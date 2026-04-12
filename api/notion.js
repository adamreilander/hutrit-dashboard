// POST /api/notion
// Body: { action: 'list_databases' | 'save_company' | 'save_email', databaseId?, data? }
// Env: NOTION_TOKEN

const NOTION_VERSION = '2022-06-28'

function headers(token) {
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type':  'application/json',
    'Notion-Version': NOTION_VERSION,
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const token = process.env.NOTION_TOKEN
  if (!token) return res.status(500).json({ error: 'NOTION_TOKEN no configurado en Vercel' })

  const { action, databaseId, data } = req.body

  try {
    // ── Listar databases ──────────────────────────────────────────
    if (action === 'list_databases') {
      const resp = await fetch('https://api.notion.com/v1/search', {
        method: 'POST',
        headers: headers(token),
        body: JSON.stringify({ filter: { value: 'database', property: 'object' } }),
      })
      const json = await resp.json()
      if (!resp.ok) return res.status(resp.status).json({ error: json.message })

      const databases = (json.results || []).map(db => ({
        id:   db.id,
        name: (db.title?.[0]?.plain_text) || 'Sin nombre',
      }))
      return res.json({ success: true, databases })
    }

    // ── Guardar empresa en pipeline ───────────────────────────────
    if (action === 'save_company') {
      if (!databaseId || !data?.nombre) return res.status(400).json({ error: 'databaseId y data.nombre requeridos' })

      const rt = (val) => ({ rich_text: [{ text: { content: String(val || '').slice(0, 2000) } }] })

      const properties = {
        'Nombre':      { title:     [{ text: { content: String(data.nombre || '').slice(0, 2000) } }] },
        'Ciudad':      rt(data.ciudad),
        'Nicho':       rt(data.nicho),
        'Web':         rt(data.web),
        'Teléfono':    rt(data.telefono),
        'Email':       rt(data.email),
        'Estrategia':  rt(data.estrategia),
      }

      const resp = await fetch('https://api.notion.com/v1/pages', {
        method: 'POST',
        headers: headers(token),
        body: JSON.stringify({ parent: { database_id: databaseId }, properties }),
      })
      const json = await resp.json()
      if (!resp.ok) return res.status(resp.status).json({ error: json.message })
      return res.json({ success: true, pageId: json.id })
    }

    // ── Guardar email enviado ─────────────────────────────────────
    if (action === 'save_email') {
      if (!databaseId || !data?.subject) return res.status(400).json({ error: 'databaseId y data.subject requeridos' })

      const rt = (val) => ({ rich_text: [{ text: { content: String(val || '').slice(0, 2000) } }] })

      const properties = {
        'Asunto':       { title:     [{ text: { content: String(data.subject || '').slice(0, 2000) } }] },
        'Destinatario': rt(data.to),
        'Empresa':      rt(data.empresa),
        'Fecha':        { date: { start: new Date().toISOString() } },
        'Resend ID':    rt(data.resendId),
      }

      const resp = await fetch('https://api.notion.com/v1/pages', {
        method: 'POST',
        headers: headers(token),
        body: JSON.stringify({ parent: { database_id: databaseId }, properties }),
      })
      const json = await resp.json()
      if (!resp.ok) return res.status(resp.status).json({ error: json.message })
      return res.json({ success: true, pageId: json.id })
    }

    return res.status(400).json({ error: `Acción desconocida: ${action}` })
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message })
  }
}
