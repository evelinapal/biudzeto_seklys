import { useState } from 'react'
import './BudgetAssistant.css'

const welcome = {
  role: 'assistant',
  content: 'Sveiki! Esu AI biudžeto asistentas. Galiu padėti sugalvoti, kaip planuoti išlaidas ir taupyti. Kol kas tai demonstracinė pokalbio sąsaja.',
}

export default function BudgetAssistant() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([welcome])
  const [draft, setDraft] = useState('')

  function sendMessage(event) {
    event.preventDefault()
    const question = draft.trim()
    if (!question) return
    setMessages((previous) => [
      ...previous,
      { role: 'user', content: question },
      { role: 'assistant', content: 'Pokalbio langas jau paruoštas! AI atsakymus įjungsime saugiai prijungę OpenRouter per atskirą serverio funkciją. Šiuo metu jūsų žinutė niekur nesiunčiama.' },
    ])
    setDraft('')
  }

  return (
    <section className="budget-assistant" aria-label="AI biudžeto asistentas">
      <button
        type="button"
        className="budget-assistant-toggle"
        aria-expanded={open}
        aria-controls="budget-assistant-panel"
        onClick={() => setOpen((value) => !value)}
      >
        🤖 AI biudžeto asistentas {open ? '▲' : '▼'}
      </button>
      {open && (
        <div id="budget-assistant-panel" className="budget-assistant-panel">
          <p className="budget-assistant-note">Demonstracinė versija – AI dar neprijungtas, finansiniai įrašai neskaitomi.</p>
          <div className="budget-assistant-messages" role="log" aria-live="polite" aria-relevant="additions">
            {messages.map((message, index) => (
              <p key={index} className={`budget-assistant-message ${message.role}`}>
                {message.content}
              </p>
            ))}
          </div>
          <form className="budget-assistant-form" onSubmit={sendMessage}>
            <label htmlFor="budget-assistant-input">Jūsų klausimas</label>
            <div className="budget-assistant-input-row">
              <input
                id="budget-assistant-input"
                value={draft}
                maxLength={500}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Pvz., kaip sutaupyti 50 €?"
              />
              <button type="submit" disabled={!draft.trim()}>Siųsti</button>
            </div>
          </form>
        </div>
      )}
    </section>
  )
}
