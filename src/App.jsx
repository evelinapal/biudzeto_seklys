import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import './App.css'
import BudgetAssistant from './BudgetAssistant'

function App() {
  const [categories, setCategories] = useState([])
  const [transactions, setTransactions] = useState([])
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [type, setType] = useState('expense') // 'expense' (išlaidos) arba 'income' (pajamos)
  const [loading, setLoading] = useState(true)

  // Užkrauname duomenis iš Supabase
  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    
    // 1. Užkrauname kategorijas
    const { data: categoriesData, error: catError } = await supabase
      .from('categories')
      .select('*')
    if (catError) console.error('Klaida kraunant kategorijas:', catError)
    else setCategories(categoriesData || [])

    // 2. Užkrauname operacijas kartu su susietos kategorijos pavadinimu (JOIN)
    const { data: transactionsData, error: transError } = await supabase
      .from('transactions')
      .select('*, categories(title)')
      .order('created_at', { ascending: false })
    
    if (transError) console.error('Klaida kraunant operacijas:', transError)
    else setTransactions(transactionsData || [])

    setLoading(false)
  }

  // Naujo įrašo pridėjimas su validacija
  async function handleSubmit(e) {
    e.preventDefault()

    // 1. Validacija: Tikriname, ar laukai nėra tušti
    if (!title.trim() || !amount || !categoryId) {
      alert('Prašome užpildyti visus laukelius!')
      return
    }

    const parsedAmount = parseFloat(amount)

    // 2. Validacija: Tikriname, ar įvesta suma yra teigiamas skaičius
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('Suma turi būti teigiamas skaičius!')
      return
    }

    // Jei pasirinktos išlaidos, paverčiame skaičių neigiamu, jei pajamos – teigiamu
    const finalAmount = type === 'expense' ? -parsedAmount : parsedAmount

    const { error } = await supabase.from('transactions').insert([
      {
        title: title.trim(),
        amount: finalAmount,
        category_id: parseInt(categoryId)
      }
    ])

    if (error) {
      alert('Klaida pridedant įrašą: ' + error.message)
    } else {
      setTitle('')
      setAmount('')
      setCategoryId('')
      setType('expense')
      fetchData() // Atnaujiname sąrašą
    }
  }

  // Įrašo ištrynimas su patvirtinimu
  async function handleDelete(id) {
    const confirmed = window.confirm('Ar tikrai norite ištrinti šį įrašą?')
    if (!confirmed) return

    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)

    if (error) {
      alert('Klaida trinant įrašą: ' + error.message)
    } else {
      fetchData() // Atnaujiname sąrašą
    }
  }

  // Bendro balanso skaičiavimas
  const totalBalance = transactions.reduce((acc, curr) => acc + Number(curr.amount), 0)

  return (
    <div className="container">
      <h1>💰 Asmeninių Finansų Seklys</h1>

      {/* Bendras balansas */}
      <div className="balance-card">
        <h2>Bendras balansas</h2>
        <p className={totalBalance >= 0 ? 'positive' : 'negative'}>
          {totalBalance.toFixed(2)} €
        </p>
      </div>

      {/* Pridėjimo forma */}
      <form onSubmit={handleSubmit} className="transaction-form">
        <h3>Pridėti naują operaciją</h3>

        {/* Pajamų / Išlaidų pasirinkimas */}
        <div style={{ display: 'flex', gap: '15px', marginBottom: '5px' }}>
          <label style={{ cursor: 'pointer', fontWeight: 'bold', color: '#c62828' }}>
            <input 
              type="radio" 
              name="type" 
              value="expense" 
              checked={type === 'expense'} 
              onChange={() => setType('expense')} 
            />{' '}
            🔴 Išlaidos
          </label>
          <label style={{ cursor: 'pointer', fontWeight: 'bold', color: '#2e7d32' }}>
            <input 
              type="radio" 
              name="type" 
              value="income" 
              checked={type === 'income'} 
              onChange={() => setType('income')} 
            />{' '}
            🟢 Pajamos
          </label>
        </div>
        
        <input
          type="text"
          placeholder="Pavadinimas (pvz., Pienas)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <input
          type="number"
          step="0.01"
          placeholder="Suma (įveskite teigiamą skaičių)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />

        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
        >
          <option value="">-- Pasirink kategoriją --</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.title}
            </option>
          ))}
        </select>

        <button type="submit">Pridėti įrašą</button>
      </form>

      {/* Operacijų sąrašas */}
      <div className="transactions-list">
        <h3>Istorija</h3>
        {loading ? (
          <p>Kraunasi duomenys...</p>
        ) : transactions.length === 0 ? (
          <p>Įrašų dar nėra.</p>
        ) : (
          <ul>
            {transactions.map((t) => (
              <li key={t.id} className="transaction-item">
                <div className="info">
                  <strong className="title">{t.title}</strong>
                  <span className="category-tag">
                    {t.categories?.title || 'Kategorija nepaskirta'}
                  </span>
                </div>
                <div className="action">
                  <span className={t.amount >= 0 ? 'amount positive' : 'amount negative'}>
                    {Number(t.amount) > 0 ? `+${Number(t.amount).toFixed(2)}` : Number(t.amount).toFixed(2)} €
                  </span>
                  <button 
                    onClick={() => handleDelete(t.id)} 
                    className="delete-btn"
                  >
                    ✖
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <BudgetAssistant />
    </div>
  )
}

export default App