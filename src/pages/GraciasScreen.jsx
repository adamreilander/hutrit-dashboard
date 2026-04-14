export default function GraciasScreen({ onContinue }) {
  const openCalendly = () => {
    window.open('https://calendly.com/reunion-ceo/30min', '_blank')
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #061413 0%, #0B2320 45%, #071918 100%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-sans)',
      padding: '48px 24px',
    }}>
      <div style={{ width: '100%', maxWidth: 520, textAlign: 'center', animation: 'fadeIn 0.5s ease' }}>

        {/* Logo */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 10, marginBottom: 40,
          fontSize: 22, fontWeight: 700, color: '#fff',
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 11,
            background: 'linear-gradient(135deg, #0D9488, #0D5C54)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, fontWeight: 800, color: '#fff',
            boxShadow: '0 6px 20px rgba(13,148,136,0.4)',
          }}>H</div>
          Hutrit
        </div>

        {/* Check icon */}
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: 'rgba(34,197,94,0.12)',
          border: '2px solid rgba(34,197,94,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 32, margin: '0 auto 28px',
          animation: 'fadeIn 0.4s ease 0.1s both',
        }}>
          ✅
        </div>

        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)',
          borderRadius: 20, padding: '5px 14px', marginBottom: 18,
          color: '#22C55E', fontSize: 11, fontWeight: 700,
          letterSpacing: '0.1em', textTransform: 'uppercase',
        }}>
          ✦ Pack descargado con éxito
        </div>

        <h1 style={{
          fontSize: 'clamp(26px, 4vw, 40px)',
          fontWeight: 800, color: '#fff',
          lineHeight: 1.15, marginBottom: 16,
          letterSpacing: '-0.03em',
        }}>
          ¡Tu pack de marketing<br />
          <span style={{ color: '#22C55E' }}>está en tus manos!</span>
        </h1>

        <p style={{
          fontSize: 15, color: 'rgba(255,255,255,0.6)',
          lineHeight: 1.75, marginBottom: 36, maxWidth: 440, margin: '0 auto 36px',
        }}>
          El PDF con tu estrategia de contenido, posts y creativo visual ya está descargado. Úsalo como tu punto de partida.
        </p>

        {/* Value prop box */}
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 16, padding: '24px',
          marginBottom: 32, textAlign: 'left',
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#22C55E', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>
            ¿Quieres que esto sea tu realidad cada día?
          </div>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, marginBottom: 16 }}>
            Con Hutrit puedes tener un equipo de marketing de LATAM trabajando en tu empresa full-time — creando contenido, gestionando redes y midiendo resultados — por mucho menos de lo que crees.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              'Diseñadores y copywriters especializados en tu sector',
              'Contenido diario para LinkedIn, Instagram y más',
              'Sin costes de contratación ni burocracia',
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: '#22C55E', fontSize: 13 }}>✓</span>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Primary CTA */}
        <button
          onClick={openCalendly}
          style={{
            width: '100%', padding: '16px 24px',
            background: 'linear-gradient(135deg, #22C55E, #16A34A)',
            border: 'none', borderRadius: 12,
            color: '#fff', fontSize: 15, fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(34,197,94,0.3)',
            transition: 'all 0.2s', marginBottom: 12,
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 30px rgba(34,197,94,0.4)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(34,197,94,0.3)' }}
        >
          📅 Hablar con el equipo de Hutrit
        </button>

        <button
          onClick={onContinue}
          style={{
            background: 'none', border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 10, padding: '12px 24px', width: '100%',
            color: 'rgba(255,255,255,0.4)', fontSize: 13,
            cursor: 'pointer', transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)' }}
        >
          Ver más sobre Hutrit →
        </button>

        <div style={{ marginTop: 36, fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>
          hutrit.com · hutriteuropa@gmail.com
        </div>
      </div>
    </div>
  )
}
