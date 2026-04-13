import Anthropic from '@anthropic-ai/sdk'

export const maxDuration = 60

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ═══════════════════════════════════════════════════════════════════════════════
// HERRAMIENTAS — solo IO externo, sin llamadas internas a Claude
// Claude genera todo el contenido en su respuesta de texto.
// Las herramientas solo ejecutan acciones con APIs externas.
// ═══════════════════════════════════════════════════════════════════════════════
const TOOLS = [
  {
    name: 'send_email',
    description: 'Envía un email real. Úsalo después de generar el contenido del email en tu respuesta.',
    input_schema: {
      type: 'object',
      properties: {
        to:      { type: 'string', description: 'Email del destinatario' },
        subject: { type: 'string', description: 'Asunto del email' },
        body:    { type: 'string', description: 'Cuerpo completo del email en texto plano' },
      },
      required: ['to', 'subject', 'body'],
    },
  },
  {
    name: 'publish_linkedin',
    description: 'Publica un post en el LinkedIn de Hutrit. Úsalo después de redactar el post. Si tienes imageBase64 de generate_image, inclúyela.',
    input_schema: {
      type: 'object',
      properties: {
        text:        { type: 'string', description: 'Texto completo del post con hashtags' },
        imageBase64: { type: 'string', description: 'Imagen en base64 generada por generate_image (opcional)' },
        mimeType:    { type: 'string', description: 'Tipo MIME de la imagen, ej: image/png (opcional)' },
      },
      required: ['text'],
    },
  },
  {
    name: 'publish_instagram',
    description: 'Publica en Instagram de Hutrit. Requiere URL pública de imagen (usa generate_image primero).',
    input_schema: {
      type: 'object',
      properties: {
        caption:   { type: 'string', description: 'Caption con hashtags' },
        image_url: { type: 'string', description: 'URL pública de la imagen' },
      },
      required: ['caption', 'image_url'],
    },
  },
  {
    name: 'search_web',
    description: 'Busca información real en internet. Úsalo para investigar empresas, sectores o noticias antes de analizar.',
    input_schema: {
      type: 'object',
      properties: {
        query:      { type: 'string', description: 'Término de búsqueda' },
        maxResults: { type: 'number', description: 'Número de resultados (default 5)' },
      },
      required: ['query'],
    },
  },
  {
    name: 'scrape_url',
    description: 'Lee el contenido de una URL. Úsalo para leer la web de una empresa antes de analizarla.',
    input_schema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'URL a leer' },
      },
      required: ['url'],
    },
  },
  {
    name: 'prospect_companies',
    description: 'Encuentra empresas reales por ciudad y sector usando Google Maps. Devuelve nombre, web y teléfono.',
    input_schema: {
      type: 'object',
      properties: {
        ciudad:     { type: 'string', description: 'Ciudad donde buscar, ej: Valencia, Barcelona, Madrid' },
        nicho:      { type: 'string', description: 'Tipo de empresa, ej: empresa de ventas, startup SaaS, agencia de marketing' },
        maxResults: { type: 'number', description: 'Número de resultados (default 5, max 8)' },
      },
      required: ['ciudad', 'nicho'],
    },
  },
  {
    name: 'generate_image',
    description: 'Genera una imagen profesional con IA (Gemini) para LinkedIn o Instagram.',
    input_schema: {
      type: 'object',
      properties: {
        prompt: { type: 'string', description: 'Descripción del concepto visual' },
        style:  { type: 'string', description: 'profesional | minimalista | impacto | lifestyle' },
      },
      required: ['prompt'],
    },
  },
  {
    name: 'save_to_notion',
    description: 'Guarda contenido como página en Notion. Úsalo para exportar auditorías, calendarios, listas de empresas o cualquier entregable. Desde Notion se puede exportar como PDF.',
    input_schema: {
      type: 'object',
      properties: {
        titulo:    { type: 'string', description: 'Título de la página' },
        contenido: { type: 'string', description: 'Contenido completo a guardar' },
        tipo:      { type: 'string', description: 'auditoria | calendario | contenido | outreach | prospectos | estrategia' },
      },
      required: ['titulo', 'contenido'],
    },
  },
  {
    name: 'export_pdf',
    description: 'Exporta cualquier contenido como PDF descargable. Genera un documento HTML formateado con el branding de Hutrit que el usuario puede guardar como PDF.',
    input_schema: {
      type: 'object',
      properties: {
        titulo:    { type: 'string', description: 'Título del documento' },
        contenido: { type: 'string', description: 'Contenido completo del documento en texto plano o markdown básico' },
        tipo:      { type: 'string', description: 'auditoria | outreach | calendario | informe' },
      },
      required: ['titulo', 'contenido'],
    },
  },
]

// ═══════════════════════════════════════════════════════════════════════════════
// EJECUCIÓN DE HERRAMIENTAS — solo IO, sin Claude interno
// ═══════════════════════════════════════════════════════════════════════════════
async function executeTool(name, input) {
  try {

    if (name === 'send_email') {
      const apiKey = process.env.RESEND_API_KEY
      if (!apiKey) return { success: false, error: 'RESEND_API_KEY no configurada en Vercel' }
      const testEmail = process.env.RESEND_TEST_EMAIL
      const to = testEmail ? [testEmail] : [input.to]
      const subject = testEmail ? `[TEST → ${input.to}] ${input.subject}` : input.subject
      const resp = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: 'onboarding@resend.dev', to, subject, html: input.body.replace(/\n/g, '<br>') }),
      })
      const data = await resp.json()
      if (!resp.ok) return { success: false, error: data.message || 'Error de Resend' }
      return { success: true, message: `Email enviado a ${to[0]}` }
    }

    if (name === 'publish_linkedin') {
      const url = process.env.MAKE_WEBHOOK_URL
      if (!url) return { success: false, error: 'MAKE_WEBHOOK_URL no configurada en Vercel' }
      const payload = { text: input.text }
      if (input.imageBase64) {
        payload.imageBase64 = input.imageBase64
        payload.mimeType = input.mimeType || 'image/png'
      }
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!resp.ok) return { success: false, error: 'Error al publicar en LinkedIn' }
      return { success: true, message: input.imageBase64 ? 'Post con imagen publicado en LinkedIn' : 'Post publicado en LinkedIn' }
    }

    if (name === 'publish_instagram') {
      const userId = process.env.INSTAGRAM_USER_ID
      const token  = process.env.INSTAGRAM_ACCESS_TOKEN
      if (!userId || !token) return { success: false, error: 'Credenciales de Instagram no configuradas' }
      if (!input.image_url) return { success: false, error: 'Se necesita image_url pública' }

      const post = async (ep, params) => {
        const body = new URLSearchParams({ ...params, access_token: token })
        return fetch(`https://graph.facebook.com/v19.0${ep}`, {
          method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body.toString(),
        }).then(r => r.json())
      }

      const container = await post(`/${userId}/media`, { image_url: input.image_url, caption: input.caption })
      if (!container?.id) return { success: false, error: container?.error?.message || 'Error creando container' }

      let status = null
      for (let i = 0; i < 10; i++) {
        await new Promise(r => setTimeout(r, 4000))
        const s = await fetch(`https://graph.facebook.com/v19.0/${container.id}?fields=status_code&access_token=${token}`).then(r => r.json())
        status = s?.status_code
        if (status === 'FINISHED') break
        if (['ERROR', 'EXPIRED'].includes(status)) return { success: false, error: `Instagram error: ${status}` }
      }
      if (status !== 'FINISHED') return { success: false, error: 'Timeout procesando imagen en Instagram' }

      const pub = await post(`/${userId}/media_publish`, { creation_id: container.id })
      if (!pub?.id) return { success: false, error: pub?.error?.message || 'Error publicando' }
      return { success: true, message: `Publicado en Instagram (ID: ${pub.id})` }
    }

    if (name === 'search_web') {
      const apiKey = process.env.APIFY_API_KEY
      if (!apiKey) return { success: false, error: 'APIFY_API_KEY no configurada en Vercel' }
      const resp = await fetch(
        `https://api.apify.com/v2/acts/apify~google-search-scraper/run-sync-get-dataset-items?token=${apiKey}&format=json`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ queries: input.query, maxPagesPerQuery: 1, resultsPerPage: input.maxResults || 5, countryCode: 'es', languageCode: 'es' }),
          signal: AbortSignal.timeout(20000),
        }
      )
      if (!resp.ok) return { success: false, error: 'Error en búsqueda web' }
      const items = await resp.json()
      const results = []
      for (const item of items || []) {
        for (const r of item.organicResults || []) {
          results.push({ title: r.title, url: r.url, description: r.description || '' })
          if (results.length >= (input.maxResults || 5)) break
        }
        if (results.length >= (input.maxResults || 5)) break
      }
      const summary = results.map(r => `${r.title}: ${r.description} (${r.url})`).join('\n')
      return { success: true, results, summary, message: `${results.length} resultados encontrados` }
    }

    if (name === 'scrape_url') {
      const resp = await fetch(input.url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; HutritAgent/1.0)' },
        signal: AbortSignal.timeout(8000),
      })
      if (!resp.ok) return { success: false, error: `Error ${resp.status} accediendo a ${input.url}` }
      const html = await resp.text()
      const text = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 3000)
      return { success: true, content: text, url: input.url, message: `Contenido leído de ${input.url}` }
    }

    if (name === 'prospect_companies') {
      const apiKey = process.env.GOOGLE_MAPS_API_KEY
      if (!apiKey) return { success: false, error: 'GOOGLE_MAPS_API_KEY no configurada en Vercel' }
      const max = Math.min(input.maxResults || 5, 8)
      const query = `${input.nicho} en ${input.ciudad}, España`
      const resp = await fetch(`https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}`)
      const data = await resp.json()
      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') return { success: false, error: `Google Places: ${data.status}` }

      // Obtener detalles en paralelo para ser más rápido
      const empresas = await Promise.all(
        (data.results || []).slice(0, max).map(async (p) => {
          let web = '', telefono = ''
          if (p.place_id) {
            try {
              const det = await fetch(`https://maps.googleapis.com/maps/api/place/details/json?place_id=${p.place_id}&fields=website,formatted_phone_number&key=${apiKey}`).then(r => r.json())
              web = det.result?.website || ''; telefono = det.result?.formatted_phone_number || ''
            } catch {}
          }
          return { nombre: p.nombre || p.name, ciudad: input.ciudad, sector: input.nicho, rating: p.rating || 0, web, telefono }
        })
      )
      return { success: true, empresas, message: `${empresas.length} empresas encontradas en ${input.ciudad}` }
    }

    if (name === 'generate_image') {
      const apiKey = process.env.GEMINI_API_KEY
      if (!apiKey) return { success: false, error: 'GEMINI_API_KEY no configurada en Vercel' }
      const STYLES = {
        profesional: 'Corporate professional, clean background, Hutrit brand teal (#0D5C54), modern typography',
        minimalista: 'Minimalist, lots of white space, teal accent (#0D9488), geometric, clean',
        impacto:     'Bold, dark background, bright teal and white, high contrast, tech startup feel',
        lifestyle:   'Warm lifestyle photography, diverse Latin American professionals, collaborative workspace, authentic',
      }
      const style = STYLES[input.style] || STYLES.profesional
      const fullPrompt = `Social media image for Hutrit Europa talent platform. ${input.prompt}. Style: ${style}. Square 1:1 format, professional, no text overlays.`

      // Imagen 3 primero
      const r1 = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instances: [{ prompt: fullPrompt }], parameters: { sampleCount: 1, aspectRatio: '1:1' } }),
      })
      const d1 = await r1.json()
      if (d1.predictions?.[0]?.bytesBase64Encoded) {
        return { success: true, imageBase64: d1.predictions[0].bytesBase64Encoded, mimeType: 'image/png', message: 'Imagen generada' }
      }

      // Fallback Gemini Flash
      const r2 = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent?key=${apiKey}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: fullPrompt }] }], generationConfig: { responseModalities: ['IMAGE', 'TEXT'] } }),
      })
      const d2 = await r2.json()
      const imgPart = d2.candidates?.[0]?.content?.parts?.find(p => p.inlineData?.mimeType?.startsWith('image/'))
      if (imgPart) return { success: true, imageBase64: imgPart.inlineData.data, mimeType: imgPart.inlineData.mimeType, message: 'Imagen generada' }
      return { success: false, error: 'No se pudo generar la imagen' }
    }

    if (name === 'save_to_notion') {
      const token = process.env.NOTION_TOKEN
      if (!token) return { success: false, error: 'NOTION_TOKEN no configurado en Vercel' }
      const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'Notion-Version': '2022-06-28' }

      const search = await fetch('https://api.notion.com/v1/search', {
        method: 'POST', headers,
        body: JSON.stringify({ filter: { value: 'page', property: 'object' }, page_size: 5 }),
      }).then(r => r.json())

      const parent = search.results?.[0]
      if (!parent) return { success: false, error: 'No hay páginas compartidas en Notion. Comparte una página con la integración.' }

      const blocks = input.contenido.split('\n').filter(l => l.trim()).slice(0, 100).map(line => ({
        object: 'block', type: 'paragraph',
        paragraph: { rich_text: [{ type: 'text', text: { content: line.slice(0, 2000) } }] },
      }))

      const page = await fetch('https://api.notion.com/v1/pages', {
        method: 'POST', headers,
        body: JSON.stringify({
          parent: { page_id: parent.id },
          properties: { title: { title: [{ text: { content: input.titulo } }] } },
          children: blocks,
        }),
      }).then(r => r.json())

      if (!page.id) return { success: false, error: page.message || 'Error creando página en Notion' }
      return { success: true, message: `Página "${input.titulo}" guardada en Notion`, pageId: page.id }
    }

    if (name === 'export_pdf') {
      const lines = input.contenido.split('\n').filter(l => l.trim())
      const bodyHtml = lines.map(line => {
        if (line.startsWith('## ')) return `<h2>${line.slice(3)}</h2>`
        if (line.startsWith('# '))  return `<h1>${line.slice(2)}</h1>`
        if (line.startsWith('- '))  return `<li>${line.slice(2)}</li>`
        if (line.startsWith('**') && line.endsWith('**')) return `<strong>${line.slice(2, -2)}</strong>`
        return `<p>${line}</p>`
      }).join('\n')

      const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
<title>${input.titulo}</title>
<style>
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:800px;margin:0 auto;padding:40px;color:#1e293b;font-size:14px;line-height:1.7}
  h1{font-size:24px;font-weight:700;color:#0D5C54;border-bottom:2px solid #0D9488;padding-bottom:10px;margin-bottom:24px}
  h2{font-size:18px;font-weight:600;color:#0D5C54;margin-top:28px}
  p{margin:8px 0}li{margin:4px 0}
  .header{background:#0D5C54;color:white;padding:20px 24px;border-radius:8px;margin-bottom:32px;display:flex;justify-content:space-between;align-items:center}
  .header-title{font-size:20px;font-weight:700}
  .header-sub{font-size:12px;opacity:0.7}
  .date{font-size:11px;color:#64748b;margin-top:32px;border-top:1px solid #e2e8f0;padding-top:12px}
  @media print{body{padding:20px}.no-print{display:none}}
</style>
</head><body>
<div class="header">
  <div><div class="header-title">Hutrit Europa</div><div class="header-sub">hutrit.com · Talento LATAM para empresas europeas</div></div>
  <div style="font-size:12px;opacity:0.7">${new Date().toLocaleDateString('es-ES',{year:'numeric',month:'long',day:'numeric'})}</div>
</div>
<h1>${input.titulo}</h1>
${bodyHtml}
<div class="date">Generado por Hutrit Agent · ${new Date().toISOString().slice(0,10)}</div>
<script>window.onload=()=>{window.print()}<\/script>
</body></html>`

      const base64 = Buffer.from(html).toString('base64')
      return {
        success: true,
        pdfHtml: base64,
        message: `PDF "${input.titulo}" listo para descargar`,
        titulo: input.titulo,
      }
    }

    return { success: false, error: `Herramienta '${name}' desconocida` }
  } catch (e) {
    return { success: false, error: e.message }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// GENERADOR DE CONTENIDO — Claude solo genera texto, no decide herramientas
// Evita que Claude diga "no puedo" porque no le preguntamos si puede o no.
// ═══════════════════════════════════════════════════════════════════════════════
async function generateContent(prompt, maxTokens = 800) {
  const resp = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: maxTokens,
    system: 'Eres el redactor de Hutrit Europa. Hutrit conecta empresas europeas con talento remoto LATAM (tech, marketing, ventas, diseño). Responde siempre en español. Devuelve SOLO el contenido solicitado, sin explicaciones ni comentarios.',
    messages: [{ role: 'user', content: prompt }],
  })
  return resp.content.find(b => b.type === 'text')?.text || ''
}

// ═══════════════════════════════════════════════════════════════════════════════
// DETECCIÓN DE PIPELINE — determina qué acción ejecutar sin preguntarle a Claude
// ═══════════════════════════════════════════════════════════════════════════════
function detectPipeline(text) {
  const t = text.toLowerCase()
  const hasLinkedIn   = t.includes('linkedin')
  const hasInstagram  = t.includes('instagram')
  const hasSocial     = hasLinkedIn || hasInstagram
  const hasPublish    = t.includes('publica') || t.includes('publicar') || t.includes('post')
  const hasImage      = t.includes('imagen') || t.includes('estático') || t.includes('estatico') || t.includes('visual') || t.includes('creativo')
  const hasEmail      = t.includes('email') || t.includes('correo') || t.includes('envia') || t.includes('envía') || t.includes('manda')
  const hasOutreach   = t.includes('outreach') || (hasEmail && (t.includes('empresa') || t.includes('agencia') || t.includes('cliente')))
  const hasProspect   = t.includes('busca') && (t.includes('empresa') || t.includes('agencia') || t.includes('startup'))
  const hasCalendar   = t.includes('calendario') || t.includes('plan de contenido') || t.includes('semana')
  const hasAudit      = t.includes('audita') || t.includes('auditoria') || t.includes('audit')
  const hasGenImage   = t.includes('genera') && hasImage && !hasSocial

  if (hasImage && hasPublish && hasLinkedIn) return 'image_post_linkedin'
  if (hasImage && hasPublish && hasInstagram) return 'image_post_instagram'
  if (hasPublish && hasLinkedIn)              return 'text_post_linkedin'
  if (hasPublish && hasInstagram)             return 'text_post_instagram'
  if (hasProspect && hasOutreach)             return 'prospect_and_outreach'
  if (hasAudit && hasEmail)                   return 'audit_and_email'
  if (hasGenImage)                            return 'generate_image_only'
  if (hasCalendar)                            return 'generate_calendar'
  if (hasEmail && t.includes('@'))            return 'send_email_direct'
  return null
}

// ═══════════════════════════════════════════════════════════════════════════════
// PIPELINES — ejecutan acciones directamente sin pasar por tool_use de Claude
// ═══════════════════════════════════════════════════════════════════════════════
async function runPipeline(pipeline, userMessage, messages, sse) {
  const ctx = `Petición del usuario: "${userMessage}"`

  // ── Publicar en LinkedIn con imagen ──────────────────────────────────────────
  if (pipeline === 'image_post_linkedin') {
    sse({ text: 'Generando imagen...\n' })
    const imgPrompt = await generateContent(`${ctx}\n\nEscribe un prompt en inglés de una frase para generar una imagen profesional para LinkedIn de Hutrit Europa. Solo el prompt, sin explicación.`, 150)
    sse({ toolCall: { name: 'generate_image', input: { prompt: imgPrompt, style: 'profesional' } } })
    const img = await executeTool('generate_image', { prompt: imgPrompt, style: 'profesional' })
    sse({ toolResult: { name: 'generate_image', ...img } })

    sse({ text: 'Redactando post...\n' })
    const postText = await generateContent(`${ctx}\n\nEscribe un post de LinkedIn en español para Hutrit Europa. Máximo 3 párrafos + hashtags. Solo el texto del post.`)

    sse({ text: 'Publicando en LinkedIn...\n' })
    sse({ toolCall: { name: 'publish_linkedin', input: { text: postText } } })
    const pub = await executeTool('publish_linkedin', { text: postText, imageBase64: img.imageBase64, mimeType: img.mimeType })
    sse({ toolResult: { name: 'publish_linkedin', ...pub } })

    sse({ text: pub.success ? `\n✅ Publicado en LinkedIn.\n\n---\n${postText}` : `\n❌ Error al publicar: ${pub.error}` })
    return
  }

  // ── Publicar en LinkedIn solo texto ──────────────────────────────────────────
  if (pipeline === 'text_post_linkedin') {
    sse({ text: 'Redactando post para LinkedIn...\n' })
    const postText = await generateContent(`${ctx}\n\nEscribe un post de LinkedIn en español para Hutrit Europa. Máximo 3 párrafos + hashtags. Solo el texto del post.`)

    sse({ text: 'Publicando en LinkedIn...\n' })
    sse({ toolCall: { name: 'publish_linkedin', input: { text: postText } } })
    const pub = await executeTool('publish_linkedin', { text: postText })
    sse({ toolResult: { name: 'publish_linkedin', ...pub } })

    sse({ text: pub.success ? `\n✅ Publicado en LinkedIn.\n\n---\n${postText}` : `\n❌ Error al publicar: ${pub.error}` })
    return
  }

  // ── Publicar en Instagram con imagen ─────────────────────────────────────────
  if (pipeline === 'image_post_instagram') {
    sse({ text: 'Generando imagen...\n' })
    const imgPrompt = await generateContent(`${ctx}\n\nEscribe un prompt en inglés para generar imagen cuadrada para Instagram de Hutrit Europa. Solo el prompt.`, 150)
    sse({ toolCall: { name: 'generate_image', input: { prompt: imgPrompt, style: 'impacto' } } })
    const img = await executeTool('generate_image', { prompt: imgPrompt, style: 'impacto' })
    sse({ toolResult: { name: 'generate_image', ...img } })

    const caption = await generateContent(`${ctx}\n\nEscribe un caption para Instagram de Hutrit Europa con emojis y hashtags. Solo el caption.`)
    sse({ text: '\nNota: Instagram requiere URL pública de imagen. La imagen fue generada — guárdala y sube manualmente o configura almacenamiento en nube.\n\nCaption listo:\n\n' + caption })
    return
  }

  // ── Solo texto Instagram ──────────────────────────────────────────────────────
  if (pipeline === 'text_post_instagram') {
    const caption = await generateContent(`${ctx}\n\nEscribe un caption para Instagram de Hutrit Europa con emojis y hashtags. Solo el caption.`)
    sse({ text: 'Caption listo (Instagram requiere imagen para publicar vía API):\n\n' + caption })
    return
  }

  // ── Buscar empresas + outreach ────────────────────────────────────────────────
  if (pipeline === 'prospect_and_outreach') {
    const cityMatch = userMessage.match(/en\s+([A-ZÁÉÍÓÚa-záéíóú]+)/i)
    const ciudad = cityMatch?.[1] || 'Barcelona'
    const nichoMatch = userMessage.match(/(agencias?|startups?|empresas?|saas|tech|marketing|hr|ecommerce)[^,.]*/i)
    const nicho = nichoMatch?.[0] || 'empresa tech'

    sse({ text: `Buscando ${nicho} en ${ciudad}...\n` })
    sse({ toolCall: { name: 'prospect_companies', input: { ciudad, nicho, maxResults: 5 } } })
    const prospects = await executeTool('prospect_companies', { ciudad, nicho, maxResults: 5 })
    sse({ toolResult: { name: 'prospect_companies', ...prospects } })

    if (!prospects.success || !prospects.empresas?.length) {
      sse({ text: `\nNo encontré empresas. Prueba con ciudad y sector más específicos.` })
      return
    }

    sse({ text: `\nEncontré ${prospects.empresas.length} empresas. Enviando outreach...\n` })
    let sent = 0
    for (const empresa of prospects.empresas) {
      const email = await generateContent(
        `Escribe un email de outreach corto (3 párrafos) de Hutrit Europa para ${empresa.nombre} (${empresa.sector || nicho}) en ${ciudad}. Ofrecemos talento remoto LATAM validado. Asunto incluido al inicio como "Asunto: ...". Tono: profesional y directo.`
      )
      const lines = email.split('\n')
      const subjectLine = lines.find(l => l.toLowerCase().startsWith('asunto:')) || ''
      const subject = subjectLine.replace(/^asunto:\s*/i, '').trim() || `Talento LATAM para ${empresa.nombre}`
      const body = lines.filter(l => !l.toLowerCase().startsWith('asunto:')).join('\n').trim()

      const to = empresa.web ? `contacto@${empresa.web.replace(/https?:\/\/(www\.)?/, '').split('/')[0]}` : ''
      if (!to && !process.env.RESEND_TEST_EMAIL) {
        sse({ text: `⚠️ Sin email para ${empresa.nombre} — saltando.\n` })
        continue
      }

      sse({ toolCall: { name: 'send_email', input: { to: to || 'test', subject, body } } })
      const result = await executeTool('send_email', { to, subject, body })
      sse({ toolResult: { name: 'send_email', ...result } })
      if (result.success) sent++
    }
    sse({ text: `\n✅ Outreach completado: ${sent}/${prospects.empresas.length} emails enviados.` })
    return
  }

  // ── Auditar empresa + email ───────────────────────────────────────────────────
  if (pipeline === 'audit_and_email') {
    const emailMatch = userMessage.match(/[\w.-]+@[\w.-]+\.\w+/)
    const to = emailMatch?.[0] || ''
    const companyMatch = userMessage.match(/audita\s+(\w[\w\s]+?)(?:\s+y|\s*,|$)/i)
    const empresa = companyMatch?.[1]?.trim() || 'la empresa'

    sse({ text: `Investigando ${empresa}...\n` })
    sse({ toolCall: { name: 'search_web', input: { query: `${empresa} empresa España LinkedIn` } } })
    const search = await executeTool('search_web', { query: `${empresa} empresa España LinkedIn` })
    sse({ toolResult: { name: 'search_web', ...search } })

    const context = search.success ? `Info encontrada: ${search.summary}` : ''
    const audit = await generateContent(
      `Analiza la empresa "${empresa}" para Hutrit Europa.\n${context}\n\nIdentifica: puntos de dolor de talento, roles que necesitan, oportunidad para contratar talent LATAM. Sé específico y conciso.`,
      600
    )
    sse({ text: `\n${audit}\n\n` })

    if (to) {
      const email = await generateContent(
        `Escribe un email de outreach de Hutrit Europa para ${empresa} (${to}). Contexto del análisis: ${audit.slice(0, 300)}. Asunto incluido al inicio como "Asunto: ...". 3 párrafos, tono profesional.`
      )
      const lines = email.split('\n')
      const subject = (lines.find(l => l.toLowerCase().startsWith('asunto:')) || '').replace(/^asunto:\s*/i, '').trim() || `Propuesta de talento LATAM para ${empresa}`
      const body = lines.filter(l => !l.toLowerCase().startsWith('asunto:')).join('\n').trim()

      sse({ toolCall: { name: 'send_email', input: { to, subject, body } } })
      const result = await executeTool('send_email', { to, subject, body })
      sse({ toolResult: { name: 'send_email', ...result } })
      sse({ text: result.success ? `\n✅ Email enviado a ${to}.` : `\n❌ Error enviando email: ${result.error}` })
    }
    return
  }

  // ── Generar solo imagen ───────────────────────────────────────────────────────
  if (pipeline === 'generate_image_only') {
    const imgPrompt = await generateContent(`${ctx}\n\nEscribe un prompt en inglés para generar una imagen profesional para redes sociales de Hutrit Europa. Solo el prompt.`, 150)
    sse({ toolCall: { name: 'generate_image', input: { prompt: imgPrompt, style: 'profesional' } } })
    const img = await executeTool('generate_image', { prompt: imgPrompt, style: 'profesional' })
    sse({ toolResult: { name: 'generate_image', ...img } })
    if (!img.success) sse({ text: `\n❌ Error generando imagen: ${img.error}` })
    return
  }

  // ── Calendario de contenido ───────────────────────────────────────────────────
  if (pipeline === 'generate_calendar') {
    sse({ text: 'Generando calendario de contenido...\n' })
    const calendar = await generateContent(
      `${ctx}\n\nCrea un calendario de contenido detallado para LinkedIn de Hutrit Europa. Incluye: fecha, tema, formato (post/carrusel/video), copy de cada publicación, hashtags. Mínimo 10 entradas. Formato claro con separadores.`,
      1200
    )
    sse({ text: calendar + '\n\n' })

    sse({ toolCall: { name: 'save_to_notion', input: { titulo: 'Calendario de Contenido Hutrit', contenido: calendar, tipo: 'calendario' } } })
    const saved = await executeTool('save_to_notion', { titulo: 'Calendario de Contenido Hutrit', contenido: calendar, tipo: 'calendario' })
    sse({ toolResult: { name: 'save_to_notion', ...saved } })
    sse({ text: saved.success ? '\n✅ Guardado en Notion.' : `\n⚠️ No se pudo guardar en Notion: ${saved.error}` })
    return
  }

  // ── Email directo ─────────────────────────────────────────────────────────────
  if (pipeline === 'send_email_direct') {
    const emailMatch = userMessage.match(/[\w.-]+@[\w.-]+\.\w+/)
    const to = emailMatch?.[0] || ''

    const email = await generateContent(`${ctx}\n\nEscribe un email profesional de Hutrit Europa. Asunto al inicio como "Asunto: ...". 3 párrafos concisos.`)
    const lines = email.split('\n')
    const subject = (lines.find(l => l.toLowerCase().startsWith('asunto:')) || '').replace(/^asunto:\s*/i, '').trim() || 'Propuesta Hutrit Europa'
    const body = lines.filter(l => !l.toLowerCase().startsWith('asunto:')).join('\n').trim()

    sse({ toolCall: { name: 'send_email', input: { to, subject, body } } })
    const result = await executeTool('send_email', { to, subject, body })
    sse({ toolResult: { name: 'send_email', ...result } })
    sse({ text: result.success ? `\n✅ Email enviado a ${to}.\n\n---\n**${subject}**\n\n${body}` : `\n❌ Error: ${result.error}` })
    return
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SYSTEM PROMPT — solo para el modo conversacional (fallback)
// ═══════════════════════════════════════════════════════════════════════════════
const SYSTEM = `Eres Hutrit Agent, el asistente de operaciones de Hutrit Europa.
Hutrit conecta empresas europeas con talento remoto LATAM (tech, marketing, ventas, diseño, datos).
Responde siempre en español. Sé conciso y útil.
Si el usuario pide ejecutar una acción, dile que lo puede pedir con un comando más directo.`

// ═══════════════════════════════════════════════════════════════════════════════
// HANDLER
// ═══════════════════════════════════════════════════════════════════════════════
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const { messages } = req.body
  if (!messages?.length) return res.status(400).json({ error: 'messages requerido' })

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')

  const sse = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`)

  try {
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')
    const userText = typeof lastUserMsg?.content === 'string' ? lastUserMsg.content : ''

    // Intenta ejecutar pipeline directo (no pasa por tool_use de Claude)
    const pipeline = detectPipeline(userText)
    if (pipeline) {
      await runPipeline(pipeline, userText, messages, sse)
      sse('[DONE]')
      res.end()
      return
    }

    // Fallback: modo conversacional con Claude (sin tools, solo texto)
    const stream = client.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      system: SYSTEM,
      messages,
    })
    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
        sse({ text: event.delta.text })
      }
    }

    sse('[DONE]')
    res.end()
  } catch (err) {
    sse({ error: err.message })
    res.end()
  }
}
