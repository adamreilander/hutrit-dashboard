// POST /api/generate-creative
// Body: { prompt, style?: 'profesional' | 'minimalista' | 'impacto' | 'lifestyle' }
// Returns: { success, imageBase64, mimeType, prompt }
// Env: GEMINI_API_KEY

export const maxDuration = 60

const STYLE_PROMPTS = {
  profesional: 'Corporate professional style, clean white background, Hutrit brand green (#0D5C54), modern typography, business context, high quality',
  minimalista: 'Minimalist design, lots of white space, one strong accent color (#0D9488 teal), geometric shapes, clean and modern',
  impacto:     'Bold impactful design, dark background (#0D1117), bright accent colors (teal and white), strong contrast, tech startup feel',
  lifestyle:   'Warm lifestyle photography feel, diverse Latin American professionals, collaborative workspace, natural light, authentic and aspirational',
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { prompt, style = 'profesional' } = req.body
  if (!prompt?.trim()) return res.status(400).json({ error: 'prompt es requerido' })

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY no configurada en Vercel' })

  const styleContext = STYLE_PROMPTS[style] || STYLE_PROMPTS.profesional

  const fullPrompt = `Create a social media post image for Hutrit Europa, a talent platform connecting Latin American professionals with European companies.

Image concept: ${prompt.trim()}

Visual style: ${styleContext}

Requirements:
- Square format (1:1 ratio), optimized for Instagram and LinkedIn
- Include subtle Hutrit brand elements (teal/dark green palette)
- Professional, aspirational, modern aesthetic
- No text overlays needed (text added separately)
- High contrast, visually striking`

  try {
    // Use Gemini imagen API
    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instances: [{ prompt: fullPrompt }],
          parameters: {
            sampleCount: 1,
            aspectRatio: '1:1',
            safetyFilterLevel: 'block_some',
            personGeneration: 'allow_adult',
          },
        }),
      }
    )

    if (!resp.ok) {
      const errData = await resp.json().catch(() => ({}))
      // Fallback: try gemini-2.0-flash-preview-image-generation
      return await generateWithGeminiFlash(req, res, fullPrompt, apiKey, prompt)
    }

    const data = await resp.json()
    const prediction = data.predictions?.[0]

    if (!prediction?.bytesBase64Encoded) {
      return await generateWithGeminiFlash(req, res, fullPrompt, apiKey, prompt)
    }

    return res.json({
      success:       true,
      imageBase64:   prediction.bytesBase64Encoded,
      mimeType:      prediction.mimeType || 'image/png',
      prompt:        prompt.trim(),
    })
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message })
  }
}

async function generateWithGeminiFlash(req, res, fullPrompt, apiKey, originalPrompt) {
  try {
    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: fullPrompt }] }],
          generationConfig: { responseModalities: ['IMAGE', 'TEXT'] },
        }),
      }
    )

    const data = await resp.json()

    if (!resp.ok) {
      return res.status(resp.status).json({ success: false, error: data.error?.message || 'Error de Gemini' })
    }

    const parts = data.candidates?.[0]?.content?.parts || []
    const imagePart = parts.find(p => p.inlineData?.mimeType?.startsWith('image/'))

    if (!imagePart) {
      return res.status(500).json({ success: false, error: 'Gemini no devolvió imagen. Comprueba que el modelo de imagen esté disponible en tu plan.' })
    }

    return res.json({
      success:     true,
      imageBase64: imagePart.inlineData.data,
      mimeType:    imagePart.inlineData.mimeType,
      prompt:      originalPrompt,
    })
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message })
  }
}
