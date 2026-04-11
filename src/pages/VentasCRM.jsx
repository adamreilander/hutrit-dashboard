import { useState } from 'react'
import { Mail, Send, Eye, MessageSquare, RefreshCw, Sparkles, Copy, Check } from 'lucide-react'

const EMAILS = [
  { id: 1, company: 'TechVenture BCN',  contact: 'Alex Comas',   subject: 'Cómo Hutrit puede ayudarte a contratar talento tech en 48h', status: 'replied',  sentAt: '07 Apr', opens: 4, reply: true  },
  { id: 2, company: 'AgroTech Iberia',  contact: 'Jordi Puig',   subject: 'Tu equipo tech crece — ¿tienes el proceso correcto?',        status: 'opened',   sentAt: '07 Apr', opens: 3, reply: false },
  { id: 3, company: 'CloudBridge SL',   contact: 'Pedro Ruiz',   subject: 'Cómo Hutrit puede ayudarte a contratar talento tech en 48h', status: 'sent',     sentAt: '08 Apr', opens: 0, reply: false },
  { id: 4, company: 'RetailOS',         contact: 'Sara Molina',  subject: 'Tu próximo developer puede estar a 48 horas',                status: 'sent',     sentAt: '07 Apr', opens: 0, reply: false },
  { id: 5, company: 'EduSpark',         contact: 'Marta León',   subject: 'Cómo Hutrit puede ayudarte a contratar talento tech en 48h', status: 'opened',   sentAt: '06 Apr', opens: 1, reply: false },
]

const statusConfig = {
  replied: { label: 'Respondido', color: '#059669', bg: '#D1FAE5', badge: 'badge-green' },
  opened:  { label: 'Abierto',    color: '#D97706', bg: '#FEF3C7', badge: 'badge-amber' },
  sent:    { label: 'Enviado',    color: '#0D9488', bg: '#CCFBF1', badge: 'badge-blue'  },
}

const TEMPLATE = `Hola {{nombre}},

He visto que {{empresa}} está creciendo su equipo tech este trimestre — felicitaciones por el momentum.

En Hutrit Europa ayudamos a startups como {{empresa}} a encontrar y contratar talento tecnológico verificado en Europa en 48 horas, sin los procesos lentos de las consultoras tradicionales.

¿Tendrías 20 minutos esta semana para ver si podemos ayudarte?

Un saludo,
Equipo Hutrit
hutriteuropa@gmail.com`

export default function VentasCRM() {
  const [company, setCompany]   = useState('')
  const [contact, setContact]   = useState('')
  const [emailBody, setEmailBody] = useState(TEMPLATE)
  const [generating, setGenerating] = useState(false)
  const [sending, setSending]   = useState(false)
  const [sent, setSent]         = useState(false)
  const [copied, setCopied]     = useState(false)
  const [activeTab, setActiveTab] = useState('redactor')

  const generate = () => {
    if (!company) return
    setGenerating(true)
    setTimeout(() => {
      const personalized = TEMPLATE
        .replace(/{{nombre}}/g, contact || 'equipo')
        .replace(/{{empresa}}/g, company)
      setEmailBody(personalized)
      setGenerating(false)
    }, 1500)
  }

  const sendEmail = () => {
    setSending(true)
    setTimeout(() => { setSending(false); setSent(true) }, 2000)
  }

  const copyText = () => {
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fade-in" style={{ padding: '28px 32px', maxWidth: 1000 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.03em' }}>Ventas CRM</h1>
        <p style={{ color: 'var(--h-muted)', fontSize: 13, marginTop: 4 }}>Redacta, envía y hace seguimiento de todos tus emails desde aquí</p>
      </div>

      {/* Stats */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        {[
          { label: 'Emails enviados',    value: '18', sub: 'este mes' },
          { label: 'Tasa de apertura',   value: '61%', sub: '+12% vs media' },
          { label: 'Respondidos',        value: '4',  sub: 'tasa 22%' },
          { label: 'Follow-ups pendientes', value: '3', sub: 'sin respuesta 4+ días' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-label">{s.label}</div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--h-border)', paddingBottom: 0 }}>
        {[{ id: 'redactor', label: 'Redactor de email' }, { id: 'tracker', label: 'Tracker de envíos' }].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              padding: '8px 16px', fontSize: 13, fontWeight: 500,
              borderBottom: `2px solid ${activeTab === t.id ? 'var(--h-accent)' : 'transparent'}`,
              color: activeTab === t.id ? 'var(--h-accent)' : 'var(--h-muted)',
              background: 'none', cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'redactor' && (
        <div className="grid-2" style={{ alignItems: 'flex-start' }}>
          {/* Form izquierda */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="card">
              <div className="section-title" style={{ marginBottom: 14 }}>Datos de la empresa</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--h-muted)', display: 'block', marginBottom: 5 }}>Empresa</label>
                  <input className="input-field" placeholder="ej: TechVenture BCN" value={company} onChange={e => setCompany(e.target.value)} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--h-muted)', display: 'block', marginBottom: 5 }}>Nombre contacto</label>
                  <input className="input-field" placeholder="ej: Alex Comas" value={contact} onChange={e => setContact(e.target.value)} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--h-muted)', display: 'block', marginBottom: 5 }}>Email destino</label>
                  <input className="input-field" placeholder="contacto@empresa.com" />
                </div>
                <button className="btn-secondary" onClick={generate} disabled={generating} style={{ justifyContent: 'center' }}>
                  {generating ? <><div className="spinner" style={{ borderTopColor: 'var(--h-accent)', borderColor: 'var(--h-border)' }} />Generando...</>
                    : <><Sparkles size={13} />Personalizar email con IA</>}
                </button>
              </div>
            </div>

            {sent && (
              <div className="fade-in" style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 'var(--radius-md)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Check size={16} color="#059669" />
                <span style={{ fontSize: 13, color: '#065F46', fontWeight: 500 }}>Email enviado desde hutriteuropa@gmail.com</span>
              </div>
            )}
          </div>

          {/* Preview email derecha */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ background: 'var(--h-surface)', padding: '12px 16px', borderBottom: '1px solid var(--h-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Mail size={14} color="var(--h-accent)" />
                <span style={{ fontSize: 12, fontWeight: 600 }}>Preview del email</span>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn-ghost" onClick={copyText} style={{ fontSize: 12 }}>
                  {copied ? <><Check size={12} />Copiado</> : <><Copy size={12} />Copiar</>}
                </button>
                <button
                  className="btn-primary"
                  onClick={sendEmail}
                  disabled={sending || sent}
                  style={{ fontSize: 12, padding: '6px 12px', opacity: sent ? 0.7 : 1 }}
                >
                  {sending ? <><div className="spinner" />Enviando...</>
                    : sent ? <><Check size={12} />Enviado</>
                    : <><Send size={12} />Enviar ahora</>}
                </button>
              </div>
            </div>
            {/* Logo Hutrit en el email */}
            <div style={{ padding: '16px', borderBottom: '1px solid var(--h-border)', background: 'var(--h-primary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: 6, background: 'var(--h-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ color: 'white', fontSize: 12, fontWeight: 700 }}>H</span>
                </div>
                <span style={{ color: 'white', fontWeight: 700, fontSize: 14 }}>Hutrit Europa</span>
              </div>
            </div>
            <textarea
              value={emailBody}
              onChange={e => setEmailBody(e.target.value)}
              style={{
                width: '100%', border: 'none', outline: 'none', resize: 'none',
                fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--h-text)',
                lineHeight: 1.7, padding: '16px', minHeight: 260, background: 'white',
              }}
            />
            <div style={{ padding: '10px 16px', borderTop: '1px solid var(--h-border)', background: 'var(--h-surface)' }}>
              <span style={{ fontSize: 11, color: 'var(--h-muted)' }}>Desde: hutriteuropa@gmail.com · Incluye logo y firma Hutrit</span>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'tracker' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--h-surface)' }}>
                {['Empresa', 'Contacto', 'Asunto', 'Enviado', 'Aperturas', 'Estado', 'Acción'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--h-muted)', letterSpacing: '0.04em', borderBottom: '1px solid var(--h-border)', whiteSpace: 'nowrap' }}>
                    {h.toUpperCase()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {EMAILS.map((e, i) => {
                const s = statusConfig[e.status]
                return (
                  <tr key={e.id} style={{ borderBottom: '1px solid var(--h-border)', background: i % 2 === 0 ? 'white' : 'var(--h-surface)' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 600, fontSize: 13 }}>{e.company}</td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--h-muted)' }}>{e.contact}</td>
                    <td style={{ padding: '12px 16px', fontSize: 12, maxWidth: 180 }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.subject}</div>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--h-muted)', whiteSpace: 'nowrap' }}>{e.sentAt}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Eye size={12} color={e.opens > 0 ? '#D97706' : 'var(--h-muted)'} />
                        <span style={{ fontSize: 12, fontWeight: e.opens > 0 ? 600 : 400, color: e.opens > 0 ? '#D97706' : 'var(--h-muted)' }}>{e.opens}x</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span className={`badge ${s.badge}`}>{s.label}</span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {e.status === 'sent' && !e.reply && (
                        <button className="btn-ghost" style={{ fontSize: 11, padding: '4px 8px' }}>
                          <RefreshCw size={11} />Follow-up
                        </button>
                      )}
                      {e.status === 'replied' && (
                        <button className="btn-ghost" style={{ fontSize: 11, padding: '4px 8px', color: '#059669' }}>
                          <MessageSquare size={11} />Ver respuesta
                        </button>
                      )}
                      {e.status === 'opened' && (
                        <button className="btn-ghost" style={{ fontSize: 11, padding: '4px 8px', color: '#D97706' }}>
                          <Send size={11} />Follow-up
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
