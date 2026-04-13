// POST /api/send-email
// Body: { to, subject, html, empresa? }
// Env: RESEND_API_KEY, RESEND_TEST_EMAIL (opcional — destinatario de prueba para onboarding@resend.dev)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { to, subject, html, empresa = '' } = req.body
  if (!subject || !html) return res.status(400).json({ error: 'subject y html son requeridos' })

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'RESEND_API_KEY no configurada en Vercel' })

  // onboarding@resend.dev solo permite enviar al email de la cuenta Resend.
  // Si RESEND_TEST_EMAIL está configurado, lo usamos como destinatario de prueba.
  const testEmail = process.env.RESEND_TEST_EMAIL
  const recipient = testEmail ? testEmail : (to || '')
  if (!recipient) return res.status(400).json({ error: 'Destinatario no configurado. Añade RESEND_TEST_EMAIL en Vercel.' })

  const isTestMode = !!testEmail

  try {
    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'onboarding@resend.dev',
        to: [recipient],
        subject: isTestMode ? `[TEST → ${to || 'sin destinatario'}] ${subject}` : subject,
        html,
      }),
    })

    const data = await resp.json()

    if (!resp.ok) {
      return res.status(resp.status).json({ success: false, error: data.message || 'Error de Resend' })
    }

    return res.json({
      success: true,
      id: data.id,
      empresa,
      testMode: isTestMode,
      deliveredTo: recipient,
    })
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message })
  }
}
