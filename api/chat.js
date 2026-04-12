import Anthropic from '@anthropic-ai/sdk'

export const maxDuration = 60

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM = `Eres el asistente de operaciones de Hutrit, empresa que conecta empresas europeas con talento remoto de LATAM (tech, marketing, ventas, diseño, producto, datos).

Contexto:
- B2B: ayuda a empresas europeas a contratar talento LATAM full-time
- B2C (Hutrit Club): conecta profesionales LATAM con empresas europeas
- Mercados: España, Alemania, Países Bajos, UK
- Talento: developers, marketers, sales reps, diseñadores, PMs, data analysts
- Propuesta: talento validado, inglés B2+, zona horaria compatible, coste optimizado vs Europa
- Web: hutrit.com

Ayudas con: prospección, contenido LinkedIn/Instagram, emails de outreach, análisis de mercado, estrategia de ventas.

IMPORTANTE — Reglas de formato:
- Respuestas CONCISAS: máximo 400 palabras por respuesta
- Si la tarea es muy grande, divide en pasos y pide confirmación antes de continuar
- Usa markdown ligero (negritas, listas cortas) pero SIN tablas grandes ni headers excesivos
- Cada respuesta debe ser accionable y directa
- Responde siempre en español`

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { messages } = req.body
  if (!messages?.length) return res.status(400).json({ error: 'messages requerido' })

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')

  try {
    const stream = client.messages.stream({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 800,
      system: SYSTEM,
      messages,
    })

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta?.type === 'text_delta') {
        res.write(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`)
      }
    }
    res.write('data: [DONE]\n\n')
    res.end()
  } catch (err) {
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`)
    res.end()
  }
}
