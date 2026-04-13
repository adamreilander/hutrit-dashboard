import Anthropic from '@anthropic-ai/sdk'

export const maxDuration = 60

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ═══════════════════════════════════════════════════════════════════════
// HERRAMIENTAS — cada una ejecuta una acción real
// ═══════════════════════════════════════════════════════════════════════
const TOOLS = [
  {
    name: 'send_email',
    description: 'Envía un email real. Úsalo cuando el usuario pida enviar un email a alguien.',
    input_schema: {
      type: 'object',
      properties: {
        to:      { type: 'string', description: 'Email del destinatario' },
        subject: { type: 'string', description: 'Asunto' },
        body:    { type: 'string', description: 'Cuerpo completo en texto plano' },
      },
      required: ['to', 'subject', 'body'],
    },
  },
  {
    name: 'publish_linkedin',
    description: 'Publica un post en el LinkedIn de Hutrit. Úsalo cuando el usuario pida publicar en LinkedIn.',
    input_schema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Texto completo del post con hashtags' },
      },
      required: ['text'],
    },
  },
  {
    name: 'audit_company',
    description: 'Audita una empresa en profundidad: detecta puntos de dolor, talento que necesitan y ángulo de outreach. Úsalo antes de generar contenido o enviar outreach a una empresa.',
    input_schema: {
      type: 'object',
      properties: {
        empresa: { type: 'string', description: 'Nombre de la empresa' },
        sector:  { type: 'string', description: 'Sector o industria' },
        web:     { type: 'string', description: 'URL de la web (opcional)' },
      },
      required: ['empresa', 'sector'],
    },
  },
  {
    name: 'send_outreach',
    description: 'Genera y envía un email de outreach personalizado para una empresa. Primero audita la empresa (si no tienes datos), luego genera el email perfectamente personalizado y lo envía. Úsalo cuando el usuario pida hacer outreach a una empresa.',
    input_schema: {
      type: 'object',
      properties: {
        empresa:     { type: 'string' },
        sector:      { type: 'string' },
        email_to:    { type: 'string', description: 'Email del destinatario' },
        contacto:    { type: 'string', description: 'Nombre del contacto (opcional)' },
        audit_data:  { type: 'string', description: 'Datos de auditoría previa en JSON (opcional, si ya auditaste la empresa)' },
      },
      required: ['empresa', 'sector', 'email_to'],
    },
  },
  {
    name: 'generate_calendar',
    description: 'Genera un calendario de contenido completo con posts para LinkedIn e Instagram. Devuelve el calendario formateado.',
    input_schema: {
      type: 'object',
      properties: {
        sector:  { type: 'string', description: 'Sector o audiencia objetivo' },
        semanas: { type: 'number', description: 'Número de semanas (1-4)' },
        foco:    { type: 'string', description: 'b2b (empresas europeas) | b2c (talento LATAM) | mixto' },
      },
      required: ['sector', 'semanas', 'foco'],
    },
  },
  {
    name: 'save_to_notion',
    description: 'Guarda cualquier contenido generado como página en Notion: auditorías, calendarios, copys, estrategias. Úsalo cuando el usuario pida guardar, exportar o crear una página.',
    input_schema: {
      type: 'object',
      properties: {
        titulo:    { type: 'string', description: 'Título de la página' },
        contenido: { type: 'string', description: 'Contenido completo en texto plano o markdown' },
        tipo:      { type: 'string', description: 'auditoria | calendario | contenido | outreach | estrategia' },
      },
      required: ['titulo', 'contenido'],
    },
  },
]

// ═══════════════════════════════════════════════════════════════════════
// EJECUCIÓN DE HERRAMIENTAS
// ═══════════════════════════════════════════════════════════════════════
async function executeTool(name, input) {
  try {
    // ── Enviar email ──────────────────────────────────────────────────
    if (name === 'send_email') {
      const apiKey = process.env.RESEND_API_KEY
      if (!apiKey) return { success: false, error: 'RESEND_API_KEY no configurada en Vercel' }
      const testEmail = process.env.RESEND_TEST_EMAIL
      const to = testEmail ? [testEmail] : [input.to]
      const subject = testEmail ? `[TEST → ${input.to}] ${input.subject}` : input.subject
      const resp = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: 'onboarding@resend.dev', to, subject, html: input.body.replace(/\n/g, '<br>') }),
      })
      const data = await resp.json()
      if (!resp.ok) return { success: false, error: data.message || 'Error de Resend' }
      return { success: true, message: `Email enviado a ${to[0]}`, id: data.id }
    }

    // ── Publicar en LinkedIn ──────────────────────────────────────────
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

    // ── Auditar empresa ───────────────────────────────────────────────
    if (name === 'audit_company') {
      const prompt = `Eres el agente de auditoría de Hutrit Europa.

EMPRESA: ${input.empresa}
SECTOR: ${input.sector}
${input.web ? `WEB: ${input.web}` : ''}

Analiza esta empresa y devuelve SOLO el siguiente JSON (sin texto adicional):
{
  "puntos_dolor": [
    {"area": "AREA", "problema": "DESCRIPCION CONCRETA", "urgencia": "alta|media|baja"}
  ],
  "talento_buscado": ["ROL 1", "ROL 2"],
  "presencia_digital": "RESUMEN EN 1 FRASE",
  "oportunidad_hutrit": "PROPUESTA CONCRETA EN 1-2 FRASES",
  "angulo_outreach": "HOOK PARA EMAIL EN 1 FRASE — específico, no genérico",
  "hook_linkedin": "HOOK para post de LinkedIn sobre esta empresa/sector"
}`

      const msg = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 600,
        messages: [{ role: 'user', content: prompt }],
      })
      const text = msg.content[0]?.text || ''
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/)
        const audit = jsonMatch ? JSON.parse(jsonMatch[0]) : null
        if (audit) return { success: true, audit, empresa: input.empresa, sector: input.sector }
        return { success: false, error: 'No se pudo generar la auditoría', raw: text }
      } catch {
        return { success: false, error: 'Error parseando auditoría', raw: text }
      }
    }

    // ── Outreach personalizado: audita + escribe email + envía ────────
    if (name === 'send_outreach') {
      const apiKey = process.env.RESEND_API_KEY
      if (!apiKey) return { success: false, error: 'RESEND_API_KEY no configurada en Vercel' }

      // 1. Obtener datos de auditoría
      let auditData = null
      if (input.audit_data) {
        try { auditData = JSON.parse(input.audit_data) } catch {}
      }
      if (!auditData) {
        const auditResult = await executeTool('audit_company', { empresa: input.empresa, sector: input.sector })
        if (auditResult.success) auditData = auditResult.audit
      }

      // 2. Generar email personalizado con Claude
      const emailPrompt = `Escribe un email de outreach en frío de Hutrit Europa para ${input.empresa}.

${auditData ? `Datos de la empresa:
- Puntos de dolor: ${auditData.puntos_dolor?.map(p => p.problema).join(', ')}
- Talento que necesitan: ${auditData.talento_buscado?.join(', ')}
- Ángulo: ${auditData.angulo_outreach}` : `Sector: ${input.sector}`}

El email debe:
- Asunto: directo, específico, sin clickbait
- Cuerpo: 4-5 líneas máximo, tono profesional y directo
- Hacer referencia a algo ESPECÍFICO de ${input.empresa}
- Propuesta clara de valor de Hutrit
- CTA: pedir 15 minutos
- Firma: Adam Reilander | Hutrit | hutrit.com

Responde SOLO con JSON:
{"subject": "...", "body": "..."}`

      const emailMsg = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 400,
        messages: [{ role: 'user', content: emailPrompt }],
      })
      const emailText = emailMsg.content[0]?.text || ''
      let emailData = null
      try {
        const match = emailText.match(/\{[\s\S]*\}/)
        if (match) emailData = JSON.parse(match[0])
      } catch {}

      if (!emailData) return { success: false, error: 'No se pudo generar el email', raw: emailText }

      // 3. Enviar
      const testEmail = process.env.RESEND_TEST_EMAIL
      const to = testEmail ? [testEmail] : [input.email_to]
      const subject = testEmail ? `[TEST → ${input.email_to}] ${emailData.subject}` : emailData.subject

      const sendResp = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'onboarding@resend.dev',
          to,
          subject,
          html: emailData.body.replace(/\n/g, '<br>'),
        }),
      })
      const sendData = await sendResp.json()
      if (!sendResp.ok) return { success: false, error: sendData.message, subject: emailData.subject }
      return {
        success: true,
        message: `Email enviado a ${to[0]}`,
        subject: emailData.subject,
        preview: emailData.body.slice(0, 100) + '...',
      }
    }

    // ── Generar calendario de contenido ───────────────────────────────
    if (name === 'generate_calendar') {
      const prompt = `Genera un calendario de contenido de ${input.semanas} semana(s) para Hutrit.

Sector/audiencia: ${input.sector}
Foco: ${input.foco === 'b2b' ? 'empresas europeas que contratan' : input.foco === 'b2c' ? 'talento LATAM buscando trabajo' : 'ambos'}

Devuelve SOLO JSON (sin texto extra):
{
  "semanas": [
    {
      "semana": 1,
      "posts": [
        {
          "dia": "Lunes",
          "canal": "LinkedIn",
          "tipo": "educativo|caso_exito|opinion|dato|carrusel",
          "titulo": "TITULO DEL POST",
          "copy": "COPY COMPLETO DEL POST con hashtags",
          "cta": "CTA CLARO"
        }
      ]
    }
  ],
  "resumen": "RESUMEN DE LA ESTRATEGIA EN 2 FRASES"
}`

      const msg = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }],
      })
      const text = msg.content[0]?.text || ''
      try {
        const match = text.match(/\{[\s\S]*\}/)
        const calendar = match ? JSON.parse(match[0]) : null
        if (calendar) {
          const totalPosts = calendar.semanas?.reduce((acc, s) => acc + (s.posts?.length || 0), 0) || 0
          return { success: true, calendar, totalPosts, message: `Calendario generado: ${totalPosts} posts para ${input.semanas} semana(s)` }
        }
        return { success: false, error: 'No se pudo generar el calendario', raw: text }
      } catch {
        return { success: false, error: 'Error parseando calendario', raw: text }
      }
    }

    // ── Guardar en Notion ─────────────────────────────────────────────
    if (name === 'save_to_notion') {
      const token = process.env.NOTION_TOKEN
      if (!token) return { success: false, error: 'NOTION_TOKEN no configurado en Vercel' }

      // Buscar una página/database donde guardar
      const searchResp = await fetch('https://api.notion.com/v1/search', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Notion-Version': '2022-06-28' },
        body: JSON.stringify({ filter: { value: 'page', property: 'object' }, page_size: 5 }),
      })
      const searchData = await searchResp.json()
      const parentPage = searchData.results?.[0]
      if (!parentPage) return { success: false, error: 'No se encontró ninguna página en Notion para guardar. Comparte una página con la integración de Notion.' }

      // Convertir contenido a bloques de Notion
      const lines = input.contenido.split('\n').filter(l => l.trim())
      const blocks = lines.map(line => ({
        object: 'block',
        type: 'paragraph',
        paragraph: { rich_text: [{ type: 'text', text: { content: line.slice(0, 2000) } }] },
      }))

      const createResp = await fetch('https://api.notion.com/v1/pages', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Notion-Version': '2022-06-28' },
        body: JSON.stringify({
          parent: { page_id: parentPage.id },
          properties: { title: { title: [{ text: { content: input.titulo } }] } },
          children: blocks.slice(0, 100),
        }),
      })
      const createData = await createResp.json()
      if (!createResp.ok) return { success: false, error: createData.message || 'Error creando página en Notion' }
      return { success: true, message: `Página "${input.titulo}" creada en Notion`, pageId: createData.id }
    }

    return { success: false, error: `Herramienta '${name}' desconocida` }
  } catch (e) {
    return { success: false, error: e.message }
  }
}

// ═══════════════════════════════════════════════════════════════════════
// SYSTEM PROMPT
// ═══════════════════════════════════════════════════════════════════════
const SYSTEM = `Eres el agente de operaciones de Hutrit Europa — empresa que conecta empresas europeas con talento remoto de LATAM (tech, marketing, ventas, diseño, producto, datos).

CONTEXTO:
- B2B: ayuda a empresas europeas a contratar talento LATAM full-time
- B2C (Hutrit Club): conecta profesionales LATAM con empresas europeas
- Mercados: España, Alemania, Países Bajos, UK
- Propuesta: talento validado, inglés B2+, zona horaria compatible, coste optimizado vs Europa

HERRAMIENTAS QUE TIENES:
- send_email → envía emails reales
- publish_linkedin → publica posts reales en LinkedIn
- audit_company → audita empresa: puntos de dolor, talento, ángulo de outreach
- send_outreach → audita empresa + genera email personalizado + lo envía (todo en uno)
- generate_calendar → genera calendario de contenido completo
- save_to_notion → guarda cualquier contenido como página en Notion

REGLAS DE COMPORTAMIENTO:
1. Cuando el usuario pida ejecutar una acción, HAZLA DIRECTAMENTE con las herramientas. No preguntes si quieres que lo hagas.
2. Para pipelines completos (auditoría → contenido → outreach), ejecuta TODOS los pasos sin pedir confirmación intermedia.
3. Si el usuario da una lista de empresas, procésalas TODAS una por una.
4. Solo pide información que sea estrictamente necesaria y que no tengas. Si te falta el email, pídelo. Si puedes inferir el sector, hazlo.
5. Después de ejecutar acciones, muestra un resumen de lo que hiciste.
6. Responde SIEMPRE en español.
7. Respuestas concisas — máximo 300 palabras de texto. El trabajo real lo hacen las herramientas.`

// ═══════════════════════════════════════════════════════════════════════
// HANDLER
// ═══════════════════════════════════════════════════════════════════════
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
    const MAX_ITER = 8

    for (let iter = 0; iter < MAX_ITER; iter++) {
      const stream = client.messages.stream({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1200,
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
        toolResults.push({
          type: 'tool_result',
          tool_use_id: toolUse.id,
          content: JSON.stringify(result),
        })
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
