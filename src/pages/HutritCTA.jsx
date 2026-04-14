const AGENT_CONTENT = {
  seo: {
    emoji: '🔍',
    titulo: 'Tu empresa merece estar en el top de Google',
    descripcion: 'El informe que acabas de descargar es solo el comienzo. Con Hutrit puedes tener un equipo de especialistas SEO de LATAM trabajando en tiempo completo por tu empresa — a una fracción del coste local.',
    capabilities: [
      'Estrategia SEO continua y en evolución',
      'Creación de contenido optimizado semanalmente',
      'Seguimiento de keywords y rankings en tiempo real',
      'Auditorías técnicas recurrentes',
    ],
    cta: 'Quiero un especialista SEO full-time',
  },
  marketing: {
    emoji: '✨',
    titulo: 'El contenido que acabas de crear puede ser diario',
    descripcion: 'Imagina tener un equipo de marketing de contenido trabajando para tu empresa todos los días — creando posts, creativos y estrategias alineadas con tu marca.',
    capabilities: [
      'Creación de contenido diario para redes sociales',
      'Diseñadores y copywriters especializados en tu sector',
      'Gestión completa de LinkedIn, Instagram y más',
      'Reportes mensuales de rendimiento y ajuste estratégico',
    ],
    cta: 'Quiero un equipo de marketing full-time',
  },
  ventas: {
    emoji: '🎯',
    titulo: 'Tu pipeline de ventas puede llenarse solo',
    descripcion: 'Los prospectos que encontraste hoy son el inicio. Con Hutrit puedes tener un SDR de LATAM dedicado exclusivamente a encontrar y contactar empresas para ti, todos los días.',
    capabilities: [
      'Prospección diaria de nuevas empresas objetivo',
      'Outreach personalizado por email y LinkedIn',
      'Seguimiento sistemático y gestión del pipeline',
      'Reportes semanales con resultados y ajustes',
    ],
    cta: 'Quiero un SDR full-time para mi empresa',
  },
}

export default function HutritCTA({ agent, onBack }) {
  const content = AGENT_CONTENT[agent] || AGENT_CONTENT.seo

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
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background decoration */}
      <div style={{
        position: 'absolute', top: '10%', right: '5%',
        width: 300, height: 300, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(13,148,136,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '15%', left: '5%',
        width: 200, height: 200, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(13,92,84,0.12) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ width: '100%', maxWidth: 600, textAlign: 'center', animation: 'fadeIn 0.5s ease' }}>

        {/* Logo */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 10, marginBottom: 40,
          fontSize: 22, fontWeight: 700, color: '#fff',
          letterSpacing: '-0.03em',
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

        {/* Agent emoji */}
        <div style={{
          width: 64, height: 64, borderRadius: 18,
          background: 'rgba(13,148,136,0.12)',
          border: '1px solid rgba(13,148,136,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 30, margin: '0 auto 24px',
        }}>
          {content.emoji}
        </div>

        {/* Badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'rgba(13,148,136,0.12)', border: '1px solid rgba(13,148,136,0.25)',
          borderRadius: 20, padding: '5px 14px', marginBottom: 20,
          color: '#0D9488', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
        }}>
          ✦ ¿Y si esto fuera diario?
        </div>

        {/* Title */}
        <h1 style={{
          fontSize: 'clamp(24px, 4vw, 38px)',
          fontWeight: 800, color: '#fff',
          lineHeight: 1.15, marginBottom: 16,
          letterSpacing: '-0.03em',
        }}>
          {content.titulo}
        </h1>

        {/* Description */}
        <p style={{
          fontSize: 15, color: 'rgba(255,255,255,0.6)',
          lineHeight: 1.75, marginBottom: 32, maxWidth: 500, margin: '0 auto 32px',
        }}>
          {content.descripcion}
        </p>

        {/* Capabilities */}
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 14, padding: '20px 24px',
          marginBottom: 36, textAlign: 'left',
        }}>
          {content.capabilities.map((cap, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '7px 0',
              borderBottom: i < content.capabilities.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
            }}>
              <span style={{ color: '#0D9488', fontSize: 14, flexShrink: 0 }}>✓</span>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>{cap}</span>
            </div>
          ))}
        </div>

        {/* CTA button */}
        <button
          onClick={openCalendly}
          style={{
            width: '100%', padding: '16px 24px',
            background: 'linear-gradient(135deg, #0D9488, #0D5C54)',
            border: 'none', borderRadius: 12,
            color: '#fff', fontSize: 15, fontWeight: 700,
            cursor: 'pointer', letterSpacing: '-0.01em',
            boxShadow: '0 8px 24px rgba(13,148,136,0.35)',
            transition: 'all 0.2s',
            marginBottom: 14,
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 30px rgba(13,148,136,0.45)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(13,148,136,0.35)' }}
        >
          📅 {content.cta}
        </button>

        <button
          onClick={onBack}
          style={{
            background: 'none', border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 10, padding: '12px 24px', width: '100%',
            color: 'rgba(255,255,255,0.4)', fontSize: 13,
            cursor: 'pointer', transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)' }}
        >
          Probar otro agente
        </button>

        {/* Footer */}
        <div style={{ marginTop: 36, fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>
          hutrit.com · Talento LATAM para empresas europeas
        </div>
      </div>
    </div>
  )
}
