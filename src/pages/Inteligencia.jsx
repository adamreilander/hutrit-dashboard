import { useState } from 'react'
import { Search, ExternalLink, TrendingUp, AlertTriangle, Zap, Download, AlertCircle, CheckCircle, Users, Target, Mail, RotateCcw } from 'lucide-react'
import { generateIntelPDF } from '../utils/generatePDF'

const COMPETITORS = [
  { name: 'TalentHub Pro',    url: 'talenthubpro.com', score: 8.2, ads: true,  pixel: true,  hiring: true,  sector: 'HR Tech',   threat: 'alta' },
  { name: 'RecruitFlow',      url: 'recruitflow.io',   score: 6.4, ads: true,  pixel: false, hiring: false, sector: 'ATS',       threat: 'media' },
  { name: 'WorkBridge EU',    url: 'workbridge.eu',    score: 7.1, ads: false, pixel: true,  hiring: true,  sector: 'Staffing',  threat: 'media' },
  { name: 'Staffify',         url: 'staffify.com',     score: 4.3, ads: false, pixel: false, hiring: false, sector: 'HR',        threat: 'baja' },
  { name: 'TalentOS',         url: 'talentos.io',      score: 9.1, ads: true,  pixel: true,  hiring: true,  sector: 'HR Tech',   threat: 'crítica' },
  { name: 'ConnectRecruit',   url: 'connectrecruit.es',score: 5.8, ads: true,  pixel: false, hiring: true,  sector: 'Staffing',  threat: 'media' },
]

const TRENDS = [
  { keyword: 'software selección personal', vol: '4.4K', trend: '+34%', opp: 'alta' },
  { keyword: 'ATS pequeña empresa',         vol: '2.9K', trend: '+28%', opp: 'alta' },
  { keyword: 'contratar talento europa',    vol: '1.8K', trend: '+61%', opp: 'muy alta' },
  { keyword: 'plataforma reclutamiento IA', vol: '3.2K', trend: '+89%', opp: 'muy alta' },
  { keyword: 'headhunter digital startup',  vol: '1.1K', trend: '+17%', opp: 'media' },
]

const threatColor = { 'crítica': '#DC2626', 'alta': '#D97706', 'media': '#0D9488', 'baja': '#059669' }
const threatBg    = { 'crítica': '#FEE2E2', 'alta': '#FEF3C7', 'media': '#CCFBF1', 'baja': '#D1FAE5' }
const urgencyColor = { alta: '#DC2626', media: '#D97706', baja: '#059669' }
const urgencyBg    = { alta: '#FEE2E2', media: '#FEF3C7', baja: '#D1FAE5' }

function PainDetector() {
  const [empresa,  setEmpresa]  = useState('')
  const [sector,   setSector]   = useState('')
  const [status,   setStatus]   = useState('idle') // idle | running | done | error
  const [auditText, setAuditText] = useState('')
  const [auditJson, setAuditJson] = useState(null)
  const [error,    setError]    = useState('')

  const run = async () => {
    if (!empresa.trim() || !sector.trim()) return
    setStatus('running'); setAuditText(''); setAuditJson(null); setError('')

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
            if (data.done) {
              if (data.error) { setStatus('error'); setError(data.error) }
              else { setStatus('done'); if (data.audit) setAuditJson(data.audit) }
            }
          } catch {}
        }
      }
    } catch (err) {
      setStatus('error'); setError(err.message)
    }
  }

  const reset = () => { setStatus('idle'); setAuditText(''); setAuditJson(null); setError('') }

  return (
    <div className="card fade-in" style={{ marginTop: 24, border: '1.5px solid var(--h-border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: '#DC262615', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <AlertCircle size={14} color="#DC2626" />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>Detectar puntos de dolor de una empresa</div>
          <div style={{ fontSize: 11, color: 'var(--h-muted)' }}>Análisis IA — presencia digital, hiring signals y oportunidad Hutrit</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <input
          className="input-field"
          placeholder="Nombre de la empresa"
          value={empresa}
          onChange={e => setEmpresa(e.target.value)}
          disabled={status === 'running'}
          style={{ flex: '1 1 180px' }}
        />
        <input
          className="input-field"
          placeholder="Sector (ej: SaaS B2B, Fintech...)"
          value={sector}
          onChange={e => setSector(e.target.value)}
          disabled={status === 'running'}
          style={{ flex: '1 1 180px' }}
        />
        {status !== 'idle' && (
          <button className="btn-ghost" onClick={reset} style={{ fontSize: 12 }}>
            <RotateCcw size={12} />Reset
          </button>
        )}
        <button
          className="btn-primary"
          onClick={run}
          disabled={status === 'running' || !empresa.trim() || !sector.trim()}
          style={{ opacity: (!empresa.trim() || !sector.trim()) ? 0.5 : 1 }}
        >
          {status === 'running'
            ? <><div className="spinner" />Analizando...</>
            : <><Search size={13} />Detectar puntos de dolor</>}
        </button>
      </div>

      {status === 'error' && (
        <div style={{ background: '#FFF1F2', border: '1px solid #FDA4AF', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#DC2626' }}>
          {error}
        </div>
      )}

      {(status === 'running' || status === 'done') && (
        <div style={{ display: 'grid', gridTemplateColumns: auditJson ? '1fr 1fr' : '1fr', gap: 14 }}>
          {/* Texto streaming */}
          <div style={{ background: 'var(--h-surface)', borderRadius: 10, padding: '14px 16px', maxHeight: 320, overflowY: 'auto', fontSize: 12, lineHeight: 1.75, whiteSpace: 'pre-wrap', color: 'var(--h-text)' }}>
            {auditText || 'Analizando empresa...'}
            {status === 'running' && (
              <span style={{ display: 'inline-block', width: 7, height: 13, background: '#DC2626', marginLeft: 2, borderRadius: 1, animation: 'pulse 1s infinite' }} />
            )}
          </div>

          {/* JSON estructurado */}
          {auditJson && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* Puntos de dolor */}
              {(auditJson.puntos_dolor || []).length > 0 && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#DC2626', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                    <AlertCircle size={11} />PUNTOS DE DOLOR
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {auditJson.puntos_dolor.map((p, i) => (
                      <div key={i} style={{ display: 'flex', gap: 8, background: 'white', borderRadius: 8, padding: '8px 10px', border: '1px solid var(--h-border)' }}>
                        <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 4, background: urgencyBg[p.urgencia] || '#f1f5f9', color: urgencyColor[p.urgencia] || '#64748b', flexShrink: 0, alignSelf: 'flex-start', marginTop: 1 }}>
                          {(p.urgencia || 'media').toUpperCase()}
                        </span>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600 }}>{p.area}</div>
                          <div style={{ fontSize: 11, color: 'var(--h-muted)', lineHeight: 1.4 }}>{p.problema}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Talento + oportunidad */}
              {(auditJson.talento_buscado || []).length > 0 && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#0D9488', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                    <Users size={11} />TALENTO QUE NECESITAN
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {auditJson.talento_buscado.map((t, i) => (
                      <span key={i} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: '#F0FDF4', color: '#065F46', border: '1px solid #86EFAC', fontWeight: 500 }}>{t}</span>
                    ))}
                  </div>
                </div>
              )}

              {auditJson.angulo_outreach && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#DC2626', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                    <Mail size={11} />ÁNGULO DE OUTREACH
                  </div>
                  <div style={{ fontSize: 12, background: '#FFF7F7', borderRadius: 7, padding: '8px 10px', border: '1px solid #FECACA', lineHeight: 1.5, fontStyle: 'italic', color: 'var(--h-text)' }}>
                    "{auditJson.angulo_outreach}"
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function Inteligencia() {
  const [filter, setFilter] = useState('todas')

  const filtered = filter === 'todas' ? COMPETITORS : COMPETITORS.filter(c => c.threat === filter)

  return (
    <div className="fade-in" style={{ padding: '28px 32px', maxWidth: 1000 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.03em' }}>Inteligencia de mercado</h1>
          <p style={{ color: 'var(--h-muted)', fontSize: 13, marginTop: 4 }}>Competidores, señales de contratación y tendencias del sector</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-secondary"><Search size={13} /> Nuevo análisis</button>
          <button className="btn-primary" onClick={() => generateIntelPDF('HR Tech / SaaS', COMPETITORS, TRENDS)}><Download size={13} /> Exportar PDF</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        {[
          { label: 'Competidores detectados', value: '47', sub: 'en tu sector' },
          { label: 'Con ads activos',          value: '12', sub: 'Meta + Google' },
          { label: 'Contratando ahora',        value: '8',  sub: 'señal de crecimiento' },
          { label: 'Amenaza crítica',          value: '2',  sub: 'acción inmediata' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-label">{s.label}</div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        {['todas', 'crítica', 'alta', 'media', 'baja'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500,
              border: `1px solid ${filter === f ? 'var(--h-accent)' : 'var(--h-border)'}`,
              background: filter === f ? 'var(--h-accent-soft)' : 'var(--h-white)',
              color: filter === f ? 'var(--h-accent)' : 'var(--h-muted)',
              cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Tabla competidores */}
      <div className="card" style={{ marginBottom: 24, padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--h-surface)' }}>
                {['Empresa', 'Score amenaza', 'Ads activos', 'Meta Pixel', 'Contratando', 'Sector', 'Acción'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--h-muted)', letterSpacing: '0.04em', borderBottom: '1px solid var(--h-border)', whiteSpace: 'nowrap' }}>
                    {h.toUpperCase()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <tr key={c.name} style={{ borderBottom: '1px solid var(--h-border)', background: i % 2 === 0 ? 'white' : 'var(--h-surface)' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{c.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--h-muted)' }}>{c.url}</div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ height: 6, width: 50, background: 'var(--h-border)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${c.score * 10}%`, background: c.score >= 8 ? '#DC2626' : c.score >= 6 ? '#D97706' : '#059669', borderRadius: 3 }} />
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 600 }}>{c.score}</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span className={`badge badge-${c.ads ? 'red' : 'gray'}`}>{c.ads ? 'Sí' : 'No'}</span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span className={`badge badge-${c.pixel ? 'amber' : 'gray'}`}>{c.pixel ? 'Sí' : 'No'}</span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {c.hiring
                      ? <span className="badge badge-green" style={{ gap: 3 }}><Zap size={10} />Sí — oportunidad</span>
                      : <span className="badge badge-gray">No</span>
                    }
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span className="tag">{c.sector}</span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span className="badge" style={{ background: threatBg[c.threat], color: threatColor[c.threat] }}>
                      {c.threat.charAt(0).toUpperCase() + c.threat.slice(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tendencias */}
      <div>
        <div className="section-title">Tendencias del sector — keywords en crecimiento</div>
        <div className="grid-2">
          {TRENDS.map(t => (
            <div key={t.keyword} className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <TrendingUp size={16} color="#059669" style={{ flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{t.keyword}</div>
                <div style={{ fontSize: 11, color: 'var(--h-muted)', marginTop: 2 }}>{t.vol}/mes</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#059669' }}>{t.trend}</div>
                <span className={`badge badge-${t.opp === 'muy alta' ? 'green' : t.opp === 'alta' ? 'blue' : 'gray'}`} style={{ fontSize: 10 }}>
                  Oport. {t.opp}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detector de puntos de dolor */}
      <PainDetector />
    </div>
  )
}
