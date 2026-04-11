import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const AGENT_PROMPTS = {
  inteligencia: `Eres el agente de Inteligencia de Mercado de Hutrit.
Hutrit conecta empresas europeas con talento tech/marketing/ventas de LATAM.
Dado un sector objetivo, analiza: competidores clave, señales de contratación, empresas que probablemente necesiten talento remoto, tendencias del sector.
Sé conciso, directo y accionable. Responde en español. Máximo 200 palabras.`,

  contenido: `Eres el agente de Contenido de Hutrit.
Hutrit conecta empresas europeas con talento LATAM (tech, marketing, ventas).
Dado un sector, genera: 3 ideas de posts para LinkedIn + 2 ideas de carruseles para Instagram.
Tono: profesional, cercano, orientado a resultados. En español. Máximo 200 palabras.`,

  outreach: `Eres el agente de Outreach de Hutrit.
Hutrit ofrece talento LATAM (tech, marketing, ventas) a empresas europeas a coste optimizado.
Dado un sector, redacta: 1 email de outreach en frío personalizado para el decisor de RRHH o CEO.
Corto, personalizado, sin spam. En español. Máximo 150 palabras.`,

  seo: `Eres el agente SEO de Hutrit.
Dado un sector, identifica: 5 keywords de long-tail relevantes para hutrit.com, dificultad estimada (baja/media/alta) y volumen (bajo/medio/alto).
Formato tabla. En español. Máximo 150 palabras.`,

  trends: `Eres el agente de Tendencias de Hutrit.
Dado un sector, identifica: 3 tendencias actuales que afectan la contratación de talento en ese sector en Europa.
Breve, datos si los tienes, accionable. En español. Máximo 150 palabras.`,
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { agentId, sector } = req.body
  if (!agentId || !sector) return res.status(400).json({ error: 'agentId y sector requeridos' })

  const systemPrompt = AGENT_PROMPTS[agentId]
  if (!systemPrompt) return res.status(400).json({ error: 'Agente no encontrado' })

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')

  try {
    const stream = client.messages.stream({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      system: systemPrompt,
      messages: [{ role: 'user', content: `Sector objetivo: ${sector}` }],
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
