import { useState } from 'react'
import { Mail, Eye, MessageSquare, Calendar, CheckCircle, Plus, Building, Search, MapPin, Globe, Database, AlertCircle, ChevronDown, ChevronUp, X } from 'lucide-react'

const STAGES = [
  { id: 'identified', label: 'Identificadas', color: '#64748B' },
  { id: 'sent',       label: 'Email enviado', color: '#0D9488' },
  { id: 'opened',     label: 'Abierto',        color: '#D97706' },
  { id: 'replied',    label: 'Respondido',     color: '#7C3AED' },
  { id: 'meeting',    label: 'Reunión',         color: '#059669' },
]

const CARDS_INIT = {
  identified: [
    { id: 1, name: 'LogiTech Solutions', sector: 'Logística',  contact: 'Anna García',  note: 'Detectada en LinkedIn — contratando 3 roles tech' },
    { id: 2, name: 'FinStart EU',        sector: 'Fintech',    contact: 'Marc Torres',  note: 'Pixel de Meta activo — invertiendo en ads' },
    { id: 3, name: 'HealthData Pro',     sector: 'Healthtech', contact: 'Laura Vidal',  note: 'Crecimiento de equipo +40% este trimestre' },
  ],
  sent: [
    { id: 4, name: 'CloudBridge SL',    sector: 'SaaS',        contact: 'Pedro Ruiz',  note: 'Email enviado hace 2 días · sin respuesta', sentAt: '08 Apr' },
    { id: 5, name: 'RetailOS',          sector: 'Retail Tech', contact: 'Sara Molina', note: 'Email enviado hace 3 días · sin respuesta', sentAt: '07 Apr' },
  ],
  opened:  [
    { id: 6, name: 'AgroTech Iberia',   sector: 'AgriTech',   contact: 'Jordi Puig',  note: 'Abierto 3 veces — alta intención', opens: 3 },
    { id: 7, name: 'EduSpark',          sector: 'EdTech',     contact: 'Marta León',  note: 'Abierto 1 vez — enviar follow-up',  opens: 1 },
  ],
  replied: [
    { id: 8, name: 'TechVenture BCN',   sector: 'HR Tech',    contact: 'Alex Comas',  note: 'Respuesta positiva — piden demo' },
    { id: 9, name: 'DataFlow Systems',  sector: 'Data',       contact: 'Irene Sanz',  note: 'Interesados en el servicio premium' },
  ],
  meeting: [
    { id: 10, name: 'InnovateMed',      sector: 'MedTech',    contact: 'Carlos Font', note: 'Reunión agendada para el 15 de abril' },
  ],
}

const sectorColors = {
  'HR Tech': '#7C3AED', 'SaaS': '#0D9488', 'Fintech': '#059669', 'Logística': '#D97706',
  'Healthtech': '#DC2626', 'AgriTech': '#065F46', 'EdTech': '#92400E', 'Data': '#0B7A70',
  'MedTech': '#6D28D9', 'Retail Tech': '#9D174D',
}
const sectorFor = (s) => sectorColors[s] || '#0D9488'

export default function Pipeline() {
  const [cards,          setCards]         = useState(CARDS_INIT)
  const [showProspector, setShowProspector] = useState(false)
  const [notionDbId,     setNotionDbId]    = useState(() => localStorage.getItem('hutrit_notion_db') || '')
  const [showNotionCfg,  setShowNotionCfg] = useState(false)
  const [notionInput,    setNotionInput]   = useState('')

  const total = Object.values(cards).reduce((a, col) => a + col.length, 0)

  const saveNotionConfig = () => {
    localStorage.setItem('hutrit_notion_db', notionInput)
    setNotionDbId(notionInput)
    setShowNotionCfg(false)
  }

  const addToBoard = (empresa) => {
    const newCard = {
      id:      Date.now(),
      name:    empresa.nombre || empresa.title,
      sector:  empresa.nicho || 'Prospecto',
      contact: '',
      note:    empresa.web ? `Web: ${empresa.web}` : (empresa.description || ''),
      web:     empresa.web || empresa.url || '',
    }
    setCards(prev => ({ ...prev, identified: [newCard, ...prev.identified] }))
  }

  return (
    <div className="fade-in" style={{ padding: '28px 32px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.03em' }}>Pipeline en vivo</h1>
          <p style={{ color: 'var(--h-muted)', fontSize: 13, marginTop: 4 }}>{total} empresas en seguimiento activo</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-secondary" onClick={() => setShowNotionCfg(v => !v)} style={{ fontSize: 12 }}>
            <Database size={13} />Notion
            {notionDbId && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#059669', flexShrink: 0 }} />}
          </button>
          <button className="btn-primary" onClick={() => setShowProspector(v => !v)}>
            <Search size={13} />{showProspector ? 'Cerrar prospector' : 'Buscar prospectos'}
          </button>
        </div>
      </div>

      {/* Config Notion */}
      {showNotionCfg && (
        <div className="card fade-in" style={{ marginBottom: 16, padding: '14px 18px' }}>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>
            Database ID de Notion
            <span style={{ fontWeight: 400, color: 'var(--h-muted)', marginLeft: 6 }}>
              (desde la URL de tu database: notion.so/.../<strong>DATABASE_ID</strong>?v=...)
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              className="input-field"
              placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              value={notionInput || notionDbId}
              onChange={e => setNotionInput(e.target.value)}
              style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}
            />
            <button className="btn-primary" onClick={saveNotionConfig} style={{ whiteSpace: 'nowrap', fontSize: 12 }}>Guardar</button>
          </div>
          {notionDbId && <div style={{ fontSize: 11, color: '#059669', marginTop: 6 }}>Conectado: {notionDbId.slice(0, 8)}...</div>}
        </div>
      )}

      {/* Prospector panel */}
      {showProspector && (
        <ProspectorPanel notionDbId={notionDbId} onAdd={addToBoard} />
      )}

      {/* Progress bar total */}
      <div className="card" style={{ marginBottom: 20, padding: '14px 20px' }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          {STAGES.map(s => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color }} />
              <span style={{ fontSize: 12, color: 'var(--h-muted)' }}>{s.label}</span>
              <span style={{ fontSize: 13, fontWeight: 700 }}>{(cards[s.id] || []).length}</span>
            </div>
          ))}
          <div style={{ marginLeft: 'auto', fontSize: 13, fontWeight: 600, color: '#059669' }}>
            Tasa cierre: {total > 0 ? Math.round(((cards.meeting || []).length / total) * 100) : 0}%
          </div>
        </div>
        <div style={{ display: 'flex', height: 6, borderRadius: 3, overflow: 'hidden', marginTop: 10, gap: 2 }}>
          {STAGES.map(s => (
            <div key={s.id} style={{ flex: Math.max((cards[s.id] || []).length, 0.1), background: s.color, borderRadius: 2, transition: 'flex 0.3s' }} />
          ))}
        </div>
      </div>

      {/* Kanban */}
      <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 16 }}>
        {STAGES.map(stage => (
          <div key={stage.id} style={{ minWidth: 220, flex: '0 0 220px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, padding: '0 4px' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: stage.color }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--h-text)' }}>{stage.label}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: stage.color, marginLeft: 'auto', background: `${stage.color}15`, padding: '2px 8px', borderRadius: 10 }}>
                {(cards[stage.id] || []).length}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(cards[stage.id] || []).map(card => (
                <KanbanCard key={card.id} card={card} stageColor={stage.color} notionDbId={notionDbId} />
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

// ── Prospector Panel ──────────────────────────────────────────────────────────

function ProspectorPanel({ notionDbId, onAdd }) {
  const [mode,       setMode]      = useState('maps') // 'maps' | 'web'
  const [ciudad,     setCiudad]    = useState('Barcelona')
  const [nicho,      setNicho]     = useState('Agencia de Marketing')
  const [query,      setQuery]     = useState('')
  const [results,    setResults]   = useState([])
  const [loading,    setLoading]   = useState(false)
  const [error,      setError]     = useState('')
  const [saved,      setSaved]     = useState({}) // id → 'saving'|'done'|'error'

  const search = async () => {
    setLoading(true); setError(''); setResults([])
    try {
      if (mode === 'maps') {
        const resp = await fetch('/api/prospect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ciudad, nicho }),
        })
        const data = await resp.json()
        if (!data.success) { setError(data.error); setLoading(false); return }
        setResults(data.prospectos.map((p, i) => ({ ...p, id: i })))
      } else {
        const resp = await fetch('/api/search-web', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query }),
        })
        const data = await resp.json()
        if (!data.success) { setError(data.error); setLoading(false); return }
        setResults(data.results.map((r, i) => ({ ...r, id: i })))
      }
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  const saveToNotion = async (item) => {
    if (!notionDbId) { alert('Configura el Notion Database ID primero (botón "Notion" arriba)'); return }
    setSaved(prev => ({ ...prev, [item.id]: 'saving' }))
    try {
      const resp = await fetch('/api/notion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_company',
          databaseId: notionDbId,
          data: {
            nombre:     item.nombre || item.title || '',
            ciudad:     item.ciudad || '',
            nicho:      item.nicho  || '',
            web:        item.web    || item.url || '',
            telefono:   item.telefono || '',
            estrategia: item.estrategia || '',
          },
        }),
      })
      const data = await resp.json()
      setSaved(prev => ({ ...prev, [item.id]: data.success ? 'done' : 'error' }))
    } catch {
      setSaved(prev => ({ ...prev, [item.id]: 'error' }))
    }
  }

  return (
    <div className="card fade-in" style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>Buscador de prospectos</div>
        <div style={{ display: 'flex', gap: 6 }}>
          {[{ id: 'maps', label: 'Google Maps', icon: MapPin }, { id: 'web', label: 'Búsqueda web', icon: Globe }].map(m => (
            <button key={m.id} onClick={() => { setMode(m.id); setResults([]); setError('') }} style={{
              padding: '5px 12px', fontSize: 12, fontWeight: 500, borderRadius: 8, cursor: 'pointer',
              background: mode === m.id ? 'var(--h-accent)' : 'var(--h-surface)',
              color:      mode === m.id ? 'white'           : 'var(--h-muted)',
              border:     `1.5px solid ${mode === m.id ? 'var(--h-accent)' : 'var(--h-border)'}`,
              display: 'flex', alignItems: 'center', gap: 5,
            }}>
              <m.icon size={11} />{m.label}
            </button>
          ))}
        </div>
      </div>

      {mode === 'maps' ? (
        <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 11, fontWeight: 500, color: 'var(--h-muted)', display: 'block', marginBottom: 4 }}>Ciudad</label>
            <input className="input-field" value={ciudad} onChange={e => setCiudad(e.target.value)} placeholder="Barcelona" />
          </div>
          <div style={{ flex: 2 }}>
            <label style={{ fontSize: 11, fontWeight: 500, color: 'var(--h-muted)', display: 'block', marginBottom: 4 }}>Sector / Nicho</label>
            <input className="input-field" value={nicho} onChange={e => setNicho(e.target.value)} placeholder="Agencia de Marketing Digital" />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button className="btn-primary" onClick={search} disabled={loading} style={{ whiteSpace: 'nowrap' }}>
              {loading ? <><div className="spinner" />Buscando...</> : <><MapPin size={13} />Buscar</>}
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
          <input
            className="input-field"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !loading && search()}
            placeholder='ej: "startups fintech Barcelona" site:linkedin.com/company'
            style={{ flex: 1 }}
          />
          <button className="btn-primary" onClick={search} disabled={loading || !query.trim()} style={{ whiteSpace: 'nowrap' }}>
            {loading ? <><div className="spinner" />Buscando...</> : <><Globe size={13} />Buscar</>}
          </button>
        </div>
      )}

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#FFF1F2', border: '1px solid #FDA4AF', borderRadius: 8, padding: '10px 14px', marginBottom: 12 }}>
          <AlertCircle size={14} color="#DC2626" />
          <span style={{ fontSize: 12, color: '#9F1239' }}>{error}</span>
        </div>
      )}

      {results.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--h-muted)', letterSpacing: '0.04em', marginBottom: 4 }}>
            {results.length} RESULTADOS
          </div>
          {results.map(item => {
            const sv = saved[item.id]
            const isGoogleMaps = mode === 'maps'
            return (
              <div key={item.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, background: 'var(--h-surface)', borderRadius: 10, padding: '12px 14px', border: '1px solid var(--h-border)' }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--h-accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Building size={14} color="var(--h-accent)" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>
                    {isGoogleMaps ? item.nombre : item.title}
                  </div>
                  {isGoogleMaps ? (
                    <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--h-muted)' }}>
                      {item.rating > 0 && <span>⭐ {item.rating}</span>}
                      {item.web && <a href={item.web} target="_blank" rel="noreferrer" style={{ color: 'var(--h-accent)', textDecoration: 'none' }}>{new URL(item.web).hostname}</a>}
                      {item.telefono && <span>{item.telefono}</span>}
                      <span style={{ color: item.estrategia?.includes('Mejora') ? '#D97706' : '#059669' }}>→ {item.estrategia}</span>
                    </div>
                  ) : (
                    <div style={{ fontSize: 11, color: 'var(--h-muted)', lineHeight: 1.5 }}>
                      <a href={item.url} target="_blank" rel="noreferrer" style={{ color: 'var(--h-accent)', textDecoration: 'none', display: 'block', marginBottom: 2 }}>{item.url}</a>
                      {item.description}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button
                    className="btn-ghost"
                    onClick={() => onAdd(item)}
                    style={{ fontSize: 11, padding: '4px 8px' }}
                  >
                    <Plus size={11} />Pipeline
                  </button>
                  <button
                    className="btn-ghost"
                    onClick={() => saveToNotion(item)}
                    disabled={sv === 'saving' || sv === 'done'}
                    style={{ fontSize: 11, padding: '4px 8px', color: sv === 'done' ? '#059669' : sv === 'error' ? '#DC2626' : undefined }}
                  >
                    {sv === 'saving' ? <><div className="spinner" style={{ width: 10, height: 10, borderWidth: 1.5 }} />Guardando</>
                      : sv === 'done' ? <><CheckCircle size={11} />Notion</>
                      : sv === 'error' ? <><AlertCircle size={11} />Error</>
                      : <><Database size={11} />Notion</>}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Kanban Card ───────────────────────────────────────────────────────────────

function KanbanCard({ card, stageColor, notionDbId }) {
  const [hovered,  setHovered]  = useState(false)
  const [notionSt, setNotionSt] = useState('idle') // idle | saving | done | error
  const sc = sectorFor(card.sector)

  const saveToNotion = async () => {
    if (!notionDbId) { alert('Configura el Notion Database ID (botón "Notion" en la cabecera)'); return }
    setNotionSt('saving')
    try {
      const resp = await fetch('/api/notion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_company',
          databaseId: notionDbId,
          data: { nombre: card.name, nicho: card.sector, web: card.web || '' },
        }),
      })
      const data = await resp.json()
      setNotionSt(data.success ? 'done' : 'error')
    } catch { setNotionSt('error') }
  }

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'var(--h-white)',
        border: `1px solid ${hovered ? stageColor : 'var(--h-border)'}`,
        borderRadius: 10, padding: '12px 14px', cursor: 'pointer',
        transition: 'all 0.15s', borderLeft: `3px solid ${stageColor}`,
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
      {card.opens > 0 && (
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
      {/* Botón Notion (visible al hover) */}
      {hovered && (
        <button
          onClick={e => { e.stopPropagation(); saveToNotion() }}
          disabled={notionSt === 'saving' || notionSt === 'done'}
          style={{
            marginTop: 8, width: '100%', padding: '4px 8px',
            background: notionSt === 'done' ? '#D1FAE5' : 'var(--h-surface)',
            border: '1px solid var(--h-border)', borderRadius: 6,
            fontSize: 10, fontWeight: 500, cursor: 'pointer',
            color: notionSt === 'done' ? '#059669' : notionSt === 'error' ? '#DC2626' : 'var(--h-muted)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
          }}
        >
          {notionSt === 'saving' ? <><div className="spinner" style={{ width: 8, height: 8, borderWidth: 1 }} />Guardando...</>
            : notionSt === 'done'  ? <><CheckCircle size={9} />Guardado en Notion</>
            : notionSt === 'error' ? <><AlertCircle size={9} />Error — reintentar</>
            : <><Database size={9} />Guardar en Notion</>}
        </button>
      )}
    </div>
  )
}
