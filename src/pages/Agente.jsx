import { useState, useRef, useEffect } from 'react'
import {
  Search, Mail, Calendar, Image, Send, FileText, Zap,
  CheckCircle, AlertCircle, Lock, ChevronDown, ChevronUp,
  Play, RotateCcw, Copy, Check, Link, Camera,
  Users, Target, Download, Wand2, ExternalLink
} from 'lucide-react'
import { generateAuditPDF } from '../utils/generatePDF'

// ─── Definición de módulos ────────────────────────────────────────────────────

const MODULES = [
  { id: 'audit',     num: 1, icon: Search,   label: 'Auditar empresa',     color: '#0D9488' },
  { id: 'calendar',  num: 2, icon: Calendar,  label: 'Crear calendario',    color: '#7C3AED' },
  { id: 'creatives', num: 3, icon: Image,     label: 'Generar creativos',   color: '#D97706' },
  { id: 'publish',   num: 4, icon: Send,      label: 'Publicar contenido',  color: '#E1306C' },
  { id: 'pdf',       num: 5, icon: FileText,  label: 'Exportar PDF',        color: '#059669' },
  { id: 'outreach',  num: 6, icon: Mail,      label: 'Email de outreach',   color: '#DC2626' },
]

// ─── Utilidades ───────────────────────────────────────────────────────────────

const urgencyColor = { alta: '#DC2626', media: '#D97706', baja: '#059669' }
const urgencyBg    = { alta: '#FEE2E2', media: '#FEF3C7', baja: '#D1FAE5' }

// ─── Componente principal ─────────────────────────────────────────────────────

export default function Agente() {
  // Inputs
  const [empresa,  setEmpresa]  = useState('')
  const [sector,   setSector]   = useState('')
  const [contacto, setContacto] = useState('')
  const [emailTo,  setEmailTo]  = useState('')

  // M1 — Auditoría
  const [auditStatus,   setAuditStatus]   = useState('idle')
  const [auditText,     setAuditText]     = useState('')
  const [auditJson,     setAuditJson]     = useState(null)
  const [auditExpanded, setAuditExpanded] = useState(true)
  const auditRef = useRef(null)

  // M2 — Calendario
  const [calStatus,  setCalStatus]  = useState('idle')
  const [calData,    setCalData]    = useState(null)
  const [calError,   setCalError]   = useState('')

  // M3 — Creativos
  const [creativeStatus, setCreativeStatus] = useState('idle')
  const [creativeImage,  setCreativeImage]  = useState(null) // { base64, mimeType }
  const [creativeError,  setCreativeError]  = useState('')

  // M4 — Publicar
  const [publishIG,  setPublishIG]  = useState('idle') // idle|running|done|error
  const [publishLI,  setPublishLI]  = useState('idle')
  const [publishCaption, setPublishCaption] = useState('')

  // M6 — Outreach
  const [outreachStatus, setOutreachStatus] = useState('idle')
  const [outreachResult, setOutreachResult] = useState(null)
  const [outreachError,  setOutreachError]  = useState('')

  useEffect(() => {
    if (auditStatus === 'running' && auditRef.current) {
      auditRef.current.scrollTop = auditRef.current.scrollHeight
    }
  }, [auditText, auditStatus])

  // Status por módulo para los pills
  const modStatus = {
    audit:     auditStatus,
    calendar:  calStatus,
    creatives: creativeStatus,
    publish:   (publishIG === 'done' || publishLI === 'done') ? 'done' : (publishIG === 'running' || publishLI === 'running') ? 'running' : 'idle',
    pdf:       auditStatus === 'done' && auditJson ? 'done' : 'idle',
    outreach:  outreachStatus,
  }

  // ── M1: Auditoría ─────────────────────────────────────────────────────────

  const runAudit = async () => {
    if (!empresa.trim() || !sector.trim()) return
    setAuditStatus('running'); setAuditText(''); setAuditJson(null); setAuditExpanded(true)

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
            if (data.text) setAuditText(prev => prev + data.text)
            if (data.done) {
              if (data.error) { setAuditStatus('error'); setAuditText(p => p + `\n\n⚠️ ${data.error}`) }
              else { setAuditStatus('done'); if (data.audit) setAuditJson(data.audit) }
            }
          } catch {}
        }
      }
    } catch (err) {
      setAuditStatus('error'); setAuditText(p => p + `\n\n⚠️ ${err.message}`)
    }
  }

  const resetAll = () => {
    setAuditStatus('idle');   setAuditText('');    setAuditJson(null)
    setCalStatus('idle');     setCalData(null);    setCalError('')
    setCreativeStatus('idle');setCreativeImage(null); setCreativeError('')
    setPublishIG('idle');     setPublishLI('idle'); setPublishCaption('')
    setOutreachStatus('idle');setOutreachResult(null); setOutreachError('')
  }

  // ── M2: Calendario ───────────────────────────────────────────────────────

  const runCalendar = async () => {
    setCalStatus('running'); setCalData(null); setCalError('')
    try {
      const resp = await fetch('/api/generate-calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sector: sector.trim() || 'HR Tech / SaaS', semanas: 2, foco: 'ambos' }),
      })
      const data = await resp.json()
      if (data.success) { setCalStatus('done'); setCalData(data.calendar) }
      else              { setCalStatus('error'); setCalError(data.error || 'Error generando calendario') }
    } catch (err) {
      setCalStatus('error'); setCalError(err.message)
    }
  }

  // ── M3: Creativos ────────────────────────────────────────────────────────

  const runCreative = async () => {
    if (!auditJson) return
    setCreativeStatus('running'); setCreativeImage(null); setCreativeError('')

    const painPoint = (auditJson.puntos_dolor || [])[0]
    const prompt = painPoint
      ? `Professional scene showing ${empresa} team solving ${painPoint.area} challenges with remote LATAM talent, modern collaborative workspace`
      : `Professional LATAM talent working remotely for European company ${empresa}, modern and aspirational workspace`

    try {
      const resp = await fetch('/api/generate-creative', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, style: 'profesional' }),
      })
      const data = await resp.json()
      if (data.success) {
        setCreativeStatus('done')
        setCreativeImage({ base64: data.imageBase64, mimeType: data.mimeType })
        // Sugerir caption
        const talento = (auditJson.talento_buscado || []).slice(0, 2).join(', ')
        setPublishCaption(`¿Sabías que empresas como ${empresa} ya cuentan con talento LATAM remoto? 🌎\n\n${auditJson.angulo_outreach || 'Conectamos talento verificado con empresas europeas en 48h.'}\n\nTalento: ${talento || 'Tech · Marketing · Ventas'}\n\n#Hutrit #TalentoLATAM #RemoteWork #Europa`)
      } else {
        setCreativeStatus('error'); setCreativeError(data.error || 'Error generando imagen')
      }
    } catch (err) {
      setCreativeStatus('error'); setCreativeError(err.message)
    }
  }

  const downloadCreative = () => {
    if (!creativeImage) return
    const a = document.createElement('a')
    a.href = `data:${creativeImage.mimeType};base64,${creativeImage.base64}`
    a.download = `hutrit-${empresa.toLowerCase().replace(/\s/g, '-')}-${Date.now()}.png`
    a.click()
  }

  // ── M4: Publicar ─────────────────────────────────────────────────────────

  const publishToInstagram = async () => {
    if (!creativeImage || !publishCaption.trim()) return
    setPublishIG('running')
    // Instagram requiere URL pública — usamos data URI con la API solo si hay URL; aquí indicamos al usuario
    setPublishIG('error') // No podemos publicar base64 directamente — necesita URL pública
  }

  const publishToLinkedIn = async () => {
    if (!publishCaption.trim()) return
    setPublishLI('running')
    try {
      const resp = await fetch('/api/publish-linkedin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: publishCaption.trim() }),
      })
      const data = await resp.json()
      if (data.success) setPublishLI('done')
      else { setPublishLI('error') }
    } catch {
      setPublishLI('error')
    }
  }

  // ── M6: Outreach ─────────────────────────────────────────────────────────

  const runOutreach = async () => {
    if (!emailTo.trim() || !auditJson) return
    setOutreachStatus('running'); setOutreachResult(null); setOutreachError('')
    try {
      const resp = await fetch('/api/send-outreach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ empresa: empresa.trim(), contacto: contacto.trim(), emailTo: emailTo.trim(), auditoria: auditJson }),
      })
      const data = await resp.json()
      if (data.success) { setOutreachStatus('done'); setOutreachResult(data) }
      else { setOutreachStatus('error'); setOutreachError(data.error || 'Error desconocido') }
    } catch (err) {
      setOutreachStatus('error'); setOutreachError(err.message)
    }
  }

  const canRunAudit = empresa.trim() && sector.trim()
  const auditDone   = auditStatus === 'done'

  return (
    <div className="fade-in" style={{ padding: '28px 32px', maxWidth: 1000 }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: Object.values(modStatus).some(s => s === 'running') ? '#059669' : '#CBD5E1', animation: Object.values(modStatus).some(s => s === 'running') ? 'pulse 1.5s infinite' : 'none' }} />
          <span style={{ fontSize: 12, color: 'var(--h-muted)', fontWeight: 500 }}>
            {auditStatus === 'running' ? `Auditando ${empresa}...` : auditDone ? `Pipeline activo · ${empresa}` : 'Listo para lanzar'}
          </span>
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.03em' }}>Pipeline de Agente IA</h1>
        <p style={{ color: 'var(--h-muted)', fontSize: 13, marginTop: 4 }}>6 módulos — úsalos solos o en secuencia completa</p>
      </div>

      {/* Pills de estado */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 28, flexWrap: 'wrap' }}>
        {MODULES.map(m => <ModulePill key={m.id} module={m} status={modStatus[m.id]} />)}
      </div>

      {/* ── Inputs ── */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="section-title" style={{ marginBottom: 14 }}>Empresa objetivo</div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 200px' }}>
            <label style={{ fontSize: 11, fontWeight: 500, color: 'var(--h-muted)', display: 'block', marginBottom: 5 }}>EMPRESA *</label>
            <input className="input-field" placeholder="ej: Holded, Factorial HR..." value={empresa} onChange={e => setEmpresa(e.target.value)} disabled={auditStatus === 'running'} />
          </div>
          <div style={{ flex: '1 1 200px' }}>
            <label style={{ fontSize: 11, fontWeight: 500, color: 'var(--h-muted)', display: 'block', marginBottom: 5 }}>SECTOR *</label>
            <input className="input-field" placeholder="ej: SaaS B2B, Fintech..." value={sector} onChange={e => setSector(e.target.value)} disabled={auditStatus === 'running'} />
          </div>
          <div style={{ flex: '1 1 160px' }}>
            <label style={{ fontSize: 11, fontWeight: 500, color: 'var(--h-muted)', display: 'block', marginBottom: 5 }}>CONTACTO</label>
            <input className="input-field" placeholder="Nombre del decisor" value={contacto} onChange={e => setContacto(e.target.value)} />
          </div>
          <div style={{ flex: '1 1 200px' }}>
            <label style={{ fontSize: 11, fontWeight: 500, color: 'var(--h-muted)', display: 'block', marginBottom: 5 }}>EMAIL DESTINO</label>
            <input className="input-field" placeholder="ceo@empresa.com" type="email" value={emailTo} onChange={e => setEmailTo(e.target.value)} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          {auditStatus !== 'idle' && (
            <button className="btn-ghost" onClick={resetAll} style={{ fontSize: 12 }}><RotateCcw size={12} />Nueva empresa</button>
          )}
          <button className="btn-primary" onClick={runAudit} disabled={!canRunAudit || auditStatus === 'running'} style={{ opacity: !canRunAudit ? 0.5 : 1 }}>
            {auditStatus === 'running' ? <><div className="spinner" />Auditando...</> : auditDone ? <><RotateCcw size={13} />Re-auditar</> : <><Search size={13} />M1 — Auditar empresa</>}
          </button>
        </div>
      </div>

      {/* ── M1: Resultado auditoría ── */}
      {auditStatus !== 'idle' && (
        <div className="card fade-in" style={{ marginBottom: 16, padding: 0, overflow: 'hidden', border: `1.5px solid ${auditStatus === 'done' ? '#0D9488' : auditStatus === 'error' ? '#DC2626' : 'var(--h-border)'}` }}>
          <div style={{ padding: '12px 18px', background: auditStatus === 'done' ? '#F0FDF4' : auditStatus === 'error' ? '#FFF1F2' : 'var(--h-surface)', borderBottom: '1px solid var(--h-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ModuleTag num={1} color="#0D9488" />
              <span style={{ fontSize: 13, fontWeight: 600 }}>Auditoría — {empresa}</span>
              {auditStatus === 'running' && <div className="spinner" style={{ borderTopColor: '#0D9488', borderColor: '#e2e8f0' }} />}
              {auditStatus === 'done'    && <CheckCircle size={14} color="#059669" />}
              {auditStatus === 'error'   && <AlertCircle size={14} color="#DC2626" />}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {auditDone && auditJson && (
                <button className="btn-secondary" onClick={() => generateAuditPDF(empresa, auditJson)} style={{ fontSize: 11, padding: '4px 10px' }}>
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
              <div ref={auditRef} style={{ padding: '16px 20px', maxHeight: 380, overflowY: 'auto', fontSize: 13, lineHeight: 1.75, whiteSpace: 'pre-wrap', color: 'var(--h-text)', background: 'white' }}>
                {auditText || (auditStatus === 'running' ? 'Analizando...' : '')}
                {auditStatus === 'running' && <span style={{ display: 'inline-block', width: 8, height: 14, background: '#0D9488', marginLeft: 2, borderRadius: 1, animation: 'pulse 1s infinite' }} />}
              </div>
              {auditJson && (
                <div style={{ borderTop: '1px solid var(--h-border)', background: '#f8fafc' }}>
                  <AuditInsights audit={auditJson} />
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── M2: Calendario ── */}
      <ModuleCard num={2} icon={Calendar} label="Crear calendario editorial" color="#7C3AED" locked={!auditDone} lockedMsg="Ejecuta el Módulo 1 primero">
        {auditDone && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 12, color: 'var(--h-muted)' }}>
              Genera 2 semanas de contenido LinkedIn + Instagram contextualizado con el sector <strong>{sector}</strong>.
            </div>
            {calStatus !== 'done' && (
              <button className="btn-primary" onClick={runCalendar} disabled={calStatus === 'running'} style={{ alignSelf: 'flex-start', background: '#7C3AED', opacity: calStatus === 'running' ? 0.7 : 1 }}>
                {calStatus === 'running' ? <><div className="spinner" />Generando...</> : <><Calendar size={13} />M2 — Generar calendario</>}
              </button>
            )}
            {calStatus === 'error' && <div style={{ fontSize: 12, color: '#DC2626' }}>{calError}</div>}
            {calStatus === 'done' && calData && (
              <div className="fade-in" style={{ overflowX: 'auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <CheckCircle size={14} color="#059669" />
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#065F46' }}>{calData.length} publicaciones generadas</span>
                  <button className="btn-ghost" onClick={runCalendar} style={{ fontSize: 11, marginLeft: 'auto' }}><RotateCcw size={10} />Regenerar</button>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: 'var(--h-surface)' }}>
                      {['Día', 'Canal', 'Tipo', 'Título', 'CTA'].map(h => (
                        <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 10, fontWeight: 600, color: 'var(--h-muted)', borderBottom: '1px solid var(--h-border)', whiteSpace: 'nowrap' }}>{h.toUpperCase()}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {calData.slice(0, 8).map((p, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--h-border)', background: i % 2 === 0 ? 'white' : 'var(--h-surface)' }}>
                        <td style={{ padding: '8px 12px', whiteSpace: 'nowrap', fontWeight: 600 }}>{p.dia}</td>
                        <td style={{ padding: '8px 12px' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: p.canal === 'LinkedIn' ? '#0A66C2' : '#E1306C', fontWeight: 500 }}>
                            {p.canal === 'LinkedIn' ? <Link size={10} /> : <Camera size={10} />}{p.canal}
                          </span>
                        </td>
                        <td style={{ padding: '8px 12px' }}><span className="tag" style={{ fontSize: 10 }}>{p.tipo}</span></td>
                        <td style={{ padding: '8px 12px', maxWidth: 200 }}>{p.titulo}</td>
                        <td style={{ padding: '8px 12px', maxWidth: 160, color: 'var(--h-muted)', fontSize: 11 }}>{p.cta}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {calData.length > 8 && (
                  <div style={{ fontSize: 11, color: 'var(--h-muted)', padding: '8px 12px' }}>+ {calData.length - 8} publicaciones más — ve a Marketing para verlas todas</div>
                )}
              </div>
            )}
          </div>
        )}
      </ModuleCard>

      {/* ── M3: Creativos ── */}
      <ModuleCard num={3} icon={Image} label="Generar creativos con IA" color="#D97706" locked={!auditDone} lockedMsg="Ejecuta el Módulo 1 primero">
        {auditDone && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 12, color: 'var(--h-muted)' }}>
              Genera una imagen con Gemini AI contextualizada con los puntos de dolor de <strong>{empresa}</strong>.
            </div>
            {creativeStatus !== 'done' && (
              <button className="btn-primary" onClick={runCreative} disabled={creativeStatus === 'running'} style={{ alignSelf: 'flex-start', background: '#D97706', opacity: creativeStatus === 'running' ? 0.7 : 1 }}>
                {creativeStatus === 'running' ? <><div className="spinner" />Generando imagen...</> : <><Wand2 size={13} />M3 — Generar creativo</>}
              </button>
            )}
            {creativeStatus === 'running' && (
              <div style={{ fontSize: 12, color: 'var(--h-muted)' }}>Generando con Gemini AI... puede tardar 15-30 segundos</div>
            )}
            {creativeStatus === 'error' && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <AlertCircle size={14} color="#DC2626" style={{ flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 12, color: '#DC2626' }}>{creativeError}</div>
                  <button className="btn-ghost" onClick={() => setCreativeStatus('idle')} style={{ fontSize: 11, marginTop: 6 }}>Reintentar</button>
                </div>
              </div>
            )}
            {creativeStatus === 'done' && creativeImage && (
              <div className="fade-in" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, alignItems: 'flex-start' }}>
                <div>
                  <img src={`data:${creativeImage.mimeType};base64,${creativeImage.base64}`} alt="Creativo" style={{ width: '100%', borderRadius: 10, border: '1px solid var(--h-border)' }} />
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <button className="btn-primary" onClick={downloadCreative} style={{ flex: 1, justifyContent: 'center', fontSize: 12, background: '#D97706' }}><Download size={12} />Descargar</button>
                    <button className="btn-ghost" onClick={() => { setCreativeStatus('idle'); setCreativeImage(null) }} style={{ fontSize: 12 }}>Regenerar</button>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: 'var(--h-muted)' }}>
                  <div style={{ fontWeight: 500, color: 'var(--h-text)', marginBottom: 6 }}>Caption sugerido para M4:</div>
                  <div style={{ background: 'var(--h-surface)', borderRadius: 8, padding: '10px 12px', fontSize: 12, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{publishCaption}</div>
                </div>
              </div>
            )}
          </div>
        )}
      </ModuleCard>

      {/* ── M4: Publicar ── */}
      <ModuleCard num={4} icon={Send} label="Publicar en redes sociales" color="#E1306C" locked={!auditDone} lockedMsg="Ejecuta el Módulo 1 primero">
        {auditDone && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 500, color: 'var(--h-muted)', display: 'block', marginBottom: 5 }}>CAPTION / TEXTO DEL POST</label>
              <textarea
                className="input-field"
                placeholder="Escribe el texto del post o genera un creativo en M3 para auto-rellenar..."
                value={publishCaption}
                onChange={e => setPublishCaption(e.target.value)}
                rows={4}
                style={{ resize: 'vertical' }}
              />
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {/* Instagram — requiere URL pública */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, minWidth: 200 }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: '#E1306C', display: 'flex', alignItems: 'center', gap: 5 }}><Camera size={13} />Instagram</div>
                {creativeStatus === 'done'
                  ? <div style={{ fontSize: 11, color: 'var(--h-muted)', background: '#FFF7F0', border: '1px solid #FED7AA', borderRadius: 7, padding: '8px 10px' }}>
                      Instagram requiere URL pública. Descarga el creativo (M3), súbelo a Imgur o similar y usa el publicador de Marketing.
                    </div>
                  : <div style={{ fontSize: 11, color: 'var(--h-muted)' }}>Genera un creativo en M3 primero.</div>
                }
              </div>

              {/* LinkedIn */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, minWidth: 200 }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: '#0A66C2', display: 'flex', alignItems: 'center', gap: 5 }}><Link size={13} />LinkedIn</div>
                <button
                  className="btn-primary"
                  onClick={publishToLinkedIn}
                  disabled={publishLI === 'running' || !publishCaption.trim()}
                  style={{ alignSelf: 'flex-start', background: '#0A66C2', opacity: !publishCaption.trim() ? 0.5 : 1, fontSize: 12 }}
                >
                  {publishLI === 'running' ? <><div className="spinner" />Publicando...</> : <><Send size={12} />Publicar en LinkedIn</>}
                </button>
                {publishLI === 'done' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#065F46' }}>
                    <CheckCircle size={13} color="#059669" />Publicado en LinkedIn
                  </div>
                )}
                {publishLI === 'error' && (
                  <div style={{ fontSize: 12, color: '#DC2626' }}>Error — revisa el webhook de Make</div>
                )}
              </div>
            </div>
          </div>
        )}
      </ModuleCard>

      {/* ── M5: PDF ── */}
      <ModuleCard num={5} icon={FileText} label="Exportar informe PDF" color="#059669" locked={!auditDone || !auditJson} lockedMsg="Ejecuta el Módulo 1 primero">
        {auditDone && auditJson && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 12, color: 'var(--h-muted)' }}>
              Genera un informe PDF de 3 páginas con branding Hutrit: portada, análisis completo y recomendaciones.
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="btn-primary" onClick={() => generateAuditPDF(empresa, auditJson)} style={{ background: '#059669' }}>
                <Download size={13} />M5 — Exportar informe PDF
              </button>
            </div>
            <div style={{ fontSize: 11, color: 'var(--h-muted)' }}>
              Incluye: presencia digital · {(auditJson.puntos_dolor || []).length} puntos de dolor · talento recomendado · ángulo de outreach
            </div>
          </div>
        )}
      </ModuleCard>

      {/* ── M6: Outreach ── */}
      <ModuleCard num={6} icon={Mail} label="Email de outreach personalizado" color="#DC2626" locked={!auditDone} lockedMsg="Ejecuta el Módulo 1 primero">
        {auditDone && (
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

    </div>
  )
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function ModulePill({ module, status }) {
  const isDone    = status === 'done'
  const isRunning = status === 'running'

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500,
      background: isDone ? `${module.color}15` : isRunning ? `${module.color}20` : 'var(--h-surface)',
      border: `1px solid ${isDone || isRunning ? module.color : 'var(--h-border)'}`,
      color: isDone || isRunning ? module.color : 'var(--h-text)',
      transition: 'all 0.2s',
    }}>
      {isDone    ? <CheckCircle size={10} />
        : isRunning ? <div className="spinner" style={{ width: 10, height: 10, borderWidth: 1.5, borderTopColor: module.color, borderColor: `${module.color}30` }} />
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
    }}>
      <div style={{ padding: '12px 18px', background: locked ? 'var(--h-surface)' : `${color}08`, borderBottom: locked ? 'none' : '1px solid var(--h-border)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <ModuleTag num={num} color={locked ? 'var(--h-muted)' : color} />
        <Icon size={14} color={locked ? 'var(--h-muted)' : color} />
        <span style={{ fontSize: 13, fontWeight: 600, color: locked ? 'var(--h-muted)' : 'var(--h-text)' }}>{label}</span>
        {locked && (
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--h-muted)' }}>
            <Lock size={11} />Bloqueado
          </div>
        )}
      </div>
      {locked ? (
        <div style={{ padding: '10px 18px', fontSize: 12, color: 'var(--h-muted)', fontStyle: 'italic' }}>{lockedMsg}</div>
      ) : (
        <div style={{ padding: '16px 18px' }}>{children}</div>
      )}
    </div>
  )
}

function AuditInsights({ audit }) {
  const puntos  = audit.puntos_dolor  || []
  const talento = audit.talento_buscado || []

  return (
    <div style={{ padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--h-muted)', letterSpacing: '0.06em' }}>RESUMEN ESTRUCTURADO</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
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
          {talento.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#0D9488', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                <Users size={11} />TALENTO QUE NECESITAN
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {talento.map((t, i) => (
                  <span key={i} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: '#F0FDF4', color: '#065F46', border: '1px solid #86EFAC', fontWeight: 500 }}>{t}</span>
                ))}
              </div>
            </div>
          )}
          {audit.oportunidad && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#7C3AED', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                <Target size={11} />OPORTUNIDAD HUTRIT
              </div>
              <div style={{ fontSize: 12, color: 'var(--h-text)', background: 'white', borderRadius: 7, padding: '8px 10px', border: '1px solid var(--h-border)', lineHeight: 1.5 }}>{audit.oportunidad}</div>
            </div>
          )}
          {audit.angulo_outreach && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#DC2626', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                <Mail size={11} />ÁNGULO DE OUTREACH
              </div>
              <div style={{ fontSize: 12, color: 'var(--h-text)', background: '#FFF7F7', borderRadius: 7, padding: '8px 10px', border: '1px solid #FECACA', lineHeight: 1.5, fontStyle: 'italic' }}>"{audit.angulo_outreach}"</div>
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
      {auditJson && (
        <div style={{ background: 'var(--h-surface)', borderRadius: 8, padding: '12px 14px', fontSize: 12, color: 'var(--h-muted)', lineHeight: 1.6 }}>
          <div style={{ fontWeight: 600, color: 'var(--h-text)', marginBottom: 6, fontSize: 13 }}>El email incluirá:</div>
          <ul style={{ margin: 0, paddingLeft: 16 }}>
            <li>Hook: <em>"{auditJson.angulo_outreach}"</em></li>
            <li>{(auditJson.puntos_dolor || []).length} puntos de dolor detectados</li>
            <li>Perfiles: {(auditJson.talento_buscado || []).join(', ') || 'talento LATAM validado'}</li>
            <li>Diseño HTML con branding Hutrit</li>
          </ul>
        </div>
      )}
      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: 11, fontWeight: 500, color: 'var(--h-muted)', display: 'block', marginBottom: 5 }}>EMAIL DESTINO *</label>
          <input className="input-field" placeholder="ceo@empresa.com" type="email" value={emailTo} onChange={e => setEmailTo(e.target.value)} disabled={status === 'running' || status === 'done'} />
        </div>
      </div>
      {status !== 'done' && (
        <button className="btn-primary" onClick={onSend} disabled={status === 'running' || !emailTo.trim()} style={{ alignSelf: 'flex-start', background: '#DC2626', opacity: !emailTo.trim() ? 0.5 : 1 }}>
          {status === 'running' ? <><div className="spinner" />Generando y enviando...</> : <><Mail size={13} />M6 — Enviar email de outreach</>}
        </button>
      )}
      {status === 'done' && result && (
        <div className="fade-in" style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 10, padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <CheckCircle size={16} color="#059669" />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#065F46' }}>Email enviado a {result.emailTo}</span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--h-text)', marginBottom: 4 }}><span style={{ fontWeight: 500 }}>Asunto: </span>{result.subject}</div>
          {result.preview && <div style={{ fontSize: 12, color: 'var(--h-muted)', fontStyle: 'italic', marginBottom: 10 }}>"{result.preview}..."</div>}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: 'var(--h-muted)', fontFamily: 'var(--font-mono)' }}>ID: {result.id}</span>
            <button className="btn-ghost" onClick={copyId} style={{ fontSize: 11, padding: '3px 8px' }}>
              {copied ? <><Check size={10} />Copiado</> : <><Copy size={10} />Copiar ID</>}
            </button>
            <button className="btn-ghost" onClick={onReset} style={{ fontSize: 11, padding: '3px 8px', marginLeft: 'auto' }}><RotateCcw size={10} />Reenviar</button>
          </div>
        </div>
      )}
      {status === 'error' && (
        <div className="fade-in" style={{ background: '#FFF1F2', border: '1px solid #FDA4AF', borderRadius: 10, padding: '12px 16px', display: 'flex', gap: 8 }}>
          <AlertCircle size={14} color="#DC2626" style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#9F1239' }}>Error al enviar</div>
            <div style={{ fontSize: 12, color: '#DC2626', marginTop: 2 }}>{error}</div>
            <button className="btn-ghost" onClick={onReset} style={{ fontSize: 11, marginTop: 8 }}><RotateCcw size={10} />Reintentar</button>
          </div>
        </div>
      )}
    </div>
  )
}
