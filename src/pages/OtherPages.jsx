import { Calendar, FileText, TrendingUp, CheckCircle, Camera, Link } from 'lucide-react'

const POSTS = [
  { date: 'Lun 14 Abr', channel: 'LinkedIn',  type: 'Artículo',   title: '5 errores al contratar talento tech en Europa', status: 'programado' },
  { date: 'Mar 15 Abr', channel: 'Instagram', type: 'Carrusel',   title: 'Cómo Hutrit encontró al CTO ideal en 3 días',    status: 'borrador'   },
  { date: 'Mié 16 Abr', channel: 'LinkedIn',  type: 'Post',       title: 'El mercado tech europeo en 2025: datos clave',   status: 'programado' },
  { date: 'Jue 17 Abr', channel: 'Instagram', type: 'Reels idea', title: 'Antes y después: equipo de 3 a 12 personas',      status: 'borrador'   },
  { date: 'Vie 18 Abr', channel: 'LinkedIn',  type: 'Post',       title: 'Por qué las startups pierden talento en 6 meses', status: 'idea'       },
]

const statusColor = { programado: 'badge-green', borrador: 'badge-amber', idea: 'badge-gray' }
const channelColor = { LinkedIn: '#0A66C2', Instagram: '#E1306C' }

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

      <div style={{ display: 'flex', gap: 10 }}>
        <button className="btn-primary"><FileText size={13} />Generar contenido con IA</button>
        <button className="btn-secondary"><Calendar size={13} />Ver calendario completo</button>
      </div>
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
