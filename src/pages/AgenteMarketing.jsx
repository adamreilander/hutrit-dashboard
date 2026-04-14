import { useState } from 'react'
import EmailCaptureModal from '../components/EmailCaptureModal'
import LoadingScreen from '../components/LoadingScreen'
import { generateMarketingReportPDF } from '../utils/generatePDF'

const LOADING_STEPS = [
  'Analizando identidad de marca...',
  'Creando estrategia de contenido...',
  'Redactando posts para LinkedIn...',
  'Generando copies para Instagram...',
  'Diseñando creativo visual...',
]

export default function AgenteMarketing({ onDone, onBack }) {
  const [step, setStep] = useState('form')
  const [form, setForm] = useState({
    empresa: '',
    descripcion: '',
    sector: '',
    estilo: 'profesional',
  })
  const [data, setData] = useState(null)
  const [imageBase64, setImageBase64] = useState(null)
  const [loadingStep, setLoadingStep] = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [error, setError] = useState('')

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }))

  const generate = async () => {
    if (!form.empresa.trim() || !form.descripcion.trim()) {
      setError('Ingresa el nombre y la descripción de tu empresa')
      return
    }
    setError('')
    setStep('loading')
    setLoadingStep(0)

    const interval = setInterval(() => {
      setLoadingStep(prev => Math.min(prev + 1, LOADING_STEPS.length - 1))
    }, 1000)

    try {
      const contentRes = await fetch('/api/demo-marketing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const contentData = await contentRes.json()
      if (!contentData || contentData.error) throw new Error(contentData?.error || 'Error generando contenido')

      // Generate creative image (optional)
      let imgBase64 = null
      try {
        const imgRes = await fetch('/api/generate-creative', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: `${form.empresa}: ${contentData.creativo_concepto?.descripcion || form.descripcion}. Sector: ${form.sector}.`,
            style: form.estilo,
          }),
        })
        const imgData = await imgRes.json()
        if (imgData.success && imgData.imageBase64) {
          imgBase64 = `data:${imgData.mimeType || 'image/png'};base64,${imgData.imageBase64}`
        }
      } catch (_) { /* image is optional */ }

      clearInterval(interval)
      setData(contentData)
      setImageBase64(imgBase64)
      setStep('results')
    } catch (err) {
      clearInterval(interval)
      setError(err.message)
      setStep('form')
    }
  }

  const handleDownload = (fields) => {
    generateMarketingReportPDF(data, fields, imageBase64)
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
        agente: 'marketing',
        empresa_analizada: form.empresa,
      }),
    }).catch(() => {})
    setTimeout(onDone, 400)
  }

  if (step === 'loading') {
    return <LoadingScreen steps={LOADING_STEPS} currentStep={loadingStep} agentName="Agente Marketing" />
  }

  if (step === 'results') {
    return (
      <>
        <MarketingResults
          data={data}
          imageBase64={imageBase64}
          empresa={form.empresa}
          onDownload={() => setShowModal(true)}
          onBack={onBack}
        />
        {showModal && (
          <EmailCaptureModal
            type="full"
            title="Descarga tu Pack de Marketing"
            subtitle="Completa tus datos para descargar el PDF con toda la estrategia y el creativo visual."
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
      <TopBar onBack={onBack} label="Agente Marketing" emoji="✨" accentColor="#22C55E" />

      <div style={outerWrap}>
        <div style={twoCol}>
          {/* Left: Form */}
          <div style={formCard}>
            <div style={{ marginBottom: 28 }}>
              <div style={agentBadge('#22C55E')}>✨ Agente Marketing</div>
              <h2 style={cardTitle}>Crea contenido listo para publicar</h2>
              <p style={cardSub}>
                Cuéntanos sobre tu empresa. En segundos tendrás posts de LinkedIn, copies para Instagram y un creativo visual con tu marca.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <Field label="Nombre de tu empresa *">
                <input
                  className="input-field"
                  placeholder="Ej: Boutique Luna, TechFlow, Estudio Creativo..."
                  value={form.empresa}
                  onChange={set('empresa')}
                  autoFocus
                />
              </Field>

              <Field label="¿A qué se dedica tu empresa? *" hint="Descríbelo en 1-2 frases">
                <textarea
                  className="input-field"
                  placeholder="Ej: Somos una consultoría de transformación digital para pymes españolas. Ayudamos a digitalizar procesos y aumentar ventas online..."
                  value={form.descripcion}
                  onChange={set('descripcion')}
                  style={{ resize: 'vertical', minHeight: 90 }}
                />
              </Field>

              <Field label="Sector" hint="Opcional">
                <input
                  className="input-field"
                  placeholder="Ej: Tech, Moda, Gastronomía, Salud, Educación..."
                  value={form.sector}
                  onChange={set('sector')}
                />
              </Field>

              <Field label="Tono de comunicación">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[
                    { value: 'profesional', label: '💼 Profesional', desc: 'Serio y confiable' },
                    { value: 'cercano', label: '🤝 Cercano', desc: 'Humano y directo' },
                    { value: 'impacto', label: '⚡ Impacto', desc: 'Directo y potente' },
                    { value: 'inspirador', label: '🌟 Inspirador', desc: 'Motivacional' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setForm(p => ({ ...p, estilo: opt.value }))}
                      style={{
                        padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
                        border: form.estilo === opt.value ? '2px solid #22C55E' : '1.5px solid #C8E0DD',
                        background: form.estilo === opt.value ? '#F0FDF4' : '#fff',
                        textAlign: 'left', transition: 'all 0.15s',
                      }}
                    >
                      <div style={{ fontSize: 12, fontWeight: 700, color: form.estilo === opt.value ? '#15803D' : '#0F2724', marginBottom: 2 }}>
                        {opt.label}
                      </div>
                      <div style={{ fontSize: 11, color: '#9BBFBC' }}>{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </Field>

              {error && <div style={errorBox}>⚠️ {error}</div>}

              <button
                onClick={generate}
                style={{
                  padding: '15px', fontSize: 14, fontWeight: 600,
                  background: 'linear-gradient(135deg, #22C55E, #16A34A)',
                  color: '#fff', border: 'none', borderRadius: 10,
                  cursor: 'pointer', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', gap: 8, marginTop: 4,
                  boxShadow: '0 4px 14px rgba(34,197,94,0.25)',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 18px rgba(34,197,94,0.35)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(34,197,94,0.25)' }}
              >
                <span>✨</span> Generar mi pack de marketing
              </button>
            </div>
          </div>

          {/* Right: Info panel */}
          <div style={infoCard}>
            <div style={{ fontSize: 32, marginBottom: 16 }}>✨</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 8, letterSpacing: '-0.01em' }}>
              ¿Qué incluye tu pack?
            </div>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', marginBottom: 24, lineHeight: 1.65 }}>
              Contenido listo para copiar y publicar, adaptado a tu marca y sector.
            </p>
            {[
              { icon: '💼', text: '3 posts para LinkedIn con hook y copy completo' },
              { icon: '📱', text: '2 copies para Instagram con hashtags' },
              { icon: '🎨', text: 'Creativo visual generado con IA' },
              { icon: '📅', text: 'Calendario editorial de 4 semanas' },
              { icon: '📄', text: 'Todo en PDF descargable' },
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
              Descarga gratuita con email de trabajo
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Results ──────────────────────────────────────────────────────────────────

function MarketingResults({ data, imageBase64, empresa, onDownload, onBack }) {
  return (
    <div style={pageWrap}>
      <TopBar onBack={onBack} label="Agente Marketing" emoji="✨" accentColor="#22C55E" />

      <div style={{ ...outerWrap, maxWidth: 960 }}>

        {/* Header */}
        <div className="fade-in" style={{
          background: 'linear-gradient(135deg, #14532D, #22C55E)',
          borderRadius: 18, padding: '24px 32px',
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.65)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
            Pack de marketing creado ✓
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', marginBottom: 6 }}>{empresa}</h2>
          {data.estrategia && (
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 1.65, maxWidth: 560 }}>{data.estrategia}</p>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 16 }}>

          {/* LinkedIn posts */}
          {data.posts_linkedin?.length > 0 && (
            <div className="card fade-in">
              <div style={sectionTitle}>💼 Posts para LinkedIn</div>
              {data.posts_linkedin.map((post, i) => (
                <div key={i} style={{ paddingBottom: 18, marginBottom: 18, borderBottom: i < data.posts_linkedin.length - 1 ? '1px solid #F0FDFA' : 'none' }}>
                  {post.hook && (
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0D5C54', marginBottom: 8, lineHeight: 1.4, fontStyle: 'italic' }}>
                      "{post.hook}"
                    </div>
                  )}
                  <p style={{ fontSize: 12, color: '#4B6E6B', lineHeight: 1.7 }}>{post.copy}</p>
                </div>
              ))}
            </div>
          )}

          {/* Instagram posts */}
          {data.posts_instagram?.length > 0 && (
            <div className="card fade-in">
              <div style={sectionTitle}>📱 Copies para Instagram</div>
              {data.posts_instagram.map((post, i) => (
                <div key={i} style={{ paddingBottom: 18, marginBottom: 18, borderBottom: i < data.posts_instagram.length - 1 ? '1px solid #F0FDFA' : 'none' }}>
                  {post.titulo && <div style={{ fontSize: 13, fontWeight: 700, color: '#16A34A', marginBottom: 6 }}>{post.titulo}</div>}
                  <p style={{ fontSize: 12, color: '#4B6E6B', lineHeight: 1.7, marginBottom: 8 }}>{post.copy}</p>
                  {post.hashtags?.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {post.hashtags.map(h => (
                        <span key={h} style={{ fontSize: 10, color: '#22C55E', background: '#F0FDF4', borderRadius: 4, padding: '2px 7px', fontWeight: 600 }}>
                          #{h}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Creative image */}
          {imageBase64 && (
            <div className="card fade-in">
              <div style={sectionTitle}>🎨 Creativo visual generado con IA</div>
              <img
                src={imageBase64}
                alt="Creativo de marca"
                style={{ width: '100%', borderRadius: 12, objectFit: 'cover', maxHeight: 260 }}
              />
              {data.creativo_concepto?.mensaje_clave && (
                <div style={{ marginTop: 12, padding: '10px 14px', background: '#F0FDF4', borderRadius: 8, fontSize: 12, color: '#15803D', fontWeight: 600 }}>
                  💡 {data.creativo_concepto.mensaje_clave}
                </div>
              )}
            </div>
          )}

          {/* Calendar */}
          {data.calendario?.length > 0 && (
            <div className="card fade-in">
              <div style={sectionTitle}>📅 Calendario editorial — 4 semanas</div>
              {data.calendario.map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 14, padding: '10px 0', borderBottom: '1px solid #F0FDFA', alignItems: 'flex-start' }}>
                  <div style={{
                    fontSize: 10, fontWeight: 700, color: '#22C55E',
                    background: '#F0FDF4', border: '1px solid #BBF7D0',
                    borderRadius: 6, padding: '3px 8px', flexShrink: 0, whiteSpace: 'nowrap',
                  }}>
                    {item.semana}
                  </div>
                  <span style={{ fontSize: 12, color: '#4B6E6B', lineHeight: 1.5 }}>{item.accion}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Download CTA */}
        <div className="fade-in" style={{
          background: 'linear-gradient(135deg, #F0FDF4, #DCFCE7)',
          border: '1px solid #86EFAC', borderRadius: 16,
          padding: '22px 28px',
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
        }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#14532D', marginBottom: 4 }}>
              Tu pack de marketing está listo
            </div>
            <div style={{ fontSize: 13, color: '#16A34A' }}>
              Descarga el PDF con toda la estrategia, posts y creativo visual.
            </div>
          </div>
          <button
            onClick={onDownload}
            style={{
              padding: '13px 28px', fontSize: 14, fontWeight: 600,
              background: 'linear-gradient(135deg, #22C55E, #16A34A)',
              color: '#fff', border: 'none', borderRadius: 10,
              cursor: 'pointer', flexShrink: 0,
              boxShadow: '0 4px 14px rgba(34,197,94,0.3)',
            }}
          >
            📥 Descargar Pack PDF
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
        style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#5A8A85', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', padding: '6px 10px', borderRadius: 8, transition: 'all 0.15s' }}
        onMouseEnter={e => { e.currentTarget.style.background = '#F0FDF4'; e.currentTarget.style.color = '#0D5C54' }}
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

const sectionTitle = { fontSize: 13, fontWeight: 700, color: '#0D2B28', marginBottom: 14, letterSpacing: '-0.01em' }

const pageWrap = { minHeight: '100vh', background: 'var(--h-surface)', display: 'flex', flexDirection: 'column', fontFamily: 'var(--font-sans)' }
const outerWrap = { flex: 1, padding: '32px 28px', maxWidth: 1040, width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }
const twoCol = { display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start' }
const formCard = { background: '#fff', border: '1px solid #C8E0DD', borderRadius: 18, padding: '32px', boxShadow: '0 2px 12px rgba(13,92,84,0.06)' }
const infoCard = { background: 'linear-gradient(160deg, #0D5C54 0%, #094840 100%)', borderRadius: 18, padding: '28px 24px', position: 'sticky', top: 32 }
const cardTitle = { fontSize: 21, fontWeight: 800, color: '#0D2B28', marginBottom: 8, letterSpacing: '-0.025em', lineHeight: 1.2 }
const cardSub = { fontSize: 13, color: '#5A8A85', lineHeight: 1.65 }
const errorBox = { fontSize: 13, color: '#DC2626', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 14px' }

function agentBadge(color) {
  return { display: 'inline-block', fontSize: 11, fontWeight: 700, color, background: color + '12', border: `1px solid ${color}25`, borderRadius: 20, padding: '4px 12px', marginBottom: 14, letterSpacing: '0.03em' }
}
