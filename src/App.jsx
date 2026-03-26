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

function getWhatsAppLink(lead) {
  const message =
    lead.temperature === 'Hot'
      ? `مرحبًا ${lead.company}، تواصلنا معكم من شركة تمكن لتقنية المعلومات بخصوص نظام إدارة المشاريع والبصمة وتطوير المواقع. هل يناسبكم اجتماع سريع اليوم أو غدًا؟`
      : lead.temperature === 'Warm'
      ? `مرحبًا ${lead.company}، نذكركم بتواصلنا السابق بخصوص النظام. هل نرتب اجتماعًا مختصرًا؟`
      : `مرحبًا ${lead.company}، نحن نقدم حلول إدارة مشاريع وبصمة ومواقع إلكترونية. هل تحبون تعريفًا سريعًا بالخدمة؟`

  return `https://wa.me/${lead.phone}?text=${encodeURIComponent(message)}`
}

export default function App() {
  const [activePage, setActivePage] = useState('dashboard')
  const [search, setSearch] = useState('')
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
      .filter((lead) => {
        const q = search.trim()
        if (!q) return true
        return (
          lead.company.includes(q) ||
          lead.phone.includes(q) ||
          lead.status.includes(q) ||
          lead.temperature.includes(q)
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
      interested: leads.filter((x) => x.status === 'مهتم').length,
      closed: leads.filter((x) => x.status === 'تم الإغلاق').length,
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

    setActivePage('leads')
  }

  function resetData() {
    localStorage.removeItem('tamakan-crm-leads')
    setLeads(initialLeads)
    setActivePage('dashboard')
  }

  return (
    <div className="crm-layout" dir="rtl">
      <aside className="sidebar">
        <div className="brand-box">
          <div className="brand-logo">ت</div>
          <div>
            <h2>CRM تمكّن</h2>
            <p>لوحة مبيعات ومتابعة</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button
            className={activePage === 'dashboard' ? 'side-link active' : 'side-link'}
            onClick={() => setActivePage('dashboard')}
          >
            الرئيسية
          </button>
          <button
            className={activePage === 'leads' ? 'side-link active' : 'side-link'}
            onClick={() => setActivePage('leads')}
          >
            العملاء
          </button>
          <button
            className={activePage === 'today' ? 'side-link active' : 'side-link'}
            onClick={() => setActivePage('today')}
          >
            متابعة اليوم
          </button>
          <button
            className={activePage === 'add' ? 'side-link active' : 'side-link'}
            onClick={() => setActivePage('add')}
          >
            إضافة عميل
          </button>
        </nav>

        <div className="sidebar-footer">
          <button className="danger-btn" onClick={resetData}>
            إعادة ضبط البيانات
          </button>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div>
            <h1>نظام CRM تمكّن</h1>
            <p>واجهة عربية احترافية لإدارة العملاء والمتابعة والأولويات</p>
          </div>

          <div className="topbar-search">
            <input
              type="text"
              placeholder="ابحث باسم الشركة أو الجوال أو الحالة"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
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
          <div className="stat-card">
            <span>عملاء مهتمون</span>
            <strong>{stats.interested}</strong>
          </div>
          <div className="stat-card">
            <span>تم الإغلاق</span>
            <strong>{stats.closed}</strong>
          </div>
        </section>

        {activePage === 'dashboard' && (
          <section className="page-card">
            <div className="section-head">
              <h2>أفضل العملاء حسب الأولوية</h2>
              <span>مرتبة تلقائيًا حسب النقاط</span>
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
                        <span
                          className={`action-badge ${
                            lead.action === 'اتصل الآن'
                              ? 'danger'
                              : lead.action === 'اليوم'
                              ? 'warn'
                              : 'ok'
                          }`}
                        >
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

        {activePage === 'leads' && (
          <section className="page-card">
            <div className="section-head">
              <h2>قائمة العملاء</h2>
              <span>إدارة كاملة مع واتساب مباشر</span>
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
                        <a
                          className="wa-btn"
                          href={getWhatsAppLink(lead)}
                          target="_blank"
                          rel="noreferrer"
                        >
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

        {activePage === 'today' && (
          <section className="cards-grid">
            {processedLeads
              .filter((lead) => lead.followUp === '2026-03-26')
              .map((lead) => (
                <div className="lead-card" key={lead.id}>
                  <div className="lead-top">
                    <h3>{lead.company}</h3>
                    <span className={`badge ${lead.temperature.toLowerCase()}`}>
                      {lead.temperature}
                    </span>
                  </div>
                  <p>{lead.phone}</p>
                  <div className="mini-info">
                    <span>الحالة: {lead.status}</span>
                    <span>النقاط: {lead.score}</span>
                    <span>الأولوية: {lead.priority}</span>
                    <span>الإجراء: {lead.action}</span>
                  </div>
                  <a
                    className="wa-btn full"
                    href={getWhatsAppLink(lead)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    إرسال واتساب
                  </a>
                </div>
              ))}
          </section>
        )}

        {activePage === 'add' && (
          <section className="page-card">
            <div className="section-head">
              <h2>إضافة عميل جديد</h2>
              <span>أدخل البيانات وسيتم حفظها تلقائيًا</span>
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
                <option value="تم الإغلاق">تم الإغلاق</option>
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

              <textarea
                className="form-input textarea"
                placeholder="ملاحظات"
                value={newLead.notes}
                onChange={(e) => setNewLead({ ...newLead, notes: e.target.value })}
              />
            </div>

            <button className="primary-btn" onClick={addLead}>
              إضافة العميل
            </button>
          </section>
        )}
      </main>
    </div>
  )
}
