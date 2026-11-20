import { useState } from 'react'
import { supabase } from './supabaseClient'
import './BudgetAssistant.css'

const welcome = {
  role: 'assistant',
  content: 'Sveiki! Esu AI biudžeto asistentas. Klauskite apie taupymą ir biudžeto planavimą. Jūsų finansinių įrašų neskaitau.',
}

export default function BudgetAssistant() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([welcome])
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)

  async function sendMessage(event) {
    event.preventDefault()
    const question = draft.trim()
    if (!question || sending) return
    setMessages((previous) => [...previous, { role: 'user', content: question }])
    setDraft('')
    setSending(true)
    try {
      const { data, error } = await supabase.functions.invoke('budget-assistant', {
        body: { message: question },
      })
      if (error) throw error
      if (typeof data?.reply !== 'string') throw new Error(data?.error || 'AI neatsakė.')
      setMessages((previous) => [...previous, { role: 'assistant', content: data.reply }])
    } catch {
      setMessages((previous) => [...previous, {
        role: 'assistant',
        content: 'Nepavyko gauti AI atsakymo. Patikrinkite funkcijos nustatymus arba bandykite vėliau.',
      }])
    } finally {
      setSending(false)
    }
  }

  return (
    <section className="budget-assistant" aria-label="AI biudžeto asistentas">
      <button type="button" className="budget-assistant-toggle" aria-expanded={open}
        aria-controls="budget-assistant-panel" onClick={() => setOpen((value) => !value)}>
        🤖 AI biudžeto asistentas {open ? '▲' : '▼'}
      </button>
      {open && (
        <div id="budget-assistant-panel" className="budget-assistant-panel">
          <p className="budget-assistant-note">AI teikia bendrus patarimus. Finansiniai įrašai nesiunčiami.</p>
          <div className="budget-assistant-messages" role="log" aria-live="polite" aria-relevant="additions">
            {messages.map((message, index) => (
              <p key={index} className={`budget-assistant-message ${message.role}`}>
                {message.content}
              </p>
            ))}
            {sending && <p className="budget-assistant-message assistant">Rašau atsakymą...</p>}
          </div>
          <form className="budget-assistant-form" onSubmit={sendMessage}>
            <label htmlFor="budget-assistant-input">Jūsų klausimas</label>
            <div className="budget-assistant-input-row">
              <input id="budget-assistant-input" value={draft} maxLength={500}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Pvz., kaip sutaupyti 50 €?" />
              <button type="submit" disabled={!draft.trim() || sending}>Siųsti</button>
            </div>
          </form>
        </div>
      )}
    </section>
  )
}
