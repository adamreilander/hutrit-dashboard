// POST /api/generate-creative
// Body: { prompt, style?: 'profesional' | 'minimalista' | 'impacto' | 'lifestyle' }
// Returns: { success, imageBase64, mimeType, prompt }
// Env: GEMINI_API_KEY

export const maxDuration = 60

const STYLE_PROMPTS = {
  profesional: 'Corporate professional aesthetic: clean gradient background in deep teal (#0D5C54) to dark navy, sophisticated geometric abstract shapes, subtle grid pattern overlay, premium brand feel, modern sans-serif design language, polished and authoritative',
  cercano:     'Warm and human aesthetic: soft gradient background, organic flowing shapes, warm teal and sage green palette, approachable and friendly visual language, people-centric design with abstract human silhouettes, welcoming and trustworthy',
  impacto:     'Bold high-impact design: dramatic dark background (#0D1117 near-black), electric teal (#0D9488) and bright green (#22C55E) neon accent glows, dynamic diagonal composition, strong geometric forms, tech-forward and energetic, cinematic quality',
  inspirador:  'Aspirational and uplifting aesthetic: bright airy background with golden hour light, soft gradient from teal to emerald, rising or ascending visual motifs (arrows, stairs, stars), optimistic and motivational energy, premium lifestyle brand quality',
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
