// POST /api/search-web
// Body: { query, maxResults? }
// Env: APIFY_API_KEY

export const maxDuration = 120 // Apify actor puede tardar ~30-60s

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { query, maxResults = 10 } = req.body
  if (!query) return res.status(400).json({ error: 'query es requerido' })

  const apiKey = process.env.APIFY_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'APIFY_API_KEY no configurada en Vercel' })

  try {
    // Ejecuta el actor y espera el resultado (run-sync devuelve cuando termina)
    const runResp = await fetch(
      `https://api.apify.com/v2/acts/apify~google-search-scraper/run-sync-get-dataset-items?token=${apiKey}&format=json`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          queries: query,
          maxPagesPerQuery: 1,
          resultsPerPage: Math.min(maxResults, 10),
          countryCode: 'es',
          languageCode: 'es',
        }),
      }
    )

    if (!runResp.ok) {
      const err = await runResp.text()
      return res.status(runResp.status).json({ success: false, error: `Apify error ${runResp.status}: ${err}` })
    }

    const items = await runResp.json()

    // El endpoint devuelve un array de resultados de búsqueda
    const results = []
    for (const item of items) {
      for (const r of item.organicResults || []) {
        results.push({
          title:       r.title || '',
          url:         r.url   || '',
          description: r.description || '',
        })
        if (results.length >= maxResults) break
      }
      if (results.length >= maxResults) break
    }

    return res.json({ success: true, results })
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message })
  }
}
