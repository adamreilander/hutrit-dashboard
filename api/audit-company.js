// POST /api/audit-company — SSE streaming
// Body: { empresa, sector }
// Env: ANTHROPIC_API_KEY, APIFY_API_KEY (optional — enriquece con datos reales)
//
// Flujo:
//   1. Busca info real de la empresa en Google (Apify, best-effort)
//   2. Streams Claude análisis en lenguaje natural
//   3. Al final emite {"done": true, "audit": {...}} con el JSON estructurado

import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const AUDIT_PROMPT = (empresa, sector, webContext) => `
Eres el agente de auditoría de Hutrit Europa — la empresa que conecta empresas europeas con talento remoto de LATAM (tech, marketing, ventas, diseño).

Tu tarea: analizar esta empresa y detectar oportunidades reales para que Hutrit les ofrezca talento.

EMPRESA: ${empresa}
SECTOR: ${sector}
${webContext ? `INFO ENCONTRADA EN WEB:\n${webContext}` : '(analiza desde tu conocimiento del sector)'}

Responde en este formato exacto — sin introducción ni texto previo:

## 🔍 PRESENCIA DIGITAL
Analiza web, LinkedIn, Instagram/redes de esta empresa. ¿Tienen presencia de pago (Google Ads, Meta Ads)? ¿Cómo está su posicionamiento?

## ⚠️ PUNTOS DE DOLOR
Lista 3-5 problemas concretos de talento/RRHH que probablemente tiene esta empresa dado su sector y tamaño. Sé específico: ¿qué roles les faltan? ¿qué funciones están sin cubrir o mal cubiertas?

## 👥 TALENTO QUE NECESITAN
Lista los 2-3 perfiles que Hutrit podría conectarles. Incluye: rol, sueldo estimado en mercado europeo vs coste con talento LATAM vía Hutrit.

## 🎯 OPORTUNIDAD HUTRIT
Una propuesta concreta y específica de cómo Hutrit puede resolver su problema principal. Máximo 3 líneas.

## ✉️ ÁNGULO DE OUTREACH
El mejor hook de 1-2 frases para el email en frío. Debe referirse a algo específico de esta empresa (no genérico). Usa tono directo y profesional.

---
AUDIT_JSON_START
{"empresa":"${empresa}","sector":"${sector}","puntos_dolor":[{"area":"AREA","problema":"DESCRIPCION","urgencia":"alta|media|baja"}],"talento_buscado":["ROL 1","ROL 2"],"oportunidad":"PROPUESTA_CONCRETA","angulo_outreach":"HOOK_PARA_EMAIL","presencia_digital":{"web":"ANALISIS","linkedin":"ANALISIS","ads":"ANALISIS"}}
AUDIT_JSON_END

(Sustituye los valores del JSON con la información real del análisis. Mantén las claves exactas.)
`

async function searchCompanyApify(empresa, sector) {
  const apiKey = process.env.APIFY_API_KEY
  if (!apiKey) return null

  try {
    const query = `"${empresa}" ${sector} España site:linkedin.com OR filetype:html`
    const resp = await fetch(
      `https://api.apify.com/v2/acts/apify~google-search-scraper/run-sync-get-dataset-items?token=${apiKey}&format=json`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          queries: query,
          maxPagesPerQuery: 1,
          resultsPerPage: 5,
          countryCode: 'es',
          languageCode: 'es',
        }),
        signal: AbortSignal.timeout(25000),
      }
    )
    if (!resp.ok) return null
    const items = await resp.json()
    const results = []
    for (const item of items || []) {
      for (const r of item.organicResults || []) {
        results.push(`- ${r.title}: ${r.description || ''} (${r.url})`)
      }
    }
    return results.length ? results.slice(0, 5).join('\n') : null
  } catch {
    return null
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { empresa, sector } = req.body
  if (!empresa || !sector) return res.status(400).json({ error: 'empresa y sector son requeridos' })

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')

  const sse = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`)

  try {
    // Paso 1: búsqueda web (best-effort, no bloquea si falla)
    sse({ log: `Buscando información de ${empresa}...` })
    const webContext = await searchCompanyApify(empresa, sector)
    if (webContext) sse({ log: `Datos encontrados. Analizando con IA...` })
    else sse({ log: `Analizando con conocimiento del sector...` })

    // Paso 2: Claude streaming
    const stream = client.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      system: 'Eres el agente de auditoría de Hutrit Europa. Responde siempre en español. Sé concreto y accionable.',
      messages: [{ role: 'user', content: AUDIT_PROMPT(empresa, sector, webContext) }],
    })

    let fullText = ''

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta?.type === 'text_delta') {
        const text = chunk.delta.text
        fullText += text

        // No enviar el bloque JSON al cliente como texto
        if (fullText.includes('AUDIT_JSON_START')) {
          // Solo enviamos el texto antes del marcador
          const visiblePart = text.replace(/AUDIT_JSON_START[\s\S]*/g, '').replace(/---\s*$/, '')
          if (visiblePart) sse({ text: visiblePart })
        } else {
          sse({ text })
        }
      }
    }

    // Paso 3: extraer JSON estructurado
    const jsonMatch = fullText.match(/AUDIT_JSON_START\s*([\s\S]*?)\s*AUDIT_JSON_END/)
    let auditJson = null
    if (jsonMatch) {
      try { auditJson = JSON.parse(jsonMatch[1].trim()) } catch { auditJson = null }
    }

    // Fallback básico si Claude no generó el JSON bien
    if (!auditJson) {
      auditJson = {
        empresa,
        sector,
        puntos_dolor: [{ area: 'General', problema: 'Ver análisis arriba', urgencia: 'media' }],
        talento_buscado: ['Perfil tech', 'Perfil marketing'],
        oportunidad: `Hutrit puede conectar a ${empresa} con talento LATAM validado`,
        angulo_outreach: `Vi que ${empresa} está creciendo en ${sector} — tengo una propuesta concreta`,
        presencia_digital: { web: 'Ver análisis', linkedin: 'Ver análisis', ads: 'Ver análisis' },
      }
    }

    sse({ done: true, audit: auditJson })
    res.end()

  } catch (err) {
    sse({ error: err.message, done: true })
    res.end()
  }
}
