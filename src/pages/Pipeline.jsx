import { useState } from 'react'
import { Mail, Eye, MessageSquare, Calendar, CheckCircle, ArrowRight, Plus, Building } from 'lucide-react'

const STAGES = [
  { id: 'identified', label: 'Identificadas', color: '#64748B', count: 16 },
  { id: 'sent',       label: 'Email enviado', color: '#0D9488', count: 8  },
  { id: 'opened',     label: 'Abierto',        color: '#D97706', count: 5  },
  { id: 'replied',    label: 'Respondido',     color: '#7C3AED', count: 3  },
  { id: 'meeting',    label: 'Reunión',         color: '#059669', count: 1  },
]

const CARDS = {
  identified: [
    { id: 1, name: 'LogiTech Solutions',  sector: 'Logística',   contact: 'Anna García',   note: 'Detectada en LinkedIn — contratando 3 roles tech' },
    { id: 2, name: 'FinStart EU',         sector: 'Fintech',     contact: 'Marc Torres',   note: 'Pixel de Meta activo — invertiendo en ads' },
    { id: 3, name: 'HealthData Pro',      sector: 'Healthtech',  contact: 'Laura Vidal',   note: 'Crecimiento de equipo +40% este trimestre' },
  ],
  sent: [
    { id: 4, name: 'CloudBridge SL',      sector: 'SaaS',        contact: 'Pedro Ruiz',    note: 'Email enviado hace 2 días · sin respuesta', sentAt: '08 Apr' },
    { id: 5, name: 'RetailOS',            sector: 'Retail Tech', contact: 'Sara Molina',   note: 'Email enviado hace 3 días · sin respuesta', sentAt: '07 Apr' },
  ],
  opened: [
    { id: 6, name: 'AgroTech Iberia',     sector: 'AgriTech',    contact: 'Jordi Puig',    note: 'Abierto 3 veces — alta intención', opens: 3 },
    { id: 7, name: 'EduSpark',            sector: 'EdTech',      contact: 'Marta León',    note: 'Abierto 1 vez — enviar follow-up',  opens: 1 },
  ],
  replied: [
    { id: 8, name: 'TechVenture BCN',     sector: 'HR Tech',     contact: 'Alex Comas',    note: 'Respuesta positiva — piden demo' },
    { id: 9, name: 'DataFlow Systems',    sector: 'Data',        contact: 'Irene Sanz',    note: 'Interesados en el servicio premium' },
  ],
  meeting: [
    { id: 10, name: 'InnovateMed',        sector: 'MedTech',     contact: 'Carlos Font',   note: 'Reunión agendada para el 15 de abril' },
  ],
}

const sectorColors = { 'HR Tech': '#7C3AED', 'SaaS': '#0D9488', 'Fintech': '#059669', 'Logística': '#D97706', 'Healthtech': '#DC2626', 'AgriTech': '#065F46', 'EdTech': '#92400E', 'Data': '#0B7A70', 'MedTech': '#6D28D9', 'Retail Tech': '#9D174D' }

export default function Pipeline() {
  const [dragging, setDragging] = useState(null)

  const total = STAGES.reduce((a, s) => a + s.count, 0)

  return (
    <div className="fade-in" style={{ padding: '28px 32px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.03em' }}>Pipeline en vivo</h1>
          <p style={{ color: 'var(--h-muted)', fontSize: 13, marginTop: 4 }}>{total} empresas en seguimiento activo</p>
        </div>
        <button className="btn-primary"><Plus size={13} />Añadir empresa</button>
      </div>

      {/* Progress bar total */}
      <div className="card" style={{ marginBottom: 20, padding: '14px 20px' }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          {STAGES.map(s => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color }} />
              <span style={{ fontSize: 12, color: 'var(--h-muted)' }}>{s.label}</span>
              <span style={{ fontSize: 13, fontWeight: 700 }}>{s.count}</span>
            </div>
          ))}
          <div style={{ marginLeft: 'auto', fontSize: 13, fontWeight: 600, color: '#059669' }}>
            Tasa cierre: {Math.round((CARDS.meeting.length / total) * 100)}%
          </div>
        </div>
        <div style={{ display: 'flex', height: 6, borderRadius: 3, overflow: 'hidden', marginTop: 10, gap: 2 }}>
          {STAGES.map(s => (
            <div key={s.id} style={{ flex: s.count, background: s.color, borderRadius: 2, transition: 'flex 0.3s' }} />
          ))}
        </div>
      </div>

      {/* Kanban */}
      <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 16 }}>
        {STAGES.map(stage => (
          <div key={stage.id} style={{ minWidth: 220, flex: '0 0 220px' }}>
            {/* Header columna */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, padding: '0 4px' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: stage.color }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--h-text)' }}>{stage.label}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: stage.color, marginLeft: 'auto',
                background: `${stage.color}15`, padding: '2px 8px', borderRadius: 10 }}>
                {stage.count}
              </span>
            </div>

            {/* Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(CARDS[stage.id] || []).map(card => (
                <KanbanCard key={card.id} card={card} stageColor={stage.color} />
              ))}
              <button style={{
                width: '100%', padding: '8px', borderRadius: 8,
                border: '1.5px dashed var(--h-border)', background: 'transparent',
                color: 'var(--h-muted)', fontSize: 12, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
              }}>
                <Plus size={12} /> Añadir
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function KanbanCard({ card, stageColor }) {
  const [hovered, setHovered] = useState(false)
  const sc = sectorColors[card.sector] || '#0D9488'

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'var(--h-white)',
        border: `1px solid ${hovered ? stageColor : 'var(--h-border)'}`,
        borderRadius: 10,
        padding: '12px 14px',
        cursor: 'pointer',
        transition: 'all 0.15s',
        borderLeft: `3px solid ${stageColor}`,
        boxShadow: hovered ? 'var(--shadow-md)' : 'var(--shadow-sm)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6, marginBottom: 6 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600 }}>{card.name}</div>
          <div style={{ fontSize: 11, color: 'var(--h-muted)', marginTop: 1 }}>{card.contact}</div>
        </div>
        <div style={{ width: 24, height: 24, borderRadius: 6, background: `${sc}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Building size={11} color={sc} />
        </div>
      </div>
      <span style={{ fontSize: 10, background: `${sc}15`, color: sc, padding: '2px 6px', borderRadius: 4, fontWeight: 500 }}>
        {card.sector}
      </span>
      <div style={{ fontSize: 11, color: 'var(--h-muted)', marginTop: 8, lineHeight: 1.5 }}>{card.note}</div>
      {card.opens && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 6 }}>
          <Eye size={11} color="#D97706" />
          <span style={{ fontSize: 11, color: '#D97706', fontWeight: 500 }}>Abierto {card.opens}x</span>
        </div>
      )}
      {card.sentAt && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 6 }}>
          <Mail size={11} color="var(--h-muted)" />
          <span style={{ fontSize: 11, color: 'var(--h-muted)' }}>{card.sentAt}</span>
        </div>
      )}
    </div>
  )
}
