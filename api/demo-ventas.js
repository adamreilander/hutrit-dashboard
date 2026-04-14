// POST /api/demo-ventas
// Body: { oferta, sector_target?, ciudad?, tipo_empresa? }
// Returns: structured prospect list JSON

import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { oferta, sector_target, ciudad, tipo_empresa } = req.body || {}
  if (!oferta?.trim()) return res.status(400).json({ error: 'oferta es requerido' })

  const prompt = `Eres un experto en ventas B2B y prospección comercial. Crea una lista de 8 prospectos calificados.

Oferta: "${oferta.trim()}"
${sector_target ? `Sector objetivo: ${sector_target}` : ''}
${ciudad ? `Ciudad/región: ${ciudad}` : 'España y Europa'}
${tipo_empresa ? `Tamaño preferido: ${tipo_empresa}` : ''}

Responde ÚNICAMENTE con JSON válido, sin markdown ni texto adicional. Estructura exacta:

{
  "oferta": "resumen breve de la oferta",
  "estrategia_general": "2 frases con la estrategia de ventas recomendada",
  "prospectos": [
    {
      "empresa": "Nombre de empresa real o plausible",
      "sector": "sector específico",
      "tamaño": "rango de empleados",
      "por_que": "1-2 frases: por qué necesitan exactamente lo que ofreces",
      "angulo_outreach": "frase de apertura concreta y personalizada para este prospecto",
      "prioridad": "alta"
    }
  ],
  "email_template": "email de primer contacto completo, personalizado, máximo 5 frases"
}

Genera exactamente 8 prospectos: 2 prioridad alta, 3 media, 3 baja. Empresas realistas para el sector y región indicados.`

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = message.content[0]?.text || ''

    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return res.status(500).json({ error: 'No se pudo generar la lista. Inténtalo de nuevo.' })
    }

    const data = JSON.parse(jsonMatch[0])
    return res.json(data)
  } catch (err) {
    if (err instanceof SyntaxError) {
      return res.status(500).json({ error: 'Error procesando la lista. Inténtalo de nuevo.' })
    }
    return res.status(500).json({ error: err.message })
  }
}
