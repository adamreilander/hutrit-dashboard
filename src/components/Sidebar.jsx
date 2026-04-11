import { useState } from 'react'
import {
  LayoutDashboard, Search, Users, Megaphone,
  Mail, BarChart2, Palette, ChevronRight, ChevronLeft, MessageSquare
} from 'lucide-react'

const NAV = [
  { id: 'comando',      icon: LayoutDashboard, label: 'Centro de mando',   badge: null },
  { id: 'chat',         icon: MessageSquare,   label: 'Chat con agente',   badge: 'IA' },
  { id: 'inteligencia', icon: Search,           label: 'Inteligencia',      badge: 'Live' },
  { id: 'pipeline',     icon: Users,            label: 'Pipeline',          badge: '18' },
  { id: 'marketing',    icon: Megaphone,        label: 'Marketing',         badge: null },
  { id: 'ventas',       icon: Mail,             label: 'Ventas CRM',        badge: '3' },
  { id: 'marca',        icon: Palette,          label: 'Marca + Voz',       badge: null },
  { id: 'seo',          icon: BarChart2,        label: 'SEO + Auditoría',   badge: null },
]

export default function Sidebar({ active, setActive }) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside style={{
      width: collapsed ? 64 : 224,
      minWidth: collapsed ? 64 : 224,
      background: '#0B4A43',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      transition: 'width 0.25s ease, min-width 0.25s ease',
      overflow: 'hidden',
      position: 'sticky',
      top: 0,
      flexShrink: 0,
      borderRight: '1px solid rgba(255,255,255,0.06)',
    }}>
      {/* Logo */}
      <div style={{
        padding: collapsed ? '18px 0' : '18px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        minHeight: 64,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Logo Hutrit real */}
          <div style={{
            width: 36, height: 36,
            borderRadius: 8,
            background: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            padding: 4,
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          }}>
            <img
              src="/logo.png"
              alt="Hutrit"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }}
            />
            <span style={{ display:'none', color:'#0D5C54', fontWeight:700, fontSize:12 }}>H</span>
          </div>
          {!collapsed && (
            <div>
              <div style={{ color: 'white', fontWeight: 700, fontSize: 15, letterSpacing: '-0.02em' }}>
                Hutrit
              </div>
              <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10 }}>
                Dashboard Pro
              </div>
            </div>
          )}
        </div>
        {!collapsed && (
          <button onClick={() => setCollapsed(true)} style={{ color: 'rgba(255,255,255,0.35)', padding: 4, borderRadius: 4 }}>
            <ChevronLeft size={14} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '10px 8px', overflowY: 'auto' }}>
        {collapsed && (
          <button
            onClick={() => setCollapsed(false)}
            style={{ width: '100%', display: 'flex', justifyContent: 'center', padding: '8px 0', color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}
          >
            <ChevronRight size={14} />
          </button>
        )}

        {NAV.map(({ id, icon: Icon, label, badge }) => {
          const isActive = active === id
          return (
            <button
              key={id}
              onClick={() => setActive(id)}
              title={collapsed ? label : undefined}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: collapsed ? '10px 0' : '9px 12px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                borderRadius: 8,
                marginBottom: 2,
                background: isActive ? 'rgba(255,255,255,0.12)' : 'transparent',
                color: isActive ? 'white' : 'rgba(255,255,255,0.55)',
                fontSize: 13,
                fontWeight: isActive ? 600 : 400,
                transition: 'all 0.15s',
                borderLeft: isActive && !collapsed ? '2px solid rgba(255,255,255,0.8)' : '2px solid transparent',
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'rgba(255,255,255,0.85)'; }}
              onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; } }}
            >
              <Icon size={16} strokeWidth={isActive ? 2.5 : 1.8} style={{ flexShrink: 0 }} />
              {!collapsed && (
                <>
                  <span style={{ flex: 1, textAlign: 'left' }}>{label}</span>
                  {badge && (
                    <span style={{
                      fontSize: 10, fontWeight: 600, padding: '1px 6px',
                      borderRadius: 10,
                      background: badge === 'Live' ? 'rgba(134,239,172,0.2)' : 'rgba(255,255,255,0.15)',
                      color: badge === 'Live' ? '#86EFAC' : 'rgba(255,255,255,0.7)',
                    }}>
                      {badge}
                    </span>
                  )}
                </>
              )}
            </button>
          )
        })}
      </nav>

      {/* Divider */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', margin: '0 8px' }} />

      {/* Footer */}
      <div style={{
        padding: collapsed ? '14px 0' : '14px 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'flex-start',
        gap: 10,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: 'rgba(255,255,255,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 700, color: 'white', flexShrink: 0,
          border: '1.5px solid rgba(255,255,255,0.2)',
        }}>
          H
        </div>
        {!collapsed && (
          <div style={{ minWidth: 0 }}>
            <div style={{ color: 'white', fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>hutriteuropa</div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>@gmail.com</div>
          </div>
        )}
      </div>
    </aside>
  )
}
