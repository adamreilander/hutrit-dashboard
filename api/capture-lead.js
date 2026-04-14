// POST /api/capture-lead
// Body: { email, nombre?, empresa?, telefono?, agente, empresa_analizada? }
// Sends lead data to Make.com → Google Sheets

const MAKE_WEBHOOK = 'https://hook.us2.make.com/vdi9oxuk7m0o1bb899cl46sa1jx1p44y'

const AGENT_LABELS = {
  seo:       'Agente SEO',
  marketing: 'Agente Marketing',
  ventas:    'Agente Ventas',
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { email, nombre, empresa, telefono, agente, empresa_analizada } = req.body || {}
  if (!email) return res.status(400).json({ error: 'email requerido' })

  const fecha = new Date().toLocaleString('es-ES', {
    timeZone: 'Europe/Madrid',
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

  const payload = {
    fecha,
    agente:             AGENT_LABELS[agente] || agente || '',
    email:              email || '',
    nombre:             nombre || '',
    empresa:            empresa || '',
    telefono:           telefono || '',
    empresa_analizada:  empresa_analizada || '',
  }

  try {
    const resp = await fetch(MAKE_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!resp.ok) {
      return res.status(502).json({ error: `Make.com error: ${resp.status}` })
    }

    return res.json({ success: true })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
