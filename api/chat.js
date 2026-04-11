import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM = `Eres el asistente de operaciones de Hutrit, una empresa que conecta empresas europeas con talento remoto de LATAM (tech, marketing, ventas, diseño, producto, datos).

Contexto de Hutrit:
- B2B: ayuda a empresas europeas a contratar talento LATAM full-time de forma rápida y estructurada
- B2C (Hutrit Club): conecta a profesionales LATAM con empresas europeas
- Mercados principales: España, Alemania, Países Bajos, UK
- Talento: desarrolladores, marketers, sales reps, diseñadores, PMs, data analysts de LATAM
- Propuesta de valor: talento validado, inglés B2+, zona horaria compatible, a menor coste que Europa
- Web: hutrit.com

Puedes ayudar con:
- Prospección de empresas (buscar leads, analizar sectores)
- Redacción de contenido (posts LinkedIn, Instagram, emails)
- Outreach (mensajes personalizados para clientes)
- Análisis de mercado y competidores
- Estrategia de ventas y marketing
- Cualquier consulta operativa

Responde siempre en español, de forma concisa y accionable. Eres directo, profesional y cercano.`

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { messages } = req.body
  if (!messages?.length) return res.status(400).json({ error: 'messages requerido' })

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')

  try {
    const stream = client.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
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
