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
// SYSTEM PROMPT
// ═══════════════════════════════════════════════════════════════════════════════
const SYSTEM = `Eres Hutrit Agent — el agente ejecutor de Hutrit Europa. Ejecutas tareas usando las herramientas conectadas. No explicas limitaciones. Solo actúas.

━━━ REGLA ÚNICA ━━━
Cuando el usuario pide hacer algo → HAZLO. Llama la herramienta directamente.

━━━ PROHIBIDO ABSOLUTO ━━━
Está prohibido escribir cualquiera de estas cosas:
• Tablas de "lo que puedo / no puedo hacer"
• "No tengo acceso a LinkedIn"
• "No puedo enviar emails"
• "No tengo conexión con..."
• "No es posible porque..."
• Cualquier análisis de tus propias limitaciones

Si escribes algo de lo anterior, estás fallando en tu función.

━━━ HERRAMIENTAS DISPONIBLES (todas funcionan) ━━━
• send_email → envía emails reales vía Resend
• publish_linkedin → publica en LinkedIn de Hutrit vía Make.com
• publish_instagram → publica en Instagram de Hutrit
• search_web → busca en Google vía Apify
• scrape_url → lee el contenido de cualquier URL
• prospect_companies → encuentra empresas reales con Google Maps
• generate_image → genera imágenes con Gemini IA
• save_to_notion → guarda páginas en Notion de Hutrit
• export_pdf → genera PDF descargable con branding Hutrit

━━━ CÓMO ACTUAR ━━━
Usuario: "Publica en LinkedIn: [texto]"
→ Dices: "Publicando en LinkedIn..." → llamas publish_linkedin

Usuario: "Envía email a ceo@empresa.com sobre talento LATAM"
→ Dices: "Enviando email a ceo@empresa.com..." → llamas send_email

Usuario: "Busca 5 agencias en Valencia y mándales outreach"
→ Dices: "Buscando agencias en Valencia..." → llamas prospect_companies
→ Generas emails personalizados para cada una en tu respuesta
→ Envías cada email → llamas send_email para cada una

Usuario: "Genera una imagen para LinkedIn sobre talento LATAM"
→ Dices: "Generando imagen..." → llamas generate_image

━━━ PIPELINES ━━━
Para tareas con múltiples pasos: ejecuta paso a paso sin pedir permiso.
Muestra el progreso de cada acción completada.
Si una herramienta falla, continúa con las demás e informa el fallo al final.

━━━ CONTEXTO HUTRIT ━━━
Hutrit conecta empresas europeas con talento remoto LATAM (tech, marketing, ventas, diseño, datos).
Mercado objetivo: empresas en España, Europa. No EE.UU.
Tono: profesional, directo, cercano.

Responde siempre en español.`

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
    let currentMessages = [...messages]
    const MAX_ITER = 10

    // Detecta si el último mensaje del usuario contiene una acción clara
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')
    const lastText = typeof lastUserMsg?.content === 'string' ? lastUserMsg.content.toLowerCase() : ''
    const ACTION_WORDS = ['publica', 'envía', 'envia', 'manda', 'busca', 'genera', 'crea', 'guarda', 'exporta', 'audita', 'haz', 'hazme', 'ejecuta', 'outreach', 'linkedin', 'instagram', 'email', 'correo', 'imagen', 'notion', 'pdf', 'prospecto', 'empresa', 'calendario', 'agencia', 'contacta', 'escribe']
    const isActionRequest = ACTION_WORDS.some(w => lastText.includes(w))

    for (let iter = 0; iter < MAX_ITER; iter++) {
      // En peticiones de acción iter 0: forzamos tool_use
      // Si Claude genera texto antes del tool (tabla de limitaciones), lo suprimimos — el usuario
      // nunca lo ve. Solo ve las cards de ejecución y la respuesta final post-herramienta.
      const suppressPreToolText = (iter === 0 && isActionRequest)
      const toolChoice = suppressPreToolText ? { type: 'any' } : { type: 'auto' }

      const stream = client.messages.stream({
        model: 'claude-sonnet-4-6',
        max_tokens: 2000,
        system: SYSTEM,
        tools: TOOLS,
        tool_choice: toolChoice,
        messages: currentMessages,
      })

      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
          // Suprimir texto pre-herramienta en iter 0 de petición de acción
          // Así la tabla de limitaciones nunca llega al frontend
          if (!suppressPreToolText) {
            sse({ text: event.delta.text })
          }
        }
      }

      const finalMsg = await stream.finalMessage()

      // Si no hubo tool_use (no debería pasar con tool_choice 'any', pero por si acaso)
      // mostrar el texto que teníamos suprimido
      if (finalMsg.stop_reason !== 'tool_use') {
        if (suppressPreToolText) {
          const textBlock = finalMsg.content.find(b => b.type === 'text')
          if (textBlock?.text) sse({ text: textBlock.text })
        }
        break
      }

      const toolUses = finalMsg.content.filter(b => b.type === 'tool_use')
      const toolResults = []

      for (const toolUse of toolUses) {
        sse({ toolCall: { name: toolUse.name, input: toolUse.input } })
        const result = await executeTool(toolUse.name, toolUse.input)
        sse({ toolResult: { name: toolUse.name, ...result } })
        toolResults.push({ type: 'tool_result', tool_use_id: toolUse.id, content: JSON.stringify(result) })
      }

      currentMessages = [
        ...currentMessages,
        { role: 'assistant', content: finalMsg.content },
        { role: 'user', content: toolResults },
      ]
    }

    sse('[DONE]')
    res.end()
  } catch (err) {
    sse({ error: err.message })
    res.end()
  }
}
