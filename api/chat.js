import Anthropic from '@anthropic-ai/sdk'

export const maxDuration = 60

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ═══════════════════════════════════════════════════════════════════════════════
// HERRAMIENTAS — 12 capacidades reales conectadas al agente
// ═══════════════════════════════════════════════════════════════════════════════
const TOOLS = [
  // ── COMUNICACIÓN ──────────────────────────────────────────────────────────
  {
    name: 'send_email',
    description: 'Envía un email real a cualquier dirección. Úsalo cuando el usuario pida enviar un email.',
    input_schema: {
      type: 'object',
      properties: {
        to:      { type: 'string', description: 'Email del destinatario' },
        subject: { type: 'string', description: 'Asunto' },
        body:    { type: 'string', description: 'Cuerpo completo en texto plano' },
      },
      required: ['to', 'subject', 'body'],
    },
  },
  {
    name: 'send_outreach',
    description: 'Pipeline completo de outreach: audita la empresa, genera email 100% personalizado y lo envía. Úsalo cuando el usuario pida hacer outreach a una empresa.',
    input_schema: {
      type: 'object',
      properties: {
        empresa:    { type: 'string' },
        sector:     { type: 'string' },
        email_to:   { type: 'string', description: 'Email del destinatario' },
        contacto:   { type: 'string', description: 'Nombre del contacto (opcional)' },
        audit_data: { type: 'string', description: 'JSON de auditoría previa (opcional)' },
      },
      required: ['empresa', 'sector', 'email_to'],
    },
  },
  {
    name: 'bulk_outreach',
    description: 'Envía outreach personalizado a múltiples empresas de una vez. Úsalo cuando el usuario dé una lista de empresas.',
    input_schema: {
      type: 'object',
      properties: {
        empresas: {
          type: 'array',
          description: 'Lista de empresas a contactar',
          items: {
            type: 'object',
            properties: {
              empresa:  { type: 'string' },
              sector:   { type: 'string' },
              email_to: { type: 'string' },
              contacto: { type: 'string' },
            },
            required: ['empresa', 'sector', 'email_to'],
          },
        },
      },
      required: ['empresas'],
    },
  },

  // ── REDES SOCIALES ─────────────────────────────────────────────────────────
  {
    name: 'publish_linkedin',
    description: 'Publica un post en el LinkedIn de Hutrit. Úsalo cuando el usuario pida publicar en LinkedIn.',
    input_schema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Texto completo del post con hashtags' },
      },
      required: ['text'],
    },
  },
  {
    name: 'publish_instagram',
    description: 'Publica una imagen con caption en el Instagram de Hutrit. Requiere una URL pública de imagen. Úsalo después de generate_image.',
    input_schema: {
      type: 'object',
      properties: {
        caption:   { type: 'string', description: 'Caption del post con hashtags' },
        image_url: { type: 'string', description: 'URL pública de la imagen a publicar' },
      },
      required: ['caption', 'image_url'],
    },
  },

  // ── INVESTIGACIÓN ──────────────────────────────────────────────────────────
  {
    name: 'audit_company',
    description: 'Audita una empresa: detecta puntos de dolor, talento que necesitan y ángulo de outreach. Úsalo antes de generar contenido o enviar outreach.',
    input_schema: {
      type: 'object',
      properties: {
        empresa: { type: 'string' },
        sector:  { type: 'string' },
        web:     { type: 'string', description: 'URL de la web (opcional)' },
      },
      required: ['empresa', 'sector'],
    },
  },
  {
    name: 'search_web',
    description: 'Busca información real en internet sobre cualquier empresa, sector o tema. Úsalo para investigar antes de auditar o prospectar.',
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
    description: 'Lee el contenido de cualquier URL — web de empresa, LinkedIn, artículo, etc. Úsalo para obtener información real antes de analizar.',
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
    description: 'Encuentra empresas reales para prospectar en una ciudad y sector usando Google. Devuelve lista con nombre, web y teléfono.',
    input_schema: {
      type: 'object',
      properties: {
        ciudad:     { type: 'string', description: 'Ciudad donde buscar, ej: Barcelona, Madrid' },
        nicho:      { type: 'string', description: 'Sector o tipo de empresa, ej: agencia de marketing, startup SaaS' },
        maxResults: { type: 'number', description: 'Número de resultados (default 6)' },
      },
      required: ['ciudad', 'nicho'],
    },
  },

  // ── CONTENIDO Y CREATIVOS ──────────────────────────────────────────────────
  {
    name: 'generate_calendar',
    description: 'Genera un calendario de contenido completo con posts listos para publicar en LinkedIn e Instagram.',
    input_schema: {
      type: 'object',
      properties: {
        sector:  { type: 'string' },
        semanas: { type: 'number', description: 'Semanas de contenido (1-4)' },
        foco:    { type: 'string', description: 'b2b (empresas europeas) | b2c (talento LATAM) | mixto' },
      },
      required: ['sector', 'semanas', 'foco'],
    },
  },
  {
    name: 'generate_image',
    description: 'Genera una imagen profesional para LinkedIn o Instagram usando IA (Gemini). Úsalo cuando el usuario pida una imagen, creativo o visual.',
    input_schema: {
      type: 'object',
      properties: {
        prompt: { type: 'string', description: 'Descripción del concepto visual a generar' },
        style:  { type: 'string', description: 'profesional | minimalista | impacto | lifestyle' },
      },
      required: ['prompt'],
    },
  },

  // ── ALMACENAMIENTO ─────────────────────────────────────────────────────────
  {
    name: 'save_to_notion',
    description: 'Guarda cualquier contenido como página en Notion: auditorías, calendarios, copys, estrategias, listas de prospectos.',
    input_schema: {
      type: 'object',
      properties: {
        titulo:    { type: 'string' },
        contenido: { type: 'string', description: 'Contenido completo a guardar' },
        tipo:      { type: 'string', description: 'auditoria | calendario | contenido | outreach | prospectos | estrategia' },
      },
      required: ['titulo', 'contenido'],
    },
  },
]

// ═══════════════════════════════════════════════════════════════════════════════
// LÓGICA DE EJECUCIÓN
// ═══════════════════════════════════════════════════════════════════════════════
async function executeTool(name, input) {
  try {

    // ── send_email ────────────────────────────────────────────────────────────
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

    // ── publish_linkedin ──────────────────────────────────────────────────────
    if (name === 'publish_linkedin') {
      const url = process.env.MAKE_WEBHOOK_URL
      if (!url) return { success: false, error: 'MAKE_WEBHOOK_URL no configurada en Vercel' }
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: input.text }),
      })
      if (!resp.ok) return { success: false, error: 'Error al publicar en LinkedIn' }
      return { success: true, message: 'Post publicado en LinkedIn' }
    }

    // ── publish_instagram ─────────────────────────────────────────────────────
    if (name === 'publish_instagram') {
      const userId = process.env.INSTAGRAM_USER_ID
      const token  = process.env.INSTAGRAM_ACCESS_TOKEN
      if (!userId || !token) return { success: false, error: 'Credenciales de Instagram no configuradas' }
      if (!input.image_url) return { success: false, error: 'Se necesita image_url. Primero genera una imagen y súbela a una URL pública.' }

      const igPost = async (endpoint, params) => {
        const body = new URLSearchParams({ ...params, access_token: token })
        const r = await fetch(`https://graph.facebook.com/v19.0${endpoint}`, {
          method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body.toString(),
        })
        return r.json()
      }

      const container = await igPost(`/${userId}/media`, { image_url: input.image_url, caption: input.caption })
      if (!container?.id) return { success: false, error: container?.error?.message || 'Error creando container de Instagram' }

      let statusCode = null
      for (let i = 0; i < 10; i++) {
        await new Promise(r => setTimeout(r, 5000))
        const s = await fetch(`https://graph.facebook.com/v19.0/${container.id}?fields=status_code&access_token=${token}`).then(r => r.json())
        statusCode = s?.status_code
        if (statusCode === 'FINISHED') break
        if (['ERROR', 'EXPIRED'].includes(statusCode)) return { success: false, error: `Instagram error: ${statusCode}` }
      }
      if (statusCode !== 'FINISHED') return { success: false, error: 'Timeout: Instagram tardó demasiado en procesar la imagen' }

      const pub = await igPost(`/${userId}/media_publish`, { creation_id: container.id })
      if (!pub?.id) return { success: false, error: pub?.error?.message || 'Error publicando en Instagram' }
      return { success: true, message: `Post publicado en Instagram (ID: ${pub.id})`, postId: pub.id }
    }

    // ── audit_company ─────────────────────────────────────────────────────────
    if (name === 'audit_company') {
      const msg = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 700,
        messages: [{
          role: 'user',
          content: `Audita esta empresa para Hutrit Europa (conectamos empresas europeas con talento LATAM).

EMPRESA: ${input.empresa}
SECTOR: ${input.sector}
${input.web ? `WEB: ${input.web}` : ''}

Devuelve SOLO JSON:
{"puntos_dolor":[{"area":"AREA","problema":"DESCRIPCION","urgencia":"alta|media|baja"}],"talento_buscado":["ROL 1","ROL 2"],"presencia_digital":"RESUMEN","oportunidad_hutrit":"PROPUESTA EN 2 FRASES","angulo_outreach":"HOOK ESPECIFICO PARA EMAIL","hook_linkedin":"HOOK PARA POST LINKEDIN"}`,
        }],
      })
      const text = msg.content[0]?.text || ''
      try {
        const m = text.match(/\{[\s\S]*\}/)
        const audit = m ? JSON.parse(m[0]) : null
        if (audit) return { success: true, audit, empresa: input.empresa, sector: input.sector, message: `Auditoría de ${input.empresa} completada` }
        return { success: false, error: 'No se pudo generar la auditoría' }
      } catch { return { success: false, error: 'Error parseando auditoría' } }
    }

    // ── send_outreach (audit + generate email + send) ─────────────────────────
    if (name === 'send_outreach') {
      const apiKey = process.env.RESEND_API_KEY
      if (!apiKey) return { success: false, error: 'RESEND_API_KEY no configurada en Vercel' }

      let auditData = null
      if (input.audit_data) { try { auditData = JSON.parse(input.audit_data) } catch {} }
      if (!auditData) {
        const r = await executeTool('audit_company', { empresa: input.empresa, sector: input.sector })
        if (r.success) auditData = r.audit
      }

      const emailMsg = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 500,
        messages: [{
          role: 'user',
          content: `Escribe email de outreach en frío de Hutrit Europa para ${input.empresa} (${input.sector}).
${auditData ? `Puntos de dolor: ${auditData.puntos_dolor?.map(p => p.problema).join(', ')}
Talento que necesitan: ${auditData.talento_buscado?.join(', ')}
Ángulo: ${auditData.angulo_outreach}` : ''}
${input.contacto ? `Contacto: ${input.contacto}` : ''}

Reglas: tono directo y profesional, 4-5 líneas máximo, referencia específica a ${input.empresa}, CTA de 15 min, firma Adam | Hutrit | hutrit.com.
Responde SOLO JSON: {"subject":"...","body":"..."}`,
        }],
      })
      const emailText = emailMsg.content[0]?.text || ''
      let emailData = null
      try { const m = emailText.match(/\{[\s\S]*\}/); if (m) emailData = JSON.parse(m[0]) } catch {}
      if (!emailData) return { success: false, error: 'No se pudo generar el email' }

      const testEmail = process.env.RESEND_TEST_EMAIL
      const to = testEmail ? [testEmail] : [input.email_to]
      const subject = testEmail ? `[TEST → ${input.email_to}] ${emailData.subject}` : emailData.subject

      const sendResp = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: 'onboarding@resend.dev', to, subject, html: emailData.body.replace(/\n/g, '<br>') }),
      })
      const sendData = await sendResp.json()
      if (!sendResp.ok) return { success: false, error: sendData.message, subject: emailData.subject }
      return { success: true, message: `Outreach enviado a ${to[0]}`, subject: emailData.subject, preview: emailData.body.slice(0, 120) + '...' }
    }

    // ── bulk_outreach ─────────────────────────────────────────────────────────
    if (name === 'bulk_outreach') {
      const results = []
      for (const emp of (input.empresas || [])) {
        const r = await executeTool('send_outreach', emp)
        results.push({ empresa: emp.empresa, ...r })
      }
      const sent = results.filter(r => r.success).length
      return { success: true, results, message: `Outreach enviado a ${sent}/${results.length} empresas` }
    }

    // ── search_web ────────────────────────────────────────────────────────────
    if (name === 'search_web') {
      const apiKey = process.env.APIFY_API_KEY
      if (!apiKey) return { success: false, error: 'APIFY_API_KEY no configurada en Vercel' }
      const resp = await fetch(
        `https://api.apify.com/v2/acts/apify~google-search-scraper/run-sync-get-dataset-items?token=${apiKey}&format=json`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ queries: input.query, maxPagesPerQuery: 1, resultsPerPage: input.maxResults || 5, countryCode: 'es', languageCode: 'es' }),
          signal: AbortSignal.timeout(25000),
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
      const summary = results.map(r => `- ${r.title}: ${r.description} (${r.url})`).join('\n')
      return { success: true, results, summary, message: `${results.length} resultados para "${input.query}"` }
    }

    // ── scrape_url ────────────────────────────────────────────────────────────
    if (name === 'scrape_url') {
      const resp = await fetch(input.url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; HutritAgent/1.0)' },
        signal: AbortSignal.timeout(10000),
      })
      if (!resp.ok) return { success: false, error: `Error ${resp.status} al acceder a ${input.url}` }
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

    // ── prospect_companies ────────────────────────────────────────────────────
    if (name === 'prospect_companies') {
      const apiKey = process.env.GOOGLE_MAPS_API_KEY
      if (!apiKey) return { success: false, error: 'GOOGLE_MAPS_API_KEY no configurada en Vercel' }
      const query = `${input.nicho} en ${input.ciudad}, España`
      const resp = await fetch(`https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}`)
      const data = await resp.json()
      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') return { success: false, error: `Google Places: ${data.status}` }
      const empresas = await Promise.all(
        (data.results || []).slice(0, input.maxResults || 6).map(async (p) => {
          let web = '', telefono = ''
          if (p.place_id) {
            try {
              const det = await fetch(`https://maps.googleapis.com/maps/api/place/details/json?place_id=${p.place_id}&fields=website,formatted_phone_number&key=${apiKey}`).then(r => r.json())
              web = det.result?.website || ''; telefono = det.result?.formatted_phone_number || ''
            } catch {}
          }
          return { nombre: p.name, ciudad: input.ciudad, sector: input.nicho, rating: p.rating || 0, web, telefono }
        })
      )
      return { success: true, empresas, message: `${empresas.length} empresas encontradas en ${input.ciudad}` }
    }

    // ── generate_calendar ─────────────────────────────────────────────────────
    if (name === 'generate_calendar') {
      const msg = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: `Genera calendario de contenido de ${input.semanas} semana(s) para Hutrit.
Sector: ${input.sector} | Foco: ${input.foco === 'b2b' ? 'empresas europeas' : input.foco === 'b2c' ? 'talento LATAM' : 'ambos'}

SOLO JSON:
{"semanas":[{"semana":1,"posts":[{"dia":"Lunes","canal":"LinkedIn","tipo":"educativo|caso_exito|opinion|dato","titulo":"TITULO","copy":"COPY COMPLETO CON HASHTAGS","cta":"CTA"}]}],"resumen":"ESTRATEGIA EN 2 FRASES"}`,
        }],
      })
      const text = msg.content[0]?.text || ''
      try {
        const m = text.match(/\{[\s\S]*\}/)
        const calendar = m ? JSON.parse(m[0]) : null
        if (calendar) {
          const total = calendar.semanas?.reduce((a, s) => a + (s.posts?.length || 0), 0) || 0
          return { success: true, calendar, message: `Calendario generado: ${total} posts en ${input.semanas} semana(s)` }
        }
        return { success: false, error: 'No se pudo generar el calendario' }
      } catch { return { success: false, error: 'Error parseando calendario' } }
    }

    // ── generate_image ────────────────────────────────────────────────────────
    if (name === 'generate_image') {
      const apiKey = process.env.GEMINI_API_KEY
      if (!apiKey) return { success: false, error: 'GEMINI_API_KEY no configurada en Vercel' }
      const STYLES = {
        profesional: 'Corporate professional, clean, Hutrit brand teal (#0D5C54), modern',
        minimalista: 'Minimalist, lots of white space, teal accent, geometric, clean',
        impacto:     'Bold, dark background, bright teal and white, high contrast, tech startup',
        lifestyle:   'Warm lifestyle, diverse Latin American professionals, collaborative workspace',
      }
      const style = STYLES[input.style] || STYLES.profesional
      const fullPrompt = `Social media image for Hutrit Europa talent platform. ${input.prompt}. Style: ${style}. Square 1:1, professional, no text overlays.`

      // Try Imagen 3 first
      const r1 = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instances: [{ prompt: fullPrompt }], parameters: { sampleCount: 1, aspectRatio: '1:1' } }),
      })
      const d1 = await r1.json()
      const img1 = d1.predictions?.[0]?.bytesBase64Encoded
      if (img1) return { success: true, imageBase64: img1, mimeType: 'image/png', message: 'Imagen generada con Imagen 3' }

      // Fallback Gemini Flash
      const r2 = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: fullPrompt }] }], generationConfig: { responseModalities: ['IMAGE', 'TEXT'] } }),
      })
      const d2 = await r2.json()
      const imgPart = d2.candidates?.[0]?.content?.parts?.find(p => p.inlineData?.mimeType?.startsWith('image/'))
      if (imgPart) return { success: true, imageBase64: imgPart.inlineData.data, mimeType: imgPart.inlineData.mimeType, message: 'Imagen generada con Gemini' }
      return { success: false, error: 'No se pudo generar la imagen' }
    }

    // ── save_to_notion ────────────────────────────────────────────────────────
    if (name === 'save_to_notion') {
      const token = process.env.NOTION_TOKEN
      if (!token) return { success: false, error: 'NOTION_TOKEN no configurado en Vercel' }
      const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'Notion-Version': '2022-06-28' }

      const search = await fetch('https://api.notion.com/v1/search', {
        method: 'POST', headers,
        body: JSON.stringify({ filter: { value: 'page', property: 'object' }, page_size: 5 }),
      }).then(r => r.json())

      const parent = search.results?.[0]
      if (!parent) return { success: false, error: 'No hay páginas en Notion. Comparte una página con la integración.' }

      const lines = input.contenido.split('\n').filter(l => l.trim())
      const blocks = lines.slice(0, 100).map(line => ({
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

    return { success: false, error: `Herramienta '${name}' desconocida` }
  } catch (e) {
    return { success: false, error: e.message }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SYSTEM PROMPT
// ═══════════════════════════════════════════════════════════════════════════════
const SYSTEM = `Eres el agente de operaciones de Hutrit Europa — empresa que conecta empresas europeas con talento LATAM (tech, marketing, ventas, diseño, producto, datos).

CONTEXTO:
- B2B: empresas europeas contratan talento LATAM full-time (España, Alemania, Países Bajos, UK)
- B2C (Hutrit Club): profesionales LATAM buscan trabajo en Europa
- Propuesta: talento validado, inglés B2+, zona horaria compatible, coste optimizado vs Europa

HERRAMIENTAS DISPONIBLES:
- send_email → envía emails reales
- send_outreach → audita empresa + genera email personalizado + lo envía (pipeline completo)
- bulk_outreach → outreach a múltiples empresas de una vez
- publish_linkedin → publica en LinkedIn de Hutrit
- publish_instagram → publica en Instagram de Hutrit (requiere image_url pública)
- audit_company → analiza empresa: puntos de dolor, talento, ángulo de outreach
- search_web → busca información real en internet (usa APIFY)
- scrape_url → lee el contenido de cualquier URL
- prospect_companies → encuentra empresas reales por ciudad y sector (Google Maps)
- generate_calendar → genera calendario de contenido completo con copys
- generate_image → genera imagen profesional con IA (Gemini) para posts
- save_to_notion → guarda cualquier contenido como página en Notion

COMPORTAMIENTO:
1. Ejecuta acciones DIRECTAMENTE sin pedir permiso. Si el usuario pide hacer algo, hazlo.
2. Para pipelines (prospectar → auditar → outreach → publicar → guardar), ejecuta TODOS los pasos.
3. Si el usuario da una lista de empresas, procésalas TODAS.
4. Usa search_web y scrape_url para obtener datos reales antes de auditar si no tienes info.
5. Solo pide información estrictamente necesaria que no puedas inferir o buscar.
6. Después de ejecutar, haz un resumen claro de lo que ejecutaste y los resultados.
7. Responde SIEMPRE en español. Máximo 300 palabras de texto — el trabajo lo hacen las herramientas.`

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

    for (let iter = 0; iter < MAX_ITER; iter++) {
      const stream = client.messages.stream({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1200,
        system: SYSTEM,
        tools: TOOLS,
        messages: currentMessages,
      })

      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
          sse({ text: event.delta.text })
        }
      }

      const finalMsg = await stream.finalMessage()
      if (finalMsg.stop_reason !== 'tool_use') break

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
