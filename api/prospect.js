// POST /api/prospect
// Body: { ciudad, nicho, maxResults? }
// Env: GOOGLE_MAPS_API_KEY

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { ciudad, nicho, maxResults = 8 } = req.body
  if (!ciudad || !nicho) return res.status(400).json({ error: 'ciudad y nicho son requeridos' })

  const apiKey = process.env.GOOGLE_MAPS_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'GOOGLE_MAPS_API_KEY no configurada en Vercel' })

  const query = `${nicho} en ${ciudad}, España`

  try {
    // Búsqueda principal
    const searchResp = await fetch(
      `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}`
    )
    const { results = [], status } = await searchResp.json()

    if (status !== 'OK' && status !== 'ZERO_RESULTS') {
      return res.status(500).json({ error: `Google Places error: ${status}` })
    }

    // Detalle de cada lugar en paralelo
    const prospectos = await Promise.all(
      results.slice(0, maxResults).map(async (place) => {
        let web = '', telefono = ''
        if (place.place_id) {
          try {
            const detResp = await fetch(
              `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=website,formatted_phone_number&key=${apiKey}`
            )
            const det = (await detResp.json()).result || {}
            web      = det.website || ''
            telefono = det.formatted_phone_number || ''
          } catch {}
        }
        return {
          nombre:    place.name || '',
          ciudad,
          nicho,
          rating:    place.rating || 0,
          web,
          telefono,
          email:     '',
          estrategia: (place.rating || 0) < 4.2
            ? 'Mejora de Performance'
            : 'Escalabilidad con Talento LATAM',
        }
      })
    )

    return res.json({ success: true, prospectos })
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message })
  }
}
