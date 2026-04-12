// POST /api/publish-instagram — SSE streaming con progreso en tiempo real
// Body: { imageUrls: string[], caption: string }
// Env: INSTAGRAM_USER_ID, INSTAGRAM_ACCESS_TOKEN

// Nota: requiere Vercel Pro (maxDuration 300s) por el polling del container.
export const maxDuration = 300

const API_VERSION = 'v19.0'
const BASE = `https://graph.facebook.com/${API_VERSION}`

async function igPost(endpoint, params, token) {
  const body = new URLSearchParams({ ...params, access_token: token })
  const resp = await fetch(`${BASE}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })
  return resp.json()
}

async function igGet(endpoint, params, token) {
  const qs = new URLSearchParams({ ...params, access_token: token })
  const resp = await fetch(`${BASE}${endpoint}?${qs}`)
  return resp.json()
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { imageUrls, caption } = req.body
  const userId = process.env.INSTAGRAM_USER_ID
  const token  = process.env.INSTAGRAM_ACCESS_TOKEN

  if (!userId || !token) return res.status(500).json({ error: 'Credenciales de Instagram no configuradas en Vercel' })
  if (!imageUrls?.length) return res.status(400).json({ error: 'imageUrls requerido' })
  if (imageUrls.length === 1 && imageUrls[0] === '') return res.status(400).json({ error: 'Añade al menos una URL de imagen' })

  const isCarousel = imageUrls.length > 1
  if (isCarousel && imageUrls.length > 10) return res.status(400).json({ error: 'Máximo 10 imágenes por carousel' })

  // SSE headers
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')

  const send = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`)
  const done = (data) => { res.write(`data: ${JSON.stringify({ ...data, done: true })}\n\n`); res.end() }

  try {
    let containerId

    if (isCarousel) {
      // ── Carousel ──────────────────────────────────────────────────
      send({ log: `Creando ${imageUrls.length} slides...` })

      const childrenIds = []
      for (let i = 0; i < imageUrls.length; i++) {
        send({ log: `  Slide ${i + 1}/${imageUrls.length}` })
        const item = await igPost(`/${userId}/media`, {
          image_url: imageUrls[i],
          is_carousel_item: 'true',
        }, token)

        if (!item?.id) {
          return done({ success: false, error: `Slide ${i + 1}: ${item?.error?.message || 'Error creando container'}` })
        }
        childrenIds.push(item.id)
        await new Promise(r => setTimeout(r, 1000))
      }

      send({ log: 'Creando container del carousel...' })
      const carousel = await igPost(`/${userId}/media`, {
        media_type: 'CAROUSEL',
        children: childrenIds.join(','),
        caption,
      }, token)

      if (!carousel?.id) {
        return done({ success: false, error: carousel?.error?.message || 'Error creando carousel' })
      }
      containerId = carousel.id

    } else {
      // ── Imagen única ─────────────────────────────────────────────
      send({ log: 'Creando container de imagen...' })
      const item = await igPost(`/${userId}/media`, {
        image_url: imageUrls[0],
        caption,
      }, token)

      if (!item?.id) {
        return done({ success: false, error: item?.error?.message || 'Error creando container' })
      }
      containerId = item.id
    }

    // ── Polling hasta FINISHED ────────────────────────────────────
    send({ log: 'Esperando procesamiento de Instagram...' })
    let statusCode = null

    for (let i = 0; i < 24; i++) {
      await new Promise(r => setTimeout(r, 5000))
      const status = await igGet(`/${containerId}`, { fields: 'status_code,status' }, token)
      statusCode = status?.status_code
      send({ log: `  Estado (${(i + 1) * 5}s): ${statusCode}` })

      if (statusCode === 'FINISHED') break
      if (['ERROR', 'EXPIRED'].includes(statusCode)) {
        return done({ success: false, error: `Container falló con estado: ${statusCode}` })
      }
    }

    if (statusCode !== 'FINISHED') {
      return done({ success: false, error: 'Timeout (120s): Instagram no procesó el media a tiempo' })
    }

    // ── Publicar ──────────────────────────────────────────────────
    send({ log: 'Publicando en Instagram...' })
    const pub = await igPost(`/${userId}/media_publish`, { creation_id: containerId }, token)

    if (pub?.id) {
      done({ success: true, postId: pub.id, log: `Publicado. Post ID: ${pub.id}` })
    } else {
      done({ success: false, error: pub?.error?.message || 'Error en media_publish' })
    }

  } catch (err) {
    done({ success: false, error: err.message })
  }
}
