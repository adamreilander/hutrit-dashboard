import { useState } from 'react'
import {
  Play, Search, TrendingUp, Mail, BarChart2,
  Megaphone, CheckCircle, AlertCircle, Zap, ArrowRight,
  ChevronDown, ChevronUp, Users, Target, FileText, Download
} from 'lucide-react'
import { generateIntelPDF } from '../utils/generatePDF'

const AGENTS = [
  { id: 'inteligencia', icon: Search,     label: 'Inteligencia de mercado', desc: 'Competidores + señales de contratación', color: '#0D9488' },
  { id: 'contenido',    icon: Megaphone,  label: 'Generador de contenido',  desc: 'Posts LinkedIn + carruseles Instagram',  color: '#7C3AED' },
  { id: 'outreach',     icon: Mail,       label: 'Outreach automático',      desc: 'Email en frío personalizado',           color: '#DC2626' },
  { id: 'seo',          icon: BarChart2,  label: 'SEO + Keywords',           desc: 'Long-tail keywords por sector',         color: '#B45309' },
  { id: 'trends',       icon: TrendingUp, label: 'Tendencias del sector',    desc: 'Señales de mercado y oportunidades',   color: '#059669' },
]

const STATUS = { idle: 'idle', running: 'running', done: 'done', error: 'error' }

// Métricas rápidas del panel
const QUICK_STATS = [
  { label: 'Empresas auditadas', value: '0', key: 'auditadas' },
  { label: 'Emails enviados',    value: '0', key: 'emails' },
  { label: 'Posts generados',    value: '0', key: 'posts' },
  { label: 'PDFs exportados',    value: '0', key: 'pdfs' },
]

export default function CentroMando() {
  const [sector,   setSector]   = useState('')
  const [empresa,  setEmpresa]  = useState('')  // para pipeline completo
  const [emailTo,  setEmailTo]  = useState('')  // para pipeline completo
  const [selected, setSelected] = useState({ inteligencia: true, contenido: true, outreach: true, seo: false, trends: false })
  const [statuses, setStatuses] = useState({})
  const [results,  setResults]  = useState({})
  const [expanded, setExpanded] = useState({})
  const [log,      setLog]      = useState([])
  const [launched, setLaunched] = useState(false)
  const [showPipeline, setShowPipeline] = useState(false)

  // Pipeline completo
  const [pipelineStatus, setPipelineStatus] = useState({}) // step → idle|running|done|error
  const [pipelineLog,    setPipelineLog]    = useState([])
  const [pipelineRunning, setPipelineRunning] = useState(false)

  const toggleAgent  = (id) => setSelected(prev => ({ ...prev, [id]: !prev[id] }))
  const toggleExpand = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }))

  const addLog = (msg) => setLog(prev => [
    ...prev,
    { time: new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit', second: '2-digit' }), msg }
  ])

  const addPipeLog = (msg) => setPipelineLog(prev => [
    ...prev,
    { time: new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit', second: '2-digit' }), msg }
  ])

  // ── Agentes individuales ──────────────────────────────────────────────────

  const runAgent = async (agent) => {
    setStatuses(prev => ({ ...prev, [agent.id]: STATUS.running }))
    setResults(prev =>  ({ ...prev, [agent.id]: '' }))
    addLog(`${agent.label} — iniciando...`)

    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: agent.id, sector }),
      })

      const reader  = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n'); buffer = lines.pop()

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
    setLaunched(true); setLog([]); setResults({}); setExpanded({})
    const active = AGENTS.filter(a => selected[a.id])
    addLog(`Sector: "${sector}" — lanzando ${active.length} agentes en paralelo`)
    await Promise.all(active.map(runAgent))
  }

  // ── Pipeline completo ─────────────────────────────────────────────────────

  const PIPELINE_STEPS = [
    { id: 'audit',    label: 'Auditoría de empresa',     icon: Search    },
    { id: 'calendar', label: 'Calendario editorial',      icon: Megaphone },
    { id: 'email',    label: 'Email de outreach',         icon: Mail      },
    { id: 'pdf',      label: 'Exportar informe PDF',      icon: FileText  },
  ]

  const updatePipe = (id, st) => setPipelineStatus(prev => ({ ...prev, [id]: st }))

  const runFullPipeline = async () => {
    if (!empresa.trim() || !sector.trim() || !emailTo.trim()) return
    setPipelineRunning(true)
    setPipelineLog([])
    setPipelineStatus({})

    let auditJson = null

    // Step 1 — Auditoría
    updatePipe('audit', 'running')
    addPipeLog('M1 — Auditando empresa...')
    try {
      const resp = await fetch('/api/audit-company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ empresa: empresa.trim(), sector: sector.trim() }),
      })
      const reader  = resp.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n'); buffer = lines.pop()
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const data = JSON.parse(line.slice(6))
            if (data.done) {
              if (data.error) { updatePipe('audit', 'error'); addPipeLog(`M1 — Error: ${data.error}`); setPipelineRunning(false); return }
              auditJson = data.audit
            }
          } catch {}
        }
      }
      updatePipe('audit', 'done')
      addPipeLog('M1 — Auditoría completada ✓')
    } catch (err) {
      updatePipe('audit', 'error'); addPipeLog(`M1 — Error: ${err.message}`); setPipelineRunning(false); return
    }

    // Step 2 — Calendario
    updatePipe('calendar', 'running')
    addPipeLog('M2 — Generando calendario editorial...')
    try {
      const resp = await fetch('/api/generate-calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sector: sector.trim(), semanas: 2, foco: 'ambos' }),
      })
      const data = await resp.json()
      if (data.success) { updatePipe('calendar', 'done'); addPipeLog(`M2 — ${data.calendar.length} posts generados ✓`) }
      else              { updatePipe('calendar', 'error'); addPipeLog(`M2 — Error: ${data.error}`) }
    } catch (err) {
      updatePipe('calendar', 'error'); addPipeLog(`M2 — Error: ${err.message}`)
    }

    // Step 3 — Outreach
    updatePipe('email', 'running')
    addPipeLog('M6 — Enviando email de outreach...')
    try {
      const resp = await fetch('/api/send-outreach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ empresa: empresa.trim(), contacto: '', emailTo: emailTo.trim(), auditoria: auditJson }),
      })
      const data = await resp.json()
      if (data.success) { updatePipe('email', 'done'); addPipeLog(`M6 — Email enviado a ${emailTo} ✓`) }
      else              { updatePipe('email', 'error'); addPipeLog(`M6 — Error: ${data.error}`) }
    } catch (err) {
      updatePipe('email', 'error'); addPipeLog(`M6 — Error: ${err.message}`)
    }

    // Step 4 — PDF
    updatePipe('pdf', 'running')
    addPipeLog('M5 — Generando PDF...')
    try {
      if (auditJson) { generateIntelPDF(sector, [], []); updatePipe('pdf', 'done'); addPipeLog('M5 — PDF descargado ✓') }
      else           { updatePipe('pdf', 'error'); addPipeLog('M5 — Sin datos de auditoría') }
    } catch (err) {
      updatePipe('pdf', 'error'); addPipeLog(`M5 — Error: ${err.message}`)
    }

    setPipelineRunning(false)
    addPipeLog('─── Pipeline completo ───')
  }

  const allDone     = Object.values(statuses).length > 0 && Object.values(statuses).every(s => s === STATUS.done || s === STATUS.error)
  const anyRunning  = Object.values(statuses).some(s => s === STATUS.running)
  const pipeAllDone = PIPELINE_STEPS.every(s => pipelineStatus[s.id] === 'done' || pipelineStatus[s.id] === 'error')
  const pipeDoneCount = PIPELINE_STEPS.filter(s => pipelineStatus[s.id] === 'done').length

  return (
    <div className="fade-in" style={{ padding: '28px 32px', maxWidth: 960 }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: anyRunning || pipelineRunning ? '#059669' : '#CBD5E1', animation: anyRunning || pipelineRunning ? 'pulse 1.5s infinite' : 'none' }} />
          <span style={{ fontSize: 12, color: 'var(--h-muted)', fontWeight: 500 }}>
            {anyRunning ? 'Agentes activos — respuestas en tiempo real' : pipelineRunning ? 'Pipeline ejecutándose...' : 'Listo para lanzar'}
          </span>
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.03em' }}>Centro de mando</h1>
        <p style={{ color: 'var(--h-muted)', fontSize: 13, marginTop: 4 }}>
          Lanza agentes de análisis por sector o ejecuta el pipeline completo empresa por empresa
        </p>
      </div>

      {/* Tabs: Análisis de sector / Pipeline empresa */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
        <button onClick={() => setShowPipeline(false)} style={{
          padding: '7px 16px', fontSize: 13, borderRadius: 8, fontWeight: showPipeline ? 400 : 600, cursor: 'pointer',
          background: showPipeline ? 'var(--h-surface)' : 'var(--h-primary)', color: showPipeline ? 'var(--h-muted)' : 'white',
          border: `1.5px solid ${showPipeline ? 'var(--h-border)' : 'var(--h-primary)'}`,
        }}>
          Análisis de sector
        </button>
        <button onClick={() => setShowPipeline(true)} style={{
          padding: '7px 16px', fontSize: 13, borderRadius: 8, fontWeight: showPipeline ? 600 : 400, cursor: 'pointer',
          background: showPipeline ? 'var(--h-primary)' : 'var(--h-surface)', color: showPipeline ? 'white' : 'var(--h-muted)',
          border: `1.5px solid ${showPipeline ? 'var(--h-primary)' : 'var(--h-border)'}`,
        }}>
          <Zap size={13} style={{ display: 'inline', marginRight: 4 }} />Pipeline empresa
        </button>
      </div>

      {!showPipeline ? (
        <>
          {/* ── ANÁLISIS DE SECTOR ── */}
          <div className="card" style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--h-muted)', display: 'block', marginBottom: 8 }}>SECTOR OBJETIVO</label>
            <div style={{ display: 'flex', gap: 10 }}>
              <input
                className="input-field"
                placeholder="ej: startups de tecnología B2B en España, agencias de marketing en Barcelona..."
                value={sector}
                onChange={e => setSector(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !anyRunning && launch()}
                disabled={anyRunning}
              />
              <button className="btn-primary" onClick={launch} disabled={anyRunning || !sector.trim()} style={{ whiteSpace: 'nowrap', opacity: anyRunning ? 0.7 : 1 }}>
                {anyRunning ? <><div className="spinner" />Corriendo...</> : <><Zap size={14} />Lanzar agentes</>}
              </button>
            </div>
          </div>

          {/* Agent selector */}
          <div style={{ marginBottom: 20 }}>
            <div className="section-title">Agentes a activar</div>
            <div className="grid-3">
              {AGENTS.map(agent => {
                const isOn  = selected[agent.id]
                const st    = statuses[agent.id]
                const res   = results[agent.id]
                const isExp = expanded[agent.id]

                return (
                  <div key={agent.id} style={{ display: 'flex', flexDirection: 'column' }}>
                    <button
                      onClick={() => !launched && toggleAgent(agent.id)}
                      style={{
                        background: 'var(--h-white)', border: `1.5px solid ${isOn ? agent.color : 'var(--h-border)'}`,
                        borderRadius: res ? '10px 10px 0 0' : 'var(--radius-lg)', padding: '14px 16px',
                        textAlign: 'left', cursor: launched ? 'default' : 'pointer', transition: 'all 0.2s',
                        opacity: !isOn ? 0.55 : 1, position: 'relative', overflow: 'hidden',
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

                    {res && (
                      <div style={{ background: '#F8FFFD', border: `1.5px solid ${agent.color}`, borderTop: 'none', borderRadius: '0 0 10px 10px', overflow: 'hidden' }}>
                        <button onClick={() => toggleExpand(agent.id)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: `${agent.color}10`, cursor: 'pointer', fontSize: 11, fontWeight: 600, color: agent.color }}>
                          Ver resultado {isExp ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        </button>
                        {isExp && (
                          <div style={{ padding: '10px 12px', fontSize: 12, color: 'var(--h-text)', lineHeight: 1.6, whiteSpace: 'pre-wrap', maxHeight: 240, overflowY: 'auto' }}>
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
                    <span style={{ color: entry.msg.includes('✓') ? '#059669' : entry.msg.includes('error') ? '#DC2626' : 'var(--h-text)' }}>{entry.msg}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Done */}
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
        </>
      ) : (
        <>
          {/* ── PIPELINE EMPRESA ── */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="section-title" style={{ marginBottom: 14 }}>Empresa objetivo</div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
              <div style={{ flex: '1 1 180px' }}>
                <label style={{ fontSize: 11, fontWeight: 500, color: 'var(--h-muted)', display: 'block', marginBottom: 5 }}>EMPRESA *</label>
                <input className="input-field" placeholder="ej: Holded, Factorial..." value={empresa} onChange={e => setEmpresa(e.target.value)} disabled={pipelineRunning} />
              </div>
              <div style={{ flex: '1 1 180px' }}>
                <label style={{ fontSize: 11, fontWeight: 500, color: 'var(--h-muted)', display: 'block', marginBottom: 5 }}>SECTOR *</label>
                <input className="input-field" placeholder="ej: SaaS B2B..." value={sector} onChange={e => setSector(e.target.value)} disabled={pipelineRunning} />
              </div>
              <div style={{ flex: '1 1 180px' }}>
                <label style={{ fontSize: 11, fontWeight: 500, color: 'var(--h-muted)', display: 'block', marginBottom: 5 }}>EMAIL DESTINO *</label>
                <input className="input-field" placeholder="ceo@empresa.com" type="email" value={emailTo} onChange={e => setEmailTo(e.target.value)} disabled={pipelineRunning} />
              </div>
            </div>
            <button
              className="btn-primary"
              onClick={runFullPipeline}
              disabled={pipelineRunning || !empresa.trim() || !sector.trim() || !emailTo.trim()}
              style={{ opacity: (!empresa.trim() || !sector.trim() || !emailTo.trim()) ? 0.5 : 1 }}
            >
              {pipelineRunning ? <><div className="spinner" />Pipeline en ejecución...</> : <><Zap size={14} />Lanzar pipeline completo</>}
            </button>
          </div>

          {/* Pipeline steps */}
          {Object.keys(pipelineStatus).length > 0 && (
            <div className="card fade-in" style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div className="section-title" style={{ margin: 0 }}>Progreso del pipeline</div>
                {pipeAllDone && (
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#059669' }}>{pipeDoneCount}/{PIPELINE_STEPS.length} completados</span>
                )}
              </div>

              {/* Barra de progreso */}
              <div style={{ height: 6, background: 'var(--h-border)', borderRadius: 3, marginBottom: 20, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(pipeDoneCount / PIPELINE_STEPS.length) * 100}%`, background: 'var(--h-accent)', borderRadius: 3, transition: 'width 0.5s ease' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {PIPELINE_STEPS.map((step, i) => {
                  const st = pipelineStatus[step.id] || 'idle'
                  return (
                    <div key={step.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 8, background: st === 'done' ? '#F0FDF4' : st === 'error' ? '#FFF1F2' : st === 'running' ? '#F0FDFA' : 'var(--h-surface)', border: `1px solid ${st === 'done' ? '#86EFAC' : st === 'error' ? '#FDA4AF' : st === 'running' ? '#99F6E4' : 'var(--h-border)'}` }}>
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: st === 'done' ? '#059669' : st === 'error' ? '#DC2626' : st === 'running' ? '#0D9488' : 'var(--h-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {st === 'running'
                          ? <div className="spinner" style={{ width: 14, height: 14, borderTopColor: 'white', borderColor: 'rgba(255,255,255,0.3)', borderWidth: 2 }} />
                          : st === 'done'   ? <CheckCircle size={14} color="white" />
                          : st === 'error'  ? <AlertCircle size={14} color="white" />
                          : <span style={{ fontSize: 11, fontWeight: 700, color: 'white' }}>{i + 1}</span>}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: st === 'idle' ? 'var(--h-muted)' : 'var(--h-text)' }}>{step.label}</div>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 500, color: st === 'done' ? '#059669' : st === 'error' ? '#DC2626' : st === 'running' ? '#0D9488' : 'var(--h-muted)' }}>
                        {st === 'done' ? 'Completado' : st === 'error' ? 'Error' : st === 'running' ? 'En proceso...' : 'Pendiente'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Pipeline log */}
          {pipelineLog.length > 0 && (
            <div className="card">
              <div className="section-title" style={{ marginBottom: 10 }}>Log del pipeline</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, maxHeight: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {pipelineLog.map((entry, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12 }}>
                    <span style={{ color: 'var(--h-muted)', flexShrink: 0 }}>{entry.time}</span>
                    <span style={{ color: entry.msg.includes('✓') ? '#059669' : entry.msg.includes('Error') ? '#DC2626' : entry.msg.includes('───') ? 'var(--h-accent)' : 'var(--h-text)', fontWeight: entry.msg.includes('───') ? 600 : 400 }}>
                      {entry.msg}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
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
