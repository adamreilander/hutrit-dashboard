import { useState } from 'react'
import EmailCaptureModal from '../components/EmailCaptureModal'
import LoadingScreen from '../components/LoadingScreen'
import { generateVentasReportPDF } from '../utils/generatePDF'
import { checkRateLimit, recordUsage, getDashboardToken } from '../utils/rateLimit'

const LOADING_STEPS = [
  'Analizando tu propuesta de valor...',
  'Identificando empresas objetivo...',
  'Evaluando oportunidad por empresa...',
  'Calculando prioridad de contacto...',
  'Generando estrategia de outreach...',
]

export default function AgenteVentas({ onDone, onBack }) {
  const [step, setStep] = useState('form')
  const [form, setForm] = useState({ oferta: '', sector_target: '', ciudad: '', tipo_empresa: '' })
  const [data, setData] = useState(null)
  const [loadingStep, setLoadingStep] = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [error, setError] = useState('')

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }))

  const analyze = async () => {
    const { allowed } = checkRateLimit()
    if (!allowed) { setError('Has alcanzado el límite de usos gratuitos por hoy. Vuelve mañana.'); return }
    if (!form.oferta.trim()) { setError('Describe qué ofreces o qué buscas'); return }
    setError('')
    setStep('loading')
    setLoadingStep(0)

    const interval = setInterval(() => {
      setLoadingStep(prev => Math.min(prev + 1, LOADING_STEPS.length - 1))
    }, 900)

    try {
      const res = await fetch('/api/demo-ventas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-dashboard-token': getDashboardToken() },
        body: JSON.stringify(form),
      })
      const result = await res.json()
      clearInterval(interval)
      if (!result || result.error) throw new Error(result?.error || 'Error en el análisis')
      recordUsage()
      setData(result)
      setStep('results')
    } catch (err) {
      clearInterval(interval)
      setError(err.message)
      setStep('form')
    }
  }

  const handleDownload = (fields) => {
    generateVentasReportPDF(data, fields)
    setShowModal(false)
    // Fire-and-forget lead capture
    fetch('/api/capture-lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: fields.email,
        nombre: fields.nombre,
        empresa: fields.empresa,
        telefono: fields.telefono,
        agente: 'ventas',
        empresa_analizada: form.oferta?.slice(0, 80),
      }),
    }).catch(() => {})
    setTimeout(onDone, 400)
  }

  if (step === 'loading') {
    return <LoadingScreen steps={LOADING_STEPS} currentStep={loadingStep} agentName="Agente Ventas" />
  }

  if (step === 'results') {
    return (
      <>
        <VentasResults data={data} onDownload={() => setShowModal(true)} onBack={onBack} />
        {showModal && (
          <EmailCaptureModal
            title="Descarga tu Lista de Prospectos"
            onConfirm={handleDownload}
            onClose={() => setShowModal(false)}
          />
        )}
      </>
    )
  }

  // FORM
  return (
    <div style={pageWrap}>
      <TopBar onBack={onBack} label="Agente Ventas" emoji="🎯" accentColor="#F59E0B" />

      <div className="agent-outer-wrap">
        <div className="agent-two-col">
          {/* Left: Form */}
          <div className="agent-form-card">
            <div style={{ marginBottom: 28 }}>
              <div style={agentBadge('#F59E0B')}>🎯 Agente Ventas</div>
              <h2 style={cardTitle}>Encuentra empresas listas para comprar</h2>
              <p style={cardSub}>
                Dinos qué ofreces y el agente identificará las mejores empresas a contactar, con el ángulo ideal de acercamiento para cada una.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <Field label="¿Qué ofreces o qué buscas? *" hint="Sé específico">
                <textarea
                  className="input-field"
                  placeholder="Ej: Ofrezco servicios de diseño web y branding para pymes. Quiero encontrar empresas con web desactualizada que quieran renovar su imagen..."
                  value={form.oferta}
                  onChange={set('oferta')}
                  style={{ resize: 'vertical', minHeight: 90 }}
                  autoFocus
                />
              </Field>

              <Field label="Tipo de empresa que buscas" hint="Opcional">
                <input
                  className="input-field"
                  placeholder="Ej: Restaurantes, Clínicas, Startups tech, Despachos de abogados..."
                  value={form.sector_target}
                  onChange={set('sector_target')}
                />
              </Field>

              <Field label="País y ciudad" hint="Opcional">
                <input
                  className="input-field"
                  placeholder="Ej: España, Madrid / Colombia, Bogotá..."
                  value={form.ciudad}
                  onChange={set('ciudad')}
                />
              </Field>

              <Field label="Tamaño de empresa preferido">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[
                    { value: '', label: '🌐 Cualquier tamaño' },
                    { value: 'startup', label: '🚀 Startup (1-20)' },
                    { value: 'pyme', label: '🏢 PYME (20-100)' },
                    { value: 'mediana', label: '🏬 Mediana (100-500)' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setForm(p => ({ ...p, tipo_empresa: opt.value }))}
                      style={{
                        padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
                        border: form.tipo_empresa === opt.value ? '2px solid #F59E0B' : '1.5px solid #C8E0DD',
                        background: form.tipo_empresa === opt.value ? '#FFFBEB' : '#fff',
                        fontSize: 12, fontWeight: 600,
                        color: form.tipo_empresa === opt.value ? '#92400E' : '#0F2724',
                        transition: 'all 0.15s', textAlign: 'center',
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </Field>

              {error && <div style={errorBox}>⚠️ {error}</div>}

              <button
                onClick={analyze}
                style={{
                  padding: '15px', fontSize: 14, fontWeight: 600,
                  background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                  color: '#fff', border: 'none', borderRadius: 10,
                  cursor: 'pointer', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', gap: 8, marginTop: 4,
                  boxShadow: '0 4px 14px rgba(245,158,11,0.25)',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 18px rgba(245,158,11,0.35)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(245,158,11,0.25)' }}
              >
                <span>🎯</span> Encontrar mis prospectos
              </button>
            </div>
          </div>

          {/* Right: Info panel */}
          <div className="agent-info-card">
            <div style={{ fontSize: 32, marginBottom: 16 }}>🎯</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 8, letterSpacing: '-0.01em' }}>
              ¿Qué incluye la lista?
            </div>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', marginBottom: 24, lineHeight: 1.65 }}>
              Empresas reales y calificadas con todo lo que necesitas para contactarlas con confianza.
            </p>
            {[
              { icon: '🏢', text: '8-10 empresas calificadas y listas para contactar' },
              { icon: '📊', text: 'Por qué cada empresa es una buena oportunidad' },
              { icon: '✉️', text: 'Ángulo de acercamiento ideal por empresa' },
              { icon: '⚡', text: 'Priorización: alta, media o baja urgencia' },
              { icon: '📧', text: 'Plantilla de email de primer contacto' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
                <span style={{ fontSize: 17, flexShrink: 0 }}>{item.icon}</span>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 1.5 }}>{item.text}</span>
              </div>
            ))}
            <div style={{
              marginTop: 24, paddingTop: 20,
              borderTop: '1px solid rgba(255,255,255,0.12)',
              fontSize: 12, color: 'rgba(255,255,255,0.4)',
              textAlign: 'center',
            }}>
              El informe se descarga como PDF gratuito
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Results ──────────────────────────────────────────────────────────────────

function VentasResults({ data, onDownload, onBack }) {
  const prioColor = (p) => p === 'alta' ? '#DC2626' : p === 'media' ? '#D97706' : '#0D9488'
  const altaCount = data.prospectos?.filter(p => p.prioridad === 'alta').length || 0

  return (
    <div style={pageWrap}>
      <TopBar onBack={onBack} label="Agente Ventas" emoji="🎯" accentColor="#F59E0B" />

      <div className="agent-outer-wrap" style={{ maxWidth: 920 }}>

        {/* Header */}
        <div className="fade-in" style={{
          background: 'linear-gradient(135deg, #78350F, #F59E0B)',
          borderRadius: 18, padding: '24px 32px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 16,
        }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.65)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
              Lista de prospectos lista ✓
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', marginBottom: 6 }}>
              {data.prospectos?.length || 0} empresas identificadas
            </h2>
            {data.estrategia_general && (
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 1.65, maxWidth: 520 }}>{data.estrategia_general}</p>
            )}
          </div>
          <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 14, padding: '14px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 30, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{altaCount}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>Alta prioridad</div>
          </div>
        </div>

        {/* Prospects list */}
        {data.prospectos?.length > 0 && (
          <div className="card fade-in">
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0D2B28', marginBottom: 4 }}>🏢 Empresas objetivo</div>
            {data.prospectos.map((p, i) => (
              <div key={i} style={{ padding: '16px 0', borderBottom: i < data.prospectos.length - 1 ? '1px solid #F0FDFA' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 8 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                    background: '#FFFBEB', border: '1px solid #FED7AA',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18,
                  }}>🏢</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#0F2724' }}>{p.empresa}</span>
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6,
                        background: prioColor(p.prioridad) + '18', color: prioColor(p.prioridad),
                      }}>
                        {(p.prioridad || 'media').toUpperCase()}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: '#9BBFBC' }}>{p.sector}{p.tamaño ? ` · ${p.tamaño}` : ''}</div>
                  </div>
                </div>

                {p.por_que && (
                  <p style={{ fontSize: 12, color: '#4B6E6B', lineHeight: 1.6, marginBottom: 8, paddingLeft: 52 }}>
                    {p.por_que}
                  </p>
                )}

                {p.angulo_outreach && (
                  <div style={{
                    marginLeft: 52, background: '#FFFBEB',
                    border: '1px solid #FED7AA', borderRadius: 8,
                    padding: '8px 12px', marginBottom: (p.telefono || p.direccion || p.web) ? 8 : 0,
                  }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#D97706', marginRight: 6 }}>CÓMO CONTACTAR:</span>
                    <span style={{ fontSize: 12, color: '#78350F' }}>{p.angulo_outreach}</span>
                  </div>
                )}

                {/* Contact info: Google Places + Hunter */}
                {(p.telefono || p.direccion || p.web || p.email_contacto) && (
                  <div style={{ marginLeft: 52, marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {p.email_contacto && (
                      <a href={`mailto:${p.email_contacto}`} style={{ ...contactChip, background: '#F0FDF4', borderColor: '#BBF7D0', color: '#065F46' }}>
                        ✉️ {p.email_contacto}{p.nombre_contacto ? ` · ${p.nombre_contacto}` : ''}{p.cargo_contacto ? ` (${p.cargo_contacto})` : ''}
                      </a>
                    )}
                    {p.telefono && (
                      <a href={`tel:${p.telefono}`} style={contactChip}>
                        📞 {p.telefono}
                      </a>
                    )}
                    {p.web && (
                      <a href={p.web} target="_blank" rel="noopener noreferrer" style={contactChip}>
                        🌐 {p.web.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                      </a>
                    )}
                    {p.direccion && (
                      <span style={{ ...contactChip, cursor: 'default' }}>
                        📍 {p.direccion}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Email template */}
        {data.email_template && (
          <div className="card fade-in">
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0D2B28', marginBottom: 14 }}>✉️ Plantilla de primer contacto</div>
            <div style={{
              background: '#F7FAFA', border: '1px solid #C8E0DD', borderRadius: 10,
              padding: '16px', fontFamily: 'var(--font-mono)',
              fontSize: 12, color: '#0F2724', lineHeight: 1.8, whiteSpace: 'pre-wrap',
            }}>
              {data.email_template}
            </div>
          </div>
        )}

        {/* Download CTA */}
        <div className="fade-in" style={{
          background: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: 16,
          padding: '22px 28px', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
        }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#78350F', marginBottom: 4 }}>Tu lista de prospectos está lista</div>
            <div style={{ fontSize: 13, color: '#D97706' }}>PDF con todos los datos, análisis y plantilla de email.</div>
          </div>
          <button
            onClick={onDownload}
            style={{
              padding: '13px 28px', fontSize: 14, fontWeight: 600,
              background: 'linear-gradient(135deg, #F59E0B, #D97706)',
              color: '#fff', border: 'none', borderRadius: 10,
              cursor: 'pointer', flexShrink: 0,
              boxShadow: '0 4px 14px rgba(245,158,11,0.3)',
            }}
          >
            📥 Descargar Lista PDF
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Shared UI ────────────────────────────────────────────────────────────────

function TopBar({ onBack, label, emoji, accentColor }) {
  return (
    <div className="agent-top-bar">
      <button
        onClick={onBack}
        style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#5A8A85', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', padding: '6px 10px', borderRadius: 8, transition: 'all 0.15s' }}
        onMouseEnter={e => { e.currentTarget.style.background = '#F0FDFA'; e.currentTarget.style.color = '#0D5C54' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#5A8A85' }}
      >
        ← Agentes
      </button>
      <div style={{ width: 1, height: 20, background: '#C8E0DD' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600, color: '#0D2B28' }}>
        <span style={{ width: 28, height: 28, borderRadius: 8, background: (accentColor || '#0D9488') + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>{emoji}</span>
        {label}
      </div>
    </div>
  )
}

function Field({ label, hint, children }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 7 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: '#0F2724' }}>{label}</label>
        {hint && <span style={{ fontSize: 11, color: '#9BBFBC' }}>{hint}</span>}
      </div>
      {children}
    </div>
  )
}

const pageWrap = { minHeight: '100vh', background: 'var(--h-surface)', display: 'flex', flexDirection: 'column', fontFamily: 'var(--font-sans)' }
const cardTitle = { fontSize: 21, fontWeight: 800, color: '#0D2B28', marginBottom: 8, letterSpacing: '-0.025em', lineHeight: 1.2 }
const cardSub = { fontSize: 13, color: '#5A8A85', lineHeight: 1.65 }
const errorBox = { fontSize: 13, color: '#DC2626', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 14px' }

const contactChip = {
  fontSize: 11, fontWeight: 600, padding: '4px 10px',
  borderRadius: 8, background: '#F7FAFA', border: '1px solid #C8E0DD',
  color: '#5A8A85', textDecoration: 'none', display: 'inline-flex',
  alignItems: 'center', gap: 4,
}

function agentBadge(color) {
  return { display: 'inline-block', fontSize: 11, fontWeight: 700, color, background: color + '12', border: `1px solid ${color}25`, borderRadius: 20, padding: '4px 12px', marginBottom: 14, letterSpacing: '0.03em' }
}
