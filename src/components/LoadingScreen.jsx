export default function LoadingScreen({ steps, currentStep, agentName }) {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--h-surface)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-sans)',
      padding: 24,
    }}>
      {/* Card container */}
      <div style={{
        background: '#fff',
        border: '1px solid #C8E0DD',
        borderRadius: 24,
        padding: '48px 40px',
        width: '100%', maxWidth: 440,
        textAlign: 'center',
        boxShadow: '0 4px 24px rgba(13,92,84,0.08)',
        animation: 'fadeIn 0.3s ease',
      }}>
        {/* Animated icon */}
        <div style={{ position: 'relative', width: 72, height: 72, margin: '0 auto 28px' }}>
          <div style={{
            position: 'absolute', inset: 0,
            borderRadius: '50%',
            border: '3px solid #C8E0DD',
          }} />
          <div style={{
            position: 'absolute', inset: 0,
            borderRadius: '50%',
            border: '3px solid transparent',
            borderTopColor: '#0D9488',
            animation: 'spin 0.9s linear infinite',
          }} />
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28,
          }}>
            🤖
          </div>
        </div>

        {/* Label */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: '#F0FDFA', border: '1px solid #C8E0DD',
          borderRadius: 20, padding: '4px 12px', marginBottom: 14,
          color: '#0D9488', fontSize: 11, fontWeight: 700,
          letterSpacing: '0.08em', textTransform: 'uppercase',
        }}>
          {agentName} trabajando
        </div>

        <h2 style={{
          fontSize: 20, fontWeight: 700, color: '#0D2B28',
          marginBottom: 32, letterSpacing: '-0.02em',
        }}>
          Analizando para ti...
        </h2>

        {/* Steps */}
        <div style={{ textAlign: 'left' }}>
          {steps.map((step, i) => {
            const done = i < currentStep
            const active = i === currentStep
            return (
              <div key={step} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '9px 0',
                borderBottom: i < steps.length - 1 ? '1px solid #F0FDFA' : 'none',
                opacity: i > currentStep ? 0.3 : 1,
                transition: 'opacity 0.4s',
              }}>
                <div style={{
                  width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                  background: done ? '#0D9488' : active ? '#F0FDFA' : '#F7FAFA',
                  border: active ? '1.5px solid #0D9488' : done ? 'none' : '1.5px solid #C8E0DD',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, transition: 'all 0.3s',
                }}>
                  {done
                    ? <span style={{ color: '#fff', fontSize: 10 }}>✓</span>
                    : active
                      ? <span style={{
                          width: 7, height: 7, borderRadius: '50%',
                          background: '#0D9488', display: 'block',
                          animation: 'pulse 1s infinite',
                        }} />
                      : null}
                </div>
                <span style={{
                  fontSize: 13,
                  color: done ? '#5A8A85' : active ? '#0F2724' : '#9BBFBC',
                  fontWeight: active ? 600 : 400,
                  transition: 'all 0.3s',
                }}>
                  {step}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
