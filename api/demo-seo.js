// POST /api/demo-seo
// Body: { empresa, url?, sector? }
// Returns: structured SEO analysis JSON

import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { empresa, url, sector } = req.body || {}
  if (!empresa?.trim()) return res.status(400).json({ error: 'empresa es requerido' })

  const prompt = `Eres un experto en SEO y posicionamiento digital para empresas europeas. Analiza el SEO de la siguiente empresa y devuelve un análisis estructurado.

Empresa: "${empresa.trim()}"
${url ? `Sitio web: ${url}` : ''}
${sector ? `Sector: ${sector}` : ''}

Genera un análisis SEO realista y detallado. Responde ÚNICAMENTE con el siguiente JSON válido, sin texto adicional, sin markdown, sin bloques de código:

{"empresa":"${empresa.trim()}","puntuacion":72,"resumen":"Resumen de 2 oraciones sobre el estado SEO actual de la empresa y su oportunidad principal","keywords":[{"kw":"keyword ejemplo 1","volumen":"alto","dificultad":"media"},{"kw":"keyword ejemplo 2","volumen":"medio","dificultad":"baja"},{"kw":"keyword ejemplo 3","volumen":"alto","dificultad":"alta"},{"kw":"keyword ejemplo 4","volumen":"bajo","dificultad":"baja"},{"kw":"keyword ejemplo 5","volumen":"medio","dificultad":"media"}],"competidores":[{"nombre":"Competidor 1","dominio":"competidor1.com","posicion":"Líder del sector"},{"nombre":"Competidor 2","dominio":"competidor2.com","posicion":"Competidor directo"},{"nombre":"Competidor 3","dominio":"competidor3.com","posicion":"Nicho especializado"}],"problemas":[{"titulo":"Problema técnico 1","impacto":"alto","solucion":"Solución concreta en 1 frase"},{"titulo":"Problema técnico 2","impacto":"medio","solucion":"Solución concreta en 1 frase"},{"titulo":"Problema técnico 3","impacto":"medio","solucion":"Solución concreta en 1 frase"},{"titulo":"Problema técnico 4","impacto":"bajo","solucion":"Solución concreta en 1 frase"}],"plan_accion":[{"accion":"Primera acción concreta y específica","plazo":"1-2 semanas"},{"accion":"Segunda acción concreta","plazo":"1 mes"},{"accion":"Tercera acción concreta","plazo":"1 mes"},{"accion":"Cuarta acción concreta","plazo":"2-3 meses"},{"accion":"Quinta acción concreta","plazo":"3 meses"}]}

Personaliza todos los valores según la empresa, sector y URL proporcionados. Las keywords deben ser específicas al sector de la empresa. Los competidores deben ser empresas reales o plausibles del sector.`

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 3000,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = message.content[0]?.text || ''

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return res.status(500).json({ error: 'No se pudo generar el análisis. Inténtalo de nuevo.' })
    }

    const data = JSON.parse(jsonMatch[0])
    return res.json(data)
  } catch (err) {
    if (err instanceof SyntaxError) {
      return res.status(500).json({ error: 'Error procesando el análisis. Inténtalo de nuevo.' })
    }
    return res.status(500).json({ error: err.message })
  }
}
