import { useState } from 'react'
import Sidebar from './components/Sidebar'
import CentroMando from './pages/CentroMando'
import Inteligencia from './pages/Inteligencia'
import Pipeline from './pages/Pipeline'
import VentasCRM from './pages/VentasCRM'
import { Marketing, Marca, SEO } from './pages/OtherPages'
import { Bell, Search } from 'lucide-react'

const PAGE_TITLES = {
  comando:      'Centro de mando',
  inteligencia: 'Inteligencia de mercado',
  pipeline:     'Pipeline en vivo',
  marketing:    'Marketing y contenido',
  ventas:       'Ventas CRM',
  marca:        'Marca + Voz',
  seo:          'SEO + Auditoría',
}

const PAGE_SUBTITLES = {
  comando:      'Orquesta todos los agentes desde aquí',
  inteligencia: 'Competidores, señales y tendencias del sector',
  pipeline:     'Seguimiento de empresas en proceso de outreach',
  marketing:    'Calendario editorial y plan de contenido',
  ventas:       'Redacta, envía y hace tracking de emails',
  marca:        'Guía de tono y coherencia de marca',
  seo:          'Auditoría técnica y reporte PDF',
}

export default function App() {
  const [active, setActive] = useState('comando')

  const renderPage = () => {
    switch (active) {
      case 'comando':      return <CentroMando />
      case 'inteligencia': return <Inteligencia />
      case 'pipeline':     return <Pipeline />
      case 'marketing':    return <Marketing />
      case 'ventas':       return <VentasCRM />
      case 'marca':        return <Marca />
      case 'seo':          return <SEO />
      default:             return <CentroMando />
    }
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--h-surface)' }}>
      <Sidebar active={active} setActive={setActive} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Topbar */}
        <header style={{
          height: 64,
          background: 'var(--h-white)',
          borderBottom: '1px solid var(--h-border)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 28px',
          gap: 16,
          flexShrink: 0,
        }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--h-primary)', letterSpacing: '-0.02em' }}>
              {PAGE_TITLES[active]}
            </div>
            <div style={{ fontSize: 12, color: 'var(--h-muted)', marginTop: 1 }}>
              {PAGE_SUBTITLES[active]}
            </div>
          </div>
          <div style={{ flex: 1 }} />

          {/* Buscador */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'var(--h-surface)', border: '1px solid var(--h-border)',
            borderRadius: 10, padding: '7px 14px', width: 240,
            transition: 'all 0.2s',
          }}>
            <Search size={13} color="var(--h-muted)" />
            <input
              style={{ border: 'none', background: 'none', outline: 'none', fontSize: 13, color: 'var(--h-text)', width: '100%' }}
              placeholder="Buscar empresa, sector..."
            />
          </div>

          {/* Notificaciones */}
          <button style={{ position: 'relative', padding: 8, borderRadius: 8, color: 'var(--h-muted)', background: 'none', cursor: 'pointer' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--h-accent-soft)'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
          >
            <Bell size={17} />
            <span style={{
              position: 'absolute', top: 6, right: 6,
              width: 7, height: 7, borderRadius: '50%',
              background: '#DC2626', border: '1.5px solid white',
            }} />
          </button>

          {/* Avatar */}
          <div style={{
            width: 34, height: 34, borderRadius: '50%',
            background: 'var(--h-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700, color: 'white',
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(13,92,84,0.25)',
          }}>
            H
          </div>
        </header>

        {/* Content */}
        <main style={{ flex: 1, overflowY: 'auto' }}>
          {renderPage()}
        </main>
      </div>
    </div>
  )
}
