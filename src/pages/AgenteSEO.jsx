import { useState } from 'react'
import EmailCaptureModal from '../components/EmailCaptureModal'
import LoadingScreen from '../components/LoadingScreen'
import { generateSEOReportPDF } from '../utils/generatePDF'

const LOADING_STEPS = [
  'Analizando presencia en buscadores...',
  'Identificando keywords de alto impacto...',
  'Evaluando competidores digitales...',
  'Detectando problemas técnicos...',
  'Generando plan de acción priorizado...',
]

export default function AgenteSEO({ onDone, onBack }) {
  const [step, setStep] = useState('form')
  const [form, setForm] = useState({ empresa: '', url: '', sector: '' })
  const [data, setData] = useState(null)
  const [loadingStep, setLoadingStep] = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [error, setError] = useState('')

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }))

  const analyze = async () => {
    if (!form.empresa.trim()) { setError('Ingresa el nombre de tu empresa'); return }
    setError('')
    setStep('loading')
    setLoadingStep(0)

    const interval = setInterval(() => {
      setLoadingStep(prev => Math.min(prev + 1, LOADING_STEPS.length - 1))
    }, 900)

    try {
      const res = await fetch('/api/demo-seo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const result = await res.json()
      clearInterval(interval)
      if (!result || result.error) throw new Error(result?.error || 'Error en el análisis')
      setData(result)
      setStep('results')
    } catch (err) {
      clearInterval(interval)
      setError(err.message)
      setStep('form')
    }
  }

  const handleDownload = (fields) => {
    generateSEOReportPDF(data, fields.email)
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
        agente: 'seo',
        empresa_analizada: data?.empresa || form.empresa,
      }),
    }).catch(() => {})
    setTimeout(onDone, 400)
  }

  if (step === 'loading') {
    return <LoadingScreen steps={LOADING_STEPS} currentStep={loadingStep} agentName="Agente SEO" />
  }

  if (step === 'results') {
    return (
      <>
        <SEOResults data={data} onDownload={() => setShowModal(true)} onBack={onBack} />
        {showModal && (
          <EmailCaptureModal
            title="Descarga tu Informe SEO"
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
      <TopBar onBack={onBack} label="Agente SEO" emoji="🔍" accentColor="#0D9488" />

      <div style={outerWrap}>
        <div style={twoCol}>
          {/* Left: Form */}
          <div style={formCard}>
            <div style={{ marginBottom: 28 }}>
              <div style={agentBadge('#0D9488')}>🔍 Agente SEO</div>
              <h2 style={cardTitle}>Analiza tu posicionamiento en buscadores</h2>
              <p style={cardSub}>
                Ingresa el nombre de tu empresa y el agente generará un diagnóstico SEO completo con keywords, competidores y plan de acción.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <Field label="Nombre de tu empresa *" hint="¿Cómo se llama tu empresa?">
                <input
                  className="input-field"
                  placeholder="Ej: Clínica Salud Verde, Agencia Pixel, Tienda Norte..."
                  value={form.empresa}
                  onChange={set('empresa')}
                  autoFocus
                />
              </Field>
              <Field label="URL de tu sitio web" hint="Opcional pero mejora el análisis">
                <input
                  className="input-field"
                  placeholder="www.tuempresa.com"
                  value={form.url}
                  onChange={set('url')}
                />
              </Field>
              <Field label="Sector o industria" hint="¿A qué se dedica tu empresa?">
                <input
                  className="input-field"
                  placeholder="Ej: Software B2B, Alimentación, Servicios legales, Moda..."
                  value={form.sector}
                  onChange={set('sector')}
                />
              </Field>

              {error && <div style={errorBox}>⚠️ {error}</div>}

              <button
                className="btn-primary"
                onClick={analyze}
                style={{ justifyContent: 'center', padding: '15px', fontSize: 14, marginTop: 4, gap: 8 }}
              >
                <span>🔍</span> Analizar mi empresa
              </button>
            </div>
          </div>

          {/* Right: Info panel */}
          <div style={infoCard}>
            <div style={{ fontSize: 32, marginBottom: 16 }}>🔍</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 8, letterSpacing: '-0.01em' }}>
              ¿Qué incluye tu informe SEO?
            </div>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', marginBottom: 24, lineHeight: 1.65 }}>
              En menos de 30 segundos el agente genera un diagnóstico completo de cómo está posicionada tu empresa online.
            </p>
            {[
              { icon: '📊', text: 'Puntuación SEO general de tu empresa' },
              { icon: '🔑', text: '5 keywords de alto impacto con volumen y dificultad' },
              { icon: '🏆', text: 'Tus 3 principales competidores digitales' },
              { icon: '⚠️', text: 'Problemas técnicos con soluciones concretas' },
              { icon: '🗺️', text: 'Plan de acción con 5 pasos y plazos reales' },
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

function SEOResults({ data, onDownload, onBack }) {
  return (
    <div style={pageWrap}>
      <TopBar onBack={onBack} label="Agente SEO" emoji="🔍" accentColor="#0D9488" />

      <div style={{ ...outerWrap, maxWidth: 920 }}>

        {/* Score banner */}
        <div className="fade-in" style={{
          background: 'linear-gradient(135deg, #0D5C54, #0D9488)',
          borderRadius: 18, padding: '24px 32px',
          display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap',
        }}>
          {/* Score circle */}
          <div style={{ flexShrink: 0, textAlign: 'center' }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              border: '4px solid rgba(255,255,255,0.35)',
              background: 'rgba(255,255,255,0.1)',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', lineHeight: 1 }}>
                {data.puntuacion || '—'}
              </div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.65)', fontWeight: 600 }}>/ 100</div>
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', marginTop: 6 }}>Score SEO</div>
          </div>
          {/* Text */}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.65)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
              Análisis completado ✓
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', marginBottom: 6 }}>{data.empresa}</h2>
            {data.resumen && <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 1.65, maxWidth: 520 }}>{data.resumen}</p>}
          </div>
        </div>

        {/* Results grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 16 }}>

          {/* Keywords */}
          {data.keywords?.length > 0 && (
            <ResultCard title="🔑 Keywords identificadas">
              {data.keywords.map((kw, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 0', borderBottom: '1px solid #F0FDFA' }}>
                  <span style={{ fontSize: 12, color: '#5A8A85', width: 18, textAlign: 'right', flexShrink: 0 }}>{i + 1}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#0F2724', flex: 1 }}>{kw.kw}</span>
                  <Chip label={`Vol: ${kw.volumen}`} color="#0D9488" />
                  <Chip
                    label={`Dif: ${kw.dificultad}`}
                    color={kw.dificultad === 'alta' ? '#DC2626' : kw.dificultad === 'media' ? '#D97706' : '#0D9488'}
                  />
                </div>
              ))}
            </ResultCard>
          )}

          {/* Competidores */}
          {data.competidores?.length > 0 && (
            <ResultCard title="🏆 Competidores detectados">
              {data.competidores.map((c, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #F0FDFA' }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                    background: '#F0FDFA', border: '1px solid #C8E0DD',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, fontWeight: 700, color: '#0D5C54',
                  }}>
                    {c.nombre?.charAt(0) || 'C'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#0F2724' }}>{c.nombre}</div>
                    {c.dominio && <div style={{ fontSize: 11, color: '#9BBFBC' }}>{c.dominio}</div>}
                  </div>
                  <Chip label={c.posicion || 'Competidor'} color="#0D9488" />
                </div>
              ))}
            </ResultCard>
          )}

          {/* Problemas */}
          {data.problemas?.length > 0 && (
            <ResultCard title="⚠️ Problemas técnicos detectados">
              {data.problemas.map((p, i) => (
                <div key={i} style={{ padding: '10px 0', borderBottom: '1px solid #F0FDFA' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <Chip
                      label={(p.impacto || 'medio').toUpperCase()}
                      color={p.impacto === 'alto' ? '#DC2626' : p.impacto === 'medio' ? '#D97706' : '#0D9488'}
                    />
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#0F2724' }}>{p.titulo}</span>
                  </div>
                  {p.solucion && <p style={{ fontSize: 12, color: '#5A8A85', lineHeight: 1.55, paddingLeft: 4 }}>{p.solucion}</p>}
                </div>
              ))}
            </ResultCard>
          )}

          {/* Plan de acción */}
          {data.plan_accion?.length > 0 && (
            <ResultCard title="🗺️ Plan de acción">
              {data.plan_accion.map((p, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, padding: '9px 0', borderBottom: '1px solid #F0FDFA', alignItems: 'flex-start' }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                    background: '#0D9488', color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700,
                  }}>{i + 1}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: '#0F2724', lineHeight: 1.4 }}>{p.accion}</div>
                    {p.plazo && <div style={{ fontSize: 11, color: '#0D9488', marginTop: 3, fontWeight: 600 }}>{p.plazo}</div>}
                  </div>
                </div>
              ))}
            </ResultCard>
          )}
        </div>

        {/* Download CTA */}
        <div className="fade-in" style={downloadBanner}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0D2B28', marginBottom: 4 }}>
              Tu informe SEO está listo para descargar
            </div>
            <div style={{ fontSize: 13, color: '#5A8A85' }}>PDF con análisis completo, keywords y plan de acción.</div>
          </div>
          <button className="btn-primary" onClick={onDownload} style={{ padding: '13px 28px', fontSize: 14, flexShrink: 0 }}>
            📥 Descargar Informe PDF
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Shared UI ────────────────────────────────────────────────────────────────

function TopBar({ onBack, label, emoji, accentColor }) {
  return (
    <div style={{
      height: 58, background: '#fff',
      borderBottom: '1px solid #C8E0DD',
      display: 'flex', alignItems: 'center',
      padding: '0 28px', gap: 14, flexShrink: 0,
    }}>
      <button
        onClick={onBack}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          fontSize: 13, color: '#5A8A85', fontWeight: 500,
          background: 'none', border: 'none', cursor: 'pointer',
          padding: '6px 10px', borderRadius: 8, transition: 'all 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = '#F0FDFA'; e.currentTarget.style.color = '#0D5C54' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#5A8A85' }}
      >
        ← Agentes
      </button>
      <div style={{ width: 1, height: 20, background: '#C8E0DD' }} />
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        fontSize: 14, fontWeight: 600, color: '#0D2B28',
      }}>
        <span style={{
          width: 28, height: 28, borderRadius: 8,
          background: (accentColor || '#0D9488') + '15',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14,
        }}>{emoji}</span>
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

function ResultCard({ title, children }) {
  return (
    <div className="card fade-in">
      <div style={{ fontSize: 13, fontWeight: 700, color: '#0D2B28', marginBottom: 4, letterSpacing: '-0.01em' }}>{title}</div>
      {children}
    </div>
  )
}

function Chip({ label, color }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: '2px 7px',
      borderRadius: 6, background: color + '18', color,
      letterSpacing: '0.02em', whiteSpace: 'nowrap', flexShrink: 0,
    }}>
      {label}
    </span>
  )
}

// ── Styles ───────────────────────────────────────────────────────────────────

const pageWrap = {
  minHeight: '100vh',
  background: 'var(--h-surface)',
  display: 'flex', flexDirection: 'column',
  fontFamily: 'var(--font-sans)',
}

const outerWrap = {
  flex: 1, padding: '32px 28px',
  maxWidth: 1040, width: '100%',
  margin: '0 auto',
  display: 'flex', flexDirection: 'column', gap: 20,
}

const twoCol = {
  display: 'grid',
  gridTemplateColumns: '1fr 340px',
  gap: 20,
  alignItems: 'start',
}

const formCard = {
  background: '#fff',
  border: '1px solid #C8E0DD',
  borderRadius: 18, padding: '32px',
  boxShadow: '0 2px 12px rgba(13,92,84,0.06)',
}

const infoCard = {
  background: 'linear-gradient(160deg, #0D5C54 0%, #094840 100%)',
  borderRadius: 18, padding: '28px 24px',
  position: 'sticky', top: 32,
}

const downloadBanner = {
  background: '#fff',
  border: '1px solid #C8E0DD',
  borderRadius: 16, padding: '22px 28px',
  display: 'flex', alignItems: 'center',
  justifyContent: 'space-between',
  flexWrap: 'wrap', gap: 16,
  boxShadow: '0 2px 12px rgba(13,92,84,0.06)',
}

const cardTitle = {
  fontSize: 21, fontWeight: 800,
  color: '#0D2B28', marginBottom: 8,
  letterSpacing: '-0.025em', lineHeight: 1.2,
}

const cardSub = {
  fontSize: 13, color: '#5A8A85', lineHeight: 1.65,
}

const errorBox = {
  fontSize: 13, color: '#DC2626',
  background: '#FEF2F2', border: '1px solid #FECACA',
  borderRadius: 10, padding: '10px 14px',
}

function agentBadge(color) {
  return {
    display: 'inline-block', fontSize: 11, fontWeight: 700,
    color, background: color + '12', border: `1px solid ${color}25`,
    borderRadius: 20, padding: '4px 12px', marginBottom: 14,
    letterSpacing: '0.03em',
  }
}
