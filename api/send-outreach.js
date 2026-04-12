// POST /api/send-outreach
// Body: { empresa, sector, contacto, emailTo, auditoria }
// auditoria: el JSON estructurado que devuelve /api/audit-company
// Env: ANTHROPIC_API_KEY, RESEND_API_KEY

import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ─── Generador de email con Claude ───────────────────────────────────────────

async function generateEmailBody(empresa, contacto, auditoria) {
  const puntosStr = (auditoria.puntos_dolor || [])
    .map(p => `- [${p.urgencia?.toUpperCase()}] ${p.area}: ${p.problema}`)
    .join('\n')

  const talentoStr = (auditoria.talento_buscado || []).join(', ')

  const prompt = `
Eres el SDR de Hutrit Europa. Redacta un email de outreach en frío para esta empresa.

DATOS DE LA EMPRESA:
- Empresa: ${empresa}
- Sector: ${auditoria.sector || ''}
- Contacto: ${contacto || 'el/la responsable de RRHH o CEO'}
- Puntos de dolor detectados:
${puntosStr || '(ver análisis)'}
- Talento que necesitan: ${talentoStr}
- Ángulo de outreach: ${auditoria.angulo_outreach || ''}
- Oportunidad: ${auditoria.oportunidad || ''}

INSTRUCCIONES:
- Email en español, tono profesional y directo (tuteo)
- 3-4 párrafos cortos, máximo 200 palabras en total
- Primer párrafo: hook específico a su situación (usa el ángulo de outreach)
- Segundo párrafo: propuesta concreta de Hutrit para su problema específico
- Tercer párrafo: datos de credibilidad breves (talento validado, 48h, coste optimizado)
- Cierre: CTA claro — pedir 20 minutos esta semana
- NO uses frases genéricas como "espero que estés bien" o "me pongo en contacto"
- NO menciones "sinergias" ni jerga corporativa
- Firma: Adam | Hutrit Europa | hutrit.com

Escribe SOLO el cuerpo del email (sin asunto, sin líneas de Para/De).
`

  const resp = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 600,
    messages: [{ role: 'user', content: prompt }],
  })

  return resp.content[0]?.text || ''
}

// ─── HTML Template ────────────────────────────────────────────────────────────

function buildEmailHtml(emailBody, empresa, auditoria) {
  const puntosHtml = (auditoria.puntos_dolor || [])
    .slice(0, 3)
    .map(p => {
      const color = p.urgencia === 'alta' ? '#DC2626' : p.urgencia === 'media' ? '#D97706' : '#64748B'
      return `<tr>
        <td style="padding:6px 12px;border-bottom:1px solid #f1f5f9">
          <span style="display:inline-block;background:${color}15;color:${color};font-size:10px;font-weight:600;padding:2px 6px;border-radius:4px;margin-right:8px">${(p.urgencia || 'media').toUpperCase()}</span>
          <strong style="font-size:12px">${p.area}:</strong>
          <span style="font-size:12px;color:#475569"> ${p.problema}</span>
        </td>
      </tr>`
    }).join('')

  const bodyHtml = emailBody
    .split('\n\n')
    .map(p => p.trim())
    .filter(Boolean)
    .map(p => `<p style="margin:0 0 14px;line-height:1.7;color:#1e293b;font-size:14px">${p.replace(/\n/g, '<br>')}</p>`)
    .join('')

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <div style="max-width:600px;margin:32px auto;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">

    <!-- Header -->
    <div style="background:#0D5C54;padding:20px 28px;display:flex;align-items:center;gap:12px">
      <div style="width:36px;height:36px;background:#0D9488;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0">
        <span style="color:white;font-weight:700;font-size:16px">H</span>
      </div>
      <div>
        <div style="color:white;font-weight:700;font-size:16px;letter-spacing:-0.02em">Hutrit Europa</div>
        <div style="color:rgba(255,255,255,0.6);font-size:11px">Talento LATAM para empresas europeas</div>
      </div>
    </div>

    <!-- Body -->
    <div style="background:white;padding:28px">
      ${bodyHtml}

      <!-- CTA Button -->
      <div style="margin:24px 0 8px">
        <a href="https://calendly.com/hutrit" style="display:inline-block;background:#0D9488;color:white;font-weight:600;font-size:13px;padding:12px 24px;border-radius:8px;text-decoration:none;letter-spacing:-0.01em">
          Agendar 20 min →
        </a>
      </div>
    </div>

    <!-- Audit insight strip -->
    ${puntosHtml ? `
    <div style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:16px 28px">
      <div style="font-size:11px;font-weight:600;color:#94a3b8;letter-spacing:0.06em;margin-bottom:8px">OPORTUNIDADES DETECTADAS EN ${empresa.toUpperCase()}</div>
      <table style="width:100%;border-collapse:collapse;background:white;border-radius:8px;border:1px solid #e2e8f0;overflow:hidden">
        <tbody>${puntosHtml}</tbody>
      </table>
    </div>` : ''}

    <!-- Footer -->
    <div style="background:#0D5C54;padding:14px 28px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
      <div style="color:rgba(255,255,255,0.6);font-size:11px">
        Hutrit Europa · hutrit.com · Madrid, España
      </div>
      <div style="color:rgba(255,255,255,0.4);font-size:10px">
        Para darte de baja, responde con "No gracias"
      </div>
    </div>

  </div>
</body>
</html>`
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { empresa, contacto, emailTo, auditoria } = req.body

  if (!empresa)  return res.status(400).json({ error: 'empresa es requerido' })
  if (!emailTo)  return res.status(400).json({ error: 'emailTo es requerido' })
  if (!auditoria) return res.status(400).json({ error: 'auditoria es requerido (ejecuta el Módulo 1 primero)' })

  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) return res.status(500).json({ error: 'RESEND_API_KEY no configurada en Vercel' })

  try {
    // 1. Generar cuerpo del email con Claude
    const emailBody = await generateEmailBody(empresa, contacto, auditoria)

    // 2. Construir el asunto personalizado
    const angulo = auditoria.angulo_outreach || ''
    const primerPunto = (auditoria.puntos_dolor || [])[0]
    const subject = primerPunto
      ? `${empresa} — ${primerPunto.area}: una idea concreta`
      : `Hutrit Europa para ${empresa} — propuesta de talento`

    // 3. Construir HTML
    const html = buildEmailHtml(emailBody, empresa, auditoria)

    // 4. Enviar vía Resend
    const sendResp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'onboarding@resend.dev',
        to: [emailTo],
        subject,
        html,
      }),
    })

    const sendData = await sendResp.json()

    if (!sendResp.ok) {
      return res.status(sendResp.status).json({
        success: false,
        error: sendData.message || 'Error de Resend',
      })
    }

    return res.json({
      success:   true,
      id:        sendData.id,
      subject,
      preview:   emailBody.slice(0, 200),
      empresa,
      emailTo,
    })

  } catch (err) {
    return res.status(500).json({ success: false, error: err.message })
  }
}
