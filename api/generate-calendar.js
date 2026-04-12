// POST /api/generate-calendar
// Body: { sector, semanas?: 1-4, foco?: 'b2b' | 'b2c' | 'ambos' }
// Returns: { success, calendar: [{dia, canal, tipo, titulo, descripcion, hashtags, cta}] }
// Env: ANTHROPIC_API_KEY

import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { sector = 'HR Tech / SaaS', semanas = 2, foco = 'ambos' } = req.body

  const dias = semanas * 5 // días laborables
  const focoDesc = foco === 'b2b'
    ? 'empresas europeas que quieren contratar talento LATAM'
    : foco === 'b2c'
    ? 'profesionales LATAM que buscan trabajo en Europa'
    : 'mezcla equilibrada B2B (empresas) y B2C (talento LATAM)'

  const prompt = `Eres el estratega de contenido de Hutrit Europa, plataforma que conecta talento LATAM con empresas europeas.

Genera un calendario editorial de ${dias} publicaciones para ${semanas} semana(s) (lunes a viernes) enfocado en: ${focoDesc}.

Sector objetivo: ${sector}

Canales disponibles: LinkedIn (B2B profesional), Instagram (B2C lifestyle + carousel)

Para CADA publicación devuelve EXACTAMENTE este JSON:
{
  "dia": "Lun 14 Abr",
  "canal": "LinkedIn" | "Instagram",
  "tipo": "Artículo" | "Post" | "Carousel" | "Reels idea" | "Historia" | "Encuesta",
  "titulo": "Título gancho del contenido (máx 80 caracteres)",
  "descripcion": "Descripción del contenido y ángulo narrativo (2-3 frases)",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3"],
  "cta": "Call to action concreto para este post"
}

Reglas de contenido:
- Alterna LinkedIn y Instagram cada día
- LinkedIn: más data, insights, casos de éxito, tips de contratación
- Instagram: lifestyle de talento LATAM, before/after, testimonios, tips de carrera
- Incluye al menos 2 carousel en Instagram
- Incluye al menos 1 encuesta en LinkedIn
- Varía los temas: no repitas el mismo ángulo en posts consecutivos
- Tono Hutrit: directo, cercano, sin jerga corporativa, orientado a resultados

Devuelve SOLO un JSON válido con esta estructura:
{
  "calendar": [array de ${dias} objetos con los campos anteriores]
}

Sin texto adicional, sin markdown, solo el JSON.`

  try {
    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = msg.content[0]?.text || ''

    // Extraer JSON
    const jsonMatch = raw.match(/\{[\s\S]*"calendar"[\s\S]*\}/)
    if (!jsonMatch) {
      return res.status(500).json({ success: false, error: 'Claude no devolvió JSON válido', raw: raw.slice(0, 500) })
    }

    const parsed = JSON.parse(jsonMatch[0])
    return res.json({ success: true, calendar: parsed.calendar || [], semanas, sector, foco })
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message })
  }
}
