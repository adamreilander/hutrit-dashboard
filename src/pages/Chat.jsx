import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Zap, Trash2 } from 'lucide-react'

const STARTERS = [
  'Dame ideas de contenido para LinkedIn esta semana',
  'Redacta un email de outreach para agencias de marketing en Barcelona',
  'Analiza el sector de startups SaaS en España',
  '¿Qué keywords debería trabajar para hutrit.com?',
  'Genera 3 hooks para un carrusel de Instagram sobre talento LATAM',
]

export default function Chat() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async (text) => {
    const userText = text || input.trim()
    if (!userText || loading) return
    setInput('')

    const newMessages = [...messages, { role: 'user', content: userText }]
    setMessages(newMessages)
    setLoading(true)

    const assistantIndex = newMessages.length
    setMessages(prev => [...prev, { role: 'assistant', content: '' }])

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
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
          const data = line.slice(6).trim()
          if (data === '[DONE]') break
          try {
            const { text } = JSON.parse(data)
            if (text) {
              setMessages(prev => {
                const updated = [...prev]
                updated[assistantIndex] = { ...updated[assistantIndex], content: updated[assistantIndex].content + text }
                return updated
              })
            }
          } catch {}
        }
      }
    } catch (err) {
      setMessages(prev => {
        const updated = [...prev]
        updated[assistantIndex] = { role: 'assistant', content: `Error: ${err.message}` }
        return updated
      })
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  const clear = () => { setMessages([]); setInput('') }

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
            <div style={{ fontSize: 11, color: 'var(--h-muted)' }}>claude-sonnet-4-6 · Listo</div>
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
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 0', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {messages.length === 0 && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24, paddingBottom: 40 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--h-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <Zap size={24} color="white" />
              </div>
              <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>¿En qué puedo ayudarte?</div>
              <div style={{ fontSize: 13, color: 'var(--h-muted)', maxWidth: 360 }}>
                Soy el agente de Hutrit. Puedo ayudarte con contenido, outreach, prospección, SEO y más.
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', maxWidth: 480 }}>
              {STARTERS.map(s => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  style={{
                    textAlign: 'left', padding: '10px 14px', borderRadius: 10,
                    border: '1.5px solid var(--h-border)', background: 'var(--h-white)',
                    fontSize: 13, color: 'var(--h-text)', cursor: 'pointer', transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--h-accent)'; e.currentTarget.style.background = 'var(--h-accent-soft)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--h-border)'; e.currentTarget.style.background = 'var(--h-white)' }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
              background: msg.role === 'user' ? 'var(--h-primary)' : 'var(--h-accent-soft)',
              border: msg.role === 'assistant' ? '1.5px solid var(--h-border)' : 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {msg.role === 'user'
                ? <User size={14} color="white" />
                : <Bot size={14} color="var(--h-accent)" />}
            </div>
            <div style={{
              maxWidth: '75%',
              background: msg.role === 'user' ? 'var(--h-primary)' : 'var(--h-white)',
              color: msg.role === 'user' ? 'white' : 'var(--h-text)',
              border: msg.role === 'assistant' ? '1px solid var(--h-border)' : 'none',
              borderRadius: msg.role === 'user' ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
              padding: '12px 16px',
              fontSize: 13,
              lineHeight: 1.65,
              whiteSpace: 'pre-wrap',
              boxShadow: 'var(--shadow-sm)',
            }}>
              {msg.content}
              {msg.role === 'assistant' && loading && i === messages.length - 1 && msg.content === '' && (
                <span style={{ display: 'inline-flex', gap: 3 }}>
                  {[0, 1, 2].map(j => (
                    <span key={j} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--h-muted)', animation: `pulse 1.2s ${j * 0.2}s infinite` }} />
                  ))}
                </span>
              )}
            </div>
          </div>
        ))}
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
            placeholder="Escribe un mensaje..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                send()
              }
            }}
            disabled={loading}
          />
          <button
            className="btn-primary"
            onClick={() => send()}
            disabled={loading || !input.trim()}
            style={{ padding: '10px 16px', flexShrink: 0, opacity: loading || !input.trim() ? 0.6 : 1 }}
          >
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
