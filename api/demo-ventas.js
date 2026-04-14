// POST /api/demo-ventas
// Body: { oferta, sector_target?, ciudad?, tipo_empresa? }
// Returns: structured prospect list JSON

import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { oferta, sector_target, ciudad, tipo_empresa } = req.body || {}
  if (!oferta?.trim()) return res.status(400).json({ error: 'oferta es requerido' })

  const prompt = `Eres un experto en ventas B2B y prospección comercial. Crea una lista de prospectos calificados basada en la oferta del usuario.

Oferta del usuario: "${oferta.trim()}"
${sector_target ? `Sector objetivo: ${sector_target}` : ''}
${ciudad ? `Ciudad/región: ${ciudad}` : 'España y Europa'}
${tipo_empresa ? `Tamaño de empresa: ${tipo_empresa}` : ''}

Genera una lista de prospectos realista y accionable. Responde ÚNICAMENTE con el siguiente JSON válido, sin texto adicional, sin markdown, sin bloques de código:

{"oferta":"${oferta.trim()}","estrategia_general":"Describe en 2 frases la estrategia de ventas recomendada para esta oferta y estos prospectos","prospectos":[{"empresa":"Nombre empresa 1 (real o plausible)","sector":"Sector específico","tamaño":"10-50 empleados","por_que":"Explicación de 1-2 frases de por qué esta empresa necesita lo que ofreces","angulo_outreach":"Frase de apertura específica y personalizada para contactar a esta empresa","prioridad":"alta"},{"empresa":"Nombre empresa 2","sector":"Sector específico","tamaño":"50-200 empleados","por_que":"Explicación específica","angulo_outreach":"Frase de apertura personalizada","prioridad":"alta"},{"empresa":"Nombre empresa 3","sector":"Sector específico","tamaño":"5-20 empleados","por_que":"Explicación específica","angulo_outreach":"Frase de apertura personalizada","prioridad":"media"},{"empresa":"Nombre empresa 4","sector":"Sector específico","tamaño":"100-500 empleados","por_que":"Explicación específica","angulo_outreach":"Frase de apertura personalizada","prioridad":"media"},{"empresa":"Nombre empresa 5","sector":"Sector específico","tamaño":"20-50 empleados","por_que":"Explicación específica","angulo_outreach":"Frase de apertura personalizada","prioridad":"media"},{"empresa":"Nombre empresa 6","sector":"Sector específico","tamaño":"10-30 empleados","por_que":"Explicación específica","angulo_outreach":"Frase de apertura personalizada","prioridad":"baja"},{"empresa":"Nombre empresa 7","sector":"Sector específico","tamaño":"50-150 empleados","por_que":"Explicación específica","angulo_outreach":"Frase de apertura personalizada","prioridad":"baja"},{"empresa":"Nombre empresa 8","sector":"Sector específico","tamaño":"5-15 empleados","por_que":"Explicación específica","angulo_outreach":"Frase de apertura personalizada","prioridad":"baja"}],"email_template":"Asunto: [Personaliza aquí]\n\nHola [Nombre],\n\nEscribe aquí un email de primer contacto personalizado y directo (máximo 5 frases). Menciona algo específico sobre su empresa y cómo tu oferta les ayuda.\n\nSaludos,\n[Tu nombre]"}

Personaliza todo según la oferta, sector y ciudad indicados. Las empresas deben ser realistas para el sector y ciudad mencionados. Los ángulos de outreach deben ser específicos y relevantes.`

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = message.content[0]?.text || ''

    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return res.status(500).json({ error: 'No se pudo generar la lista. Inténtalo de nuevo.' })
    }

    const data = JSON.parse(jsonMatch[0])
    return res.json(data)
  } catch (err) {
    if (err instanceof SyntaxError) {
      return res.status(500).json({ error: 'Error procesando la lista. Inténtalo de nuevo.' })
    }
    return res.status(500).json({ error: err.message })
  }
}
