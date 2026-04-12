import { useState, useRef, useEffect } from 'react'
import {
  Search, Mail, Calendar, Image, Send, FileText, Zap,
  CheckCircle, AlertCircle, Lock, ChevronDown, ChevronUp,
  Play, RotateCcw, Database, Copy, Check, ExternalLink,
  Building, TrendingUp, Users, Target, Download
} from 'lucide-react'
import { generateAuditPDF } from '../utils/generatePDF'

// ─── Definición de módulos ────────────────────────────────────────────────────

const MODULES = [
  {
    id: 'audit',
    num: 1,
    icon: Search,
    label: 'Auditar empresa',
    desc: 'Analiza presencia digital y detecta puntos de dolor',
    color: '#0D9488',
    active: true,
  },
  {
    id: 'calendar',
    num: 2,
    icon: Calendar,
    label: 'Crear calendario',
    desc: 'Genera 30 días de contenido LinkedIn + Instagram',
    color: '#7C3AED',
    active: false,
  },
  {
    id: 'creatives',
    num: 3,
    icon: Image,
    label: 'Generar creativos',
    desc: 'Crea imágenes en el estilo Hutrit con IA',
    color: '#D97706',
    active: false,
  },
  {
    id: 'publish',
    num: 4,
    icon: Send,
    label: 'Publicar contenido',
    desc: 'Publica en Instagram y LinkedIn automáticamente',
    color: '#E1306C',
    active: false,
  },
  {
    id: 'pdf',
    num: 5,
    icon: FileText,
    label: 'Exportar PDF',
    desc: 'Genera informe de auditoría con branding Hutrit',
    color: '#059669',
    active: false,
  },
  {
    id: 'outreach',
    num: 6,
    icon: Mail,
    label: 'Email de outreach',
    desc: 'Redacta y envía email personalizado con los puntos de dolor',
    color: '#DC2626',
    active: true,
  },
]

// ─── Utilidades ───────────────────────────────────────────────────────────────

const urgencyColor = { alta: '#DC2626', media: '#D97706', baja: '#059669' }
const urgencyBg    = { alta: '#FEE2E2', media: '#FEF3C7', baja: '#D1FAE5' }

// ─── Componente principal ────────────────────────────────────────────────────

export default function Agente() {
  // Inputs
  const [empresa,  setEmpresa]  = useState('')
  const [sector,   setSector]   = useState('')
  const [contacto, setContacto] = useState('')
  const [emailTo,  setEmailTo]  = useState('')

  // Estado del módulo 1 — Auditoría
  const [auditStatus,  setAuditStatus]  = useState('idle') // idle|running|done|error
  const [auditText,    setAuditText]    = useState('')
  const [auditJson,    setAuditJson]    = useState(null)
  const [auditExpanded, setAuditExpanded] = useState(true)
  const auditRef = useRef(null)

  // Estado del módulo 6 — Outreach
  const [outreachStatus,  setOutreachStatus]  = useState('idle') // idle|running|done|error
  const [outreachResult,  setOutreachResult]  = useState(null) // {id, subject, preview, emailTo}
  const [outreachError,   setOutreachError]   = useState('')

  // Pipeline completo
  const [pipelineRunning, setPipelineRunning] = useState(false)

  useEffect(() => {
    if (auditStatus === 'running' && auditRef.current) {
      auditRef.current.scrollTop = auditRef.current.scrollHeight
    }
  }, [auditText, auditStatus])

  // ── Módulo 1: Auditoría ────────────────────────────────────────────────────

  const runAudit = async () => {
    if (!empresa.trim() || !sector.trim()) return
    setAuditStatus('running')
    setAuditText('')
    setAuditJson(null)
    setAuditExpanded(true)

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
        const lines = buffer.split('\n')
        buffer = lines.pop()

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const data = JSON.parse(line.slice(6))
            if (data.text) setAuditText(prev => prev + data.text)
            if (data.log)  { /* internal log, ignore in UI */ }
            if (data.done) {
              if (data.error) {
                setAuditStatus('error')
                setAuditText(prev => prev + `\n\n⚠️ Error: ${data.error}`)
              } else {
                setAuditStatus('done')
                if (data.audit) setAuditJson(data.audit)
              }
            }
          } catch {}
        }
      }
    } catch (err) {
      setAuditStatus('error')
      setAuditText(prev => prev + `\n\n⚠️ Error de red: ${err.message}`)
    }
  }

  const resetAudit = () => {
    setAuditStatus('idle')
    setAuditText('')
    setAuditJson(null)
    setOutreachStatus('idle')
    setOutreachResult(null)
    setOutreachError('')
  }

  // ── Módulo 6: Outreach ────────────────────────────────────────────────────

  const runOutreach = async () => {
    if (!emailTo.trim() || !auditJson) return
    setOutreachStatus('running')
    setOutreachResult(null)
    setOutreachError('')

    try {
      const resp = await fetch('/api/send-outreach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          empresa:   empresa.trim(),
          contacto:  contacto.trim(),
          emailTo:   emailTo.trim(),
          auditoria: auditJson,
        }),
      })
      const data = await resp.json()
      if (data.success) {
        setOutreachStatus('done')
        setOutreachResult(data)
      } else {
        setOutreachStatus('error')
        setOutreachError(data.error || 'Error desconocido')
      }
    } catch (err) {
      setOutreachStatus('error')
      setOutreachError(err.message)
    }
  }

  // ── Pipeline completo ─────────────────────────────────────────────────────

  const runFullPipeline = async () => {
    if (!empresa.trim() || !sector.trim() || !emailTo.trim()) return
    setPipelineRunning(true)
    await runAudit()
    // Outreach se habilita y el usuario lo ejecuta manualmente
    // (no podemos encadenar porque auditJson se setea en el scope del state)
    setPipelineRunning(false)
  }

  const canRunAudit    = empresa.trim() && sector.trim()
  const canRunOutreach = auditStatus === 'done' && auditJson && emailTo.trim()

  return (
    <div className="fade-in" style={{ padding: '28px 32px', maxWidth: 1000 }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: auditStatus === 'running' || outreachStatus === 'running' ? '#059669' : '#CBD5E1', animation: auditStatus === 'running' ? 'pulse 1.5s infinite' : 'none' }} />
          <span style={{ fontSize: 12, color: 'var(--h-muted)', fontWeight: 500 }}>
            {auditStatus === 'running' ? 'Auditando empresa...'
              : outreachStatus === 'running' ? 'Enviando email...'
              : auditStatus === 'done' ? `Auditoría completada · ${empresa}`
              : 'Listo para lanzar'}
          </span>
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.03em' }}>Pipeline de Agente IA</h1>
        <p style={{ color: 'var(--h-muted)', fontSize: 13, marginTop: 4 }}>
          6 módulos modulares — úsalos solos o en pipeline completo
        </p>
      </div>

      {/* Vista general de módulos */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 28, flexWrap: 'wrap' }}>
        {MODULES.map(m => (
          <ModulePill key={m.id} module={m}
            status={m.id === 'audit' ? auditStatus : m.id === 'outreach' ? outreachStatus : 'idle'}
          />
        ))}
      </div>

      {/* ── Input de empresa ── */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="section-title" style={{ marginBottom: 14 }}>Empresa objetivo</div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 200px' }}>
            <label style={{ fontSize: 11, fontWeight: 500, color: 'var(--h-muted)', display: 'block', marginBottom: 5 }}>EMPRESA *</label>
            <input className="input-field" placeholder="ej: Holded, Factorial HR, Cobee..."
              value={empresa} onChange={e => setEmpresa(e.target.value)}
              disabled={auditStatus === 'running'}
            />
          </div>
          <div style={{ flex: '1 1 200px' }}>
            <label style={{ fontSize: 11, fontWeight: 500, color: 'var(--h-muted)', display: 'block', marginBottom: 5 }}>SECTOR *</label>
            <input className="input-field" placeholder="ej: SaaS B2B, Agencia Marketing, Fintech..."
              value={sector} onChange={e => setSector(e.target.value)}
              disabled={auditStatus === 'running'}
            />
          </div>
          <div style={{ flex: '1 1 160px' }}>
            <label style={{ fontSize: 11, fontWeight: 500, color: 'var(--h-muted)', display: 'block', marginBottom: 5 }}>CONTACTO</label>
            <input className="input-field" placeholder="Nombre del decisor"
              value={contacto} onChange={e => setContacto(e.target.value)}
            />
          </div>
          <div style={{ flex: '1 1 200px' }}>
            <label style={{ fontSize: 11, fontWeight: 500, color: 'var(--h-muted)', display: 'block', marginBottom: 5 }}>EMAIL DESTINO *</label>
            <input className="input-field" placeholder="ceo@empresa.com" type="email"
              value={emailTo} onChange={e => setEmailTo(e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          {auditStatus !== 'idle' && (
            <button className="btn-ghost" onClick={resetAudit} style={{ fontSize: 12 }}>
              <RotateCcw size={12} />Nueva empresa
            </button>
          )}
          <button
            className="btn-primary"
            onClick={runAudit}
            disabled={!canRunAudit || auditStatus === 'running'}
            style={{ opacity: !canRunAudit ? 0.5 : 1 }}
          >
            {auditStatus === 'running'
              ? <><div className="spinner" />Auditando...</>
              : auditStatus === 'done'
              ? <><RotateCcw size={13} />Re-auditar</>
              : <><Search size={13} />Módulo 1 — Auditar empresa</>}
          </button>
          <button
            className="btn-secondary"
            onClick={runFullPipeline}
            disabled={!canRunAudit || !emailTo.trim() || auditStatus === 'running'}
            style={{ opacity: (!canRunAudit || !emailTo.trim()) ? 0.4 : 1, fontSize: 12 }}
          >
            <Zap size={13} />Pipeline completo
          </button>
        </div>
      </div>

      {/* ── MÓDULO 1: Resultado de auditoría ── */}
      {auditStatus !== 'idle' && (
        <div className="card fade-in" style={{ marginBottom: 20, padding: 0, overflow: 'hidden', border: `1.5px solid ${auditStatus === 'done' ? '#0D9488' : auditStatus === 'error' ? '#DC2626' : 'var(--h-border)'}` }}>

          {/* Card header */}
          <div style={{ padding: '12px 18px', background: auditStatus === 'done' ? '#F0FDF4' : auditStatus === 'error' ? '#FFF1F2' : 'var(--h-surface)', borderBottom: '1px solid var(--h-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ModuleTag num={1} color="#0D9488" />
              <span style={{ fontSize: 13, fontWeight: 600 }}>Auditoría — {empresa}</span>
              {auditStatus === 'running' && <div className="spinner" style={{ borderTopColor: '#0D9488', borderColor: '#e2e8f0' }} />}
              {auditStatus === 'done'    && <CheckCircle size={14} color="#059669" />}
              {auditStatus === 'error'   && <AlertCircle size={14} color="#DC2626" />}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {auditStatus === 'done' && auditJson && (
                <button
                  className="btn-secondary"
                  onClick={() => generateAuditPDF(empresa, auditJson)}
                  style={{ fontSize: 11, padding: '4px 10px' }}
                >
                  <Download size={11} />Exportar PDF
                </button>
              )}
              <button onClick={() => setAuditExpanded(v => !v)} style={{ color: 'var(--h-muted)', padding: 4 }}>
                {auditExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>
          </div>

          {auditExpanded && (
            <>
              {/* Texto de análisis */}
              <div
                ref={auditRef}
                style={{
                  padding: '16px 20px', maxHeight: 420, overflowY: 'auto',
                  fontSize: 13, lineHeight: 1.75, whiteSpace: 'pre-wrap',
                  color: 'var(--h-text)', background: 'white',
                }}
              >
                {auditText || (auditStatus === 'running' ? 'Analizando...' : '')}
                {auditStatus === 'running' && (
                  <span style={{ display: 'inline-block', width: 8, height: 14, background: '#0D9488', marginLeft: 2, borderRadius: 1, animation: 'pulse 1s infinite' }} />
                )}
              </div>

              {/* JSON estructurado */}
              {auditJson && (
                <div style={{ borderTop: '1px solid var(--h-border)', background: '#f8fafc' }}>
                  <AuditInsights audit={auditJson} />
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── MÓDULO 6: Email de outreach ── */}
      <ModuleCard
        num={6}
        icon={Mail}
        label="Email de outreach personalizado"
        color="#DC2626"
        locked={auditStatus !== 'done'}
        lockedMsg="Ejecuta el Módulo 1 primero para personalizar el email con los puntos de dolor"
      >
        {auditStatus === 'done' && (
          <OutreachPanel
            auditJson={auditJson}
            empresa={empresa}
            contacto={contacto}
            emailTo={emailTo}
            setEmailTo={setEmailTo}
            status={outreachStatus}
            result={outreachResult}
            error={outreachError}
            onSend={runOutreach}
            onReset={() => { setOutreachStatus('idle'); setOutreachResult(null); setOutreachError('') }}
          />
        )}
      </ModuleCard>

      {/* ── Módulos 2-5: Bloqueados ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12, marginTop: 12 }}>
        {MODULES.filter(m => !['audit', 'outreach'].includes(m.id)).map(m => (
          <ModuleCard key={m.id} num={m.num} icon={m.icon} label={m.label} color={m.color} locked={true} lockedMsg="Próximamente">
            <div style={{ fontSize: 12, color: 'var(--h-muted)' }}>{m.desc}</div>
          </ModuleCard>
        ))}
      </div>

    </div>
  )
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function ModulePill({ module, status }) {
  const isDone    = status === 'done'
  const isRunning = status === 'running'
  const isActive  = module.active

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500,
      background: isDone ? `${module.color}15` : isRunning ? `${module.color}20` : isActive ? 'var(--h-surface)' : '#f1f5f9',
      border: `1px solid ${isDone ? module.color : isRunning ? module.color : isActive ? 'var(--h-border)' : 'transparent'}`,
      color: isDone || isRunning ? module.color : isActive ? 'var(--h-text)' : 'var(--h-muted)',
      transition: 'all 0.2s',
    }}>
      {isDone    ? <CheckCircle size={10} />
        : isRunning ? <div className="spinner" style={{ width: 10, height: 10, borderWidth: 1.5, borderTopColor: module.color, borderColor: `${module.color}30` }} />
        : !isActive ? <Lock size={10} />
        : <module.icon size={10} />}
      M{module.num} {module.label}
    </div>
  )
}

function ModuleTag({ num, color }) {
  return (
    <div style={{ width: 22, height: 22, borderRadius: 6, background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <span style={{ fontSize: 10, fontWeight: 700, color }}>{num}</span>
    </div>
  )
}

function ModuleCard({ num, icon: Icon, label, color, locked, lockedMsg, children }) {
  return (
    <div className="card fade-in" style={{
      marginBottom: 12, padding: 0, overflow: 'hidden',
      border: `1.5px solid ${locked ? 'var(--h-border)' : color}`,
      opacity: locked && lockedMsg !== 'Próximamente' ? 0.85 : 1,
    }}>
      <div style={{ padding: '12px 18px', background: locked ? 'var(--h-surface)' : `${color}08`, borderBottom: locked ? 'none' : '1px solid var(--h-border)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <ModuleTag num={num} color={locked ? 'var(--h-muted)' : color} />
        <Icon size={14} color={locked ? 'var(--h-muted)' : color} />
        <span style={{ fontSize: 13, fontWeight: 600, color: locked ? 'var(--h-muted)' : 'var(--h-text)' }}>{label}</span>
        {locked && (
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--h-muted)' }}>
            <Lock size={11} />
            {lockedMsg === 'Próximamente' ? 'Próximamente' : 'Bloqueado'}
          </div>
        )}
      </div>

      {locked ? (
        <div style={{ padding: '12px 18px', fontSize: 12, color: 'var(--h-muted)', fontStyle: 'italic' }}>
          {lockedMsg}
        </div>
      ) : (
        <div style={{ padding: '16px 18px' }}>
          {children}
        </div>
      )}
    </div>
  )
}

function AuditInsights({ audit }) {
  const puntos  = audit.puntos_dolor || []
  const talento = audit.talento_buscado || []

  return (
    <div style={{ padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--h-muted)', letterSpacing: '0.06em' }}>RESUMEN ESTRUCTURADO</div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>

        {/* Puntos de dolor */}
        {puntos.length > 0 && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#DC2626', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
              <AlertCircle size={11} />PUNTOS DE DOLOR
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {puntos.map((p, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 7, background: 'white', borderRadius: 7, padding: '7px 10px', border: '1px solid var(--h-border)' }}>
                  <span style={{ fontSize: 10, fontWeight: 600, padding: '1px 5px', borderRadius: 4, background: urgencyBg[p.urgencia] || '#f1f5f9', color: urgencyColor[p.urgencia] || '#64748b', flexShrink: 0, marginTop: 1 }}>
                    {(p.urgencia || 'media').toUpperCase()}
                  </span>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600 }}>{p.area}</div>
                    <div style={{ fontSize: 11, color: 'var(--h-muted)', lineHeight: 1.4 }}>{p.problema}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Talento buscado */}
          {talento.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#0D9488', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                <Users size={11} />TALENTO QUE NECESITAN
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {talento.map((t, i) => (
                  <span key={i} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: '#F0FDF4', color: '#065F46', border: '1px solid #86EFAC', fontWeight: 500 }}>
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Oportunidad */}
          {audit.oportunidad && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#7C3AED', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                <Target size={11} />OPORTUNIDAD HUTRIT
              </div>
              <div style={{ fontSize: 12, color: 'var(--h-text)', background: 'white', borderRadius: 7, padding: '8px 10px', border: '1px solid var(--h-border)', lineHeight: 1.5 }}>
                {audit.oportunidad}
              </div>
            </div>
          )}

          {/* Ángulo de outreach */}
          {audit.angulo_outreach && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#DC2626', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                <Mail size={11} />ÁNGULO DE OUTREACH
              </div>
              <div style={{ fontSize: 12, color: 'var(--h-text)', background: '#FFF7F7', borderRadius: 7, padding: '8px 10px', border: '1px solid #FECACA', lineHeight: 1.5, fontStyle: 'italic' }}>
                "{audit.angulo_outreach}"
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function OutreachPanel({ auditJson, empresa, contacto, emailTo, setEmailTo, status, result, error, onSend, onReset }) {
  const [copied, setCopied] = useState(false)

  const copyId = () => {
    if (result?.id) { navigator.clipboard.writeText(result.id).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 2000) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Preview de lo que se enviará */}
      {auditJson && (
        <div style={{ background: 'var(--h-surface)', borderRadius: 8, padding: '12px 14px', fontSize: 12, color: 'var(--h-muted)', lineHeight: 1.6 }}>
          <div style={{ fontWeight: 600, color: 'var(--h-text)', marginBottom: 6, fontSize: 13 }}>El email incluirá:</div>
          <ul style={{ margin: 0, paddingLeft: 16 }}>
            <li>Hook personalizado: <em>"{auditJson.angulo_outreach}"</em></li>
            <li>Propuesta específica para los {(auditJson.puntos_dolor || []).length} puntos de dolor detectados</li>
            <li>Perfiles disponibles: {(auditJson.talento_buscado || []).join(', ') || 'talento LATAM validado'}</li>
            <li>Diseño HTML con branding Hutrit + tabla de oportunidades</li>
          </ul>
        </div>
      )}

      {/* Inputs */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 180px' }}>
          <label style={{ fontSize: 11, fontWeight: 500, color: 'var(--h-muted)', display: 'block', marginBottom: 5 }}>EMAIL DESTINO *</label>
          <input
            className="input-field"
            placeholder="ceo@empresa.com"
            type="email"
            value={emailTo}
            onChange={e => setEmailTo(e.target.value)}
            disabled={status === 'running' || status === 'done'}
          />
        </div>
      </div>

      {/* Botón */}
      {status !== 'done' && (
        <button
          className="btn-primary"
          onClick={onSend}
          disabled={status === 'running' || !emailTo.trim()}
          style={{ alignSelf: 'flex-start', background: '#DC2626', opacity: !emailTo.trim() ? 0.5 : 1 }}
        >
          {status === 'running'
            ? <><div className="spinner" />Generando y enviando...</>
            : <><Mail size={13} />Módulo 6 — Enviar email de outreach</>}
        </button>
      )}

      {/* Resultado */}
      {status === 'done' && result && (
        <div className="fade-in" style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 10, padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <CheckCircle size={16} color="#059669" />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#065F46' }}>Email enviado a {result.emailTo}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 10 }}>
            <div style={{ fontSize: 12, color: 'var(--h-text)' }}>
              <span style={{ fontWeight: 500 }}>Asunto: </span>{result.subject}
            </div>
            {result.preview && (
              <div style={{ fontSize: 12, color: 'var(--h-muted)', fontStyle: 'italic', lineHeight: 1.5 }}>
                "{result.preview}..."
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: 'var(--h-muted)', fontFamily: 'var(--font-mono)' }}>ID: {result.id}</span>
            <button className="btn-ghost" onClick={copyId} style={{ fontSize: 11, padding: '3px 8px' }}>
              {copied ? <><Check size={10} />Copiado</> : <><Copy size={10} />Copiar ID</>}
            </button>
            <button className="btn-ghost" onClick={onReset} style={{ fontSize: 11, padding: '3px 8px', marginLeft: 'auto' }}>
              <RotateCcw size={10} />Reenviar
            </button>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="fade-in" style={{ background: '#FFF1F2', border: '1px solid #FDA4AF', borderRadius: 10, padding: '12px 16px', display: 'flex', gap: 8 }}>
          <AlertCircle size={14} color="#DC2626" style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#9F1239' }}>Error al enviar</div>
            <div style={{ fontSize: 12, color: '#DC2626', marginTop: 2 }}>{error}</div>
            <button className="btn-ghost" onClick={onReset} style={{ fontSize: 11, marginTop: 8 }}>
              <RotateCcw size={10} />Reintentar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
