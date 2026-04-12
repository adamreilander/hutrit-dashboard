// POST /api/publish-linkedin
// Body: { text, imageUrl? }
// Publica en LinkedIn vía webhook de Make.com
// Env: MAKE_WEBHOOK_URL (opcional, usa valor por defecto)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { text, imageUrl } = req.body
  if (!text?.trim()) return res.status(400).json({ error: 'text es requerido' })

  const webhookUrl =
    process.env.MAKE_WEBHOOK_URL ||
    'https://hook.us2.make.com/eddmr643b21lxtqjri2e74gkrdgv0c7j'

  try {
    const resp = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: text.trim(),
        imageUrl: imageUrl?.trim() || null,
      }),
    })

    const raw = await resp.text()

    if (!resp.ok) {
      return res.status(resp.status).json({ success: false, error: raw || 'Error del webhook Make' })
    }

    return res.json({ success: true, message: 'Publicado en LinkedIn vía Make.com', response: raw })
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message })
  }
}
