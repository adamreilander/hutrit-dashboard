import Anthropic from '@anthropic-ai/sdk'

export const maxDuration = 60

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ── Herramientas reales que el agente puede ejecutar ──────────────────────────
const TOOLS = [
  {
    name: 'send_email',
    description: 'Envía un email real de outreach a cualquier dirección. Úsalo cuando el usuario pida enviar, mandar o escribir un email a alguien.',
    input_schema: {
      type: 'object',
      properties: {
        to:      { type: 'string', description: 'Email del destinatario, ej: contacto@empresa.com' },
        subject: { type: 'string', description: 'Asunto del email' },
        body:    { type: 'string', description: 'Cuerpo completo del email en texto plano' },
      },
      required: ['to', 'subject', 'body'],
    },
  },
  {
    name: 'publish_linkedin',
    description: 'Publica un post en el LinkedIn de Hutrit. Úsalo cuando el usuario pida publicar, postear o compartir algo en LinkedIn.',
    input_schema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Texto completo del post de LinkedIn, incluyendo hashtags si aplica' },
      },
      required: ['text'],
    },
  },
]

// ── Ejecución real de cada herramienta ────────────────────────────────────────
async function executeTool(name, input) {
  try {
    if (name === 'send_email') {
      const apiKey = process.env.RESEND_API_KEY
      if (!apiKey) return { success: false, error: 'RESEND_API_KEY no configurada en Vercel' }

      const testEmail = process.env.RESEND_TEST_EMAIL
      const to = testEmail ? [testEmail] : [input.to]
      const subject = testEmail ? `[TEST → ${input.to}] ${input.subject}` : input.subject
      const html = input.body.replace(/\n/g, '<br>')

      const resp = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: 'onboarding@resend.dev', to, subject, html }),
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

    return { success: false, error: `Herramienta '${name}' desconocida` }
  } catch (e) {
    return { success: false, error: e.message }
  }
}

// ── System prompt ─────────────────────────────────────────────────────────────
const SYSTEM = `Eres el agente de operaciones de Hutrit, empresa que conecta empresas europeas con talento remoto de LATAM (tech, marketing, ventas, diseño, producto, datos).

Contexto:
- B2B: ayuda a empresas europeas a contratar talento LATAM full-time
- B2C (Hutrit Club): conecta profesionales LATAM con empresas europeas
- Mercados: España, Alemania, Países Bajos, UK
- Talento: developers, marketers, sales reps, diseñadores, PMs, data analysts
- Propuesta: talento validado, inglés B2+, zona horaria compatible, coste optimizado vs Europa

Tienes herramientas reales disponibles:
- send_email: envía emails de outreach reales
- publish_linkedin: publica posts en LinkedIn de Hutrit

Cuando el usuario pida enviar un email o publicar en LinkedIn, HAZLO DIRECTAMENTE usando las herramientas. No preguntes si quieres que lo hagas — simplemente hazlo. Si te falta el email de destino, pregúntalo. Si te falta contenido, genéralo tú.

IMPORTANTE — Reglas de formato:
- Respuestas CONCISAS: máximo 300 palabras
- Usa markdown ligero (negritas, listas cortas)
- Cada respuesta debe ser accionable y directa
- Responde siempre en español`

// ── Handler principal ─────────────────────────────────────────────────────────
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
    const MAX_ITER = 5

    for (let iter = 0; iter < MAX_ITER; iter++) {
      // Streaming del texto en tiempo real
      const stream = client.messages.stream({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
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

      // Sin tool_use → conversación terminada
      if (finalMsg.stop_reason !== 'tool_use') break

      // Ejecutar todas las herramientas que Claude quiere usar
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

      // Continuar la conversación con los resultados
      currentMessages = [
        ...currentMessages,
        { role: 'assistant', content: finalMsg.content },
        { role: 'user',      content: toolResults },
      ]
    }

    sse('[DONE]')
    res.end()
  } catch (err) {
    sse({ error: err.message })
    res.end()
  }
}
