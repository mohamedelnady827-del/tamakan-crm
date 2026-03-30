import './styles.css'
import { useEffect, useMemo, useState } from 'react'
import { initializeApp } from 'firebase/app'
import {
  getFirestore,
  collection,
  collectionGroup,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  onSnapshot,
  getDocs,
  query,
  orderBy
} from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyB53c1aa_CGtDzE0JnUQjbzntYVRBQmx14',
  authDomain: 'tamakan-crm.firebaseapp.com',
  projectId: 'tamakan-crm',
  storageBucket: 'tamakan-crm.firebasestorage.app',
  messagingSenderId: '180077608637',
  appId: '1:180077608637:web:bd09d667e20ed830f541d4'
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

const STAGES = ['Lead', 'Contacted', 'Meeting', 'Proposal', 'Won']
const TEMPERATURES = ['Hot', 'Warm']
const DEAL_STATUSES = ['Open', 'Won', 'Lost']
const DECISION_STATUSES = ['Pending', 'Approved', 'Rejected', 'No Response']
const TASK_STATUSES = ['Pending', 'In Progress', 'Done']
const PAYMENT_STATUSES = ['Pending', 'Paid', 'Partial']
const TABS = ['overview', 'tasks', 'notes', 'files', 'payments']

const emptyLeadForm = {
  company: '',
  phone: '',
  service: '',
  temperature: 'Warm',
  stage: 'Lead',
  status: 'جديد',
  dealStatus: 'Open',
  decisionStatus: 'Pending',
  quoteAmount: '',
  expectedCloseDate: '',
  nextFollowUpDate: ''
}

const emptyTaskForm = {
  title: '',
  dueDate: '',
  owner: '',
  status: 'Pending'
}

const emptyFileForm = {
  type: 'عرض سعر',
  url: ''
}

const emptyPaymentForm = {
  title: '',
  amount: '',
  date: '',
  status: 'Pending'
}

const sampleLead = {
  company: 'تمكن لتقنية المعلومات',
  phone: '966553909589',
  service: 'تطوير موقع إلكتروني',
  temperature: 'Hot',
  stage: 'Lead',
  status: 'جديد',
  dealStatus: 'Open',
  decisionStatus: 'Pending',
  quoteAmount: 0,
  paidAmount: 0,
  remainingAmount: 0,
  expectedCloseDate: '',
  nextFollowUpDate: '',
  lastActivityAt: Date.now(),
  createdAt: Date.now()
}

function formatDate(timestamp) {
  if (!timestamp) return '-'
  const date = new Date(timestamp)
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

function formatMoney(value) {
  return Number(value || 0).toLocaleString('en-US')
}

function todayString() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function isTaskToday(task) {
  return task?.dueDate === todayString() && task?.status !== 'Done'
}

function isTaskOverdue(task) {
  return !!task?.dueDate && task?.dueDate < todayString() && task?.status !== 'Done'
}

function taskStatusClass(task) {
  if (task.status === 'Done') return 'task-done'
  if (isTaskOverdue(task)) return 'task-overdue'
  if (isTaskToday(task)) return 'task-today'
  return ''
}

function dealLabel(status) {
  if (status === 'Won') return 'مغلقة - ربح'
  if (status === 'Lost') return 'مغلقة - خسارة'
  return 'مفتوحة'
}

function decisionLabel(status) {
  if (status === 'Approved') return 'موافق'
  if (status === 'Rejected') return 'مرفوض'
  if (status === 'No Response') return 'لا يوجد رد'
  return 'بانتظار القرار'
}

function stageLabel(stage) {
  if (stage === 'Lead') return 'عميل محتمل'
  if (stage === 'Contacted') return 'تم التواصل'
  if (stage === 'Meeting') return 'اجتماع'
  if (stage === 'Proposal') return 'عرض سعر'
  if (stage === 'Won') return 'مغلقة'
  return stage
}

function tempLabel(temp) {
  if (temp === 'Hot') return 'حار'
  if (temp === 'Warm') return 'دافئ'
  return temp
}

function taskStatusLabel(status) {
  if (status === 'Pending') return 'معلقة'
  if (status === 'In Progress') return 'قيد التنفيذ'
  if (status === 'Done') return 'مكتملة'
  return status
}

function paymentStatusLabel(status) {
  if (status === 'Pending') return 'معلقة'
  if (status === 'Paid') return 'مدفوعة'
  if (status === 'Partial') return 'مدفوعة جزئيًا'
  return status
}

function buildWhatsAppMessage(lead) {
  const company = lead.company || 'العميل'
  const service = lead.service || 'الخدمة المطلوبة'
  const quote = Number(lead.quoteAmount || 0)
  const paid = Number(lead.paidAmount || 0)
  const remaining = Number(lead.remainingAmount || 0)

  let text = `السلام عليكم ${company}\n\n`

  if (lead.dealStatus === 'Won') {
    text += `نشكركم على ثقتكم.\n`
    text += `الخدمة: ${service}\n`
    text += `قيمة عرض السعر: ${formatMoney(quote)} ريال\n`
    text += `المدفوع: ${formatMoney(paid)} ريال\n`
    text += `المتبقي: ${formatMoney(remaining)} ريال\n\n`
    text += `يسعدنا متابعة بقية الإجراءات معكم.`
    return encodeURIComponent(text)
  }

  if (lead.dealStatus === 'Lost') {
    text += `نشكر لكم وقتكم.\n`
    text += `إذا رغبتم بإعادة فتح النقاش بخصوص ${service} فنحن جاهزون لخدمتكم.`
    return encodeURIComponent(text)
  }

  if (lead.stage === 'Proposal' || lead.decisionStatus === 'Pending') {
    text += `نود متابعتكم بخصوص عرض السعر الخاص بخدمة ${service}.\n`
    text += `قيمة العرض: ${formatMoney(quote)} ريال.\n`
    text += `حالة القرار الحالية: ${decisionLabel(lead.decisionStatus)}.\n\n`
    text += `في حال رغبتكم بإكمال الإجراءات أو لديكم أي استفسار، نحن جاهزون لخدمتكم.`
    return encodeURIComponent(text)
  }

  if (lead.decisionStatus === 'No Response') {
    text += `نود التذكير بخصوص عرض السعر لخدمة ${service}.\n`
    text += `قيمة العرض: ${formatMoney(quote)} ريال.\n\n`
    text += `يسعدنا استكمال الخطوات معكم عند جاهزيتكم.`
    return encodeURIComponent(text)
  }

  text += `هذه متابعة بخصوص طلبكم لخدمة ${service}.\n`
  text += `المرحلة الحالية: ${stageLabel(lead.stage)}\n`
  text += `حالة الصفقة: ${dealLabel(lead.dealStatus)}\n`
  text += `عرض السعر: ${formatMoney(quote)} ريال\n`
  text += `المدفوع: ${formatMoney(paid)} ريال\n`
  text += `المتبقي: ${formatMoney(remaining)} ريال\n\n`
  text += `يسعدنا خدمتكم ومتابعة الطلب معكم.`
  return encodeURIComponent(text)
}

function Sidebar({ currentPage, setCurrentPage }) {
  const items = [
    { key: 'dashboard', label: 'لوحة التحكم' },
    { key: 'clients', label: 'العملاء' },
    { key: 'tasks', label: 'المهام' },
    { key: 'reports', label: 'التقارير' },
    { key: 'settings', label: 'الإعدادات' }
  ]

  return (
    <aside className="saas-sidebar">
      <div className="saas-brand">
        <div className="saas-brand-badge">T</div>
        <div>
          <div className="saas-brand-title">Tamakan CRM</div>
          <div className="saas-brand-subtitle">Sales SaaS</div>
        </div>
      </div>

      <nav className="saas-nav">
        {items.map((item) => (
          <button
            key={item.key}
            className={`saas-nav-item ${currentPage === item.key ? 'active' : ''}`}
            onClick={() => setCurrentPage(item.key)}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </aside>
  )
}

function Topbar({ searchTerm, setSearchTerm, openAddPanel, currentPage }) {
  return (
    <header className="saas-topbar">
      <div>
        <h1 className="saas-page-title">
          {currentPage === 'dashboard' && 'لوحة التحكم'}
          {currentPage === 'clients' && 'العملاء'}
          {currentPage === 'tasks' && 'المهام'}
          {currentPage === 'reports' && 'التقارير'}
          {currentPage === 'settings' && 'الإعدادات'}
        </h1>
        <p className="saas-page-subtitle">إدارة العملاء والصفقات والمتابعات | Client & Sales Management</p>
      </div>

      <div className="saas-topbar-actions">
        <input
          className="saas-search"
          placeholder="بحث باسم الشركة أو الجوال أو الخدمة"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button className="primary-btn" onClick={openAddPanel}>
          + إضافة عميل
        </button>
      </div>
    </header>
  )
}

function StatCard({ title, value, accent = 'blue' }) {
  return (
    <div className={`stat-card stat-accent-${accent}`}>
      <span>{title}</span>
      <strong>{value}</strong>
    </div>
  )
}

function InfoBox({ label, value }) {
  return (
    <div className="info-box">
      <div className="info-box-label">{label}</div>
      <div className="info-box-value">{value}</div>
    </div>
  )
}

function EmptyState({ text }) {
  return <div className="empty-state">{text}</div>
}

export default function App() {
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)

  const [leads, setLeads] = useState([])
  const [selectedClient, setSelectedClient] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [showAddPanel, setShowAddPanel] = useState(false)

  const [searchTerm, setSearchTerm] = useState('')
  const [stageFilter, setStageFilter] = useState('All')
  const [tempFilter, setTempFilter] = useState('All')
  const [dealFilter, setDealFilter] = useState('All')

  const [newLead, setNewLead] = useState(emptyLeadForm)

  const [clientTasks, setClientTasks] = useState([])
  const [allTasks, setAllTasks] = useState([])
  const [taskForm, setTaskForm] = useState(emptyTaskForm)

  const [clientNotes, setClientNotes] = useState([])
  const [noteText, setNoteText] = useState('')

  const [clientFiles, setClientFiles] = useState([])
  const [fileForm, setFileForm] = useState(emptyFileForm)

  const [clientPayments, setClientPayments] = useState([])
  const [paymentForm, setPaymentForm] = useState(emptyPaymentForm)

  useEffect(() => {
    async function seedIfNeeded() {
      const leadsRef = collection(db, 'leads')
      const snapshot = await getDocs(leadsRef)
      if (!snapshot.empty) return

      const oldLocal = localStorage.getItem('leads')
      if (oldLocal) {
        try {
          const parsed = JSON.parse(oldLocal)
          if (Array.isArray(parsed) && parsed.length) {
            for (const item of parsed) {
              const quoteAmount = Number(item.quoteAmount || 0)
              const paidAmount = Number(item.paidAmount || 0)
              await addDoc(leadsRef, {
                company: item.company || '',
                phone: item.phone || '',
                service: item.service || '',
                temperature: item.temperature || 'Warm',
                stage: item.stage || 'Lead',
                status: item.status || 'جديد',
                dealStatus: item.dealStatus || 'Open',
                decisionStatus: item.decisionStatus || 'Pending',
                quoteAmount,
                paidAmount,
                remainingAmount: Math.max(quoteAmount - paidAmount, 0),
                expectedCloseDate: item.expectedCloseDate || '',
                nextFollowUpDate: item.nextFollowUpDate || '',
                lastActivityAt: item.lastActivityAt || Date.now(),
                createdAt: item.createdAt || Date.now()
              })
            }
            return
          }
        } catch (error) {
          console.error('خطأ في قراءة البيانات القديمة:', error)
        }
      }

      await addDoc(leadsRef, sampleLead)
    }

    let unsubscribeRef

    async function init() {
      await seedIfNeeded()

      const unsubscribe = onSnapshot(collection(db, 'leads'), (snapshot) => {
        const data = snapshot.docs.map((item) => ({
          id: item.id,
          ...item.data()
        }))
        setLeads(data)
        setLoading(false)

        if (selectedClient) {
          const fresh = data.find((x) => x.id === selectedClient.id)
          if (fresh) setSelectedClient(fresh)
        }
      })

      unsubscribeRef = unsubscribe
    }

    init()

    return () => {
      if (unsubscribeRef) unsubscribeRef()
    }
  }, [selectedClient])

  useEffect(() => {
    if (!selectedClient) {
      setClientTasks([])
      setClientNotes([])
      setClientFiles([])
      setClientPayments([])
      return
    }

    const unsubscribers = []

    const tasksQ = query(
      collection(db, 'leads', selectedClient.id, 'tasks'),
      orderBy('createdAt', 'desc')
    )
    unsubscribers.push(
      onSnapshot(tasksQ, (snapshot) => {
        setClientTasks(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })))
      })
    )

    const notesQ = query(
      collection(db, 'leads', selectedClient.id, 'notes'),
      orderBy('createdAt', 'desc')
    )
    unsubscribers.push(
      onSnapshot(notesQ, (snapshot) => {
        setClientNotes(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })))
      })
    )

    const filesQ = query(
      collection(db, 'leads', selectedClient.id, 'files'),
      orderBy('createdAt', 'desc')
    )
    unsubscribers.push(
      onSnapshot(filesQ, (snapshot) => {
        setClientFiles(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })))
      })
    )

    const paymentsQ = query(
      collection(db, 'leads', selectedClient.id, 'payments'),
      orderBy('createdAt', 'desc')
    )
    unsubscribers.push(
      onSnapshot(paymentsQ, (snapshot) => {
        setClientPayments(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })))
      })
    )

    return () => {
      unsubscribers.forEach((fn) => fn())
    }
  }, [selectedClient])

  useEffect(() => {
    const q = query(collectionGroup(db, 'tasks'), orderBy('createdAt', 'desc'))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tasksData = snapshot.docs.map((docSnap) => {
        const data = docSnap.data()
        const pathParts = docSnap.ref.path.split('/')
        const clientId = pathParts[1]
        const client = leads.find((lead) => lead.id === clientId)

        return {
          id: docSnap.id,
          clientId,
          clientName: client?.company || 'عميل غير معروف',
          ...data
        }
      })

      setAllTasks(tasksData)
    })

    return () => unsubscribe()
  }, [leads])

  async function touchClient(clientId, extra = {}) {
    await updateDoc(doc(db, 'leads', clientId), {
      lastActivityAt: Date.now(),
      ...extra
    })
  }

  async function recalcPayments(clientId, quoteOverride = null) {
    const snapshot = await getDocs(collection(db, 'leads', clientId, 'payments'))
    let paid = 0

    snapshot.forEach((d) => {
      const payment = d.data()
      if (payment.status === 'Paid' || payment.status === 'Partial') {
        paid += Number(payment.amount || 0)
      }
    })

    const current = leads.find((x) => x.id === clientId)
    const quoteAmount =
      quoteOverride !== null ? Number(quoteOverride || 0) : Number(current?.quoteAmount || 0)

    await updateDoc(doc(db, 'leads', clientId), {
      paidAmount: paid,
      remainingAmount: Math.max(quoteAmount - paid, 0),
      lastActivityAt: Date.now()
    })
  }

  async function addLead() {
    if (!newLead.company || !newLead.phone) {
      alert('أكمل اسم الشركة ورقم الجوال')
      return
    }

    const quoteAmount = Number(newLead.quoteAmount || 0)

    await addDoc(collection(db, 'leads'), {
      company: newLead.company,
      phone: newLead.phone,
      service: newLead.service,
      temperature: newLead.temperature,
      stage: newLead.stage,
      status: 'جديد',
      dealStatus: newLead.dealStatus,
      decisionStatus: newLead.decisionStatus,
      quoteAmount,
      paidAmount: 0,
      remainingAmount: quoteAmount,
      expectedCloseDate: newLead.expectedCloseDate || '',
      nextFollowUpDate: newLead.nextFollowUpDate || '',
      lastActivityAt: Date.now(),
      createdAt: Date.now()
    })

    setNewLead(emptyLeadForm)
    setShowAddPanel(false)
  }

  async function updateLead(lead) {
    const { id, ...payload } = lead
    const quoteAmount = Number(payload.quoteAmount || 0)

    await updateDoc(doc(db, 'leads', id), {
      ...payload,
      quoteAmount,
      remainingAmount: Math.max(quoteAmount - Number(payload.paidAmount || 0), 0),
      lastActivityAt: Date.now()
    })

    await recalcPayments(id, quoteAmount)
    setEditingId(null)
  }

  async function deleteLead(id) {
    await deleteDoc(doc(db, 'leads', id))
    if (selectedClient?.id === id) {
      setSelectedClient(null)
      setActiveTab('overview')
    }
  }

  function patchLeadLocal(id, field, value) {
    setLeads((prev) => prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)))
  }

  async function saveQuickField(id, field, value) {
    await updateDoc(doc(db, 'leads', id), {
      [field]: value,
      lastActivityAt: Date.now()
    })
  }

  async function addTask() {
    if (!selectedClient) return
    if (!taskForm.title || !taskForm.dueDate || !taskForm.owner) {
      alert('أكمل بيانات المهمة')
      return
    }

    await addDoc(collection(db, 'leads', selectedClient.id, 'tasks'), {
      title: taskForm.title,
      dueDate: taskForm.dueDate,
      owner: taskForm.owner,
      status: taskForm.status,
      createdAt: Date.now()
    })

    await touchClient(selectedClient.id)
    setTaskForm(emptyTaskForm)
  }

  async function updateTaskStatus(taskId, status) {
    if (!selectedClient) return
    await updateDoc(doc(db, 'leads', selectedClient.id, 'tasks', taskId), { status })
    await touchClient(selectedClient.id)
  }

  async function deleteTask(taskId) {
    if (!selectedClient) return
    await deleteDoc(doc(db, 'leads', selectedClient.id, 'tasks', taskId))
    await touchClient(selectedClient.id)
  }

  async function addNote() {
    if (!selectedClient || !noteText.trim()) {
      alert('اكتب الملاحظة')
      return
    }

    await addDoc(collection(db, 'leads', selectedClient.id, 'notes'), {
      text: noteText.trim(),
      createdAt: Date.now()
    })

    await touchClient(selectedClient.id)
    setNoteText('')
  }

  async function deleteNote(noteId) {
    if (!selectedClient) return
    await deleteDoc(doc(db, 'leads', selectedClient.id, 'notes', noteId))
    await touchClient(selectedClient.id)
  }

  async function addFile() {
    if (!selectedClient || !fileForm.url.trim()) {
      alert('أدخل رابط الملف')
      return
    }

    await addDoc(collection(db, 'leads', selectedClient.id, 'files'), {
      type: fileForm.type,
      url: fileForm.url.trim(),
      createdAt: Date.now()
    })

    await touchClient(selectedClient.id)
    setFileForm(emptyFileForm)
  }

  async function deleteFile(fileId) {
    if (!selectedClient) return
    await deleteDoc(doc(db, 'leads', selectedClient.id, 'files', fileId))
    await touchClient(selectedClient.id)
  }

  async function addPayment() {
    if (!selectedClient) return
    if (!paymentForm.title || !paymentForm.amount || !paymentForm.date) {
      alert('أكمل بيانات الدفعة')
      return
    }

    await addDoc(collection(db, 'leads', selectedClient.id, 'payments'), {
      title: paymentForm.title,
      amount: Number(paymentForm.amount || 0),
      date: paymentForm.date,
      status: paymentForm.status,
      createdAt: Date.now()
    })

    await touchClient(selectedClient.id)
    await recalcPayments(selectedClient.id)
    setPaymentForm(emptyPaymentForm)
  }

  async function updatePaymentStatus(paymentId, status) {
    if (!selectedClient) return
    await updateDoc(doc(db, 'leads', selectedClient.id, 'payments', paymentId), { status })
    await touchClient(selectedClient.id)
    await recalcPayments(selectedClient.id)
  }

  async function deletePayment(paymentId) {
    if (!selectedClient) return
    await deleteDoc(doc(db, 'leads', selectedClient.id, 'payments', paymentId))
    await touchClient(selectedClient.id)
    await recalcPayments(selectedClient.id)
  }

  function exportCsv() {
    const headers = [
      'اسم الشركة / Company',
      'رقم الجوال / Phone',
      'الخدمة / Service',
      'المرحلة / Stage',
      'حالة الصفقة / Deal Status',
      'حالة القرار / Decision Status',
      'عرض السعر / Quote Amount',
      'المدفوع / Paid Amount',
      'المتبقي / Remaining Amount',
      'تاريخ التسجيل / Created At',
      'المتابعة القادمة / Next Follow-up'
    ]

    const rows = filteredLeads.map((lead) => [
      lead.company || '',
      lead.phone || '',
      lead.service || '',
      stageLabel(lead.stage || ''),
      dealLabel(lead.dealStatus || ''),
      decisionLabel(lead.decisionStatus || ''),
      Number(lead.quoteAmount || 0),
      Number(lead.paidAmount || 0),
      Number(lead.remainingAmount || 0),
      formatDate(lead.createdAt),
      lead.nextFollowUpDate || ''
    ])

    const csvContent = [headers, ...rows]
      .map((row) =>
        row.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(',')
      )
      .join('\n')

    const bom = '\uFEFF'
    const blob = new Blob([bom + csvContent], {
      type: 'text/csv;charset=utf-8;'
    })

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'tamakan-crm-report.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const q = searchTerm.trim().toLowerCase()

      const matchesSearch =
        !q ||
        (lead.company || '').toLowerCase().includes(q) ||
        (lead.phone || '').toLowerCase().includes(q) ||
        (lead.service || '').toLowerCase().includes(q) ||
        (lead.stage || '').toLowerCase().includes(q) ||
        (lead.status || '').toLowerCase().includes(q)

      const matchesStage = stageFilter === 'All' || lead.stage === stageFilter
      const matchesTemp = tempFilter === 'All' || lead.temperature === tempFilter
      const matchesDeal = dealFilter === 'All' || lead.dealStatus === dealFilter

      return matchesSearch && matchesStage && matchesTemp && matchesDeal
    })
  }, [leads, searchTerm, stageFilter, tempFilter, dealFilter])

  const total = leads.length
  const filteredTotal = filteredLeads.length
  const hotCount = leads.filter((x) => x.temperature === 'Hot').length
  const warmCount = leads.filter((x) => x.temperature === 'Warm').length
  const contactedCount = leads.filter((x) => x.stage === 'Contacted').length
  const meetingCount = leads.filter((x) => x.stage === 'Meeting').length
  const proposalCount = leads.filter((x) => x.stage === 'Proposal').length
  const wonCount = leads.filter((x) => x.dealStatus === 'Won' || x.stage === 'Won').length
  const lostCount = leads.filter((x) => x.dealStatus === 'Lost').length
  const totalDealValue = leads.reduce((sum, x) => sum + Number(x.quoteAmount || 0), 0)
  const totalWonValue = leads
    .filter((x) => x.dealStatus === 'Won')
    .reduce((sum, x) => sum + Number(x.quoteAmount || 0), 0)

  const todayTasksCount = allTasks.filter(isTaskToday).length
  const overdueTasksCount = allTasks.filter(isTaskOverdue).length
  const doneTasksCount = allTasks.filter((t) => t.status === 'Done').length

  const selectedClientPaymentsSummary = {
    quote: Number(selectedClient?.quoteAmount || 0),
    paid: Number(selectedClient?.paidAmount || 0),
    remaining: Number(selectedClient?.remainingAmount || 0)
  }

  if (loading) {
    return (
      <div className="saas-shell">
        <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
        <main className="saas-main">
          <div className="loading-box">جاري تحميل البيانات...</div>
        </main>
      </div>
    )
  }

  return (
    <div className="saas-shell" dir="rtl">
      <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />

      <main className="saas-main">
        <Topbar
          currentPage={currentPage}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          openAddPanel={() => setShowAddPanel(true)}
        />

        <section className="saas-filters-panel">
          <div className="saas-grid-4">
            <select value={stageFilter} onChange={(e) => setStageFilter(e.target.value)}>
              <option value="All">كل المراحل</option>
              {STAGES.map((stage) => (
                <option key={stage} value={stage}>
                  {stageLabel(stage)}
                </option>
              ))}
            </select>

            <select value={tempFilter} onChange={(e) => setTempFilter(e.target.value)}>
              <option value="All">كل الدرجات</option>
              {TEMPERATURES.map((temp) => (
                <option key={temp} value={temp}>
                  {tempLabel(temp)}
                </option>
              ))}
            </select>

            <select value={dealFilter} onChange={(e) => setDealFilter(e.target.value)}>
              <option value="All">كل حالات الصفقة</option>
              {DEAL_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {dealLabel(status)}
                </option>
              ))}
            </select>

            <button className="primary-btn" onClick={exportCsv}>
              ⬇️ تصدير CSV
            </button>
          </div>
        </section>

        {(currentPage === 'dashboard' || currentPage === 'clients') && (
          <>
            <section className="stats-grid stats-grid-extended">
              <StatCard title="📊 إجمالي العملاء" value={total} accent="blue" />
              <StatCard title="🔎 نتائج البحث" value={filteredTotal} accent="purple" />
              <StatCard title="🔥 حار" value={hotCount} accent="red" />
              <StatCard title="🟡 دافئ" value={warmCount} accent="gold" />
              <StatCard title="☎️ تم التواصل" value={contactedCount} accent="orange" />
              <StatCard title="🤝 اجتماعات" value={meetingCount} accent="violet" />
              <StatCard title="📄 عروض أسعار" value={proposalCount} accent="cyan" />
              <StatCard title="💰 صفقات مغلقة" value={wonCount} accent="green" />
              <StatCard title="❌ صفقات مفقودة" value={lostCount} accent="red" />
              <StatCard title="💵 قيمة الصفقات" value={formatMoney(totalDealValue)} accent="blue" />
              <StatCard title="✅ أرباح محققة" value={formatMoney(totalWonValue)} accent="green" />
              <StatCard title="📅 مهام اليوم" value={todayTasksCount} accent="gold" />
              <StatCard title="🚨 مهام متأخرة" value={overdueTasksCount} accent="red" />
              <StatCard title="✔️ مهام مكتملة" value={doneTasksCount} accent="green" />
            </section>

            <section className="saas-board">
              {STAGES.map((stage) => (
                <div key={stage} className="saas-column">
                  <div className="saas-column-header">
                    <h3>{stageLabel(stage)}</h3>
                    <span>{filteredLeads.filter((lead) => lead.stage === stage).length}</span>
                  </div>

                  <div className="saas-column-body">
                    {filteredLeads
                      .filter((lead) => lead.stage === stage)
                      .map((lead) => (
                        <div
                          key={lead.id}
                          className="saas-lead-card"
                          style={{ borderRightColor: lead.temperature === 'Hot' ? '#ef4444' : '#f59e0b' }}
                          onClick={() => {
                            setSelectedClient(lead)
                            setActiveTab('overview')
                          }}
                        >
                          {editingId === lead.id ? (
                            <>
                              <input
                                value={lead.company}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => patchLeadLocal(lead.id, 'company', e.target.value)}
                              />
                              <input
                                value={lead.phone}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => patchLeadLocal(lead.id, 'phone', e.target.value)}
                              />
                              <input
                                value={lead.service || ''}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => patchLeadLocal(lead.id, 'service', e.target.value)}
                                placeholder="الخدمة"
                              />
                              <input
                                type="number"
                                value={lead.quoteAmount || 0}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => patchLeadLocal(lead.id, 'quoteAmount', e.target.value)}
                                placeholder="عرض السعر"
                              />
                              <select
                                value={lead.dealStatus || 'Open'}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => patchLeadLocal(lead.id, 'dealStatus', e.target.value)}
                              >
                                {DEAL_STATUSES.map((status) => (
                                  <option key={status} value={status}>
                                    {dealLabel(status)}
                                  </option>
                                ))}
                              </select>
                              <select
                                value={lead.decisionStatus || 'Pending'}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => patchLeadLocal(lead.id, 'decisionStatus', e.target.value)}
                              >
                                {DECISION_STATUSES.map((status) => (
                                  <option key={status} value={status}>
                                    {decisionLabel(status)}
                                  </option>
                                ))}
                              </select>

                              <div className="saas-inline-actions">
                                <button
                                  className="primary-btn small-btn"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    updateLead(lead)
                                  }}
                                >
                                  💾 حفظ
                                </button>
                                <button
                                  className="danger-btn small-btn"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setEditingId(null)
                                  }}
                                >
                                  ✖
                                </button>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="saas-lead-header">
                                <strong>{lead.company}</strong>
                                <span className="saas-stage-chip">{stageLabel(lead.stage)}</span>
                              </div>

                              <div className="saas-lead-meta">الخدمة: {lead.service || '-'}</div>
                              <div className="saas-lead-meta">حالة الصفقة: {dealLabel(lead.dealStatus)}</div>
                              <div className="saas-lead-meta">حالة القرار: {decisionLabel(lead.decisionStatus)}</div>
                              <div className="saas-lead-meta">عرض السعر: {formatMoney(lead.quoteAmount)} ريال</div>
                              <div className="saas-lead-meta">المدفوع: {formatMoney(lead.paidAmount)} ريال</div>
                              <div className="saas-lead-meta">المتبقي: {formatMoney(lead.remainingAmount)} ريال</div>
                              <div className="saas-lead-small">📅 {formatDate(lead.createdAt)}</div>
                              <div className="saas-lead-small">📌 متابعة: {lead.nextFollowUpDate || '-'}</div>

                              <div className="saas-inline-actions">
                                <a
                                  href={`https://wa.me/${lead.phone}?text=${buildWhatsAppMessage(lead)}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="wa-btn"
                                >
                                  واتساب ذكي
                                </a>

                                <button
                                  className="primary-btn small-btn"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setEditingId(lead.id)
                                  }}
                                >
                                  ✏️
                                </button>

                                <button
                                  className="danger-btn small-btn"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    deleteLead(lead.id)
                                  }}
                                >
                                  🗑️
                                </button>
                              </div>
                            </>
                          )}

                          <div className="saas-inline-actions top-gap">
                            <select
                              value={lead.stage}
                              onClick={(e) => e.stopPropagation()}
                              onChange={async (e) => {
                                const value = e.target.value
                                patchLeadLocal(lead.id, 'stage', value)
                                await saveQuickField(lead.id, 'stage', value)
                              }}
                            >
                              {STAGES.map((stageOption) => (
                                <option key={stageOption} value={stageOption}>
                                  {stageLabel(stageOption)}
                                </option>
                              ))}
                            </select>

                            <select
                              value={lead.temperature}
                              onClick={(e) => e.stopPropagation()}
                              onChange={async (e) => {
                                const value = e.target.value
                                patchLeadLocal(lead.id, 'temperature', value)
                                await saveQuickField(lead.id, 'temperature', value)
                              }}
                            >
                              {TEMPERATURES.map((temp) => (
                                <option key={temp} value={temp}>
                                  {tempLabel(temp)}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </section>
          </>
        )}

        {currentPage === 'tasks' && (
          <section className="saas-page-panel">
            <h2>كل المهام والمتابعات</h2>
            <div className="list-block">
              {allTasks.length === 0 ? (
                <EmptyState text="لا توجد مهام مسجلة" />
              ) : (
                allTasks.map((task) => (
                  <div key={task.id} className={`list-item ${taskStatusClass(task)}`}>
                    <div><strong>العميل:</strong> {task.clientName}</div>
                    <div><strong>المهمة:</strong> {task.title}</div>
                    <div><strong>التاريخ:</strong> {task.dueDate}</div>
                    <div><strong>المسؤول:</strong> {task.owner}</div>
                    <div><strong>الحالة:</strong> {taskStatusLabel(task.status)}</div>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {currentPage === 'reports' && (
          <section className="saas-page-panel">
            <h2>التقارير</h2>
            <div className="saas-grid-4">
              <InfoBox label="إجمالي العملاء" value={total} />
              <InfoBox label="إجمالي قيمة الصفقات" value={`${formatMoney(totalDealValue)} ريال`} />
              <InfoBox label="إجمالي الصفقات المغلقة" value={wonCount} />
              <InfoBox label="إجمالي الصفقات الضائعة" value={lostCount} />
            </div>
          </section>
        )}

        {currentPage === 'settings' && (
          <section className="saas-page-panel">
            <h2>الإعدادات</h2>
            <EmptyState text="هذه الصفحة جاهزة للتطوير لاحقًا" />
          </section>
        )}
      </main>

      {showAddPanel && (
        <div className="drawer-overlay" onClick={() => setShowAddPanel(false)}>
          <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <h2>إضافة عميل جديد</h2>
              <button className="danger-btn small-btn" onClick={() => setShowAddPanel(false)}>
                إغلاق
              </button>
            </div>

            <div className="saas-grid-2">
              <input
                placeholder="اسم الشركة"
                value={newLead.company}
                onChange={(e) => setNewLead({ ...newLead, company: e.target.value })}
              />
              <input
                placeholder="رقم الجوال"
                value={newLead.phone}
                onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
              />
              <input
                placeholder="الخدمة المطلوبة"
                value={newLead.service}
                onChange={(e) => setNewLead({ ...newLead, service: e.target.value })}
              />
              <input
                placeholder="عرض السعر"
                type="number"
                value={newLead.quoteAmount}
                onChange={(e) => setNewLead({ ...newLead, quoteAmount: e.target.value })}
              />
              <input
                type="date"
                value={newLead.nextFollowUpDate}
                onChange={(e) => setNewLead({ ...newLead, nextFollowUpDate: e.target.value })}
              />
              <input
                type="date"
                value={newLead.expectedCloseDate}
                onChange={(e) => setNewLead({ ...newLead, expectedCloseDate: e.target.value })}
              />

              <select
                value={newLead.temperature}
                onChange={(e) => setNewLead({ ...newLead, temperature: e.target.value })}
              >
                {TEMPERATURES.map((temp) => (
                  <option key={temp} value={temp}>
                    {tempLabel(temp)}
                  </option>
                ))}
              </select>

              <select
                value={newLead.stage}
                onChange={(e) => setNewLead({ ...newLead, stage: e.target.value })}
              >
                {STAGES.map((stage) => (
                  <option key={stage} value={stage}>
                    {stageLabel(stage)}
                  </option>
                ))}
              </select>

              <select
                value={newLead.dealStatus}
                onChange={(e) => setNewLead({ ...newLead, dealStatus: e.target.value })}
              >
                {DEAL_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {dealLabel(status)}
                  </option>
                ))}
              </select>

              <select
                value={newLead.decisionStatus}
                onChange={(e) => setNewLead({ ...newLead, decisionStatus: e.target.value })}
              >
                {DECISION_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {decisionLabel(status)}
                  </option>
                ))}
              </select>
            </div>

            <div className="drawer-footer">
              <button className="primary-btn" onClick={addLead}>
                + حفظ العميل
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedClient && (
        <div className="drawer-overlay" onClick={() => setSelectedClient(null)}>
          <div className="drawer-panel drawer-panel-wide" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <div>
                <h2>{selectedClient.company}</h2>
                <p className="muted-text">{selectedClient.service || '-'}</p>
              </div>

              <div className="saas-inline-actions">
                <a
                  href={`https://wa.me/${selectedClient.phone}?text=${buildWhatsAppMessage(selectedClient)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="wa-btn"
                >
                  واتساب ذكي
                </a>
                <button className="danger-btn small-btn" onClick={() => setSelectedClient(null)}>
                  إغلاق
                </button>
              </div>
            </div>

            <div className="tabs">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  className={activeTab === tab ? 'active' : ''}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab === 'overview' && 'نظرة عامة'}
                  {tab === 'tasks' && 'المهام'}
                  {tab === 'notes' && 'الملاحظات'}
                  {tab === 'files' && 'الملفات'}
                  {tab === 'payments' && 'الدفعات'}
                </button>
              ))}
            </div>

            {activeTab === 'overview' && (
              <div className="saas-grid-2">
                <InfoBox label="رقم الجوال" value={selectedClient.phone} />
                <InfoBox label="المرحلة" value={stageLabel(selectedClient.stage)} />
                <InfoBox label="درجة العميل" value={tempLabel(selectedClient.temperature)} />
                <InfoBox label="حالة الصفقة" value={dealLabel(selectedClient.dealStatus)} />
                <InfoBox label="حالة القرار" value={decisionLabel(selectedClient.decisionStatus)} />
                <InfoBox label="تاريخ التسجيل" value={formatDate(selectedClient.createdAt)} />
                <InfoBox label="آخر نشاط" value={formatDate(selectedClient.lastActivityAt)} />
                <InfoBox label="المتابعة القادمة" value={selectedClient.nextFollowUpDate || '-'} />
                <InfoBox label="الإغلاق المتوقع" value={selectedClient.expectedCloseDate || '-'} />
                <InfoBox label="عرض السعر" value={`${formatMoney(selectedClientPaymentsSummary.quote)} ريال`} />
                <InfoBox label="المدفوع" value={`${formatMoney(selectedClientPaymentsSummary.paid)} ريال`} />
                <InfoBox label="المتبقي" value={`${formatMoney(selectedClientPaymentsSummary.remaining)} ريال`} />
                <InfoBox label="عدد المهام" value={clientTasks.length} />
                <InfoBox label="عدد الملاحظات" value={clientNotes.length} />
                <InfoBox label="عدد الملفات" value={clientFiles.length} />
              </div>
            )}

            {activeTab === 'tasks' && (
              <>
                <div className="saas-grid-4">
                  <input
                    placeholder="اسم المهمة"
                    value={taskForm.title}
                    onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  />
                  <input
                    type="date"
                    value={taskForm.dueDate}
                    onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                  />
                  <input
                    placeholder="المسؤول"
                    value={taskForm.owner}
                    onChange={(e) => setTaskForm({ ...taskForm, owner: e.target.value })}
                  />
                  <select
                    value={taskForm.status}
                    onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value })}
                  >
                    {TASK_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {taskStatusLabel(status)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="top-gap">
                  <button className="primary-btn" onClick={addTask}>
                    + إضافة مهمة
                  </button>
                </div>

                <div className="list-block">
                  {clientTasks.length === 0 ? (
                    <EmptyState text="لا توجد مهام لهذا العميل" />
                  ) : (
                    clientTasks.map((task) => (
                      <div key={task.id} className={`list-item ${taskStatusClass(task)}`}>
                        <div><strong>المهمة:</strong> {task.title}</div>
                        <div><strong>التاريخ:</strong> {task.dueDate}</div>
                        <div><strong>المسؤول:</strong> {task.owner}</div>
                        <div><strong>الحالة:</strong> {taskStatusLabel(task.status)}</div>

                        <div className="saas-inline-actions top-gap">
                          <select
                            value={task.status}
                            onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                          >
                            {TASK_STATUSES.map((status) => (
                              <option key={status} value={status}>
                                {taskStatusLabel(status)}
                              </option>
                            ))}
                          </select>

                          <button className="danger-btn small-btn" onClick={() => deleteTask(task.id)}>
                            🗑️ حذف
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}

            {activeTab === 'notes' && (
              <>
                <div className="saas-inline-actions">
                  <input
                    className="flex-1"
                    placeholder="اكتب ملاحظة"
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                  />
                  <button className="primary-btn" onClick={addNote}>
                    + إضافة ملاحظة
                  </button>
                </div>

                <div className="list-block">
                  {clientNotes.length === 0 ? (
                    <EmptyState text="لا توجد ملاحظات" />
                  ) : (
                    clientNotes.map((note) => (
                      <div key={note.id} className="list-item">
                        <div>{note.text}</div>
                        <div className="meta-text">{formatDate(note.createdAt)}</div>
                        <button className="danger-btn small-btn top-gap" onClick={() => deleteNote(note.id)}>
                          🗑️ حذف
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}

            {activeTab === 'files' && (
              <>
                <div className="saas-grid-4">
                  <select
                    value={fileForm.type}
                    onChange={(e) => setFileForm({ ...fileForm, type: e.target.value })}
                  >
                    <option value="عرض سعر">عرض سعر</option>
                    <option value="عقد">عقد</option>
                    <option value="ملف آخر">ملف آخر</option>
                  </select>

                  <input
                    placeholder="رابط الملف"
                    value={fileForm.url}
                    onChange={(e) => setFileForm({ ...fileForm, url: e.target.value })}
                  />

                  <button className="primary-btn" onClick={addFile}>
                    + إضافة ملف
                  </button>
                </div>

                <div className="list-block">
                  {clientFiles.length === 0 ? (
                    <EmptyState text="لا توجد ملفات" />
                  ) : (
                    clientFiles.map((file) => (
                      <div key={file.id} className="list-item">
                        <div><strong>النوع:</strong> {file.type}</div>
                        <div className="top-gap">
                          <a href={file.url} target="_blank" rel="noreferrer">
                            فتح الملف
                          </a>
                        </div>
                        <div className="meta-text">{formatDate(file.createdAt)}</div>
                        <button className="danger-btn small-btn top-gap" onClick={() => deleteFile(file.id)}>
                          🗑️ حذف
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}

            {activeTab === 'payments' && (
              <>
                <div className="saas-grid-4">
                  <input
                    placeholder="اسم الدفعة"
                    value={paymentForm.title}
                    onChange={(e) => setPaymentForm({ ...paymentForm, title: e.target.value })}
                  />
                  <input
                    placeholder="المبلغ"
                    type="number"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  />
                  <input
                    type="date"
                    value={paymentForm.date}
                    onChange={(e) => setPaymentForm({ ...paymentForm, date: e.target.value })}
                  />
                  <select
                    value={paymentForm.status}
                    onChange={(e) => setPaymentForm({ ...paymentForm, status: e.target.value })}
                  >
                    {PAYMENT_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {paymentStatusLabel(status)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="top-gap">
                  <button className="primary-btn" onClick={addPayment}>
                    + إضافة دفعة
                  </button>
                </div>

                <div className="list-block">
                  {clientPayments.length === 0 ? (
                    <EmptyState text="لا توجد دفعات" />
                  ) : (
                    clientPayments.map((payment) => (
                      <div key={payment.id} className="list-item">
                        <div><strong>اسم الدفعة:</strong> {payment.title}</div>
                        <div><strong>المبلغ:</strong> {formatMoney(payment.amount)} ريال</div>
                        <div><strong>التاريخ:</strong> {payment.date}</div>
                        <div><strong>الحالة:</strong> {paymentStatusLabel(payment.status)}</div>

                        <div className="saas-inline-actions top-gap">
                          <select
                            value={payment.status}
                            onChange={(e) => updatePaymentStatus(payment.id, e.target.value)}
                          >
                            {PAYMENT_STATUSES.map((status) => (
                              <option key={status} value={status}>
                                {paymentStatusLabel(status)}
                              </option>
                            ))}
                          </select>

                          <button className="danger-btn small-btn" onClick={() => deletePayment(payment.id)}>
                            🗑️ حذف
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
