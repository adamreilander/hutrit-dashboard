import { useState } from 'react'
import {
  Play, Search, TrendingUp, Mail, BarChart2,
  Megaphone, CheckCircle, Clock, AlertCircle, Loader,
  Zap, ArrowRight
} from 'lucide-react'

const AGENTS = [
  { id: 'inteligencia', icon: Search,    label: 'Inteligencia de mercado',  desc: 'Scraping de competidores + auditoría web', color: '#0D9488' },
  { id: 'contenido',    icon: Megaphone, label: 'Generador de contenido',   desc: 'Plan editorial + posts + carruseles',       color: '#0D9488' },
  { id: 'outreach',     icon: Mail,      label: 'Outreach automático',       desc: 'Emails personalizados + seguimiento',       color: '#0D5C54' },
  { id: 'seo',          icon: BarChart2, label: 'SEO + Auditoría',           desc: 'Análisis técnico + reporte PDF',            color: '#B45309' },
  { id: 'trends',       icon: TrendingUp,label: 'Tendencias del sector',     desc: 'Keywords + oportunidades de contenido',    color: '#DC2626' },
]

const STATUS = { idle: 'idle', running: 'running', done: 'done', error: 'error' }

export default function CentroMando() {
  const [sector, setSector] = useState('')
  const [selected, setSelected] = useState({ inteligencia: true, contenido: true, outreach: true, seo: false, trends: false })
  const [statuses, setStatuses] = useState({})
  const [launched, setLaunched] = useState(false)
  const [log, setLog] = useState([])

  const toggleAgent = (id) => setSelected(prev => ({ ...prev, [id]: !prev[id] }))

  const addLog = (msg) => setLog(prev => [...prev, { time: new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit', second: '2-digit' }), msg }])

  const launch = () => {
    if (!sector.trim()) return
    setLaunched(true)
    setLog([])
    const active = AGENTS.filter(a => selected[a.id])
    const initial = {}
    active.forEach(a => (initial[a.id] = STATUS.running))
    setStatuses(initial)
    addLog(`Sector detectado: "${sector}" — iniciando ${active.length} agentes en paralelo`)

    active.forEach((agent, i) => {
      const delay = i * 1800 + Math.random() * 800
      setTimeout(() => addLog(`${agent.label} — arrancando...`), delay)
      setTimeout(() => {
        setStatuses(prev => ({ ...prev, [agent.id]: STATUS.done }))
        addLog(`${agent.label} — completado ✓`)
      }, delay + 3000 + Math.random() * 2000)
    })
  }

  const allDone = Object.values(statuses).length > 0 && Object.values(statuses).every(s => s === STATUS.done)
  const anyRunning = Object.values(statuses).some(s => s === STATUS.running)

  return (
    <div className="fade-in" style={{ padding: '28px 32px', maxWidth: 900 }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: anyRunning ? '#059669' : '#CBD5E1', animation: anyRunning ? 'pulse 1.5s infinite' : 'none' }} />
          <span style={{ fontSize: 12, color: 'var(--h-muted)', fontWeight: 500 }}>
            {anyRunning ? 'Agentes activos' : 'Listo para lanzar'}
          </span>
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.03em' }}>Centro de mando</h1>
        <p style={{ color: 'var(--h-muted)', fontSize: 13, marginTop: 4 }}>
          Define el sector y lanza todos los agentes desde aquí
        </p>
      </div>

      {/* Input principal */}
      <div className="card" style={{ marginBottom: 20 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--h-muted)', display: 'block', marginBottom: 8 }}>
          SECTOR OBJETIVO
        </label>
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            className="input-field"
            placeholder="ej: empresas de tecnología B2B en España, startups de logística en Europa..."
            value={sector}
            onChange={e => setSector(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && launch()}
          />
          <button
            className="btn-primary"
            onClick={launch}
            disabled={anyRunning || !sector.trim()}
            style={{ whiteSpace: 'nowrap', opacity: anyRunning ? 0.7 : 1 }}
          >
            {anyRunning ? <><div className="spinner" />Corriendo...</> : <><Play size={14} />Lanzar agentes</>}
          </button>
        </div>
      </div>

      {/* Selección de agentes */}
      <div style={{ marginBottom: 20 }}>
        <div className="section-title">Agentes a activar</div>
        <div className="grid-3">
          {AGENTS.map(agent => {
            const isOn = selected[agent.id]
            const st = statuses[agent.id]
            return (
              <button
                key={agent.id}
                onClick={() => !launched && toggleAgent(agent.id)}
                style={{
                  background: 'var(--h-white)',
                  border: `1.5px solid ${isOn ? agent.color : 'var(--h-border)'}`,
                  borderRadius: 'var(--radius-lg)',
                  padding: '14px 16px',
                  textAlign: 'left',
                  cursor: launched ? 'default' : 'pointer',
                  transition: 'all 0.2s',
                  opacity: !isOn ? 0.55 : 1,
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {isOn && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: agent.color, borderRadius: '2px 2px 0 0' }} />}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: isOn ? `${agent.color}15` : 'var(--h-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <agent.icon size={14} color={isOn ? agent.color : 'var(--h-muted)'} />
                  </div>
                  <StatusIcon status={st} />
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--h-text)', marginBottom: 2 }}>{agent.label}</div>
                <div style={{ fontSize: 11, color: 'var(--h-muted)' }}>{agent.desc}</div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Log de actividad */}
      {log.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="section-title" style={{ marginBottom: 10 }}>Log en tiempo real</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, maxHeight: 180, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {log.map((entry, i) => (
              <div key={i} style={{ display: 'flex', gap: 12 }} className="slide-in">
                <span style={{ color: 'var(--h-muted)', flexShrink: 0 }}>{entry.time}</span>
                <span style={{ color: entry.msg.includes('✓') ? '#059669' : 'var(--h-text)' }}>{entry.msg}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resultado */}
      {allDone && (
        <div className="fade-in" style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 'var(--radius-lg)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <CheckCircle size={20} color="#059669" />
          <div>
            <div style={{ fontWeight: 600, fontSize: 13, color: '#065F46' }}>Ciclo completado para "{sector}"</div>
            <div style={{ fontSize: 12, color: '#0D5C54', marginTop: 2 }}>Revisa Inteligencia, Pipeline y Marketing para ver los resultados</div>
          </div>
          <button className="btn-primary" style={{ marginLeft: 'auto', background: '#059669' }}>
            Ver resultados <ArrowRight size={13} />
          </button>
        </div>
      )}
    </div>
  )
}

function StatusIcon({ status }) {
  if (!status) return null
  if (status === STATUS.running) return <div className="spinner" style={{ borderTopColor: 'var(--h-accent)', borderColor: 'var(--h-border)' }} />
  if (status === STATUS.done)    return <CheckCircle size={14} color="#059669" />
  if (status === STATUS.error)   return <AlertCircle size={14} color="#DC2626" />
  return null
}
