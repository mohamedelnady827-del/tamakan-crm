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
    followUp: '2026-03-25',
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
    notes: 'يحتاج متابعة بعد يومين',
  },
  {
    id: 3,
    company: 'مؤسسة الإعمار الذكي',
    phone: '966509998877',
    projects: 5,
    employees: 40,
    currentMethod: 'يدوي',
    status: 'مهتم',
    temperature: 'Hot',
    lastContact: 'اليوم',
    followUp: '2026-03-26',
    notes: 'أفضل عميل حاليًا',
  },
]

function scoreLead(lead) {
  if (lead.status === 'تم الإغلاق') return 0

  const tempScore =
    lead.temperature === 'Hot' ? 50 :
    lead.temperature === 'Warm' ? 30 : 10

  const statusScore =
    lead.status === 'مهتم' ? 20 :
    lead.status === 'تم التواصل' ? 10 :
    lead.status === 'جديد' ? 5 :
    lead.status === 'غير مهتم' ? -20 : 0

  const followScore =
    lead.followUp === '2026-03-26' ? 25 :
    lead.followUp < '2026-03-26' ? 20 : 0

  return tempScore + statusScore + followScore
}

function getPriority(score) {
  if (score >= 80) return 'أولوية قصوى'
  if (score >= 50) return 'أولوية عالية'
  if (score >= 30) return 'أولوية متوسطة'
  return 'أولوية منخفضة'
}

function getAction(score) {
  if (score >= 80) return 'اتصل الآن'
  if (score >= 50) return 'اليوم'
  if (score >= 30) return 'بعد العملاء المهمين'
  return 'لاحقًا'
}

export default function App() {
  const [tab, setTab] = useState('dashboard')
  const [search, setSearch] = useState('')

  // ✅ حفظ البيانات
  const [leads, setLeads] = useState(() => {
    const saved = localStorage.getItem('tamakan-crm-leads')
    return saved ? JSON.parse(saved) : initialLeads
  })

  const [newLead, setNewLead] = useState({
    company: '',
    phone: '',
    projects: '',
    employees: '',
    currentMethod: '',
    status: 'جديد',
    temperature: 'Warm',
    followUp: '',
    notes: '',
  })

  // ✅ حفظ تلقائي
  useEffect(() => {
    localStorage.setItem('tamakan-crm-leads', JSON.stringify(leads))
  }, [leads])

  const processedLeads = useMemo(() => {
    return leads
      .map((lead) => {
        const score = scoreLead(lead)
        return {
          ...lead,
          score,
          priority: getPriority(score),
          action: getAction(score),
        }
      })
      .filter((lead) =>
        lead.company.includes(search) ||
        lead.phone.includes(search)
      )
      .sort((a, b) => b.score - a.score)
  }, [leads, search])

  const stats = {
    total: leads.length,
    hot: leads.filter((x) => x.temperature === 'Hot').length,
    today: leads.filter((x) => x.followUp === '2026-03-26').length,
  }

  function addLead() {
    if (!newLead.company || !newLead.phone) return

    setLeads([
      {
        id: leads.length + 1,
        ...newLead,
        lastContact: 'اليوم',
      },
      ...leads,
    ])

    setNewLead({
      company: '',
      phone: '',
      projects: '',
      employees: '',
      currentMethod: '',
      status: 'جديد',
      temperature: 'Warm',
      followUp: '',
      notes: '',
    })

    setTab('leads')
  }

  function getWhatsAppLink(lead) {
    return `https://wa.me/${lead.phone}?text=مرحبا ${lead.company}`
  }

  return (
    <div className="app" dir="rtl">
      <h1>🚀 Tamakan CRM</h1>

      <div className="nav">
        <button onClick={() => setTab('dashboard')}>الرئيسية</button>
        <button onClick={() => setTab('leads')}>العملاء</button>
        <button onClick={() => setTab('add')}>إضافة عميل</button>
      </div>

      {tab === 'dashboard' && (
        <>
          <div className="stats">
            <div>إجمالي: {stats.total}</div>
            <div>Hot: {stats.hot}</div>
            <div>اليوم: {stats.today}</div>
          </div>

          <table>
            <thead>
              <tr>
                <th>الشركة</th>
                <th>النقاط</th>
                <th>الأولوية</th>
              </tr>
            </thead>
            <tbody>
              {processedLeads.map((l) => (
                <tr key={l.id}>
                  <td>{l.company}</td>
                  <td>{l.score}</td>
                  <td>{l.priority}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {tab === 'leads' && (
        <>
          <input
            placeholder="بحث"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {processedLeads.map((l) => (
            <div key={l.id} className="card">
              <h3>{l.company}</h3>
              <p>{l.phone}</p>
              <a href={getWhatsAppLink(l)} target="_blank">واتساب</a>
            </div>
          ))}
        </>
      )}

      {tab === 'add' && (
        <>
          <input placeholder="الشركة"
            value={newLead.company}
            onChange={(e) => setNewLead({...newLead, company:e.target.value})}
          />

          <input placeholder="الجوال"
            value={newLead.phone}
            onChange={(e) => setNewLead({...newLead, phone:e.target.value})}
          />

          <button onClick={addLead}>إضافة</button>
        </>
      )}
    </div>
  )
}
