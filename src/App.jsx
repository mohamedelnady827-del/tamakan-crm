import './styles.css'
import { useMemo, useState } from 'react'

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

// حساب النقاط
function scoreLead(lead) {
  const tempScore = lead.temperature === 'Hot' ? 50 : 30
  const statusScore =
    lead.status === 'تم التواصل' ? 10 : 5

  return tempScore + statusScore
}

// رسائل واتساب الذكية
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
  const [leads] = useState(initialLeads)

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
                {lead.score > 60 ? (
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
