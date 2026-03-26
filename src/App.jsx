import './styles.css'
import { useMemo, useState, useEffect } from 'react'

const initialLeads = [
  {
    id: 1,
    company: 'تمكن لتقنية المعلومات',
    phone: '966553909589',
    status: 'جديد',
    temperature: 'Hot',
    stage: 'Lead',
  },
  {
    id: 2,
    company: 'شركة البناء الحديث',
    phone: '966501112233',
    status: 'تم التواصل',
    temperature: 'Warm',
    stage: 'Contacted',
  },
]

function scoreLead(lead) {
  const tempScore = lead.temperature === 'Hot' ? 50 : 30
  const statusScore =
    lead.status === 'تم التواصل' ? 10 :
    lead.status === 'مهتم' ? 20 : 5

  const stageScore =
    lead.stage === 'Won' ? 40 :
    lead.stage === 'Proposal' ? 30 :
    lead.stage === 'Meeting' ? 20 :
    lead.stage === 'Contacted' ? 10 : 5

  return tempScore + statusScore + stageScore
}

function getWhatsAppMessage(lead) {
  if (lead.temperature === 'Hot') {
    return `مرحبًا ${lead.company} 👋
جاهزين نبدأ فورًا في نظام CRM 🚀
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
  const [filterTemp, setFilterTemp] = useState('all')
  const [filterStage, setFilterStage] = useState('all')

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
    setNewLead({
      company: lead.company,
      phone: lead.phone,
      temperature: lead.temperature,
      status: lead.status,
      stage: lead.stage,
    })
  }

  function saveEdit() {
    if (!newLead.company || !newLead.phone) return

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

  function updateStage(id, stage) {
    setLeads(
      leads.map((lead) =>
        lead.id === id ? { ...lead, stage } : lead
      )
    )
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
          lead.temperature.includes(q) ||
          lead.stage.includes(q)

        const matchTemp =
          filterTemp === 'all' || lead.temperature === filterTemp

        const matchStage =
          filterStage === 'all' || lead.stage === filterStage

        return matchSearch && matchTemp && matchStage
      })
      .sort((a, b) => b.score - a.score)
  }, [leads, search, filterTemp, filterStage])

  const stats = useMemo(() => {
    return {
      total: leads.length,
      hot: leads.filter((lead) => lead.temperature === 'Hot').length,
      warm: leads.filter((lead) => lead.temperature === 'Warm').length,
      lead: leads.filter((lead) => lead.stage === 'Lead').length,
      contacted: leads.filter((lead) => lead.stage === 'Contacted').length,
      meeting: leads.filter((lead) => lead.stage === 'Meeting').length,
      proposal: leads.filter((lead) => lead.stage === 'Proposal').length,
      won: leads.filter((lead) => lead.stage === 'Won').length,
    }
  }, [leads])

  return (
    <div className="container" dir="rtl">
      <h1>🚀 Tamakan CRM</h1>

      <div className="stats-grid stats-grid-extended">
        <div className="stat-card">
          <span>إجمالي العملاء</span>
          <strong>{stats.total}</strong>
        </div>
        <div className="stat-card">
          <span>Hot</span>
          <strong>{stats.hot}</strong>
        </div>
        <div className="stat-card">
          <span>Warm</span>
          <strong>{stats.warm}</strong>
        </div>
        <div className="stat-card">
          <span>Lead</span>
          <strong>{stats.lead}</strong>
        </div>
        <div className="stat-card">
          <span>Contacted</span>
          <strong>{stats.contacted}</strong>
        </div>
        <div className="stat-card">
          <span>Meeting</span>
          <strong>{stats.meeting}</strong>
        </div>
        <div className="stat-card">
          <span>Proposal</span>
          <strong>{stats.proposal}</strong>
        </div>
        <div className="stat-card">
          <span>Won</span>
          <strong>{stats.won}</strong>
        </div>
      </div>

      <div className="top-bar">
        <input
          placeholder="🔍 ابحث باسم الشركة أو الجوال أو المرحلة"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select value={filterTemp} onChange={(e) => setFilterTemp(e.target.value)}>
          <option value="all">كل الدرجات</option>
          <option value="Hot">🔥 Hot</option>
          <option value="Warm">🟡 Warm</option>
        </select>

        <select value={filterStage} onChange={(e) => setFilterStage(e.target.value)}>
          <option value="all">كل المراحل</option>
          <option value="Lead">Lead</option>
          <option value="Contacted">Contacted</option>
          <option value="Meeting">Meeting</option>
          <option value="Proposal">Proposal</option>
          <option value="Won">Won</option>
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
            <th>المرحلة</th>
            <th>النقاط</th>
            <th>أفضلية الاتصال</th>
            <th>واتساب</th>
            <th>تحديث المرحلة</th>
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
              <td>
                <span className={`stage-badge stage-${lead.stage.toLowerCase()}`}>
                  {lead.stage}
                </span>
              </td>
              <td>{lead.score}</td>

              <td>
                {lead.score > 70 ? (
                  <span className="danger">اتصل الآن</span>
                ) : lead.score > 45 ? (
                  <span className="warn">اليوم</span>
                ) : (
                  <span className="ok-badge">لاحقًا</span>
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
                <select
                  className="stage-select"
                  value={lead.stage}
                  onChange={(e) => updateStage(lead.id, e.target.value)}
                >
                  <option value="Lead">Lead</option>
                  <option value="Contacted">Contacted</option>
                  <option value="Meeting">Meeting</option>
                  <option value="Proposal">Proposal</option>
                  <option value="Won">Won</option>
                </select>
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
