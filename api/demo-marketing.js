// POST /api/demo-marketing
// Body: { empresa, descripcion, sector?, colores?, estilo? }
// Returns: structured marketing content JSON

import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { empresa, descripcion, sector, colores, estilo } = req.body || {}
  if (!empresa?.trim() || !descripcion?.trim()) {
    return res.status(400).json({ error: 'empresa y descripcion son requeridos' })
  }

  const prompt = `Eres un experto en marketing de contenidos y estrategia digital para empresas. Crea un pack de marketing completo y personalizado.

Empresa: "${empresa.trim()}"
Descripción: "${descripcion.trim()}"
${sector ? `Sector: ${sector}` : ''}
${colores ? `Colores de marca: ${colores}` : ''}
${estilo ? `Estilo de comunicación: ${estilo}` : 'Estilo: profesional y cercano'}

Genera contenido de marketing de alta calidad. Responde ÚNICAMENTE con el siguiente JSON válido, sin texto adicional, sin markdown, sin bloques de código:

{"empresa":"${empresa.trim()}","sector":"${sector || 'general'}","estrategia":"Describe en 2 frases la estrategia de contenido recomendada para esta empresa","posts_linkedin":[{"hook":"Frase de apertura impactante para captar atención en LinkedIn","copy":"Copy completo del post (150-200 palabras), profesional y orientado a resultados"},{"hook":"Segunda frase de apertura para LinkedIn","copy":"Segundo copy completo para LinkedIn, diferente ángulo"},{"hook":"Tercera frase de apertura para LinkedIn","copy":"Tercer copy completo para LinkedIn, formato lista o storytelling"}],"posts_instagram":[{"titulo":"Título visual del post de Instagram","copy":"Copy para Instagram (80-120 palabras), más cercano y visual","hashtags":["hashtag1","hashtag2","hashtag3","hashtag4","hashtag5"]},{"titulo":"Título del segundo post Instagram","copy":"Segundo copy para Instagram, diferente formato","hashtags":["hashtag1","hashtag2","hashtag3","hashtag4","hashtag5"]}],"creativo_concepto":{"descripcion":"Describe el concepto visual del creativo: composición, elementos, atmósfera y mensaje que debe transmitir la imagen","colores":["color1","color2","color3"],"mensaje_clave":"El mensaje principal que debe comunicar el creativo visual en máximo 10 palabras"},"calendario":[{"semana":"Semana 1","accion":"Acción concreta de contenido para la primera semana"},{"semana":"Semana 2","accion":"Acción concreta de contenido para la segunda semana"},{"semana":"Semana 3","accion":"Acción concreta de contenido para la tercera semana"},{"semana":"Semana 4","accion":"Acción concreta de contenido para la cuarta semana"}]}

Personaliza todo el contenido para la empresa específica. Los posts deben ser concretos y usar el tono correcto para el sector y estilo indicados.`

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = message.content[0]?.text || ''

    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return res.status(500).json({ error: 'No se pudo generar el contenido. Inténtalo de nuevo.' })
    }

    const data = JSON.parse(jsonMatch[0])
    return res.json(data)
  } catch (err) {
    if (err instanceof SyntaxError) {
      return res.status(500).json({ error: 'Error procesando el contenido. Inténtalo de nuevo.' })
    }
    return res.status(500).json({ error: err.message })
  }
}
