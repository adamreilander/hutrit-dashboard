// POST /api/demo-ventas
// Body: { oferta, sector_target?, ciudad?, tipo_empresa? }
// Returns: structured prospect list + Google Places + Hunter.io enrichment
// Env: ANTHROPIC_API_KEY, GOOGLE_PLACES_API_KEY (optional), HUNTER_API_KEY (optional)

import Anthropic from '@anthropic-ai/sdk'

export const maxDuration = 60

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// Enrich with Google Places: telefono, direccion, web
async function enrichPlaces(empresa, ciudad, apiKey) {
  try {
    const q = encodeURIComponent(`${empresa} ${ciudad || 'España'}`)
    const sr = await fetch(
      `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${q}&key=${apiKey}`
    )
    const sd = await sr.json()
    const placeId = sd.results?.[0]?.place_id
    if (!placeId) return {}

    const dr = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=formatted_phone_number,formatted_address,website,international_phone_number&key=${apiKey}`
    )
    const dd = await dr.json()
    const r = dd.result || {}

    return {
      telefono: r.formatted_phone_number || r.international_phone_number || '',
      direccion: r.formatted_address || '',
      web: r.website || '',
    }
  } catch (_) {
    return {}
  }
}

// Enrich with Hunter.io: email + contacto
async function enrichHunter(empresa, web, apiKey) {
  try {
    // Extract domain from web URL or derive from company name
    let domain = ''
    if (web) {
      domain = web.replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/^www\./, '')
    }
    if (!domain) return {}

    const url = `https://api.hunter.io/v2/domain-search?domain=${encodeURIComponent(domain)}&limit=3&api_key=${apiKey}`
    const r = await fetch(url)
    const d = await r.json()

    const emails = d.data?.emails || []
    if (!emails.length) return {}

    // Prefer decision-makers: director, manager, head, founder, ceo, cto, vp
    const priority = ['director', 'manager', 'head', 'founder', 'ceo', 'cto', 'vp', 'chief']
    const best = emails.find(e =>
      priority.some(p => (e.position || '').toLowerCase().includes(p))
    ) || emails[0]

    return {
      email_contacto: best.value || '',
      nombre_contacto: [best.first_name, best.last_name].filter(Boolean).join(' '),
      cargo_contacto: best.position || '',
    }
  } catch (_) {
    return {}
  }
}

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

Genera exactamente 8 prospectos: 2 prioridad alta, 3 media, 3 baja. Empresas realistas y con presencia conocida para el sector y región indicados.`

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

    const googleKey = process.env.GOOGLE_PLACES_API_KEY
    const hunterKey = process.env.HUNTER_API_KEY

    if ((googleKey || hunterKey) && data.prospectos?.length) {
      // Run Places enrichment first to get web domains
      const placesData = googleKey
        ? await Promise.all(data.prospectos.map(p => enrichPlaces(p.empresa, ciudad, googleKey)))
        : data.prospectos.map(() => ({}))

      // Then run Hunter using the web domain from Places (or fallback)
      const hunterData = hunterKey
        ? await Promise.all(data.prospectos.map((p, i) =>
            enrichHunter(p.empresa, placesData[i]?.web || '', hunterKey)
          ))
        : data.prospectos.map(() => ({}))

      data.prospectos = data.prospectos.map((p, i) => ({
        ...p,
        ...placesData[i],
        ...hunterData[i],
      }))
    }

    return res.json(data)
  } catch (err) {
    if (err instanceof SyntaxError) {
      return res.status(500).json({ error: 'Error procesando la lista. Inténtalo de nuevo.' })
    }
    return res.status(500).json({ error: err.message })
  }
}
