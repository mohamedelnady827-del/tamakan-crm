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
نحن جاهزين نبدأ معكم فورًا في نظام CRM 🚀
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

export default function App() {
  const [leads, setLeads] = useState(() => {
    const saved = localStorage.getItem('leads')
    return saved ? JSON.parse(saved) : initialLeads
  })

  const [newLead, setNewLead] = useState({
    company: '',
    phone: '',
    temperature: 'Warm',
  })

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
      company: newLead.company,
      phone: newLead.phone,
      temperature: newLead.temperature,
      status: 'جديد',
    }

    setLeads([newItem, ...leads])

    setNewLead({
      company: '',
      phone: '',
      temperature: 'Warm',
    })
  }

  const processedLeads = useMemo(() => {
    return leads
      .map((lead) => ({
        ...lead,
        score: scoreLead(lead),
      }))
      .sort((a, b) => b.score - a.score)
  }, [leads])

  return (
    <div className="container" dir="rtl">
      <h1>🚀 Tamakan CRM</h1>

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

        <button onClick={addLead} className="primary-btn">
          ➕ إضافة عميل
        </button>
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
