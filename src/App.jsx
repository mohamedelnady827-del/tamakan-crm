import './styles.css'
import { useMemo, useState, useEffect } from 'react'

const initialLeads = [
  {
    id: 1,
    company: 'تمكن لتقنية المعلومات',
    phone: '966553909589',
    status: 'جديد',
    temperature: 'Hot',
  },
  {
    id: 2,
    company: 'شركة البناء الحديث',
    phone: '966501112233',
    status: 'تم التواصل',
    temperature: 'Warm',
  },
]

function scoreLead(lead) {
  const tempScore = lead.temperature === 'Hot' ? 50 : 30
  const statusScore = lead.status === 'تم التواصل' ? 10 : 5
  return tempScore + statusScore
}

function getWhatsAppMessage(lead) {
  if (lead.temperature === 'Hot') {
    return `مرحبًا ${lead.company} 👋
جاهزين نبدأ فورًا 🚀 هل يناسبكم اتصال الآن؟`
  }

  if (lead.temperature === 'Warm') {
    return `مرحبًا ${lead.company} 👋
نحب نتابع معكم بخصوص النظام`
  }

  return `مرحبًا ${lead.company}`
}

const emptyLead = {
  company: '',
  phone: '',
  temperature: 'Warm',
  status: 'جديد',
}

export default function App() {
  const [leads, setLeads] = useState(() => {
    const saved = localStorage.getItem('leads')
    return saved ? JSON.parse(saved) : initialLeads
  })

  const [newLead, setNewLead] = useState(emptyLead)
  const [editingId, setEditingId] = useState(null)

  // 🔥 جديد
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    localStorage.setItem('leads', JSON.stringify(leads))
  }, [leads])

  function addLead() {
    if (!newLead.company || !newLead.phone) return

    const newItem = {
      id: Date.now(),
      ...newLead,
    }

    setLeads([newItem, ...leads])
    setNewLead(emptyLead)
  }

  function startEdit(lead) {
    setEditingId(lead.id)
    setNewLead(lead)
  }

  function saveEdit() {
    setLeads(
      leads.map((l) => (l.id === editingId ? { ...newLead, id: editingId } : l))
    )
    setEditingId(null)
    setNewLead(emptyLead)
  }

  function deleteLead(id) {
    setLeads(leads.filter((l) => l.id !== id))
  }

  const processedLeads = useMemo(() => {
    return leads
      .map((lead) => ({
        ...lead,
        score: scoreLead(lead),
      }))
      .filter((lead) => {
        const matchSearch = lead.company.includes(search)
        const matchFilter =
          filter === 'all' || lead.temperature === filter
        return matchSearch && matchFilter
      })
      .sort((a, b) => b.score - a.score)
  }, [leads, search, filter])

  return (
    <div className="container" dir="rtl">
      <h1>🚀 Tamakan CRM</h1>

      {/* 🔥 البحث + الفلترة */}
      <div className="top-bar">
        <input
          placeholder="🔍 ابحث باسم الشركة"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">الكل</option>
          <option value="Hot">🔥 Hot</option>
          <option value="Warm">🟡 Warm</option>
        </select>
      </div>

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
          <option value="Hot">🔥 Hot</option>
          <option value="Warm">🟡 Warm</option>
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

      <table>
        <thead>
          <tr>
            <th>الشركة</th>
            <th>الحالة</th>
            <th>الحرارة</th>
            <th>النقاط</th>
            <th>واتساب</th>
            <th>تعديل</th>
            <th>حذف</th>
          </tr>
        </thead>

        <tbody>
          {processedLeads.map((lead) => (
            <tr key={lead.id}>
              <td>{lead.company}</td>
              <td>{lead.status}</td>
              <td>{lead.temperature}</td>
              <td>{lead.score}</td>

              <td>
                <a
                  href={`https://wa.me/${lead.phone}?text=${encodeURIComponent(
                    getWhatsAppMessage(lead)
                  )}`}
                  target="_blank"
                  className="wa-btn"
                >
                  واتساب
                </a>
              </td>

              <td>
                <button onClick={() => startEdit(lead)} className="edit-btn">
                  ✏️
                </button>
              </td>

              <td>
                <button onClick={() => deleteLead(lead.id)} className="delete-btn">
                  🗑️
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
