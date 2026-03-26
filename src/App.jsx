import './styles.css'
import { useEffect, useMemo, useState } from 'react'

const initialLeads = [
  {
    id: 1,
    company: 'تمكن لتقنية المعلومات',
    phone: '966553909589',
    projects: 3,
    employees: 25,
    currentMethod: 'إكسل + واتساب',
    status: 'جديد',
    temperature: 'Hot',
    lastContact: 'أمس',
    followUp: '2026-03-26',
    notes: 'عميل مناسب للاجتماع',
  },
  {
    id: 2,
    company: 'شركة البناء الحديث',
    phone: '966501112233',
    projects: 2,
    employees: 12,
    currentMethod: 'واتساب',
    status: 'تم التواصل',
    temperature: 'Warm',
    lastContact: 'اليوم',
    followUp: '2026-03-27',
    notes: 'يحتاج متابعة',
  },
]

function scoreLead(lead) {
  const tempScore = lead.temperature === 'Hot' ? 50 : 30
  const statusScore =
    lead.status === 'مهتم' ? 20 :
    lead.status === 'تم التواصل' ? 10 : 5

  return tempScore + statusScore
}

function getWhatsAppMessage(lead) {
  if (lead.temperature === 'Hot') {
    return `مرحبًا ${lead.company}، جاهزين نبدأ معكم فورًا في نظام CRM 🚀 هل يناسبكم اتصال الآن؟`
  }

  if (lead.temperature === 'Warm') {
    return `مرحبًا ${lead.company}، نحب نتابع معكم بخصوص النظام، هل يناسبكم وقت قريب؟`
  }

  return `مرحبًا ${lead.company}، نقدم نظام CRM يساعدكم في إدارة العملاء بسهولة`
}

export default function App() {
  const [leads, setLeads] = useState(initialLeads)

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
            <th>واتساب</th> {/* ✅ العمود الجديد */}
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

              {/* ✅ زر واتساب */}
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

            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
