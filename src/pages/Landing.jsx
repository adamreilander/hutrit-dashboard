import { useState } from 'react'

const AGENTS = [
  {
    id: 'seo',
    emoji: '🔍',
    name: 'Agente SEO',
    tagline: 'Diagnóstico de posicionamiento web',
    description: 'Analiza cómo está posicionada tu empresa en los buscadores, detecta oportunidades de keywords y entrega un plan de acción con los pasos prioritarios.',
    caps: [
      'Análisis de keywords y competencia',
      'Diagnóstico técnico de tu sitio web',
      'Plan de acción priorizado con plazos',
    ],
    accent: '#0D9488',
    accentSoft: 'rgba(13,148,136,0.12)',
  },
  {
    id: 'marketing',
    emoji: '✨',
    name: 'Agente Marketing',
    tagline: 'Contenido listo para publicar',
    description: 'Crea posts, copys y un creativo visual personalizado para tu marca — listos para publicar en LinkedIn e Instagram.',
    caps: [
      'Posts para LinkedIn e Instagram',
      'Creativo visual con identidad de marca',
      'Estrategia de contenido por semana',
    ],
    accent: '#22C55E',
    accentSoft: 'rgba(34,197,94,0.12)',
  },
  {
    id: 'ventas',
    emoji: '🎯',
    name: 'Agente Ventas',
    tagline: 'Prospectos listos para contactar',
    description: 'Encuentra empresas que necesitan lo que ofreces, con análisis de oportunidad por empresa y estrategia de acercamiento personalizada.',
    caps: [
      'Lista de prospectos calificados',
      'Análisis de oportunidad por empresa',
      'Ángulo de outreach ideal para cada una',
    ],
    accent: '#F59E0B',
    accentSoft: 'rgba(245,158,11,0.12)',
  },
]

export default function Landing({ onSelect }) {
  const [hovered, setHovered] = useState(null)

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #061413 0%, #0B2320 45%, #071918 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '48px 24px 72px',
      fontFamily: 'var(--font-sans)',
    }}>

      {/* Logo */}
      <div className="fade-in" style={{ marginBottom: 56 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          fontSize: 24, fontWeight: 700, color: '#fff',
          letterSpacing: '-0.03em',
        }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: 'linear-gradient(135deg, #0D9488, #0D5C54)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 19, fontWeight: 800, color: '#fff',
            boxShadow: '0 4px 14px rgba(13,148,136,0.4)',
          }}>H</div>
          Hutrit
        </div>
      </div>

      {/* Hero */}
      <div style={{ textAlign: 'center', maxWidth: 620, marginBottom: 64, animation: 'fadeIn 0.6s ease 0.1s both' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'rgba(13,148,136,0.12)',
          border: '1px solid rgba(13,148,136,0.25)',
          borderRadius: 20, padding: '5px 14px', marginBottom: 22,
          color: '#0D9488', fontSize: 11, fontWeight: 700,
          letterSpacing: '0.1em', textTransform: 'uppercase',
        }}>
          ✦ Agentes de IA especializados
        </div>

        <h1 style={{
          fontSize: 'clamp(30px, 5vw, 50px)',
          fontWeight: 800, color: '#fff',
          lineHeight: 1.1, marginBottom: 18,
          letterSpacing: '-0.03em',
        }}>
          Descubre los Agentes<br />
          <span style={{ color: '#0D9488' }}>increíbles para tu empresa</span>
        </h1>

        <p style={{
          fontSize: 15, color: 'rgba(255,255,255,0.55)',
          lineHeight: 1.75, maxWidth: 460, margin: '0 auto',
        }}>
          Tres agentes especializados que analizan, crean y encuentran oportunidades.
          Cada uno entrega un informe PDF descargable al instante.
        </p>
      </div>

      {/* Agent cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 340px))',
        gap: 20,
        width: '100%', maxWidth: 1060,
        justifyContent: 'center',
      }}>
        {AGENTS.map((agent, i) => (
          <div
            key={agent.id}
            onClick={() => onSelect(agent.id)}
            onMouseEnter={() => setHovered(agent.id)}
            onMouseLeave={() => setHovered(null)}
            style={{
              background: hovered === agent.id
                ? 'rgba(255,255,255,0.07)'
                : 'rgba(255,255,255,0.03)',
              border: hovered === agent.id
                ? `1px solid ${agent.accent}50`
                : '1px solid rgba(255,255,255,0.08)',
              borderRadius: 20,
              padding: '28px 24px 24px',
              cursor: 'pointer',
              transition: 'all 0.22s',
              transform: hovered === agent.id ? 'translateY(-5px)' : 'translateY(0)',
              boxShadow: hovered === agent.id ? `0 20px 40px rgba(0,0,0,0.3)` : 'none',
              animation: `fadeIn 0.5s ease ${0.15 * i + 0.25}s both`,
              display: 'flex', flexDirection: 'column',
            }}
          >
            {/* Icon */}
            <div style={{
              width: 52, height: 52,
              background: agent.accentSoft,
              border: `1px solid ${agent.accent}30`,
              borderRadius: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 26, marginBottom: 18,
            }}>
              {agent.emoji}
            </div>

            {/* Tag */}
            <div style={{
              fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
              textTransform: 'uppercase', color: agent.accent, marginBottom: 6,
            }}>
              {agent.tagline}
            </div>

            {/* Name */}
            <h3 style={{
              fontSize: 19, fontWeight: 700, color: '#fff',
              marginBottom: 10, letterSpacing: '-0.01em',
            }}>
              {agent.name}
            </h3>

            {/* Description */}
            <p style={{
              fontSize: 13, color: 'rgba(255,255,255,0.5)',
              lineHeight: 1.65, marginBottom: 22, flex: 1,
            }}>
              {agent.description}
            </p>

            {/* Capabilities */}
            <ul style={{ listStyle: 'none', marginBottom: 24 }}>
              {agent.caps.map(cap => (
                <li key={cap} style={{
                  fontSize: 12, color: 'rgba(255,255,255,0.65)',
                  padding: '5px 0',
                  display: 'flex', alignItems: 'flex-start', gap: 9,
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                }}>
                  <span style={{ color: agent.accent, marginTop: 1, flexShrink: 0 }}>✓</span>
                  {cap}
                </li>
              ))}
            </ul>

            {/* CTA button */}
            <button style={{
              width: '100%', padding: '12px 0',
              background: hovered === agent.id ? agent.accent : 'transparent',
              border: `1.5px solid ${agent.accent}`,
              borderRadius: 10,
              color: hovered === agent.id ? '#fff' : agent.accent,
              fontSize: 13, fontWeight: 600,
              transition: 'all 0.2s',
              cursor: 'pointer',
              letterSpacing: '-0.01em',
            }}>
              Usar {agent.name} →
            </button>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ marginTop: 72, fontSize: 12, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.02em' }}>
        hutrit.com · Impulsado por IA · Resultados descargables
      </div>
    </div>
  )
}
