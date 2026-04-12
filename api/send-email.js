// POST /api/send-email
// Body: { to, subject, html, empresa? }
// Env: RESEND_API_KEY

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { to, subject, html, empresa = '' } = req.body
  if (!to || !subject || !html) return res.status(400).json({ error: 'to, subject y html son requeridos' })

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'RESEND_API_KEY no configurada en Vercel' })

  try {
    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'onboarding@resend.dev',
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
      }),
    })

    const data = await resp.json()

    if (!resp.ok) {
      return res.status(resp.status).json({ success: false, error: data.message || 'Error de Resend' })
    }

    return res.json({ success: true, id: data.id, empresa })
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message })
  }
}
