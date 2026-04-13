import Anthropic from '@anthropic-ai/sdk'

export const maxDuration = 60

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ═══════════════════════════════════════════════════════════════════════════════
// HERRAMIENTAS — solo IO externo, sin llamadas internas a Claude
// Claude genera todo el contenido en su respuesta de texto.
// Las herramientas solo ejecutan acciones con APIs externas.
// ═══════════════════════════════════════════════════════════════════════════════
const TOOLS = [
  {
    name: 'send_email',
    description: 'Envía un email real. Úsalo después de generar el contenido del email en tu respuesta.',
    input_schema: {
      type: 'object',
      properties: {
        to:      { type: 'string', description: 'Email del destinatario' },
        subject: { type: 'string', description: 'Asunto del email' },
        body:    { type: 'string', description: 'Cuerpo completo del email en texto plano' },
      },
      required: ['to', 'subject', 'body'],
    },
  },
  {
    name: 'publish_linkedin',
    description: 'Publica un post en el LinkedIn de Hutrit. Úsalo después de redactar el post en tu respuesta.',
    input_schema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Texto completo del post con hashtags' },
      },
      required: ['text'],
    },
  },
  {
    name: 'publish_instagram',
    description: 'Publica en Instagram de Hutrit. Requiere URL pública de imagen (usa generate_image primero).',
    input_schema: {
      type: 'object',
      properties: {
        caption:   { type: 'string', description: 'Caption con hashtags' },
        image_url: { type: 'string', description: 'URL pública de la imagen' },
      },
      required: ['caption', 'image_url'],
    },
  },
  {
    name: 'search_web',
    description: 'Busca información real en internet. Úsalo para investigar empresas, sectores o noticias antes de analizar.',
    input_schema: {
      type: 'object',
      properties: {
        query:      { type: 'string', description: 'Término de búsqueda' },
        maxResults: { type: 'number', description: 'Número de resultados (default 5)' },
      },
      required: ['query'],
    },
  },
  {
    name: 'scrape_url',
    description: 'Lee el contenido de una URL. Úsalo para leer la web de una empresa antes de analizarla.',
    input_schema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'URL a leer' },
      },
      required: ['url'],
    },
  },
  {
    name: 'prospect_companies',
    description: 'Encuentra empresas reales por ciudad y sector usando Google Maps. Devuelve nombre, web y teléfono.',
    input_schema: {
      type: 'object',
      properties: {
        ciudad:     { type: 'string', description: 'Ciudad donde buscar, ej: Valencia, Barcelona, Madrid' },
        nicho:      { type: 'string', description: 'Tipo de empresa, ej: empresa de ventas, startup SaaS, agencia de marketing' },
        maxResults: { type: 'number', description: 'Número de resultados (default 5, max 8)' },
      },
      required: ['ciudad', 'nicho'],
    },
  },
  {
    name: 'generate_image',
    description: 'Genera una imagen profesional con IA (Gemini) para LinkedIn o Instagram.',
    input_schema: {
      type: 'object',
      properties: {
        prompt: { type: 'string', description: 'Descripción del concepto visual' },
        style:  { type: 'string', description: 'profesional | minimalista | impacto | lifestyle' },
      },
      required: ['prompt'],
    },
  },
  {
    name: 'save_to_notion',
    description: 'Guarda contenido como página en Notion. Úsalo para exportar auditorías, calendarios, listas de empresas o cualquier entregable.',
    input_schema: {
      type: 'object',
      properties: {
        titulo:    { type: 'string', description: 'Título de la página' },
        contenido: { type: 'string', description: 'Contenido completo a guardar' },
        tipo:      { type: 'string', description: 'auditoria | calendario | contenido | outreach | prospectos | estrategia' },
      },
      required: ['titulo', 'contenido'],
    },
  },
]

// ═══════════════════════════════════════════════════════════════════════════════
// EJECUCIÓN DE HERRAMIENTAS — solo IO, sin Claude interno
// ═══════════════════════════════════════════════════════════════════════════════
async function executeTool(name, input) {
  try {

    if (name === 'send_email') {
      const apiKey = process.env.RESEND_API_KEY
      if (!apiKey) return { success: false, error: 'RESEND_API_KEY no configurada en Vercel' }
      const testEmail = process.env.RESEND_TEST_EMAIL
      const to = testEmail ? [testEmail] : [input.to]
      const subject = testEmail ? `[TEST → ${input.to}] ${input.subject}` : input.subject
      const resp = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: 'onboarding@resend.dev', to, subject, html: input.body.replace(/\n/g, '<br>') }),
      })
      const data = await resp.json()
      if (!resp.ok) return { success: false, error: data.message || 'Error de Resend' }
      return { success: true, message: `Email enviado a ${to[0]}` }
    }

    if (name === 'publish_linkedin') {
      const url = process.env.MAKE_WEBHOOK_URL
      if (!url) return { success: false, error: 'MAKE_WEBHOOK_URL no configurada en Vercel' }
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: input.text }),
      })
      if (!resp.ok) return { success: false, error: 'Error al publicar en LinkedIn' }
      return { success: true, message: 'Post publicado en LinkedIn' }
    }

    if (name === 'publish_instagram') {
      const userId = process.env.INSTAGRAM_USER_ID
      const token  = process.env.INSTAGRAM_ACCESS_TOKEN
      if (!userId || !token) return { success: false, error: 'Credenciales de Instagram no configuradas' }
      if (!input.image_url) return { success: false, error: 'Se necesita image_url pública' }

      const post = async (ep, params) => {
        const body = new URLSearchParams({ ...params, access_token: token })
        return fetch(`https://graph.facebook.com/v19.0${ep}`, {
          method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body.toString(),
        }).then(r => r.json())
      }

      const container = await post(`/${userId}/media`, { image_url: input.image_url, caption: input.caption })
      if (!container?.id) return { success: false, error: container?.error?.message || 'Error creando container' }

      let status = null
      for (let i = 0; i < 10; i++) {
        await new Promise(r => setTimeout(r, 4000))
        const s = await fetch(`https://graph.facebook.com/v19.0/${container.id}?fields=status_code&access_token=${token}`).then(r => r.json())
        status = s?.status_code
        if (status === 'FINISHED') break
        if (['ERROR', 'EXPIRED'].includes(status)) return { success: false, error: `Instagram error: ${status}` }
      }
      if (status !== 'FINISHED') return { success: false, error: 'Timeout procesando imagen en Instagram' }

      const pub = await post(`/${userId}/media_publish`, { creation_id: container.id })
      if (!pub?.id) return { success: false, error: pub?.error?.message || 'Error publicando' }
      return { success: true, message: `Publicado en Instagram (ID: ${pub.id})` }
    }

    if (name === 'search_web') {
      const apiKey = process.env.APIFY_API_KEY
      if (!apiKey) return { success: false, error: 'APIFY_API_KEY no configurada en Vercel' }
      const resp = await fetch(
        `https://api.apify.com/v2/acts/apify~google-search-scraper/run-sync-get-dataset-items?token=${apiKey}&format=json`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ queries: input.query, maxPagesPerQuery: 1, resultsPerPage: input.maxResults || 5, countryCode: 'es', languageCode: 'es' }),
          signal: AbortSignal.timeout(20000),
        }
      )
      if (!resp.ok) return { success: false, error: 'Error en búsqueda web' }
      const items = await resp.json()
      const results = []
      for (const item of items || []) {
        for (const r of item.organicResults || []) {
          results.push({ title: r.title, url: r.url, description: r.description || '' })
          if (results.length >= (input.maxResults || 5)) break
        }
        if (results.length >= (input.maxResults || 5)) break
      }
      const summary = results.map(r => `${r.title}: ${r.description} (${r.url})`).join('\n')
      return { success: true, results, summary, message: `${results.length} resultados encontrados` }
    }

    if (name === 'scrape_url') {
      const resp = await fetch(input.url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; HutritAgent/1.0)' },
        signal: AbortSignal.timeout(8000),
      })
      if (!resp.ok) return { success: false, error: `Error ${resp.status} accediendo a ${input.url}` }
      const html = await resp.text()
      const text = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 3000)
      return { success: true, content: text, url: input.url, message: `Contenido leído de ${input.url}` }
    }

    if (name === 'prospect_companies') {
      const apiKey = process.env.GOOGLE_MAPS_API_KEY
      if (!apiKey) return { success: false, error: 'GOOGLE_MAPS_API_KEY no configurada en Vercel' }
      const max = Math.min(input.maxResults || 5, 8)
      const query = `${input.nicho} en ${input.ciudad}, España`
      const resp = await fetch(`https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}`)
      const data = await resp.json()
      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') return { success: false, error: `Google Places: ${data.status}` }

      // Obtener detalles en paralelo para ser más rápido
      const empresas = await Promise.all(
        (data.results || []).slice(0, max).map(async (p) => {
          let web = '', telefono = ''
          if (p.place_id) {
            try {
              const det = await fetch(`https://maps.googleapis.com/maps/api/place/details/json?place_id=${p.place_id}&fields=website,formatted_phone_number&key=${apiKey}`).then(r => r.json())
              web = det.result?.website || ''; telefono = det.result?.formatted_phone_number || ''
            } catch {}
          }
          return { nombre: p.nombre || p.name, ciudad: input.ciudad, sector: input.nicho, rating: p.rating || 0, web, telefono }
        })
      )
      return { success: true, empresas, message: `${empresas.length} empresas encontradas en ${input.ciudad}` }
    }

    if (name === 'generate_image') {
      const apiKey = process.env.GEMINI_API_KEY
      if (!apiKey) return { success: false, error: 'GEMINI_API_KEY no configurada en Vercel' }
      const STYLES = {
        profesional: 'Corporate professional, clean background, Hutrit brand teal (#0D5C54), modern typography',
        minimalista: 'Minimalist, lots of white space, teal accent (#0D9488), geometric, clean',
        impacto:     'Bold, dark background, bright teal and white, high contrast, tech startup feel',
        lifestyle:   'Warm lifestyle photography, diverse Latin American professionals, collaborative workspace, authentic',
      }
      const style = STYLES[input.style] || STYLES.profesional
      const fullPrompt = `Social media image for Hutrit Europa talent platform. ${input.prompt}. Style: ${style}. Square 1:1 format, professional, no text overlays.`

      // Imagen 3 primero
      const r1 = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instances: [{ prompt: fullPrompt }], parameters: { sampleCount: 1, aspectRatio: '1:1' } }),
      })
      const d1 = await r1.json()
      if (d1.predictions?.[0]?.bytesBase64Encoded) {
        return { success: true, imageBase64: d1.predictions[0].bytesBase64Encoded, mimeType: 'image/png', message: 'Imagen generada' }
      }

      // Fallback Gemini Flash
      const r2 = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent?key=${apiKey}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: fullPrompt }] }], generationConfig: { responseModalities: ['IMAGE', 'TEXT'] } }),
      })
      const d2 = await r2.json()
      const imgPart = d2.candidates?.[0]?.content?.parts?.find(p => p.inlineData?.mimeType?.startsWith('image/'))
      if (imgPart) return { success: true, imageBase64: imgPart.inlineData.data, mimeType: imgPart.inlineData.mimeType, message: 'Imagen generada' }
      return { success: false, error: 'No se pudo generar la imagen' }
    }

    if (name === 'save_to_notion') {
      const token = process.env.NOTION_TOKEN
      if (!token) return { success: false, error: 'NOTION_TOKEN no configurado en Vercel' }
      const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'Notion-Version': '2022-06-28' }

      const search = await fetch('https://api.notion.com/v1/search', {
        method: 'POST', headers,
        body: JSON.stringify({ filter: { value: 'page', property: 'object' }, page_size: 5 }),
      }).then(r => r.json())

      const parent = search.results?.[0]
      if (!parent) return { success: false, error: 'No hay páginas compartidas en Notion. Comparte una página con la integración.' }

      const blocks = input.contenido.split('\n').filter(l => l.trim()).slice(0, 100).map(line => ({
        object: 'block', type: 'paragraph',
        paragraph: { rich_text: [{ type: 'text', text: { content: line.slice(0, 2000) } }] },
      }))

      const page = await fetch('https://api.notion.com/v1/pages', {
        method: 'POST', headers,
        body: JSON.stringify({
          parent: { page_id: parent.id },
          properties: { title: { title: [{ text: { content: input.titulo } }] } },
          children: blocks,
        }),
      }).then(r => r.json())

      if (!page.id) return { success: false, error: page.message || 'Error creando página en Notion' }
      return { success: true, message: `Página "${input.titulo}" guardada en Notion`, pageId: page.id }
    }

    return { success: false, error: `Herramienta '${name}' desconocida` }
  } catch (e) {
    return { success: false, error: e.message }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SYSTEM PROMPT
// ═══════════════════════════════════════════════════════════════════════════════
const SYSTEM = `Eres el agente de operaciones de Hutrit Europa — empresa que conecta empresas europeas con talento LATAM (tech, marketing, ventas, diseño, producto, datos).

CONTEXTO:
- B2B: empresas europeas contratan talento LATAM full-time (España, Alemania, Países Bajos, UK)
- B2C (Hutrit Club): profesionales LATAM buscan trabajo en Europa
- Propuesta: talento validado, inglés B2+, zona horaria compatible, coste optimizado vs Europa

HERRAMIENTAS (solo IO externo — rápidas):
- send_email → envía email real vía Resend
- publish_linkedin → publica en LinkedIn de Hutrit vía Make.com
- publish_instagram → publica en Instagram (necesita image_url pública)
- search_web → busca en Google vía Apify
- scrape_url → lee contenido de cualquier URL
- prospect_companies → encuentra empresas reales por ciudad/sector (Google Maps)
- generate_image → genera imagen con Gemini IA
- save_to_notion → guarda contenido en Notion

CÓMO TRABAJAR:
TÚ eres el cerebro. Tú generas todo el contenido (auditorías, emails, posts, calendarios, análisis) en tu respuesta de texto. Las herramientas solo ejecutan IO.

FLUJO CORRECTO para pipelines complejos:
1. Usa herramientas de investigación si las necesitas (search_web, scrape_url, prospect_companies)
2. ANALIZA y GENERA el contenido en tu respuesta de texto (auditoría, email, post, etc.)
3. Ejecuta las acciones con herramientas (send_email, publish_linkedin, save_to_notion)

PARA OUTREACH: genera el email completo (asunto + cuerpo) en tu respuesta, luego llama send_email con ese contenido exacto.
PARA LINKEDIN: redacta el post completo en tu respuesta, luego llama publish_linkedin.
PARA AUDITORÍAS: analiza la empresa en tu respuesta, luego save_to_notion si piden exportar.
PARA PIPELINES LARGOS: ejecuta un paso, muestra resultado, continúa con el siguiente. No intentes hacer todo a la vez.

REGLAS:
- Ejecuta acciones directamente sin pedir permiso. Si el usuario pide hacer algo, hazlo.
- Cuando el usuario pida múltiples empresas: procésalas UNA A UNA, mostrando progreso entre cada una.
- Usa search_web o scrape_url para obtener datos reales cuando ayude al análisis.
- Responde SIEMPRE en español. Sé conciso en el texto — el trabajo va en las herramientas.`

// ═══════════════════════════════════════════════════════════════════════════════
// HANDLER
// ═══════════════════════════════════════════════════════════════════════════════
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const { messages } = req.body
  if (!messages?.length) return res.status(400).json({ error: 'messages requerido' })

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')

  const sse = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`)

  try {
    let currentMessages = [...messages]
    const MAX_ITER = 10

    for (let iter = 0; iter < MAX_ITER; iter++) {
      const stream = client.messages.stream({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1500,
        system: SYSTEM,
        tools: TOOLS,
        messages: currentMessages,
      })

      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
          sse({ text: event.delta.text })
        }
      }

      const finalMsg = await stream.finalMessage()
      if (finalMsg.stop_reason !== 'tool_use') break

      const toolUses = finalMsg.content.filter(b => b.type === 'tool_use')
      const toolResults = []

      for (const toolUse of toolUses) {
        sse({ toolCall: { name: toolUse.name, input: toolUse.input } })
        const result = await executeTool(toolUse.name, toolUse.input)
        sse({ toolResult: { name: toolUse.name, ...result } })
        toolResults.push({ type: 'tool_result', tool_use_id: toolUse.id, content: JSON.stringify(result) })
      }

      currentMessages = [
        ...currentMessages,
        { role: 'assistant', content: finalMsg.content },
        { role: 'user', content: toolResults },
      ]
    }

    sse('[DONE]')
    res.end()
  } catch (err) {
    sse({ error: err.message })
    res.end()
  }
}
