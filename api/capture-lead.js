// POST /api/capture-lead
// Body: { email, nombre?, empresa?, telefono?, agente, empresa_analizada? }
// Env: RESEND_API_KEY, RESEND_TEST_EMAIL

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { email, nombre, empresa, telefono, agente, empresa_analizada } = req.body || {}
  if (!email) return res.status(400).json({ error: 'email requerido' })

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'RESEND_API_KEY no configurada' })

  const recipient = process.env.RESEND_TEST_EMAIL || 'hutriteuropa@gmail.com'

  const agentLabels = {
    seo:       '🔍 Agente SEO',
    marketing: '✨ Agente Marketing',
    ventas:    '🎯 Agente Ventas',
  }

  const now = new Date().toLocaleString('es-ES', {
    timeZone: 'Europe/Madrid',
    dateStyle: 'full', timeStyle: 'short',
  })

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: 'Segoe UI', sans-serif; background: #F7FAFA; padding: 32px; margin: 0;">
  <div style="max-width: 520px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(13,92,84,0.08);">

    <!-- Header -->
    <div style="background: linear-gradient(135deg, #0D5C54, #0D9488); padding: 28px 32px;">
      <div style="font-size: 22px; font-weight: 800; color: #fff; letter-spacing: -0.03em; margin-bottom: 4px;">
        H Hutrit
      </div>
      <div style="font-size: 13px; color: rgba(255,255,255,0.75);">Nuevo lead generado desde el demo</div>
    </div>

    <!-- Body -->
    <div style="padding: 28px 32px;">

      <div style="display: inline-block; background: #F0FDFA; border: 1px solid #C8E0DD; border-radius: 8px; padding: 6px 12px; font-size: 12px; font-weight: 700; color: #0D9488; margin-bottom: 20px; letter-spacing: 0.05em;">
        ${agentLabels[agente] || agente || 'Demo'}
      </div>

      <table style="width: 100%; border-collapse: collapse;">
        ${nombre ? `
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #F0FDFA; font-size: 12px; color: #9BBFBC; font-weight: 600; width: 38%; text-transform: uppercase; letter-spacing: 0.05em;">Nombre</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #F0FDFA; font-size: 14px; color: #0F2724; font-weight: 600;">${nombre}</td>
        </tr>` : ''}
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #F0FDFA; font-size: 12px; color: #9BBFBC; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Email</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #F0FDFA; font-size: 14px; color: #0D9488; font-weight: 600;">${email}</td>
        </tr>
        ${empresa ? `
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #F0FDFA; font-size: 12px; color: #9BBFBC; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Empresa</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #F0FDFA; font-size: 14px; color: #0F2724; font-weight: 600;">${empresa}</td>
        </tr>` : ''}
        ${telefono ? `
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #F0FDFA; font-size: 12px; color: #9BBFBC; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Teléfono</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #F0FDFA; font-size: 14px; color: #0F2724; font-weight: 600;">${telefono}</td>
        </tr>` : ''}
        ${empresa_analizada ? `
        <tr>
          <td style="padding: 10px 0; font-size: 12px; color: #9BBFBC; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Empresa analizada</td>
          <td style="padding: 10px 0; font-size: 14px; color: #0F2724;">${empresa_analizada}</td>
        </tr>` : ''}
      </table>

      <div style="margin-top: 24px; background: #F0FDFA; border-radius: 10px; padding: 14px 16px; font-size: 12px; color: #5A8A85;">
        📅 <strong>${now}</strong> · Descargó PDF del ${agentLabels[agente] || 'agente'}
      </div>
    </div>

    <!-- Footer -->
    <div style="padding: 16px 32px; background: #F7FAFA; border-top: 1px solid #C8E0DD; font-size: 11px; color: #9BBFBC; text-align: center;">
      hutrit.com · Lead capturado automáticamente desde el demo
    </div>
  </div>
</body>
</html>`

  try {
    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Hutrit Demo <onboarding@resend.dev>',
        to: [recipient],
        subject: `🎯 Nuevo lead — ${nombre || email}${empresa ? ` · ${empresa}` : ''} [${agentLabels[agente] || agente}]`,
        html,
      }),
    })

    const data = await resp.json()
    if (!resp.ok) return res.status(resp.status).json({ error: data.message || 'Error enviando email' })
    return res.json({ success: true, id: data.id })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
