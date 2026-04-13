import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Zap, Trash2, Mail, CheckCircle, XCircle, Loader, Search, Calendar, FileText, Link, Globe, Image, MapPin, Users } from 'lucide-react'

const STARTERS = [
  'Busca 6 agencias de marketing en Barcelona y mándales outreach a todas',
  'Audita Factorial (HR software, Barcelona) y mándales email a ceo@factorial.hr',
  'Genera calendario de 2 semanas B2B, publícalo en LinkedIn y guárdalo en Notion',
  'Genera una imagen impacto para un post sobre talento LATAM y publícala en LinkedIn',
  'Haz outreach a Typeform, Holded y Factorial con emails personalizados para cada uno',
]

const STORAGE_KEY = 'hutrit_chat_history'

const TOOL_LABELS = {
  send_email:          { icon: Mail,     label: 'Enviando email',           doneLabel: 'Email enviado' },
  publish_linkedin:    { icon: Link,     label: 'Publicando en LinkedIn',   doneLabel: 'Publicado en LinkedIn' },
  publish_instagram:   { icon: Image,    label: 'Publicando en Instagram',  doneLabel: 'Publicado en Instagram' },
  search_web:          { icon: Globe,    label: 'Buscando en internet',     doneLabel: 'Búsqueda completada' },
  scrape_url:          { icon: Globe,    label: 'Leyendo URL',              doneLabel: 'URL leída' },
  prospect_companies:  { icon: MapPin,   label: 'Buscando empresas',        doneLabel: 'Empresas encontradas' },
  generate_image:      { icon: Image,    label: 'Generando imagen con IA',  doneLabel: 'Imagen generada' },
  save_to_notion:      { icon: FileText, label: 'Guardando en Notion',      doneLabel: 'Guardado en Notion' },
  export_pdf:          { icon: FileText, label: 'Generando PDF',            doneLabel: 'PDF listo' },
}

function ToolCard({ msg }) {
  const cfg = TOOL_LABELS[msg.toolName] || { label: msg.toolName, doneLabel: msg.toolName }
  const Icon = cfg.icon || Zap

  const bgColor  = msg.status === 'running' ? '#FEF3C7' : msg.success ? '#D1FAE5' : '#FEE2E2'
  const txtColor = msg.status === 'running' ? '#92400E' : msg.success ? '#065F46'  : '#9F1239'
  const bdColor  = msg.status === 'running' ? '#FCD34D' : msg.success ? '#6EE7B7'  : '#FCA5A5'

  const hasImage = msg.toolName === 'generate_image' && msg.status === 'done' && msg.success && msg.imageBase64

  return (
    <div style={{ display: 'flex', justifyContent: 'center', margin: '4px 0', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '7px 14px', borderRadius: 20,
        background: bgColor, border: `1px solid ${bdColor}`,
        fontSize: 12, color: txtColor, fontWeight: 500,
      }}>
        {msg.status === 'running'
          ? <Loader size={13} style={{ animation: 'spin 1s linear infinite' }} />
          : msg.success ? <CheckCircle size={13} /> : <XCircle size={13} />}
        <Icon size={13} />
        {msg.status === 'running' ? cfg.label + '...' : msg.result || (msg.success ? cfg.doneLabel : 'Error')}
      </div>
      {hasImage && (
        <img
          src={`data:${msg.mimeType || 'image/png'};base64,${msg.imageBase64}`}
          alt="Imagen generada"
          style={{ maxWidth: 300, borderRadius: 12, border: '1px solid var(--h-border)', boxShadow: 'var(--shadow-sm)' }}
        />
      )}
      {msg.toolName === 'export_pdf' && msg.status === 'done' && msg.success && msg.pdfHtml && (
        <button
          onClick={() => {
            const html = atob(msg.pdfHtml)
            const w = window.open('', '_blank')
            w.document.write(html)
            w.document.close()
          }}
          className="btn-primary"
          style={{ fontSize: 12, padding: '6px 14px' }}
        >
          <FileText size={12} /> Abrir PDF
        </button>
      )}
    </div>
  )
}

export default function Chat() {
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : []
    } catch { return [] }
  })
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (!loading) {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(messages)) } catch {}
    }
  }, [messages, loading])

  const send = async (text) => {
    const userText = text || input.trim()
    if (!userText || loading) return
    setInput('')

    // Solo pasamos mensajes user/assistant a la API (no los tool cards)
    const apiMessages = [...messages.filter(m => m.role === 'user' || m.role === 'assistant'), { role: 'user', content: userText }]
    setMessages(prev => [...prev.filter(m => m.role === 'user' || m.role === 'assistant' || m.role === 'tool'), { role: 'user', content: userText }])
    setLoading(true)

    const assistantIndex = apiMessages.length  // índice donde va la respuesta del asistente
    setMessages(prev => [...prev, { role: 'assistant', content: '' }])

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages }),
      })

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop()

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const raw = line.slice(6).trim()
          if (raw === '[DONE]') break
          try {
            const event = JSON.parse(raw)

            if (event.text) {
              setMessages(prev => {
                const updated = [...prev]
                // El asistente es el último mensaje con role assistant
                const idx = updated.map(m => m.role).lastIndexOf('assistant')
                if (idx >= 0) updated[idx] = { ...updated[idx], content: updated[idx].content + event.text }
                return updated
              })
            }

            if (event.toolCall) {
              // Añadir card de herramienta en estado "running"
              setMessages(prev => [...prev, {
                role: 'tool',
                toolName: event.toolCall.name,
                toolInput: event.toolCall.input,
                status: 'running',
              }])
            }

            if (event.toolResult) {
              setMessages(prev => {
                const updated = [...prev]
                for (let i = updated.length - 1; i >= 0; i--) {
                  if (updated[i].role === 'tool' && updated[i].toolName === event.toolResult.name && updated[i].status === 'running') {
                    updated[i] = {
                      ...updated[i],
                      status: 'done',
                      success: event.toolResult.success,
                      result: event.toolResult.message || event.toolResult.error,
                      // pass through image data if present
                      imageBase64: event.toolResult.imageBase64 || null,
                      mimeType: event.toolResult.mimeType || null,
                      pdfHtml: event.toolResult.pdfHtml || null,
                    }
                    break
                  }
                }
                return updated
              })
            }

            if (event.error) {
              setMessages(prev => {
                const updated = [...prev]
                const idx = updated.map(m => m.role).lastIndexOf('assistant')
                if (idx >= 0) updated[idx] = { ...updated[idx], content: `Error: ${event.error}` }
                return updated
              })
            }
          } catch {}
        }
      }
    } catch (err) {
      setMessages(prev => {
        const updated = [...prev]
        const idx = updated.map(m => m.role).lastIndexOf('assistant')
        if (idx >= 0) updated[idx] = { role: 'assistant', content: `Error: ${err.message}` }
        return updated
      })
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  const clear = () => {
    setMessages([])
    setInput('')
    try { localStorage.removeItem(STORAGE_KEY) } catch {}
  }

  // Mensajes que se muestran en el chat (user + assistant + tool cards)
  const visibleMessages = messages.filter(m => m.role === 'user' || m.role === 'assistant' || m.role === 'tool')

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%', maxWidth: 820, margin: '0 auto', padding: '0 24px' }}>
      {/* Header */}
      <div style={{ padding: '24px 0 16px', borderBottom: '1px solid var(--h-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--h-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={16} color="white" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Agente Hutrit</div>
            <div style={{ fontSize: 11, color: 'var(--h-muted)' }}>
              sonnet-4-6 · email · linkedin · instagram · búsqueda · imágenes · notion
              {messages.filter(m => m.role === 'user').length > 0 && ` · ${messages.filter(m => m.role === 'user').length} msgs`}
            </div>
          </div>
        </div>
        {messages.length > 0 && (
          <button onClick={clear} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--h-muted)', padding: '6px 10px', borderRadius: 8, cursor: 'pointer' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--h-surface)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <Trash2 size={13} /> Limpiar
          </button>
        )}
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 0', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {visibleMessages.length === 0 && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24, paddingBottom: 40 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--h-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <Zap size={24} color="white" />
              </div>
              <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>¿En qué puedo ayudarte?</div>
              <div style={{ fontSize: 13, color: 'var(--h-muted)', maxWidth: 420 }}>
                Audita empresas, crea contenido, genera calendarios, envía outreach personalizado y publica en LinkedIn. Dime qué necesitas y lo ejecuto.
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', maxWidth: 480 }}>
              {STARTERS.map(s => (
                <button key={s} onClick={() => send(s)} style={{
                  textAlign: 'left', padding: '10px 14px', borderRadius: 10,
                  border: '1.5px solid var(--h-border)', background: 'var(--h-white)',
                  fontSize: 13, color: 'var(--h-text)', cursor: 'pointer', transition: 'all 0.15s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--h-accent)'; e.currentTarget.style.background = 'var(--h-accent-soft)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--h-border)'; e.currentTarget.style.background = 'var(--h-white)' }}
                >{s}</button>
              ))}
            </div>
          </div>
        )}

        {visibleMessages.map((msg, i) => {
          // Tool execution card
          if (msg.role === 'tool') return <ToolCard key={i} msg={msg} />

          // User / assistant bubbles
          return (
            <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                background: msg.role === 'user' ? 'var(--h-primary)' : 'var(--h-accent-soft)',
                border: msg.role === 'assistant' ? '1.5px solid var(--h-border)' : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {msg.role === 'user' ? <User size={14} color="white" /> : <Bot size={14} color="var(--h-accent)" />}
              </div>
              <div style={{
                maxWidth: '75%',
                background: msg.role === 'user' ? 'var(--h-primary)' : 'var(--h-white)',
                color: msg.role === 'user' ? 'white' : 'var(--h-text)',
                border: msg.role === 'assistant' ? '1px solid var(--h-border)' : 'none',
                borderRadius: msg.role === 'user' ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                padding: '12px 16px', fontSize: 13, lineHeight: 1.65,
                whiteSpace: 'pre-wrap', boxShadow: 'var(--shadow-sm)',
              }}>
                {msg.content}
                {msg.role === 'assistant' && loading && i === visibleMessages.length - 1 && msg.content === '' && (
                  <span style={{ display: 'inline-flex', gap: 3 }}>
                    {[0, 1, 2].map(j => (
                      <span key={j} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--h-muted)', animation: `pulse 1.2s ${j * 0.2}s infinite` }} />
                    ))}
                  </span>
                )}
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '16px 0 24px', borderTop: '1px solid var(--h-border)', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
          <textarea
            ref={inputRef}
            rows={1}
            className="input-field"
            style={{ resize: 'none', overflowY: 'auto', maxHeight: 120, lineHeight: 1.5 }}
            placeholder='Ej: "Audita Factorial y mándales outreach" o "Genera calendario de 2 semanas y guárdalo en Notion"'
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
            disabled={loading}
          />
          <button className="btn-primary" onClick={() => send()} disabled={loading || !input.trim()}
            style={{ padding: '10px 16px', flexShrink: 0, opacity: loading || !input.trim() ? 0.6 : 1 }}>
            <Send size={15} />
          </button>
        </div>
        <div style={{ fontSize: 11, color: 'var(--h-muted)', marginTop: 6, textAlign: 'center' }}>
          Enter para enviar · Shift+Enter para nueva línea
        </div>
      </div>
    </div>
  )
}
