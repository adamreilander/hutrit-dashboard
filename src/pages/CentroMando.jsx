import { useState } from 'react'
import {
  Play, Search, TrendingUp, Mail, BarChart2,
  Megaphone, CheckCircle, AlertCircle, Zap, ArrowRight, ChevronDown, ChevronUp
} from 'lucide-react'

const AGENTS = [
  { id: 'inteligencia', icon: Search,     label: 'Inteligencia de mercado', desc: 'Competidores + señales de contratación', color: '#0D9488' },
  { id: 'contenido',    icon: Megaphone,  label: 'Generador de contenido',  desc: 'Posts LinkedIn + carruseles Instagram',  color: '#0D9488' },
  { id: 'outreach',     icon: Mail,       label: 'Outreach automático',      desc: 'Email en frío personalizado',           color: '#0D5C54' },
  { id: 'seo',          icon: BarChart2,  label: 'SEO + Keywords',           desc: 'Long-tail keywords por sector',         color: '#B45309' },
  { id: 'trends',       icon: TrendingUp, label: 'Tendencias del sector',    desc: 'Señales de mercado y oportunidades',   color: '#DC2626' },
]

const STATUS = { idle: 'idle', running: 'running', done: 'done', error: 'error' }

export default function CentroMando() {
  const [sector, setSector] = useState('')
  const [selected, setSelected] = useState({ inteligencia: true, contenido: true, outreach: true, seo: false, trends: false })
  const [statuses, setStatuses] = useState({})
  const [results, setResults] = useState({})
  const [expanded, setExpanded] = useState({})
  const [log, setLog] = useState([])
  const [launched, setLaunched] = useState(false)

  const toggleAgent = (id) => setSelected(prev => ({ ...prev, [id]: !prev[id] }))
  const toggleExpand = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }))

  const addLog = (msg) => setLog(prev => [
    ...prev,
    { time: new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit', second: '2-digit' }), msg }
  ])

  const runAgent = async (agent) => {
    setStatuses(prev => ({ ...prev, [agent.id]: STATUS.running }))
    setResults(prev => ({ ...prev, [agent.id]: '' }))
    addLog(`${agent.label} — iniciando...`)

    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: agent.id, sector }),
      })

      const reader = res.body.getReader()
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
          const data = line.slice(6).trim()
          if (data === '[DONE]') {
            setStatuses(prev => ({ ...prev, [agent.id]: STATUS.done }))
            addLog(`${agent.label} — completado ✓`)
            return
          }
          try {
            const { text, error } = JSON.parse(data)
            if (error) throw new Error(error)
            if (text) setResults(prev => ({ ...prev, [agent.id]: (prev[agent.id] || '') + text }))
          } catch {}
        }
      }
    } catch (err) {
      setStatuses(prev => ({ ...prev, [agent.id]: STATUS.error }))
      addLog(`${agent.label} — error: ${err.message}`)
    }
  }

  const launch = async () => {
    if (!sector.trim()) return
    setLaunched(true)
    setLog([])
    setResults({})
    setExpanded({})
    const active = AGENTS.filter(a => selected[a.id])
    addLog(`Sector: "${sector}" — lanzando ${active.length} agentes en paralelo`)
    await Promise.all(active.map(runAgent))
  }

  const allDone = Object.values(statuses).length > 0 && Object.values(statuses).every(s => s === STATUS.done || s === STATUS.error)
  const anyRunning = Object.values(statuses).some(s => s === STATUS.running)

  return (
    <div className="fade-in" style={{ padding: '28px 32px', maxWidth: 920 }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: anyRunning ? '#059669' : '#CBD5E1', animation: anyRunning ? 'pulse 1.5s infinite' : 'none' }} />
          <span style={{ fontSize: 12, color: 'var(--h-muted)', fontWeight: 500 }}>
            {anyRunning ? 'Agentes activos — respuestas en tiempo real' : 'Listo para lanzar'}
          </span>
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.03em' }}>Centro de mando</h1>
        <p style={{ color: 'var(--h-muted)', fontSize: 13, marginTop: 4 }}>
          Define el sector y lanza todos los agentes Claude desde aquí
        </p>
      </div>

      {/* Input */}
      <div className="card" style={{ marginBottom: 20 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--h-muted)', display: 'block', marginBottom: 8 }}>
          SECTOR OBJETIVO
        </label>
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            className="input-field"
            placeholder="ej: startups de tecnología B2B en España, agencias de marketing en Barcelona..."
            value={sector}
            onChange={e => setSector(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !anyRunning && launch()}
            disabled={anyRunning}
          />
          <button
            className="btn-primary"
            onClick={launch}
            disabled={anyRunning || !sector.trim()}
            style={{ whiteSpace: 'nowrap', opacity: anyRunning ? 0.7 : 1 }}
          >
            {anyRunning
              ? <><div className="spinner" />Corriendo...</>
              : <><Zap size={14} />Lanzar agentes</>}
          </button>
        </div>
      </div>

      {/* Agent selector */}
      <div style={{ marginBottom: 20 }}>
        <div className="section-title">Agentes a activar</div>
        <div className="grid-3">
          {AGENTS.map(agent => {
            const isOn = selected[agent.id]
            const st = statuses[agent.id]
            const res = results[agent.id]
            const isExp = expanded[agent.id]

            return (
              <div key={agent.id} style={{ display: 'flex', flexDirection: 'column' }}>
                <button
                  onClick={() => !launched && toggleAgent(agent.id)}
                  style={{
                    background: 'var(--h-white)',
                    border: `1.5px solid ${isOn ? agent.color : 'var(--h-border)'}`,
                    borderRadius: res ? '10px 10px 0 0' : 'var(--radius-lg)',
                    padding: '14px 16px',
                    textAlign: 'left',
                    cursor: launched ? 'default' : 'pointer',
                    transition: 'all 0.2s',
                    opacity: !isOn ? 0.55 : 1,
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {isOn && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: agent.color }} />}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: isOn ? `${agent.color}15` : 'var(--h-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <agent.icon size={14} color={isOn ? agent.color : 'var(--h-muted)'} />
                    </div>
                    <StatusIcon status={st} />
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--h-text)', marginBottom: 2 }}>{agent.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--h-muted)' }}>{agent.desc}</div>
                </button>

                {/* Result panel */}
                {res && (
                  <div style={{
                    background: '#F8FFFD',
                    border: `1.5px solid ${agent.color}`,
                    borderTop: 'none',
                    borderRadius: '0 0 10px 10px',
                    overflow: 'hidden',
                  }}>
                    <button
                      onClick={() => toggleExpand(agent.id)}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '8px 12px', background: `${agent.color}10`, cursor: 'pointer',
                        fontSize: 11, fontWeight: 600, color: agent.color,
                      }}
                    >
                      Ver resultado {isExp ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>
                    {isExp && (
                      <div style={{
                        padding: '10px 12px', fontSize: 12, color: 'var(--h-text)',
                        lineHeight: 1.6, whiteSpace: 'pre-wrap', maxHeight: 240, overflowY: 'auto',
                      }}>
                        {res}
                        {st === STATUS.running && <span style={{ display: 'inline-block', width: 8, height: 14, background: agent.color, marginLeft: 2, animation: 'pulse 1s infinite', borderRadius: 1 }} />}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Log */}
      {log.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="section-title" style={{ marginBottom: 10 }}>Log en tiempo real</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, maxHeight: 160, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {log.map((entry, i) => (
              <div key={i} style={{ display: 'flex', gap: 12 }} className="slide-in">
                <span style={{ color: 'var(--h-muted)', flexShrink: 0 }}>{entry.time}</span>
                <span style={{ color: entry.msg.includes('✓') ? '#059669' : entry.msg.includes('error') ? '#DC2626' : 'var(--h-text)' }}>
                  {entry.msg}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Done state */}
      {allDone && (
        <div className="fade-in" style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 'var(--radius-lg)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <CheckCircle size={20} color="#059669" />
          <div>
            <div style={{ fontWeight: 600, fontSize: 13, color: '#065F46' }}>Ciclo completado para "{sector}"</div>
            <div style={{ fontSize: 12, color: '#0D5C54', marginTop: 2 }}>Expande cada agente para ver sus resultados</div>
          </div>
          <button className="btn-primary" style={{ marginLeft: 'auto', background: '#059669' }} onClick={() => {
            const all = {}
            AGENTS.forEach(a => { if (results[a.id]) all[a.id] = true })
            setExpanded(all)
          }}>
            Ver todos <ArrowRight size={13} />
          </button>
        </div>
      )}
    </div>
  )
}

function StatusIcon({ status }) {
  if (!status || status === STATUS.idle) return null
  if (status === STATUS.running) return <div className="spinner" style={{ borderTopColor: 'var(--h-accent)', borderColor: 'var(--h-border)' }} />
  if (status === STATUS.done)    return <CheckCircle size={14} color="#059669" />
  if (status === STATUS.error)   return <AlertCircle size={14} color="#DC2626" />
  return null
}
