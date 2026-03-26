import './styles.css'
import { useState, useEffect, useMemo } from 'react'

const initialLeads = [
  {
    id: 1,
    company: 'تمكن لتقنية المعلومات',
    phone: '966553909589',
    status: 'جديد',
    temperature: 'Hot',
    stage: 'Lead',
  },
]

const emptyLead = {
  company: '',
  phone: '',
  temperature: 'Warm',
  status: 'جديد',
  stage: 'Lead',
}

export default function App() {
  const [leads, setLeads] = useState(() => {
    const saved = localStorage.getItem('leads')
    return saved ? JSON.parse(saved) : initialLeads
  })

  const [newLead, setNewLead] = useState(emptyLead)
  const [editingId, setEditingId] = useState(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    localStorage.setItem('leads', JSON.stringify(leads))
  }, [leads])

  function addLead() {
    if (!newLead.company || !newLead.phone) return

    const item = { id: Date.now(), ...newLead }
    setLeads([item, ...leads])
    setNewLead(emptyLead)
  }

  function deleteLead(id) {
    setLeads(leads.filter(l => l.id !== id))
  }

  function startEdit(lead) {
    setEditingId(lead.id)
    setNewLead(lead)
  }

  function saveEdit() {
    setLeads(leads.map(l => l.id === editingId ? newLead : l))
    setEditingId(null)
    setNewLead(emptyLead)
  }

  function updateStage(id, stage) {
    setLeads(leads.map(l => l.id === id ? { ...l, stage } : l))
  }

  const filtered = useMemo(() => {
    return leads.filter(l => {
      return (
        (filter === 'all' || l.temperature === filter) &&
        l.company.includes(search)
      )
    })
  }, [leads, search, filter])

  return (
    <div className="container" dir="rtl">
      <h1>🚀 Tamakan CRM</h1>

      {/* 🔥 Dashboard */}
      <div className="stats-grid stats-grid-extended">
        <div className="stat-card">
          <span>📊 العملاء</span>
          <strong>{leads.length}</strong>
        </div>

        <div className="stat-card">
          <span>🔥 Hot</span>
          <strong>{leads.filter(l => l.temperature === 'Hot').length}</strong>
        </div>

        <div className="stat-card">
          <span>🟡 Warm</span>
          <strong>{leads.filter(l => l.temperature === 'Warm').length}</strong>
        </div>

        <div className="stat-card">
          <span>💰 Won</span>
          <strong>{leads.filter(l => l.stage === 'Won').length}</strong>
        </div>
      </div>

      {/* 🔍 Search */}
      <div className="top-bar">
        <input
          placeholder="ابحث"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select onChange={(e) => setFilter(e.target.value)}>
          <option value="all">الكل</option>
          <option value="Hot">Hot</option>
          <option value="Warm">Warm</option>
        </select>
      </div>

      {/* 📝 Form */}
      <div className="form-box">
        <input
          placeholder="اسم الشركة"
          value={newLead.company}
          onChange={(e) =>
            setNewLead({ ...newLead, company: e.target.value })
          }
        />

        <input
          placeholder="رقم الجوال"
          value={newLead.phone}
          onChange={(e) =>
            setNewLead({ ...newLead, phone: e.target.value })
          }
        />

        <select
          value={newLead.temperature}
          onChange={(e) =>
            setNewLead({ ...newLead, temperature: e.target.value })
          }
        >
          <option value="Hot">Hot</option>
          <option value="Warm">Warm</option>
        </select>

        <select
          value={newLead.stage}
          onChange={(e) =>
            setNewLead({ ...newLead, stage: e.target.value })
          }
        >
          <option value="Lead">Lead</option>
          <option value="Contacted">Contacted</option>
          <option value="Meeting">Meeting</option>
          <option value="Proposal">Proposal</option>
          <option value="Won">Won</option>
        </select>

        {editingId ? (
          <button onClick={saveEdit} className="primary-btn">
            💾 حفظ
          </button>
        ) : (
          <button onClick={addLead} className="primary-btn">
            ➕ إضافة
          </button>
        )}
      </div>

      {/* 📊 Pipeline */}
      <div className="pipeline">
        {['Lead', 'Contacted', 'Meeting', 'Proposal', 'Won'].map(stage => (
          <div key={stage} className="pipe-col">
            <h3>{stage}</h3>

            {leads
              .filter(l => l.stage === stage)
              .map(l => (
                <div key={l.id} className="card">
                  <b>{l.company}</b>

                  <div className="actions">
                    <button onClick={() => startEdit(l)}>✏️</button>
                    <button onClick={() => deleteLead(l.id)}>🗑️</button>
                  </div>

                  <select
                    value={l.stage}
                    onChange={(e) => updateStage(l.id, e.target.value)}
                  >
                    <option>Lead</option>
                    <option>Contacted</option>
                    <option>Meeting</option>
                    <option>Proposal</option>
                    <option>Won</option>
                  </select>
                </div>
              ))}
          </div>
        ))}
      </div>
    </div>
  )
}
