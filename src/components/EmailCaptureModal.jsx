import { useState } from 'react'

/**
 * EmailCaptureModal
 * type: 'simple' → solo email
 * type: 'full'   → email + nombre + empresa + teléfono
 */
export default function EmailCaptureModal({ onConfirm, onClose, title, subtitle, type = 'simple' }) {
  const [fields, setFields] = useState({ email: '', nombre: '', empresa: '', telefono: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (key) => (e) => setFields(prev => ({ ...prev, [key]: e.target.value }))

  const validate = () => {
    if (!fields.email.trim() || !fields.email.includes('@')) {
      setError('Ingresa un email válido')
      return false
    }
    if (type === 'full') {
      if (!fields.nombre.trim()) { setError('Ingresa tu nombre'); return false }
      if (!fields.empresa.trim()) { setError('Ingresa el nombre de tu empresa'); return false }
    }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    setError('')
    await new Promise(r => setTimeout(r, 400))
    onConfirm(fields)
    setLoading(false)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(6,20,19,0.75)',
      backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000,
      padding: 24,
      animation: 'fadeIn 0.2s ease',
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 20,
        padding: '36px 32px',
        width: '100%', maxWidth: 420,
        boxShadow: '0 24px 60px rgba(0,0,0,0.25)',
        animation: 'fadeIn 0.25s ease',
      }}>
        {/* Icon */}
        <div style={{
          width: 48, height: 48,
          background: 'linear-gradient(135deg, #0D9488, #0D5C54)',
          borderRadius: 14,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, marginBottom: 20,
        }}>
          📄
        </div>

        <h2 style={{
          fontSize: 20, fontWeight: 700,
          color: '#0D2B28', marginBottom: 6,
          letterSpacing: '-0.02em',
        }}>
          {title}
        </h2>
        <p style={{ fontSize: 13, color: '#5A8A85', marginBottom: 24, lineHeight: 1.6 }}>
          {subtitle}
        </p>

        <form onSubmit={handleSubmit}>
          {type === 'full' && (
            <>
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Tu nombre</label>
                <input
                  className="input-field"
                  placeholder="Ej: María García"
                  value={fields.nombre}
                  onChange={set('nombre')}
                />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Empresa</label>
                <input
                  className="input-field"
                  placeholder="Nombre de tu empresa"
                  value={fields.empresa}
                  onChange={set('empresa')}
                />
              </div>
            </>
          )}

          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Email de trabajo</label>
            <input
              className="input-field"
              type="email"
              placeholder="tu@empresa.com"
              value={fields.email}
              onChange={set('email')}
            />
          </div>

          {type === 'full' && (
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Teléfono <span style={{ color: '#9BBFBC', fontWeight: 400 }}>(opcional)</span></label>
              <input
                className="input-field"
                placeholder="+34 600 000 000"
                value={fields.telefono}
                onChange={set('telefono')}
              />
            </div>
          )}

          {error && (
            <div style={{
              fontSize: 12, color: '#DC2626',
              background: '#FEE2E2', borderRadius: 8,
              padding: '8px 12px', marginBottom: 14,
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: 14, marginTop: 4 }}
          >
            {loading ? <><span className="spinner" />Preparando PDF...</> : '📥 Descargar PDF gratuito'}
          </button>
        </form>

        <button
          onClick={onClose}
          style={{
            display: 'block', width: '100%', textAlign: 'center',
            marginTop: 14, fontSize: 12, color: '#9BBFBC',
            background: 'none', border: 'none', cursor: 'pointer',
          }}
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}

const labelStyle = {
  display: 'block',
  fontSize: 12, fontWeight: 600,
  color: '#0F2724', marginBottom: 6,
  letterSpacing: '-0.01em',
}
