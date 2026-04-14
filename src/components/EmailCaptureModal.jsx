import { useState } from 'react'

const STEPS = [
  {
    key: 'email',
    type: 'email',
    label: '¿Cuál es tu email de trabajo?',
    placeholder: 'tu@empresa.com',
    optional: false,
  },
  {
    key: 'nombre',
    type: 'text',
    label: '¿Cómo te llamas?',
    placeholder: 'Tu nombre y apellido',
    optional: false,
  },
  {
    key: 'empresa',
    type: 'text',
    label: '¿En qué empresa trabajas?',
    placeholder: 'Nombre de tu empresa',
    optional: false,
  },
  {
    key: 'telefono',
    type: 'tel',
    label: '¿Cuál es tu teléfono?',
    placeholder: '+34 600 000 000',
    optional: true,
  },
]

export default function EmailCaptureModal({ onConfirm, onClose, title }) {
  const [step, setStep] = useState(0)
  const [fields, setFields] = useState({ email: '', nombre: '', empresa: '', telefono: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const current = STEPS[step]
  const isLast = step === STEPS.length - 1
  const progress = ((step) / STEPS.length) * 100

  const validate = () => {
    const val = fields[current.key]?.trim()
    if (!current.optional && !val) {
      setError('Este campo es obligatorio')
      return false
    }
    if (current.key === 'email' && val && !val.includes('@')) {
      setError('Ingresa un email válido')
      return false
    }
    return true
  }

  const handleNext = async (e) => {
    e?.preventDefault()
    setError('')
    if (!validate()) return

    if (isLast) {
      setLoading(true)
      await new Promise(r => setTimeout(r, 300))
      onConfirm(fields)
      setLoading(false)
    } else {
      setStep(s => s + 1)
    }
  }

  const handleSkip = () => {
    setError('')
    if (isLast) {
      onConfirm(fields)
    } else {
      setStep(s => s + 1)
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter') handleNext()
  }

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(6,20,19,0.7)',
      backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: 24,
      animation: 'fadeIn 0.2s ease',
    }}>
      <div style={{
        background: '#fff', borderRadius: 22,
        width: '100%', maxWidth: 400,
        boxShadow: '0 24px 60px rgba(0,0,0,0.2)',
        overflow: 'hidden',
        animation: 'fadeIn 0.25s ease',
      }}>
        {/* Progress bar */}
        <div style={{ height: 3, background: '#F0FDFA' }}>
          <div style={{
            height: '100%',
            width: `${((step + 1) / STEPS.length) * 100}%`,
            background: 'linear-gradient(90deg, #0D9488, #22C55E)',
            transition: 'width 0.4s ease',
            borderRadius: '0 2px 2px 0',
          }} />
        </div>

        <div style={{ padding: '32px 32px 28px' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
            {/* Back button */}
            <button
              onClick={() => step > 0 ? setStep(s => s - 1) : onClose()}
              style={{
                width: 32, height: 32, borderRadius: '50%',
                background: '#F7FAFA', border: '1px solid #C8E0DD',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', fontSize: 14, color: '#5A8A85',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#F0FDFA'}
              onMouseLeave={e => e.currentTarget.style.background = '#F7FAFA'}
            >
              ←
            </button>

            {/* Step dots */}
            <div style={{ display: 'flex', gap: 6 }}>
              {STEPS.map((_, i) => (
                <div key={i} style={{
                  width: i === step ? 18 : 6,
                  height: 6, borderRadius: 3,
                  background: i <= step ? '#0D9488' : '#C8E0DD',
                  transition: 'all 0.3s',
                }} />
              ))}
            </div>

            {/* Step counter */}
            <div style={{ fontSize: 12, color: '#9BBFBC', fontWeight: 600 }}>
              {step + 1} / {STEPS.length}
            </div>
          </div>

          {/* Title (solo en el primer paso) */}
          {step === 0 && title && (
            <div style={{ marginBottom: 6 }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: '#F0FDFA', border: '1px solid #C8E0DD',
                borderRadius: 20, padding: '4px 12px', marginBottom: 16,
                color: '#0D9488', fontSize: 11, fontWeight: 700,
                letterSpacing: '0.08em', textTransform: 'uppercase',
              }}>
                📄 {title}
              </div>
            </div>
          )}

          {/* Question */}
          <h2 style={{
            fontSize: 22, fontWeight: 800, color: '#0D2B28',
            marginBottom: 20, letterSpacing: '-0.025em', lineHeight: 1.2,
          }}>
            {current.label}
          </h2>

          {/* Input */}
          <form onSubmit={handleNext}>
            <input
              key={current.key}
              type={current.type}
              className="input-field"
              placeholder={current.placeholder}
              value={fields[current.key]}
              onChange={e => setFields(p => ({ ...p, [current.key]: e.target.value }))}
              onKeyDown={handleKey}
              autoFocus
              style={{ fontSize: 15, padding: '13px 16px' }}
            />

            {error && (
              <div style={{
                fontSize: 12, color: '#DC2626',
                background: '#FEF2F2', border: '1px solid #FECACA',
                borderRadius: 8, padding: '8px 12px', marginTop: 10,
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', marginTop: 16, padding: '14px',
                background: 'linear-gradient(135deg, #0D9488, #0D5C54)',
                color: '#fff', border: 'none', borderRadius: 12,
                fontSize: 14, fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: '0 4px 14px rgba(13,148,136,0.25)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = 'translateY(-1px)' }}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)' }
            >
              {loading
                ? <><span className="spinner" /> Preparando PDF...</>
                : isLast ? '📥 Descargar PDF gratuito' : 'Continuar →'
              }
            </button>

            {current.optional && (
              <button
                type="button"
                onClick={handleSkip}
                style={{
                  width: '100%', marginTop: 10, padding: '10px',
                  background: 'none', border: 'none',
                  fontSize: 12, color: '#9BBFBC',
                  cursor: 'pointer', transition: 'color 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.color = '#5A8A85'}
                onMouseLeave={e => e.currentTarget.style.color = '#9BBFBC'}
              >
                Omitir este paso →
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}
