// POST /api/generate-creative
// Body: { prompt, style?: 'profesional' | 'cercano' | 'impacto' | 'inspirador' }
// Returns: { success, imageBase64, mimeType, imageUrl, prompt }
// Env: GEMINI_API_KEY, IMGBB_API_KEY (optional — enables hosted URL)

export const maxDuration = 60

const STYLE_PROMPTS = {
  profesional: 'Corporate professional aesthetic: clean gradient background in deep teal (#0D5C54) to dark navy, sophisticated geometric abstract shapes, subtle grid pattern overlay, premium brand feel, modern sans-serif design language, polished and authoritative',
  cercano:     'Warm and human aesthetic: soft gradient background, organic flowing shapes, warm teal and sage green palette, approachable and friendly visual language, people-centric design with abstract human silhouettes, welcoming and trustworthy',
  impacto:     'Bold high-impact design: dramatic dark background (#0D1117 near-black), electric teal (#0D9488) and bright green (#22C55E) neon accent glows, dynamic diagonal composition, strong geometric forms, tech-forward and energetic, cinematic quality',
  inspirador:  'Aspirational and uplifting aesthetic: bright airy background with golden hour light, soft gradient from teal to emerald, rising or ascending visual motifs (arrows, stairs, stars), optimistic and motivational energy, premium lifestyle brand quality',
}

async function uploadToImgBB(base64Data, name) {
  const key = process.env.IMGBB_API_KEY
  if (!key) return null
  try {
    const body = new URLSearchParams()
    body.append('key', key)
    body.append('image', base64Data)
    body.append('name', name)
    body.append('expiration', '15552000') // 180 days
    const resp = await fetch('https://api.imgbb.com/1/upload', { method: 'POST', body })
    const data = await resp.json()
    return data?.success ? data.data.url : null
  } catch (_) {
    return null
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { prompt, style = 'profesional' } = req.body
  if (!prompt?.trim()) return res.status(400).json({ error: 'prompt es requerido' })

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY no configurada en Vercel' })

  const styleContext = STYLE_PROMPTS[style] || STYLE_PROMPTS.profesional

  const fullPrompt = `Create a stunning, award-winning social media creative image. This will be used as a brand post on Instagram and LinkedIn.

BRAND CONTEXT: ${prompt.trim()}

VISUAL STYLE DIRECTION: ${styleContext}

TECHNICAL REQUIREMENTS:
- Perfect square 1:1 ratio composition
- Ultra-high resolution, photorealistic or premium illustration quality
- NO text, NO words, NO letters anywhere in the image
- The composition should feel like a premium brand campaign from a Fortune 500 company
- Rich depth: foreground, midground and background layers
- Sophisticated color grading with the brand's teal/green palette (#0D9488, #0D5C54, #22C55E)

COMPOSITION RULES:
- Strong focal point centered or following rule of thirds
- Cinematic lighting with soft shadows and highlights
- Abstract or semi-abstract — evoke emotion, not literal illustration
- Premium texture and detail that rewards close inspection
- The image alone should communicate success, growth, and professionalism`

  const debugErrors = []

  // Try Imagen 4 fast (predict endpoint)
  for (const imgModel of ['imagen-4.0-fast-generate-001', 'imagen-4.0-generate-001']) {
    try {
      const resp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${imgModel}:predict?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            instances: [{ prompt: fullPrompt }],
            parameters: { sampleCount: 1, aspectRatio: '1:1', safetyFilterLevel: 'block_some', personGeneration: 'allow_adult' },
          }),
        }
      )
      const data = await resp.json()
      if (!resp.ok) { debugErrors.push(`${imgModel}: ${resp.status} ${data.error?.message || ''}`); continue }
      const prediction = data.predictions?.[0]
      if (prediction?.bytesBase64Encoded) {
        const b64 = prediction.bytesBase64Encoded
        const mimeType = prediction.mimeType || 'image/png'
        const imageUrl = await uploadToImgBB(b64, `hutrit-creativo-${Date.now()}`)
        return res.json({ success: true, imageBase64: b64, mimeType, imageUrl, prompt: prompt.trim() })
      }
      debugErrors.push(`${imgModel}: no prediction returned`)
    } catch (err) {
      debugErrors.push(`${imgModel}: ${err.message}`)
    }
  }

  return generateWithGeminiFlash(res, fullPrompt, apiKey, prompt, debugErrors)
}

// Image-capable generateContent models confirmed available for this API key
const FLASH_MODELS = [
  { model: 'gemini-2.5-flash-image', version: 'v1beta' },
  { model: 'gemini-3.1-flash-image-preview', version: 'v1beta' },
  { model: 'gemini-3-pro-image-preview', version: 'v1beta' },
]

async function generateWithGeminiFlash(res, fullPrompt, apiKey, originalPrompt, prevErrors = []) {
  const modelErrors = [...prevErrors]

  for (const { model, version } of FLASH_MODELS) {
    try {
      const resp = await fetch(
        `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: fullPrompt }] }],
            generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
          }),
        }
      )

      const data = await resp.json()
      if (!resp.ok) {
        modelErrors.push(`${model}(${version}): ${data.error?.message || data.error?.status || resp.status}`)
        continue
      }

      const parts = data.candidates?.[0]?.content?.parts || []
      const imagePart = parts.find(p => p.inlineData?.mimeType?.startsWith('image/'))
      if (!imagePart) {
        modelErrors.push(`${model}(${version}): no image in response (parts: ${parts.length})`)
        continue
      }

      const b64 = imagePart.inlineData.data
      const mimeType = imagePart.inlineData.mimeType
      const imageUrl = await uploadToImgBB(b64, `hutrit-creativo-${Date.now()}`)

      return res.json({ success: true, imageBase64: b64, mimeType, imageUrl, prompt: originalPrompt })
    } catch (err) {
      modelErrors.push(`${model}(${version}): ${err.message}`)
    }
  }

  return res.status(500).json({ success: false, errors: modelErrors })
}
