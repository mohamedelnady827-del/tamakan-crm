import './styles.css'
import { useMemo, useState } from 'react'

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
  const [leads, setLeads] = useState(initialLeads)
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
      .filter((lead) => {
        return (
          lead.company.includes(search) ||
          lead.phone.includes(search) ||
          lead.status.includes(search) ||
          lead.temperature.includes(search)
        )
      })
      .sort((a, b) => b.score - a.score)
  }, [leads, search])

  const stats = useMemo(() => {
    return {
      total: leads.length,
      hot: leads.filter((x) => x.temperature === 'Hot').length,
      warm: leads.filter((x) => x.temperature === 'Warm').length,
      today: leads.filter((x) => x.followUp === '2026-03-26').length,
    }
  }, [leads])

  function addLead() {
    if (!newLead.company || !newLead.phone) return

    setLeads([
      {
        id: leads.length + 1,
        company: newLead.company,
        phone: newLead.phone,
        projects: Number(newLead.projects || 0),
        employees: Number(newLead.employees || 0),
        currentMethod: newLead.currentMethod,
        status: newLead.status,
        temperature: newLead.temperature,
        lastContact: 'اليوم',
        followUp: newLead.followUp || '2026-03-27',
        notes: newLead.notes,
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
    const message =
      lead.temperature === 'Hot'
        ? `مرحبًا ${lead.company}، تواصلنا معكم بخصوص نظام إدارة المشاريع والبصمة. هل يناسبكم اجتماع سريع اليوم أو غدًا؟`
        : lead.temperature === 'Warm'
        ? `مرحبًا ${lead.company}، نذكركم بتواصلنا السابق بخصوص النظام. هل نرتب اجتماعًا مختصرًا؟`
        : `مرحبًا ${lead.company}، نحن نقدم حلول إدارة مشاريع وبصمة ومواقع إلكترونية. هل تحبون تعريفًا سريعًا بالخدمة؟`

    return `https://wa.me/${lead.phone}?text=${encodeURIComponent(message)}`
  }

  return (
    <div className="app" dir="rtl">
      <header className="hero">
        <div>
          <h1>نظام CRM تمكّن</h1>
          <p>واجهة عربية احترافية لإدارة العملاء والمتابعات والأولويات</p>
        </div>
        <div className="hero-buttons">
          <button className="nav-btn" onClick={() => setTab('dashboard')}>الرئيسية</button>
          <button className="nav-btn" onClick={() => setTab('leads')}>العملاء</button>
          <button className="nav-btn" onClick={() => setTab('today')}>متابعة اليوم</button>
          <button className="nav-btn" onClick={() => setTab('add')}>إضافة عميل</button>
        </div>
      </header>

      <section className="stats-grid">
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
          <span>متابعات اليوم</span>
          <strong>{stats.today}</strong>
        </div>
      </section>

      {tab === 'dashboard' && (
        <section className="panel">
          <div className="panel-header">
            <h2>أفضل العملاء حسب الأولوية</h2>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>الشركة</th>
                  <th>الحرارة</th>
                  <th>الحالة</th>
                  <th>النقاط</th>
                  <th>الأولوية</th>
                  <th>أفضلية الاتصال</th>
                </tr>
              </thead>
              <tbody>
                {processedLeads.map((lead) => (
                  <tr key={lead.id}>
                    <td>{lead.company}</td>
                    <td>
                      <span className={`badge ${lead.temperature.toLowerCase()}`}>
                        {lead.temperature}
                      </span>
                    </td>
                    <td>{lead.status}</td>
                    <td>{lead.score}</td>
                    <td>{lead.priority}</td>
                    <td>
                      <span className={`action-badge ${lead.action === 'اتصل الآن' ? 'danger' : lead.action === 'اليوم' ? 'warn' : 'ok'}`}>
                        {lead.action}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === 'leads' && (
        <section className="panel">
          <div className="panel-header row-between">
            <h2>قائمة العملاء</h2>
            <input
              className="search-input"
              placeholder="ابحث باسم الشركة أو الجوال أو الحالة"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>الشركة</th>
                  <th>الجوال</th>
                  <th>الحالة</th>
                  <th>الحرارة</th>
                  <th>موعد المتابعة</th>
                  <th>النقاط</th>
                  <th>واتساب</th>
                </tr>
              </thead>
              <tbody>
                {processedLeads.map((lead) => (
                  <tr key={lead.id}>
                    <td>{lead.company}</td>
                    <td>{lead.phone}</td>
                    <td>{lead.status}</td>
                    <td>
                      <span className={`badge ${lead.temperature.toLowerCase()}`}>
                        {lead.temperature}
                      </span>
                    </td>
                    <td>{lead.followUp}</td>
                    <td>{lead.score}</td>
                    <td>
                      <a className="wa-btn" href={getWhatsAppLink(lead)} target="_blank" rel="noreferrer">
                        واتساب
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === 'today' && (
        <section className="cards-grid">
          {processedLeads
            .filter((lead) => lead.followUp === '2026-03-26')
            .map((lead) => (
              <div className="lead-card" key={lead.id}>
                <h3>{lead.company}</h3>
                <p>{lead.phone}</p>
                <div className="mini-info">
                  <span>الحالة: {lead.status}</span>
                  <span>النقاط: {lead.score}</span>
                  <span>الأولوية: {lead.priority}</span>
                  <span>الإجراء: {lead.action}</span>
                </div>
                <a className="wa-btn full" href={getWhatsAppLink(lead)} target="_blank" rel="noreferrer">
                  إرسال واتساب
                </a>
              </div>
            ))}
        </section>
      )}

      {tab === 'add' && (
        <section className="panel">
          <div className="panel-header">
            <h2>إضافة عميل جديد</h2>
          </div>

          <div className="form-grid">
            <input
              className="form-input"
              placeholder="اسم الشركة"
              value={newLead.company}
              onChange={(e) => setNewLead({ ...newLead, company: e.target.value })}
            />
            <input
              className="form-input"
              placeholder="رقم الجوال بصيغة 966"
              value={newLead.phone}
              onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
            />
            <input
              className="form-input"
              placeholder="عدد المشاريع"
              value={newLead.projects}
              onChange={(e) => setNewLead({ ...newLead, projects: e.target.value })}
            />
            <input
              className="form-input"
              placeholder="عدد الموظفين"
              value={newLead.employees}
              onChange={(e) => setNewLead({ ...newLead, employees: e.target.value })}
            />
            <input
              className="form-input"
              placeholder="طريقة الإدارة الحالية"
              value={newLead.currentMethod}
              onChange={(e) => setNewLead({ ...newLead, currentMethod: e.target.value })}
            />
            <input
              className="form-input"
              placeholder="موعد المتابعة YYYY-MM-DD"
              value={newLead.followUp}
              onChange={(e) => setNewLead({ ...newLead, followUp: e.target.value })}
            />

            <select
              className="form-input"
              value={newLead.status}
              onChange={(e) => setNewLead({ ...newLead, status: e.target.value })}
            >
              <option value="جديد">جديد</option>
              <option value="تم التواصل">تم التواصل</option>
              <option value="مهتم">مهتم</option>
              <option value="غير مهتم">غير مهتم</option>
            </select>

            <select
              className="form-input"
              value={newLead.temperature}
              onChange={(e) => setNewLead({ ...newLead, temperature: e.target.value })}
            >
              <option value="Hot">Hot</option>
              <option value="Warm">Warm</option>
              <option value="Cold">Cold</option>
            </select>
          </div>

          <button className="primary-btn" onClick={addLead}>
            إضافة العميل
          </button>
        </section>
      )}
    </div>
  )
}
