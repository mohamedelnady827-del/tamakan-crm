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
  const statusScore =
    lead.status === 'تم التواصل' ? 10 :
    lead.status === 'مهتم' ? 20 : 5

  return tempScore + statusScore
}

function getWhatsAppMessage(lead) {
  if (lead.temperature === 'Hot') {
    return `مرحبًا ${lead.company} 👋
جاهزين نبدأ معكم فورًا في نظام CRM 🚀
هل يناسبكم اتصال الآن؟`
  }

  if (lead.temperature === 'Warm') {
    return `مرحبًا ${lead.company} 👋
نحب نتابع معكم بخصوص النظام
هل يناسبكم وقت مناسب؟`
  }

  return `مرحبًا ${lead.company} 👋
نقدم نظام CRM يساعدكم في إدارة العملاء بسهولة`
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
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    localStorage.setItem('leads', JSON.stringify(leads))
  }, [leads])

  function addLead() {
    if (!newLead.company || !newLead.phone) {
      alert('اكمل البيانات')
      return
    }

    const newItem = {
      id: Date.now(),
      ...newLead,
    }

    setLeads([newItem, ...leads])
    setNewLead(emptyLead)
  }

  function startEdit(lead) {
    setEditingId(lead.id)
    setNewLead({
      company: lead.company,
      phone: lead.phone,
      temperature: lead.temperature,
      status: lead.status,
    })
  }

  function saveEdit() {
    if (!newLead.company || !newLead.phone) {
      alert('اكمل البيانات')
      return
    }

    setLeads(
      leads.map((lead) =>
        lead.id === editingId ? { ...lead, ...newLead } : lead
      )
    )

    setEditingId(null)
    setNewLead(emptyLead)
  }

  function cancelEdit() {
    setEditingId(null)
    setNewLead(emptyLead)
  }

  function deleteLead(id) {
    const ok = window.confirm('هل أنت متأكد من حذف العميل؟')
    if (!ok) return

    setLeads(leads.filter((lead) => lead.id !== id))

    if (editingId === id) {
      setEditingId(null)
      setNewLead(emptyLead)
    }
  }

  const processedLeads = useMemo(() => {
    return leads
      .map((lead) => ({
        ...lead,
        score: scoreLead(lead),
      }))
      .filter((lead) => {
        const q = search.trim()
        const matchSearch =
          !q ||
          lead.company.includes(q) ||
          lead.phone.includes(q) ||
          lead.status.includes(q) ||
          lead.temperature.includes(q)

        const matchFilter =
          filter === 'all' || lead.temperature === filter

        return matchSearch && matchFilter
      })
      .sort((a, b) => b.score - a.score)
  }, [leads, search, filter])

  const stats = useMemo(() => {
    return {
      total: leads.length,
      hot: leads.filter((lead) => lead.temperature === 'Hot').length,
      warm: leads.filter((lead) => lead.temperature === 'Warm').length,
      newCount: leads.filter((lead) => lead.status === 'جديد').length,
      contacted: leads.filter((lead) => lead.status === 'تم التواصل').length,
    }
  }, [leads])

  return (
    <div className="container" dir="rtl">
      <h1>🚀 Tamakan CRM</h1>

      <div className="stats-grid">
        <div className="stat-card">
          <span>إجمالي العملاء</span>
          <strong>{stats.total}</strong>
        </div>
        <div className="stat-card">
          <span>عملاء Hot</span>
          <strong>{stats.hot}</strong>
        </div>
        <div className="stat-card">
          <span>عملاء Warm</span>
          <strong>{stats.warm}</strong>
        </div>
        <div className="stat-card">
          <span>عملاء جدد</span>
          <strong>{stats.newCount}</strong>
        </div>
        <div className="stat-card">
          <span>تم التواصل</span>
          <strong>{stats.contacted}</strong>
        </div>
      </div>

      <div className="top-bar">
        <input
          placeholder="🔍 ابحث باسم الشركة أو الجوال أو الحالة"
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

        <select
          value={newLead.status}
          onChange={(e) =>
            setNewLead({ ...newLead, status: e.target.value })
          }
        >
          <option value="جديد">جديد</option>
          <option value="تم التواصل">تم التواصل</option>
          <option value="مهتم">مهتم</option>
        </select>

        {editingId ? (
          <>
            <button onClick={saveEdit} className="primary-btn">
              💾 حفظ التعديل
            </button>
            <button onClick={cancelEdit} className="cancel-btn">
              إلغاء
            </button>
          </>
        ) : (
          <button onClick={addLead} className="primary-btn">
            ➕ إضافة عميل
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
            <th>أفضلية الاتصال</th>
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
                {lead.score > 40 ? (
                  <span className="danger">اتصل الآن</span>
                ) : (
                  <span className="warn">اليوم</span>
                )}
              </td>

              <td>
                <a
                  href={`https://wa.me/${lead.phone}?text=${encodeURIComponent(
                    getWhatsAppMessage(lead)
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="wa-btn"
                >
                  واتساب
                </a>
              </td>

              <td>
                <button onClick={() => startEdit(lead)} className="edit-btn">
                  ✏️ تعديل
                </button>
              </td>

              <td>
                <button onClick={() => deleteLead(lead.id)} className="delete-btn">
                  🗑️ حذف
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
