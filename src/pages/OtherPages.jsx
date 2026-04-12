import { useState } from 'react'
import { Calendar, FileText, TrendingUp, CheckCircle, Camera, Link, Instagram, ImagePlus, Send, AlertCircle, ExternalLink } from 'lucide-react'

const POSTS = [
  { date: 'Lun 14 Abr', channel: 'LinkedIn',  type: 'Artículo',   title: '5 errores al contratar talento tech en Europa', status: 'programado' },
  { date: 'Mar 15 Abr', channel: 'Instagram', type: 'Carrusel',   title: 'Cómo Hutrit encontró al CTO ideal en 3 días',    status: 'borrador'   },
  { date: 'Mié 16 Abr', channel: 'LinkedIn',  type: 'Post',       title: 'El mercado tech europeo en 2025: datos clave',   status: 'programado' },
  { date: 'Jue 17 Abr', channel: 'Instagram', type: 'Reels idea', title: 'Antes y después: equipo de 3 a 12 personas',      status: 'borrador'   },
  { date: 'Vie 18 Abr', channel: 'LinkedIn',  type: 'Post',       title: 'Por qué las startups pierden talento en 6 meses', status: 'idea'       },
]

const statusColor = { programado: 'badge-green', borrador: 'badge-amber', idea: 'badge-gray' }
const channelColor = { LinkedIn: '#0A66C2', Instagram: '#E1306C' }

function InstagramPublisher() {
  const [mode,      setMode]      = useState('single') // 'single' | 'carousel'
  const [urlsText,  setUrlsText]  = useState('')
  const [caption,   setCaption]   = useState('')
  const [log,       setLog]       = useState([])
  const [status,    setStatus]    = useState('idle') // idle | running | done | error
  const [postId,    setPostId]    = useState('')

  const addLog = (msg) => setLog(prev => [...prev, msg])

  const publish = async () => {
    const urls = urlsText.split('\n').map(u => u.trim()).filter(Boolean)
    if (!urls.length) return
    if (mode === 'carousel' && urls.length < 2) {
      setLog(['El carousel necesita mínimo 2 URLs']); setStatus('error'); return
    }

    setStatus('running'); setLog([]); setPostId('')

    try {
      const resp = await fetch('/api/publish-instagram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrls: urls, caption }),
      })

      const reader  = resp.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop()
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const data = JSON.parse(line.slice(6))
            if (data.log) addLog(data.log)
            if (data.done) {
              if (data.success) { setStatus('done'); setPostId(data.postId || '') }
              else              { setStatus('error'); addLog(`Error: ${data.error}`) }
            }
          } catch {}
        }
      }
    } catch (err) {
      setStatus('error'); addLog(`Error de red: ${err.message}`)
    }
  }

  const reset = () => { setStatus('idle'); setLog([]); setPostId(''); }

  return (
    <div className="card" style={{ marginTop: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: '#E1306C15', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Camera size={14} color="#E1306C" />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>Publicar en Instagram</div>
          <div style={{ fontSize: 11, color: 'var(--h-muted)' }}>@hutrit_club · vía Graph API</div>
        </div>
      </div>

      {/* Modo */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        {[{ id: 'single', label: 'Imagen única' }, { id: 'carousel', label: 'Carousel (2-10)' }].map(m => (
          <button key={m.id} onClick={() => { setMode(m.id); reset() }} style={{
            padding: '6px 14px', fontSize: 12, fontWeight: 500, borderRadius: 8, cursor: 'pointer',
            background: mode === m.id ? 'var(--h-accent)' : 'var(--h-surface)',
            color:      mode === m.id ? 'white'           : 'var(--h-muted)',
            border:     `1.5px solid ${mode === m.id ? 'var(--h-accent)' : 'var(--h-border)'}`,
          }}>
            {m.label}
          </button>
        ))}
      </div>

      <div className="grid-2" style={{ alignItems: 'flex-start', gap: 14 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--h-muted)', display: 'block', marginBottom: 5 }}>
              {mode === 'carousel' ? 'URLs de imágenes (una por línea, 2-10)' : 'URL de imagen pública'}
            </label>
            <textarea
              className="input-field"
              placeholder={mode === 'carousel'
                ? 'https://i.imgur.com/slide1.png\nhttps://i.imgur.com/slide2.png\n...'
                : 'https://i.imgur.com/imagen.png'}
              value={urlsText}
              onChange={e => setUrlsText(e.target.value)}
              rows={mode === 'carousel' ? 5 : 2}
              style={{ resize: 'vertical', fontFamily: 'var(--font-mono)', fontSize: 12 }}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--h-muted)', display: 'block', marginBottom: 5 }}>Caption</label>
            <textarea
              className="input-field"
              placeholder="Escribe el caption con hashtags..."
              value={caption}
              onChange={e => setCaption(e.target.value)}
              rows={4}
              style={{ resize: 'vertical' }}
            />
          </div>
          <button
            className="btn-primary"
            onClick={publish}
            disabled={status === 'running' || !urlsText.trim()}
            style={{ justifyContent: 'center', background: '#E1306C', opacity: status === 'running' ? 0.7 : 1 }}
          >
            {status === 'running'
              ? <><div className="spinner" />Publicando...</>
              : <><Send size={13} />Publicar en Instagram</>}
          </button>
        </div>

        {/* Log / resultado */}
        <div>
          {log.length > 0 && (
            <div style={{ background: '#0D1117', borderRadius: 10, padding: '12px 14px', marginBottom: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', marginBottom: 8, letterSpacing: '0.06em' }}>PROGRESO</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                {log.map((msg, i) => (
                  <div key={i} style={{ color: msg.startsWith('Error') ? '#F87171' : '#86EFAC' }}>{msg}</div>
                ))}
                {status === 'running' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#94A3B8' }}>
                    <div className="spinner" style={{ width: 10, height: 10, borderWidth: 1.5, borderTopColor: '#94A3B8', borderColor: '#334155' }} />
                    Procesando...
                  </div>
                )}
              </div>
            </div>
          )}

          {status === 'done' && (
            <div className="fade-in" style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <CheckCircle size={16} color="#059669" />
                <span style={{ fontSize: 13, fontWeight: 600, color: '#065F46' }}>Publicado en Instagram</span>
              </div>
              {postId && (
                <div style={{ fontSize: 11, color: '#0D9488' }}>Post ID: {postId}</div>
              )}
              <button className="btn-ghost" style={{ marginTop: 8, fontSize: 12 }} onClick={reset}>Nueva publicación</button>
            </div>
          )}

          {status === 'error' && (
            <div className="fade-in" style={{ background: '#FFF1F2', border: '1px solid #FDA4AF', borderRadius: 10, padding: '14px 16px', display: 'flex', gap: 8 }}>
              <AlertCircle size={16} color="#DC2626" style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#9F1239' }}>Error al publicar</div>
                <button className="btn-ghost" style={{ marginTop: 6, fontSize: 12 }} onClick={reset}>Reintentar</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function Marketing() {
  return (
    <div className="fade-in" style={{ padding: '28px 32px', maxWidth: 900 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.03em' }}>Marketing y contenido</h1>
        <p style={{ color: 'var(--h-muted)', fontSize: 13, marginTop: 4 }}>Calendario editorial, carruseles y plan de publicación</p>
      </div>

      <div className="grid-4" style={{ marginBottom: 24 }}>
        {[
          { label: 'Posts este mes', value: '12', sub: 'LinkedIn + Instagram' },
          { label: 'Engagement rate', value: '4.8%', sub: '+1.2% vs anterior' },
          { label: 'Alcance total', value: '28K',  sub: 'últimos 30 días' },
          { label: 'Contenido pendiente', value: '5', sub: 'por publicar' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-label">{s.label}</div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="section-title">Calendario editorial — próximos 7 días</div>
      <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 20 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--h-surface)' }}>
              {['Fecha', 'Canal', 'Tipo', 'Título', 'Estado'].map(h => (
                <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--h-muted)', letterSpacing: '0.04em', borderBottom: '1px solid var(--h-border)' }}>
                  {h.toUpperCase()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {POSTS.map((p, i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--h-border)', background: i % 2 === 0 ? 'white' : 'var(--h-surface)' }}>
                <td style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>{p.date}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 500, color: channelColor[p.channel] }}>
                    {p.channel === 'LinkedIn' ? <Link size={12} /> : <Camera size={12} />}
                    {p.channel}
                  </span>
                </td>
                <td style={{ padding: '12px 16px' }}><span className="tag">{p.type}</span></td>
                <td style={{ padding: '12px 16px', fontSize: 12 }}>{p.title}</td>
                <td style={{ padding: '12px 16px' }}><span className={`badge ${statusColor[p.status]}`}>{p.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 0 }}>
        <button className="btn-primary"><FileText size={13} />Generar contenido con IA</button>
        <button className="btn-secondary"><Calendar size={13} />Ver calendario completo</button>
      </div>

      {/* Publicador de Instagram */}
      <InstagramPublisher />
    </div>
  )
}

export function Marca() {
  return (
    <div className="fade-in" style={{ padding: '28px 32px', maxWidth: 800 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.03em' }}>Marca + Voz</h1>
        <p style={{ color: 'var(--h-muted)', fontSize: 13, marginTop: 4 }}>Guía de tono y coherencia que alimenta todos los agentes</p>
      </div>

      <div className="grid-2" style={{ marginBottom: 20 }}>
        <div className="card">
          <div className="section-title">Tono de voz Hutrit</div>
          {[
            { label: 'Directo y claro', desc: 'Sin jerga corporativa. Vamos al grano.' },
            { label: 'Cercano pero profesional', desc: 'Tratamos de tú. Somos expertos, no robots.' },
            { label: 'Orientado a resultados', desc: 'Siempre hablamos de impacto y tiempos concretos.' },
            { label: 'Europeo y global', desc: 'Multicultural, inclusivo, enfocado en el mercado EU.' },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 12 }}>
              <CheckCircle size={14} color="#059669" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{item.label}</div>
                <div style={{ fontSize: 12, color: 'var(--h-muted)' }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="card">
          <div className="section-title">Palabras clave de marca</div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--h-muted)', marginBottom: 8 }}>Usamos</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {['talento verificado', '48 horas', 'sin riesgo', 'equipo ideal', 'Europa', 'ágil', 'transparente'].map(w => (
                <span key={w} className="badge badge-green">{w}</span>
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--h-muted)', marginBottom: 8 }}>Evitamos</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {['recursos humanos', 'capital humano', 'sinergia', 'win-win', 'proactivo'].map(w => (
                <span key={w} className="badge badge-red">{w}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="section-title">Score de coherencia de marca</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ fontSize: 36, fontWeight: 700, color: '#059669' }}>87</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500 }}>Buena coherencia en todos los canales</div>
            <div style={{ fontSize: 12, color: 'var(--h-muted)' }}>Instagram necesita ajuste de tono — demasiado formal</div>
          </div>
          <button className="btn-secondary" style={{ marginLeft: 'auto' }}>Ver informe completo</button>
        </div>
      </div>
    </div>
  )
}

export function SEO() {
  const issues = [
    { priority: 'crítica', title: 'Meta descriptions ausentes en 12 páginas', impact: 'Alto' },
    { priority: 'alta',    title: 'Velocidad de carga móvil: 3.8s (objetivo <2s)', impact: 'Alto' },
    { priority: 'alta',    title: 'H1 duplicados en páginas de servicios',         impact: 'Medio' },
    { priority: 'media',   title: 'Faltan alt text en 34 imágenes',               impact: 'Medio' },
    { priority: 'media',   title: 'Schema markup no implementado',                 impact: 'Bajo' },
  ]
  const pColors = { crítica: 'badge-red', alta: 'badge-amber', media: 'badge-blue' }

  return (
    <div className="fade-in" style={{ padding: '28px 32px', maxWidth: 900 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.03em' }}>SEO + Auditoría</h1>
          <p style={{ color: 'var(--h-muted)', fontSize: 13, marginTop: 4 }}>Análisis técnico, issues priorizados y reporte PDF</p>
        </div>
        <button className="btn-primary">Generar PDF ↗</button>
      </div>

      <div className="grid-4" style={{ marginBottom: 24 }}>
        {[
          { label: 'Score SEO',          value: '68', sub: 'de 100' },
          { label: 'Issues críticos',    value: '12', sub: 'acción urgente' },
          { label: 'Palabras en top 10', value: '8',  sub: 'posiciones Google' },
          { label: 'Tráfico orgánico',   value: '1.4K', sub: 'visitas/mes' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-label">{s.label}</div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="section-title">Top issues por impacto</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {issues.map((issue, i) => (
          <div key={i} className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--h-muted)', minWidth: 20 }}>#{i + 1}</span>
            <span className={`badge ${pColors[issue.priority]}`}>{issue.priority}</span>
            <span style={{ fontSize: 13, flex: 1 }}>{issue.title}</span>
            <span className="tag">Impacto {issue.impact}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
