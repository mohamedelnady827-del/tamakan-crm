import './styles.css'
import { useEffect, useMemo, useState } from 'react'
import { initializeApp } from 'firebase/app'
import {
  getFirestore,
  collection,
  addDoc,
  doc,
  updateDoc,
  onSnapshot,
  getDocs,
  query,
  orderBy,
  deleteDoc
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
const LOST_REASONS = ['السعر', 'لا يوجد رد', 'ذهب لمنافس', 'تأخر القرار', 'تم إلغاء المشروع', 'سبب آخر']
const TABS = ['overview', 'tasks', 'notes', 'files', 'payments', 'activity']

const DEFAULT_SETTINGS = {
  companyName: 'Tamakan CRM',
  currency: 'ريال',
  vatPercent: '15',
  defaultTaskOwner: '',
  whatsappSignature: 'مع تحيات فريق المبيعات',
  notificationsEnabled: true
}

const DEFAULT_USERS = [
  { id: 'admin-1', name: 'Admin', email: 'admin@tamakan.com', password: '123456', role: 'admin', active: true },
  { id: 'manager-1', name: 'Sales Manager', email: 'manager@tamakan.com', password: '123456', role: 'manager', active: true },
  { id: 'sales-1', name: 'Sales User', email: 'sales@tamakan.com', password: '123456', role: 'sales', active: true }
]

const AR = {
  lead: 'عميل محتمل',
  contacted: 'تم التواصل',
  meeting: 'اجتماع',
  proposal: 'عرض سعر',
  won: 'مغلقة',
  hot: 'حار',
  warm: 'دافئ',
  open: 'مفتوحة',
  wonDeal: 'مغلقة - ربح',
  lost: 'مغلقة - خسارة',
  pending: 'معلقة',
  inProgress: 'قيد التنفيذ',
  done: 'مكتملة',
  approved: 'موافق',
  rejected: 'مرفوض',
  noResponse: 'لا يوجد رد',
  dashboard: 'لوحة التحكم',
  clients: 'العملاء',
  tasks: 'المهام',
  reports: 'التقارير',
  settings: 'الإعدادات',
  archived: 'المؤرشف',
  addClient: 'إضافة عميل',
  notes: 'الملاحظات',
  files: 'الملفات',
  payments: 'الدفعات',
  overview: 'نظرة عامة',
  activity: 'النشاط',
  company: 'اسم الشركة',
  phone: 'رقم الجوال',
  service: 'الخدمة',
  quote: 'عرض السعر',
  paid: 'المدفوع',
  remaining: 'المتبقي',
  followup: 'المتابعة القادمة',
  createdAt: 'تاريخ التسجيل',
  lastActivity: 'آخر نشاط',
  expectedCloseDate: 'الإغلاق المتوقع',
  dealStatus: 'حالة الصفقة',
  decisionStatus: 'حالة القرار',
  temperature: 'درجة العميل',
  stage: 'المرحلة',
  lostReason: 'سبب الخسارة',
  whatsapp: 'واتساب ذكي',
  edit: 'تعديل',
  delete: 'حذف',
  save: 'حفظ',
  cancel: 'إلغاء',
  archive: 'أرشفة',
  restore: 'استرجاع',
  todayTasks: 'مهام اليوم',
  overdueTasks: 'مهام متأخرة',
  doneTasks: 'مهام مكتملة',
  allTasks: 'كل المهام',
  allStages: 'كل المراحل',
  allTemps: 'كل الدرجات',
  allDeals: 'كل حالات الصفقة',
  lightMode: 'الوضع الفاتح',
  darkMode: 'الوضع الداكن',
  nextDevelopment: 'التطوير القادم'
}

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
  nextFollowUpDate: '',
  lostReason: ''
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

const emptyUserForm = {
  name: '',
  email: '',
  password: '',
  role: 'sales',
  active: true
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
  lostReason: '',
  archived: false,
  ownerId: 'sales-1',
  ownerName: 'Sales User',
  source: 'Manual',
  priority: 'Medium',
  tags: [],
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

function getStartOfWeekTimestamp() {
  const now = new Date()
  const day = now.getDay()
  const diff = day === 0 ? 6 : day - 1
  now.setHours(0, 0, 0, 0)
  now.setDate(now.getDate() - diff)
  return now.getTime()
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

function stageLabel(stage) {
  return {
    Lead: AR.lead,
    Contacted: AR.contacted,
    Meeting: AR.meeting,
    Proposal: AR.proposal,
    Won: AR.won
  }[stage] || stage
}

function tempLabel(temp) {
  return {
    Hot: AR.hot,
    Warm: AR.warm
  }[temp] || temp
}

function dealLabel(status) {
  return {
    Open: AR.open,
    Won: AR.wonDeal,
    Lost: AR.lost
  }[status] || status
}

function decisionLabel(status) {
  return {
    Pending: AR.pending,
    Approved: AR.approved,
    Rejected: AR.rejected,
    'No Response': AR.noResponse
  }[status] || status
}

function taskStatusLabel(status) {
  return {
    Pending: AR.pending,
    'In Progress': AR.inProgress,
    Done: AR.done
  }[status] || status
}

function paymentStatusLabel(status) {
  if (status === 'Pending') return 'معلقة'
  if (status === 'Paid') return 'مدفوعة'
  if (status === 'Partial') return 'مدفوعة جزئيًا'
  return status
}

function loadLocalSettings() {
  try {
    const raw = localStorage.getItem('tamakan-crm-settings')
    if (!raw) return DEFAULT_SETTINGS
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
  } catch {
    return DEFAULT_SETTINGS
  }
}

function loadReadNotifications() {
  try {
    return JSON.parse(localStorage.getItem('tamakan-read-notifications') || '[]')
  } catch {
    return []
  }
}

function loadLocalUsers() {
  try {
    const raw = localStorage.getItem('tamakan-local-users')
    if (!raw) {
      localStorage.setItem('tamakan-local-users', JSON.stringify(DEFAULT_USERS))
      return DEFAULT_USERS
    }
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem('tamakan-local-users', JSON.stringify(DEFAULT_USERS))
      return DEFAULT_USERS
    }
    return parsed
  } catch {
    localStorage.setItem('tamakan-local-users', JSON.stringify(DEFAULT_USERS))
    return DEFAULT_USERS
  }
}

function loadCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem('tamakan-current-user') || 'null')
  } catch {
    return null
  }
}

function saveLocalUsers(users) {
  localStorage.setItem('tamakan-local-users', JSON.stringify(users))
}

function saveCurrentUser(user) {
  localStorage.setItem('tamakan-current-user', JSON.stringify(user))
}

function canManageUsers(user) {
  return user?.role === 'admin'
}

function canSeeAllLeads(user) {
  return user?.role === 'admin' || user?.role === 'manager'
}

function canEditLead(user, lead) {
  if (!user || !lead) return false
  if (user.role === 'admin' || user.role === 'manager') return true
  return lead.ownerId === user.id
}

function canArchiveLead(user, lead) {
  return canEditLead(user, lead)
}

function canDeleteLead(user) {
  return user?.role === 'admin'
}

function canAccessReports(user) {
  return user?.role === 'admin' || user?.role === 'manager'
}

function getRoleLabel(role) {
  if (role === 'admin') return 'أدمن'
  if (role === 'manager') return 'مدير'
  if (role === 'sales') return 'موظف مبيعات'
  return role
}

function buildWhatsAppMessage(lead, settings) {
  const company = lead.company || 'العميل'
  const service = lead.service || 'الخدمة المطلوبة'
  const quote = Number(lead.quoteAmount || 0)
  const paid = Number(lead.paidAmount || 0)
  const remaining = Number(lead.remainingAmount || 0)
  const currency = settings?.currency || 'ريال'
  const signature = settings?.whatsappSignature?.trim()

  let text = `السلام عليكم ${company}\n\n`

  if (lead.dealStatus === 'Won') {
    text += `نشكركم على ثقتكم.\n`
    text += `الخدمة: ${service}\n`
    text += `قيمة عرض السعر: ${formatMoney(quote)} ${currency}\n`
    text += `المدفوع: ${formatMoney(paid)} ${currency}\n`
    text += `المتبقي: ${formatMoney(remaining)} ${currency}\n\n`
    text += `يسعدنا متابعة بقية الإجراءات معكم.`
    if (signature) text += `\n\n${signature}`
    return encodeURIComponent(text)
  }

  if (lead.dealStatus === 'Lost') {
    text += `نشكر لكم وقتكم.\n`
    if (lead.lostReason) text += `سبب عدم الإغلاق: ${lead.lostReason}\n`
    text += `إذا رغبتم بإعادة فتح النقاش بخصوص ${service} فنحن جاهزون لخدمتكم.`
    if (signature) text += `\n\n${signature}`
    return encodeURIComponent(text)
  }

  if (lead.stage === 'Proposal' || lead.decisionStatus === 'Pending') {
    text += `نود متابعتكم بخصوص عرض السعر الخاص بخدمة ${service}.\n`
    text += `قيمة العرض: ${formatMoney(quote)} ${currency}.\n`
    text += `حالة القرار الحالية: ${decisionLabel(lead.decisionStatus)}.\n\n`
    text += `في حال رغبتكم بإكمال الإجراءات أو لديكم أي استفسار، نحن جاهزون لخدمتكم.`
    if (signature) text += `\n\n${signature}`
    return encodeURIComponent(text)
  }

  if (lead.decisionStatus === 'No Response') {
    text += `نود التذكير بخصوص عرض السعر لخدمة ${service}.\n`
    text += `قيمة العرض: ${formatMoney(quote)} ${currency}.\n\n`
    text += `يسعدنا استكمال الخطوات معكم عند جاهزيتكم.`
    if (signature) text += `\n\n${signature}`
    return encodeURIComponent(text)
  }

  text += `هذه متابعة بخصوص طلبكم لخدمة ${service}.\n`
  text += `المرحلة الحالية: ${stageLabel(lead.stage)}\n`
  text += `حالة الصفقة: ${dealLabel(lead.dealStatus)}\n`
  text += `عرض السعر: ${formatMoney(quote)} ${currency}\n`
  text += `المدفوع: ${formatMoney(paid)} ${currency}\n`
  text += `المتبقي: ${formatMoney(remaining)} ${currency}\n\n`
  text += `يسعدنا خدمتكم ومتابعة الطلب معكم.`
  if (signature) text += `\n\n${signature}`
  return encodeURIComponent(text)
}

function LoginScreen({ onLogin }) {
  const [users] = useState(loadLocalUsers())
  const [email, setEmail] = useState('admin@tamakan.com')
  const [password, setPassword] = useState('123456')
  const [error, setError] = useState('')

  function submitLogin(e) {
    e.preventDefault()
    const user = users.find(
      (item) =>
        item.email.trim().toLowerCase() === email.trim().toLowerCase() &&
        item.password === password &&
        item.active !== false
    )

    if (!user) {
      setError('بيانات الدخول غير صحيحة أو الحساب غير مفعل')
      return
    }

    onLogin(user)
  }

  return (
    <div className="saas-shell auth-shell" dir="rtl">
      <main className="saas-main auth-main">
        <div className="auth-card saas-page-panel">
          <div className="saas-brand auth-brand">
            <div className="saas-brand-badge">T</div>
            <div>
              <div className="saas-brand-title">Tamakan CRM</div>
              <div className="saas-brand-subtitle">تسجيل الدخول للنظام</div>
            </div>
          </div>

          <form onSubmit={submitLogin} className="auth-form">
            <div className="saas-grid-2">
              <input placeholder="البريد الإلكتروني" value={email} onChange={(e) => setEmail(e.target.value)} />
              <input type="password" placeholder="كلمة المرور" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>

            {error && <div className="empty-state top-gap">{error}</div>}

            <div className="drawer-footer">
              <button className="primary-btn" type="submit">دخول</button>
            </div>
          </form>

          <div className="list-block top-gap">
            <div className="list-item"><strong>حساب الأدمن:</strong> admin@tamakan.com / 123456</div>
            <div className="list-item"><strong>حساب المدير:</strong> manager@tamakan.com / 123456</div>
            <div className="list-item"><strong>حساب المبيعات:</strong> sales@tamakan.com / 123456</div>
          </div>
        </div>
      </main>
    </div>
  )
}

function Sidebar({ currentPage, setCurrentPage, settings, currentUser }) {
  const items = [
    { key: 'dashboard', label: AR.dashboard },
    { key: 'clients', label: AR.clients },
    { key: 'tasks', label: AR.tasks },
    ...(canAccessReports(currentUser) ? [{ key: 'reports', label: AR.reports }] : []),
    { key: 'archived', label: AR.archived },
    { key: 'settings', label: AR.settings }
  ]

  return (
    <aside className="saas-sidebar">
      <div className="saas-brand">
        <div className="saas-brand-badge">T</div>
        <div>
          <div className="saas-brand-title">{settings.companyName || 'Tamakan CRM'}</div>
          <div className="saas-brand-subtitle">
            {currentUser?.name} | {getRoleLabel(currentUser?.role)}
          </div>
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

function Topbar({
  searchTerm,
  setSearchTerm,
  openAddPanel,
  currentPage,
  theme,
  toggleTheme,
  showNextDevelopment,
  unreadNotificationsCount,
  openNotifications,
  currentUser,
  logout,
  canAddLead
}) {
  return (
    <header className="saas-topbar">
      <div>
        <h1 className="saas-page-title">
          {currentPage === 'dashboard' && AR.dashboard}
          {currentPage === 'clients' && AR.clients}
          {currentPage === 'tasks' && AR.tasks}
          {currentPage === 'reports' && AR.reports}
          {currentPage === 'archived' && AR.archived}
          {currentPage === 'settings' && AR.settings}
        </h1>
        <p className="saas-page-subtitle">
          إدارة العملاء والصفقات والمتابعات | {currentUser?.name} - {getRoleLabel(currentUser?.role)}
        </p>
      </div>

      <div className="saas-topbar-actions">
        <input
          className="saas-search"
          placeholder="بحث باسم الشركة أو الجوال أو الخدمة"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <button className="secondary-btn notification-btn" onClick={openNotifications}>
          🔔 الإشعارات
          {unreadNotificationsCount > 0 && <span className="notification-badge">{unreadNotificationsCount}</span>}
        </button>

        <button className="secondary-btn" onClick={toggleTheme}>
          {theme === 'dark' ? `☀️ ${AR.lightMode}` : `🌙 ${AR.darkMode}`}
        </button>

        <button className="secondary-btn" onClick={showNextDevelopment}>
          🚀 {AR.nextDevelopment}
        </button>

        {canAddLead && (
          <button className="primary-btn" onClick={openAddPanel}>
            + {AR.addClient}
          </button>
        )}

        <button className="danger-btn" onClick={logout}>تسجيل خروج</button>
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
  const [currentUser, setCurrentUser] = useState(loadCurrentUser())
  const [users, setUsers] = useState(loadLocalUsers())

  const [currentPage, setCurrentPage] = useState('dashboard')
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [theme, setTheme] = useState(localStorage.getItem('tamakan-theme') || 'dark')

  const [leads, setLeads] = useState([])
  const [selectedClient, setSelectedClient] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [showAddPanel, setShowAddPanel] = useState(false)

  const [searchTerm, setSearchTerm] = useState('')
  const [stageFilter, setStageFilter] = useState('All')
  const [tempFilter, setTempFilter] = useState('All')
  const [dealFilter, setDealFilter] = useState('All')
  const [decisionFilter, setDecisionFilter] = useState('All')
  const [ownerFilter, setOwnerFilter] = useState('All')
  const [taskViewFilter, setTaskViewFilter] = useState('All')

  const [newLead, setNewLead] = useState(emptyLeadForm)

  const [clientTasks, setClientTasks] = useState([])
  const [allTasks, setAllTasks] = useState([])
  const [editingTaskId, setEditingTaskId] = useState(null)
  const [editingTaskData, setEditingTaskData] = useState({ title: '', dueDate: '', owner: '', status: 'Pending' })
  const [taskForm, setTaskForm] = useState(emptyTaskForm)

  const [clientNotes, setClientNotes] = useState([])
  const [noteText, setNoteText] = useState('')

  const [clientFiles, setClientFiles] = useState([])
  const [fileForm, setFileForm] = useState(emptyFileForm)

  const [clientPayments, setClientPayments] = useState([])
  const [paymentForm, setPaymentForm] = useState(emptyPaymentForm)

  const [clientActivity, setClientActivity] = useState([])

  const [settings, setSettings] = useState(loadLocalSettings())
  const [showNotificationsPanel, setShowNotificationsPanel] = useState(false)
  const [readNotifications, setReadNotifications] = useState(loadReadNotifications())

  const [userForm, setUserForm] = useState(emptyUserForm)
  const [editingUserId, setEditingUserId] = useState(null)

  const [toast, setToast] = useState({ open: false, message: '', type: 'success' })
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    message: '',
    confirmText: 'تأكيد',
    cancelText: 'إلغاء',
    type: 'danger',
    onConfirm: null
  })

  useEffect(() => {
    document.body.setAttribute('data-theme', theme)
    localStorage.setItem('tamakan-theme', theme)
  }, [theme])

  useEffect(() => {
    localStorage.setItem('tamakan-crm-settings', JSON.stringify(settings))
  }, [settings])

  useEffect(() => {
    localStorage.setItem('tamakan-read-notifications', JSON.stringify(readNotifications))
  }, [readNotifications])

  useEffect(() => {
    saveLocalUsers(users)
  }, [users])

  useEffect(() => {
    if (!toast.open) return
    const timer = setTimeout(() => closeToast(), 3000)
    return () => clearTimeout(timer)
  }, [toast.open])

  function showToast(message, type = 'success') {
    setToast({ open: true, message, type })
  }

  function closeToast() {
    setToast({ open: false, message: '', type: 'success' })
  }

  function openConfirmDialog({
    title = 'تأكيد العملية',
    message = 'هل أنت متأكد؟',
    confirmText = 'تأكيد',
    cancelText = 'إلغاء',
    type = 'danger',
    onConfirm
  }) {
    setConfirmDialog({
      open: true,
      title,
      message,
      confirmText,
      cancelText,
      type,
      onConfirm
    })
  }

  function closeConfirmDialog() {
    setConfirmDialog({
      open: false,
      title: '',
      message: '',
      confirmText: 'تأكيد',
      cancelText: 'إلغاء',
      type: 'danger',
      onConfirm: null
    })
  }

  function toggleTheme() {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }

  function showNextDevelopment() {
    showToast('التطوير القادم: Audit Log أقوى + Firebase Auth + تحسين إدارة الملفات لاحقًا', 'success')
  }

  function loginUser(user) {
    setCurrentUser(user)
    saveCurrentUser(user)
  }

  function logoutUser() {
    setCurrentUser(null)
    localStorage.removeItem('tamakan-current-user')
    setSelectedClient(null)
    setCurrentPage('dashboard')
  }

  useEffect(() => {
    async function seedIfNeeded() {
      const leadsRef = collection(db, 'leads')
      const snapshot = await getDocs(leadsRef)
      if (!snapshot.empty) return
      await addDoc(leadsRef, sampleLead)
    }

    let unsubscribeRef

    async function init() {
      await seedIfNeeded()

      const unsubscribe = onSnapshot(collection(db, 'leads'), (snapshot) => {
        const data = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))
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
      setClientActivity([])
      return
    }

    const unsubscribers = []

    const tasksQ = query(collection(db, 'leads', selectedClient.id, 'tasks'), orderBy('createdAt', 'desc'))
    unsubscribers.push(onSnapshot(tasksQ, (snapshot) => setClientTasks(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })))))

    const notesQ = query(collection(db, 'leads', selectedClient.id, 'notes'), orderBy('createdAt', 'desc'))
    unsubscribers.push(onSnapshot(notesQ, (snapshot) => setClientNotes(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })))))

    const filesQ = query(collection(db, 'leads', selectedClient.id, 'files'), orderBy('createdAt', 'desc'))
    unsubscribers.push(onSnapshot(filesQ, (snapshot) => setClientFiles(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })))))

    const paymentsQ = query(collection(db, 'leads', selectedClient.id, 'payments'), orderBy('createdAt', 'desc'))
    unsubscribers.push(onSnapshot(paymentsQ, (snapshot) => setClientPayments(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })))))

    const activityQ = query(collection(db, 'leads', selectedClient.id, 'activity'), orderBy('createdAt', 'desc'))
    unsubscribers.push(onSnapshot(activityQ, (snapshot) => setClientActivity(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })))))

    return () => unsubscribers.forEach((fn) => fn())
  }, [selectedClient])

  useEffect(() => {
    if (!leads.length) {
      setAllTasks([])
      return
    }

    let isMounted = true

    async function loadAllTasks() {
      try {
        const visibleLeads = leads.filter((lead) => {
          if (lead.archived) return false
          if (canSeeAllLeads(currentUser)) return true
          return lead.ownerId === currentUser?.id
        })

        const tasksResults = await Promise.all(
          visibleLeads.map(async (lead) => {
            const tasksRef = collection(db, 'leads', lead.id, 'tasks')
            const snapshot = await getDocs(tasksRef)
            return snapshot.docs.map((docSnap) => ({
              id: docSnap.id,
              clientId: lead.id,
              clientName: lead.company || 'عميل غير معروف',
              ...docSnap.data()
            }))
          })
        )

        const mergedTasks = tasksResults.flat().sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0))
        if (isMounted) setAllTasks(mergedTasks)
      } catch (error) {
        console.error('خطأ في تحميل كل المهام:', error)
      }
    }

    if (currentUser) loadAllTasks()
    return () => {
      isMounted = false
    }
  }, [leads, currentUser])

  async function logActivity(clientId, action, details = '') {
    await addDoc(collection(db, 'leads', clientId, 'activity'), {
      action,
      details,
      actorId: currentUser?.id || '',
      actorName: currentUser?.name || '',
      createdAt: Date.now()
    })
  }

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
    const quoteAmount = quoteOverride !== null ? Number(quoteOverride || 0) : Number(current?.quoteAmount || 0)

    await updateDoc(doc(db, 'leads', clientId), {
      paidAmount: paid,
      remainingAmount: Math.max(quoteAmount - paid, 0),
      lastActivityAt: Date.now()
    })
  }

  async function addLead() {
    if (!newLead.company || !newLead.phone) {
      showToast('أكمل اسم الشركة ورقم الجوال', 'warning')
      return
    }

    const quoteAmount = Number(newLead.quoteAmount || 0)

    const newDoc = await addDoc(collection(db, 'leads'), {
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
      lostReason: newLead.lostReason || '',
      archived: false,
      ownerId: currentUser?.id || '',
      ownerName: currentUser?.name || settings.defaultTaskOwner || '',
      source: 'Manual',
      priority: 'Medium',
      tags: [],
      lastActivityAt: Date.now(),
      createdAt: Date.now()
    })

    await logActivity(newDoc.id, 'إنشاء العميل', `تم إنشاء العميل ${newLead.company}`)
    setNewLead(emptyLeadForm)
    setShowAddPanel(false)
    showToast('تمت إضافة العميل بنجاح', 'success')
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

    await logActivity(id, 'تحديث بيانات العميل', `تم تحديث بيانات العميل ${lead.company}`)
    await recalcPayments(id, quoteAmount)
    setEditingId(null)
    showToast('تم تحديث بيانات العميل', 'success')
  }

  async function archiveLead(id) {
    const lead = leads.find((x) => x.id === id)
    await updateDoc(doc(db, 'leads', id), { archived: true, lastActivityAt: Date.now() })
    await logActivity(id, 'أرشفة العميل', `تمت أرشفة العميل ${lead?.company || ''}`)

    if (selectedClient?.id === id) {
      setSelectedClient(null)
      setActiveTab('overview')
    }
  }

  async function restoreLead(id) {
    const lead = leads.find((x) => x.id === id)
    await updateDoc(doc(db, 'leads', id), { archived: false, lastActivityAt: Date.now() })
    await logActivity(id, 'استرجاع العميل', `تم استرجاع العميل ${lead?.company || ''}`)
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
    await updateDoc(doc(db, 'leads', id), { [field]: value, lastActivityAt: Date.now() })
    await logActivity(id, 'تحديث سريع', `تم تحديث ${field} إلى ${value}`)
  }

  async function addTask() {
    if (!selectedClient) return
    const ownerToUse = taskForm.owner || settings.defaultTaskOwner || currentUser?.name || ''

    if (!taskForm.title || !taskForm.dueDate || !ownerToUse) {
      showToast('أكمل بيانات المهمة', 'warning')
      return
    }

    await addDoc(collection(db, 'leads', selectedClient.id, 'tasks'), {
      title: taskForm.title,
      dueDate: taskForm.dueDate,
      owner: ownerToUse,
      status: taskForm.status,
      createdAt: Date.now()
    })

    await touchClient(selectedClient.id)
    await logActivity(selectedClient.id, 'إضافة مهمة', `تمت إضافة مهمة: ${taskForm.title}`)
    setTaskForm({ ...emptyTaskForm, owner: settings.defaultTaskOwner || currentUser?.name || '' })
    setCurrentPage('tasks')
    showToast('تمت إضافة المهمة بنجاح', 'success')
  }

  function startEditTask(task) {
    setEditingTaskId(task.id)
    setEditingTaskData({
      title: task.title || '',
      dueDate: task.dueDate || '',
      owner: task.owner || '',
      status: task.status || 'Pending'
    })
  }

  async function saveEditedTask(task) {
    const clientId = task.clientId || selectedClient?.id
    if (!clientId) return

    await updateDoc(doc(db, 'leads', clientId, 'tasks', task.id), {
      title: editingTaskData.title,
      dueDate: editingTaskData.dueDate,
      owner: editingTaskData.owner,
      status: editingTaskData.status
    })

    await touchClient(clientId)
    await logActivity(clientId, 'تعديل مهمة', `تم تعديل مهمة: ${editingTaskData.title}`)
    setEditingTaskId(null)
    setEditingTaskData({ title: '', dueDate: '', owner: '', status: 'Pending' })
    showToast('تم تعديل المهمة', 'success')
  }

  async function updateTaskStatus(taskId, status, clientIdOverride = null) {
    const clientId = clientIdOverride || selectedClient?.id
    if (!clientId) return
    await updateDoc(doc(db, 'leads', clientId, 'tasks', taskId), { status })
    await touchClient(clientId)
    await logActivity(clientId, 'تحديث حالة مهمة', `تم تحديث حالة المهمة إلى ${taskStatusLabel(status)}`)
    showToast('تم تحديث حالة المهمة', 'success')
  }

  async function deleteTask(taskId, clientIdOverride = null) {
    const clientId = clientIdOverride || selectedClient?.id
    if (!clientId) return
    await deleteDoc(doc(db, 'leads', clientId, 'tasks', taskId))
    await touchClient(clientId)
    await logActivity(clientId, 'حذف مهمة', 'تم حذف مهمة')
  }

  async function addNote() {
    if (!selectedClient || !noteText.trim()) {
      showToast('اكتب الملاحظة أولاً', 'warning')
      return
    }

    await addDoc(collection(db, 'leads', selectedClient.id, 'notes'), {
      text: noteText.trim(),
      createdAt: Date.now()
    })

    await touchClient(selectedClient.id)
    await logActivity(selectedClient.id, 'إضافة ملاحظة', noteText.trim())
    setNoteText('')
    showToast('تمت إضافة الملاحظة', 'success')
  }

  async function deleteNote(noteId) {
    if (!selectedClient) return
    await deleteDoc(doc(db, 'leads', selectedClient.id, 'notes', noteId))
    await touchClient(selectedClient.id)
    await logActivity(selectedClient.id, 'حذف ملاحظة', 'تم حذف ملاحظة')
  }

  async function addFile() {
    if (!selectedClient || !fileForm.url.trim()) {
      showToast('أدخل رابط الملف أولاً', 'warning')
      return
    }

    await addDoc(collection(db, 'leads', selectedClient.id, 'files'), {
      type: fileForm.type,
      url: fileForm.url.trim(),
      createdAt: Date.now()
    })

    await touchClient(selectedClient.id)
    await logActivity(selectedClient.id, 'إضافة ملف', `نوع الملف: ${fileForm.type}`)
    setFileForm(emptyFileForm)
    showToast('تمت إضافة رابط الملف', 'success')
  }

  async function deleteFile(fileId) {
    if (!selectedClient) return
    await deleteDoc(doc(db, 'leads', selectedClient.id, 'files', fileId))
    await touchClient(selectedClient.id)
    await logActivity(selectedClient.id, 'حذف ملف', 'تم حذف ملف')
  }

  async function addPayment() {
    if (!selectedClient) return
    if (!paymentForm.title || !paymentForm.amount || !paymentForm.date) {
      showToast('أكمل بيانات الدفعة', 'warning')
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
    await logActivity(selectedClient.id, 'إضافة دفعة', `دفعة: ${paymentForm.title} - ${paymentForm.amount} ${settings.currency}`)
    await recalcPayments(selectedClient.id)
    setPaymentForm(emptyPaymentForm)
    showToast('تمت إضافة الدفعة بنجاح', 'success')
  }

  async function updatePaymentStatus(paymentId, status) {
    if (!selectedClient) return
    await updateDoc(doc(db, 'leads', selectedClient.id, 'payments', paymentId), { status })
    await touchClient(selectedClient.id)
    await logActivity(selectedClient.id, 'تحديث حالة دفعة', `تم تحديث الحالة إلى ${paymentStatusLabel(status)}`)
    await recalcPayments(selectedClient.id)
    showToast('تم تحديث حالة الدفعة', 'success')
  }

  async function deletePayment(paymentId) {
    if (!selectedClient) return
    await deleteDoc(doc(db, 'leads', selectedClient.id, 'payments', paymentId))
    await touchClient(selectedClient.id)
    await logActivity(selectedClient.id, 'حذف دفعة', 'تم حذف دفعة')
    await recalcPayments(selectedClient.id)
  }

  function exportCsv(rowsSource) {
    const headers = [
      'اسم الشركة',
      'رقم الجوال',
      'الخدمة',
      'المرحلة',
      'حالة الصفقة',
      'حالة القرار',
      'عرض السعر',
      'المدفوع',
      'المتبقي',
      'المتابعة القادمة',
      'تاريخ التسجيل',
      'سبب الخسارة',
      'المسؤول'
    ]

    const rows = rowsSource.map((lead) => [
      lead.company,
      lead.phone,
      lead.service,
      stageLabel(lead.stage),
      dealLabel(lead.dealStatus),
      decisionLabel(lead.decisionStatus),
      lead.quoteAmount,
      lead.paidAmount,
      lead.remainingAmount,
      lead.nextFollowUpDate || '',
      formatDate(lead.createdAt),
      lead.lostReason || '',
      lead.ownerName || ''
    ])

    const csv = [headers, ...rows]
      .map((row) => row.map((val) => `"${String(val ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'tamakan-report.csv'
    link.click()

    showToast('تم تصدير التقرير بنجاح', 'success')
  }

  function createUser() {
    if (!userForm.name || !userForm.email || !userForm.password) {
      showToast('أكمل بيانات المستخدم', 'warning')
      return
    }

    const exists = users.some((user) => user.email.trim().toLowerCase() === userForm.email.trim().toLowerCase())

    if (exists) {
      showToast('هذا البريد مستخدم مسبقًا', 'error')
      return
    }

    const newUser = {
      id: `user-${Date.now()}`,
      name: userForm.name,
      email: userForm.email.trim().toLowerCase(),
      password: userForm.password,
      role: userForm.role,
      active: userForm.active
    }

    setUsers((prev) => [newUser, ...prev])
    setUserForm(emptyUserForm)
    showToast('تمت إضافة المستخدم بنجاح', 'success')
  }

  function startEditUser(user) {
    setEditingUserId(user.id)
    setUserForm({
      name: user.name || '',
      email: user.email || '',
      password: user.password || '',
      role: user.role || 'sales',
      active: user.active !== false
    })
  }

  function saveEditedUser() {
    setUsers((prev) =>
      prev.map((user) =>
        user.id === editingUserId
          ? {
              ...user,
              name: userForm.name,
              email: userForm.email.trim().toLowerCase(),
              password: userForm.password,
              role: userForm.role,
              active: userForm.active
            }
          : user
      )
    )

    if (currentUser?.id === editingUserId) {
      const updated = {
        ...currentUser,
        name: userForm.name,
        email: userForm.email.trim().toLowerCase(),
        password: userForm.password,
        role: userForm.role,
        active: userForm.active
      }
      setCurrentUser(updated)
      saveCurrentUser(updated)
    }

    setEditingUserId(null)
    setUserForm(emptyUserForm)
    showToast('تم تحديث المستخدم بنجاح', 'success')
  }

  function removeUser(userId) {
    if (currentUser?.id === userId) {
      showToast('لا يمكن حذف المستخدم الحالي', 'warning')
      return
    }
    setUsers((prev) => prev.filter((user) => user.id !== userId))
  }

  const visibleLeads = useMemo(() => {
    if (!currentUser) return []
    if (canSeeAllLeads(currentUser)) return leads
    return leads.filter((lead) => lead.ownerId === currentUser.id)
  }, [leads, currentUser])

  const activeLeads = useMemo(() => visibleLeads.filter((lead) => !lead.archived), [visibleLeads])
  const archivedLeads = useMemo(() => visibleLeads.filter((lead) => lead.archived), [visibleLeads])

  const ownerOptions = useMemo(() => {
    const map = new Map()
    activeLeads.forEach((lead) => {
      if (lead.ownerId) map.set(lead.ownerId, lead.ownerName || 'بدون اسم')
    })
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }))
  }, [activeLeads])

  const filteredLeads = useMemo(() => {
    return activeLeads.filter((lead) => {
      const q = searchTerm.trim().toLowerCase()

      const matchesSearch =
        !q ||
        (lead.company || '').toLowerCase().includes(q) ||
        (lead.phone || '').toLowerCase().includes(q) ||
        (lead.service || '').toLowerCase().includes(q) ||
        (lead.stage || '').toLowerCase().includes(q) ||
        (lead.status || '').toLowerCase().includes(q) ||
        (lead.ownerName || '').toLowerCase().includes(q)

      const matchesStage = stageFilter === 'All' || lead.stage === stageFilter
      const matchesTemp = tempFilter === 'All' || lead.temperature === tempFilter
      const matchesDeal = dealFilter === 'All' || lead.dealStatus === dealFilter
      const matchesDecision = decisionFilter === 'All' || lead.decisionStatus === decisionFilter
      const matchesOwner = ownerFilter === 'All' || lead.ownerId === ownerFilter

      return matchesSearch && matchesStage && matchesTemp && matchesDeal && matchesDecision && matchesOwner
    })
  }, [activeLeads, searchTerm, stageFilter, tempFilter, dealFilter, decisionFilter, ownerFilter])

  const filteredArchivedLeads = useMemo(() => {
    return archivedLeads.filter((lead) => {
      const q = searchTerm.trim().toLowerCase()
      return !q || (lead.company || '').toLowerCase().includes(q) || (lead.phone || '').toLowerCase().includes(q) || (lead.service || '').toLowerCase().includes(q)
    })
  }, [archivedLeads, searchTerm])

  const filteredAllTasks = useMemo(() => {
    if (taskViewFilter === 'Today') return allTasks.filter(isTaskToday)
    if (taskViewFilter === 'Overdue') return allTasks.filter(isTaskOverdue)
    if (taskViewFilter === 'Done') return allTasks.filter((task) => task.status === 'Done')
    return allTasks
  }, [allTasks, taskViewFilter])

  const total = activeLeads.length
  const filteredTotal = filteredLeads.length
  const wonCount = activeLeads.filter((x) => x.dealStatus === 'Won' || x.stage === 'Won').length
  const lostCount = activeLeads.filter((x) => x.dealStatus === 'Lost').length
  const openDealsCount = activeLeads.filter((x) => x.dealStatus === 'Open').length
  const totalDealValue = activeLeads.reduce((sum, x) => sum + Number(x.quoteAmount || 0), 0)
  const conversionRate = total ? Math.round((wonCount / total) * 100) : 0

  const avgDealValue = total ? Math.round(totalDealValue / total) : 0
  const weeklyNewClients = activeLeads.filter((lead) => Number(lead.createdAt || 0) >= getStartOfWeekTimestamp()).length
  const winRateVsClosed = wonCount + lostCount ? Math.round((wonCount / (wonCount + lostCount)) * 100) : 0

  const todayTasksCount = allTasks.filter(isTaskToday).length
  const overdueTasksCount = allTasks.filter(isTaskOverdue).length
  const doneTasksCount = allTasks.filter((t) => t.status === 'Done').length

  const todayFollowups = activeLeads.filter((lead) => lead.nextFollowUpDate === todayString())
  const overdueFollowups = activeLeads.filter((lead) => lead.nextFollowUpDate && lead.nextFollowUpDate < todayString() && lead.dealStatus !== 'Won')
  const pendingProposalLeads = activeLeads.filter((lead) => lead.stage === 'Proposal' && lead.decisionStatus === 'Pending')

  const selectedClientPaymentsSummary = {
    quote: Number(selectedClient?.quoteAmount || 0),
    paid: Number(selectedClient?.paidAmount || 0),
    remaining: Number(selectedClient?.remainingAmount || 0)
  }

  const reportByStage = useMemo(() => {
    return STAGES.map((stage) => ({
      stage,
      count: activeLeads.filter((lead) => lead.stage === stage).length,
      value: activeLeads.filter((lead) => lead.stage === stage).reduce((sum, lead) => sum + Number(lead.quoteAmount || 0), 0)
    }))
  }, [activeLeads])

  const reportByDecision = useMemo(() => {
    return DECISION_STATUSES.map((status) => ({
      status,
      count: activeLeads.filter((lead) => lead.decisionStatus === status).length
    }))
  }, [activeLeads])

  const reportByUser = useMemo(() => {
    if (!canSeeAllLeads(currentUser)) return []

    return users
      .filter((user) => user.active !== false)
      .map((user) => {
        const userLeads = activeLeads.filter((lead) => lead.ownerId === user.id)
        return {
          id: user.id,
          name: user.name,
          role: user.role,
          count: userLeads.length,
          won: userLeads.filter((lead) => lead.dealStatus === 'Won').length,
          value: userLeads.reduce((sum, lead) => sum + Number(lead.quoteAmount || 0), 0)
        }
      })
      .filter((row) => row.count > 0)
      .sort((a, b) => b.value - a.value)
  }, [activeLeads, users, currentUser])

  const serviceStats = useMemo(() => {
    const map = new Map()
    activeLeads.forEach((lead) => {
      const key = (lead.service || 'غير محدد').trim() || 'غير محدد'
      const current = map.get(key) || { name: key, count: 0, value: 0 }
      current.count += 1
      current.value += Number(lead.quoteAmount || 0)
      map.set(key, current)
    })
    return Array.from(map.values()).sort((a, b) => b.count - a.count || b.value - a.value).slice(0, 5)
  }, [activeLeads])

  const lostReasonStats = useMemo(() => {
    const map = new Map()
    activeLeads.filter((lead) => lead.dealStatus === 'Lost').forEach((lead) => {
      const key = (lead.lostReason || 'غير محدد').trim() || 'غير محدد'
      map.set(key, (map.get(key) || 0) + 1)
    })
    return Array.from(map.entries()).map(([reason, count]) => ({ reason, count })).sort((a, b) => b.count - a.count).slice(0, 5)
  }, [activeLeads])

  const recentClients = useMemo(() => {
    return [...activeLeads].sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0)).slice(0, 6)
  }, [activeLeads])

  const upcomingClosings = useMemo(() => {
    return activeLeads
      .filter((lead) => !!lead.expectedCloseDate && lead.dealStatus === 'Open')
      .sort((a, b) => String(a.expectedCloseDate).localeCompare(String(b.expectedCloseDate)))
      .slice(0, 6)
  }, [activeLeads])

  const notifications = useMemo(() => {
    if (!settings.notificationsEnabled) return []
    const items = []

    allTasks.forEach((task) => {
      if (isTaskOverdue(task)) {
        items.push({ id: `task-overdue-${task.clientId}-${task.id}`, type: 'danger', title: 'مهمة متأخرة', text: `${task.title} - ${task.clientName}`, date: task.dueDate || '', clientId: task.clientId })
      } else if (isTaskToday(task)) {
        items.push({ id: `task-today-${task.clientId}-${task.id}`, type: 'warning', title: 'مهمة اليوم', text: `${task.title} - ${task.clientName}`, date: task.dueDate || '', clientId: task.clientId })
      }
    })

    activeLeads.forEach((lead) => {
      if (lead.nextFollowUpDate && lead.nextFollowUpDate < todayString() && lead.dealStatus !== 'Won') {
        items.push({ id: `lead-overdue-followup-${lead.id}`, type: 'danger', title: 'متابعة متأخرة', text: `${lead.company} - ${lead.service || 'بدون خدمة'}`, date: lead.nextFollowUpDate, clientId: lead.id })
      } else if (lead.nextFollowUpDate === todayString()) {
        items.push({ id: `lead-today-followup-${lead.id}`, type: 'warning', title: 'متابعة اليوم', text: `${lead.company} - ${lead.service || 'بدون خدمة'}`, date: lead.nextFollowUpDate, clientId: lead.id })
      }

      if (lead.stage === 'Proposal' && lead.decisionStatus === 'Pending') {
        items.push({ id: `proposal-pending-${lead.id}`, type: 'info', title: 'عرض بانتظار القرار', text: `${lead.company} - ${formatMoney(lead.quoteAmount)} ${settings.currency}`, date: lead.expectedCloseDate || '', clientId: lead.id })
      }
    })

    return items.sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')))
  }, [allTasks, activeLeads, settings])

  const unreadNotificationsCount = notifications.filter((item) => !readNotifications.includes(item.id)).length

  function markAllNotificationsAsRead() {
    const ids = notifications.map((item) => item.id)
    setReadNotifications(Array.from(new Set([...readNotifications, ...ids])))
  }

  function markNotificationAsRead(id) {
    if (readNotifications.includes(id)) return
    setReadNotifications((prev) => [...prev, id])
  }

  function openClientFromNotification(notification) {
    const client = activeLeads.find((lead) => lead.id === notification.clientId) || visibleLeads.find((lead) => lead.id === notification.clientId)
    if (client) {
      setSelectedClient(client)
      setActiveTab('overview')
      markNotificationAsRead(notification.id)
      setShowNotificationsPanel(false)
    }
  }

  function saveSettings() {
    localStorage.setItem('tamakan-crm-settings', JSON.stringify(settings))
    showToast('تم حفظ الإعدادات بنجاح', 'success')
  }

  function resetSettings() {
    setSettings(DEFAULT_SETTINGS)
    localStorage.setItem('tamakan-crm-settings', JSON.stringify(DEFAULT_SETTINGS))
    showToast('تمت إعادة الإعدادات الافتراضية', 'success')
  }

  useEffect(() => {
    if (!currentUser && !loading) return
    if (currentPage === 'reports' && !canAccessReports(currentUser)) {
      setCurrentPage('dashboard')
    }
  }, [currentPage, currentUser, loading])

  if (!currentUser) {
    return <LoginScreen onLogin={loginUser} />
  }

  if (loading) {
    return (
      <div className="saas-shell">
        <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} settings={settings} currentUser={currentUser} />
        <main className="saas-main">
          <div className="loading-box">جاري تحميل البيانات...</div>
        </main>
      </div>
    )
  }

  return (
    <div className="saas-shell" dir="rtl">
      <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} settings={settings} currentUser={currentUser} />

      <main className="saas-main">
        <Topbar
          currentPage={currentPage}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          openAddPanel={() => setShowAddPanel(true)}
          theme={theme}
          toggleTheme={toggleTheme}
          showNextDevelopment={showNextDevelopment}
          unreadNotificationsCount={unreadNotificationsCount}
          openNotifications={() => setShowNotificationsPanel(true)}
          currentUser={currentUser}
          logout={logoutUser}
          canAddLead={true}
        />

        {currentPage !== 'archived' && (
          <section className="saas-filters-panel">
            <div className="saas-grid-4">
              <select value={stageFilter} onChange={(e) => setStageFilter(e.target.value)}>
                <option value="All">{AR.allStages}</option>
                {STAGES.map((stage) => <option key={stage} value={stage}>{stageLabel(stage)}</option>)}
              </select>

              <select value={tempFilter} onChange={(e) => setTempFilter(e.target.value)}>
                <option value="All">{AR.allTemps}</option>
                {TEMPERATURES.map((temp) => <option key={temp} value={temp}>{tempLabel(temp)}</option>)}
              </select>

              <select value={dealFilter} onChange={(e) => setDealFilter(e.target.value)}>
                <option value="All">{AR.allDeals}</option>
                {DEAL_STATUSES.map((status) => <option key={status} value={status}>{dealLabel(status)}</option>)}
              </select>

              <select value={decisionFilter} onChange={(e) => setDecisionFilter(e.target.value)}>
                <option value="All">كل حالات القرار</option>
                {DECISION_STATUSES.map((status) => <option key={status} value={status}>{decisionLabel(status)}</option>)}
              </select>

              {canSeeAllLeads(currentUser) && (
                <select value={ownerFilter} onChange={(e) => setOwnerFilter(e.target.value)}>
                  <option value="All">كل المسؤولين</option>
                  {ownerOptions.map((owner) => <option key={owner.id} value={owner.id}>{owner.name}</option>)}
                </select>
              )}

              <button
                className="secondary-btn"
                onClick={() => {
                  setStageFilter('All')
                  setTempFilter('All')
                  setDealFilter('All')
                  setDecisionFilter('All')
                  setOwnerFilter('All')
                }}
              >
                إعادة تعيين الفلاتر
              </button>

              <button className="primary-btn" onClick={() => exportCsv(filteredLeads)}>⬇️ تصدير CSV</button>
            </div>
          </section>
        )}

        {(currentPage === 'dashboard' || currentPage === 'clients') && (
          <>
            <section className="stats-grid">
              <StatCard title="📊 إجمالي العملاء" value={total} accent="blue" />
              <StatCard title="📂 صفقات مفتوحة" value={openDealsCount} accent="cyan" />
              <StatCard title="💰 صفقات مغلقة" value={wonCount} accent="green" />
              <StatCard title="🚨 مهام متأخرة" value={overdueTasksCount} accent="red" />
              <StatCard title={`💵 قيمة الصفقات (${settings.currency})`} value={formatMoney(totalDealValue)} accent="purple" />
              <StatCard title="📈 نسبة التحويل" value={`${conversionRate}%`} accent="gold" />
            </section>

            {currentPage === 'dashboard' ? (
              <section className="dashboard-shell">
                <div className="dashboard-main-col">
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
  className={`saas-lead-card new-card ${lead.temperature === 'Hot' ? 'lead-hot' : 'lead-warm'}`}
  onClick={() => {
    setSelectedClient(lead)
    setActiveTab('overview')
  }}
>
  <div className="card-top">
    <strong>{lead.company}</strong>
    <span className={`chip ${lead.temperature === 'Hot' ? 'hot' : 'warm'}`}>
      {tempLabel(lead.temperature)}
    </span>
  </div>

  <div className="card-service">
    {lead.service || '-'}
  </div>

  <div className="card-price">
    💰 {formatMoney(lead.quoteAmount)} {settings.currency}
  </div>

  {lead.nextFollowUpDate && (
    <div
      className={`card-followup ${
        lead.nextFollowUpDate === todayString()
          ? 'today'
          : lead.nextFollowUpDate < todayString()
          ? 'overdue'
          : ''
      }`}
    >
      📌 {lead.nextFollowUpDate}
    </div>
  )}
</div>

                                {canEditLead(currentUser, lead) && (
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
                                      {STAGES.map((stageOption) => <option key={stageOption} value={stageOption}>{stageLabel(stageOption)}</option>)}
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
                                      {TEMPERATURES.map((temp) => <option key={temp} value={temp}>{tempLabel(temp)}</option>)}
                                    </select>
                                  </div>
                                )}
                              </div>
                            ))}
                        </div>
                      </div>
                    ))}
                  </section>
                </div>

                <aside className="dashboard-side-col">
                  <div className="saas-page-panel">
                    <h2>لوحة ذكية</h2>
                    <div className="list-block">
                      <div className="list-item report-row">
                        <div><strong>عملاء هذا الأسبوع</strong></div>
                        <div>{weeklyNewClients}</div>
                      </div>
                      <div className="list-item report-row">
                        <div><strong>متوسط الصفقة</strong></div>
                        <div>{formatMoney(avgDealValue)} {settings.currency}</div>
                      </div>
                      <div className="list-item report-row">
                        <div><strong>Win Rate (Closed)</strong></div>
                        <div>{winRateVsClosed}%</div>
                      </div>
                      <div className="list-item report-row">
                        <div><strong>مهام اليوم</strong></div>
                        <div>{todayTasksCount}</div>
                      </div>
                    </div>
                  </div>

                  <div className="saas-page-panel">
                    <h2>متابعات اليوم</h2>
                    <div className="list-block">
                      {todayFollowups.length === 0 ? (
                        <EmptyState text="لا توجد متابعات اليوم" />
                      ) : (
                        todayFollowups.slice(0, 5).map((lead) => (
                          <div key={lead.id} className="list-item highlight-today">
                            <div><strong>{lead.company}</strong></div>
                            <div className="meta-text">{lead.service || '-'}</div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="saas-page-panel">
                    <h2>متابعات متأخرة</h2>
                    <div className="list-block">
                      {overdueFollowups.length === 0 ? (
                        <EmptyState text="لا توجد متابعات متأخرة" />
                      ) : (
                        overdueFollowups.slice(0, 5).map((lead) => (
                          <div key={lead.id} className="list-item highlight-overdue">
                            <div><strong>{lead.company}</strong></div>
                            <div className="meta-text">{lead.nextFollowUpDate}</div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="saas-page-panel">
                    <h2>أقرب إغلاقات</h2>
                    <div className="list-block">
                      {upcomingClosings.length === 0 ? (
                        <EmptyState text="لا توجد تواريخ إغلاق" />
                      ) : (
                        upcomingClosings.map((lead) => (
                          <div key={lead.id} className="list-item">
                            <div><strong>{lead.company}</strong></div>
                            <div className="meta-text">{lead.expectedCloseDate}</div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="saas-page-panel">
                    <h2>أكثر الخدمات طلبًا</h2>
                    <div className="list-block">
                      {serviceStats.length === 0 ? (
                        <EmptyState text="لا توجد بيانات" />
                      ) : (
                        serviceStats.map((item) => (
                          <div key={item.name} className="list-item report-row">
                            <div><strong>{item.name}</strong></div>
                            <div>{item.count}</div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="saas-page-panel">
                    <h2>أكثر أسباب الخسارة</h2>
                    <div className="list-block">
                      {lostReasonStats.length === 0 ? (
                        <EmptyState text="لا توجد صفقات خاسرة" />
                      ) : (
                        lostReasonStats.map((item) => (
                          <div key={item.reason} className="list-item report-row">
                            <div><strong>{item.reason}</strong></div>
                            <div>{item.count}</div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {canSeeAllLeads(currentUser) && (
                    <div className="saas-page-panel">
                      <h2>أداء الموظفين</h2>
                      <div className="list-block">
                        {reportByUser.length === 0 ? (
                          <EmptyState text="لا توجد بيانات" />
                        ) : (
                          reportByUser.slice(0, 5).map((item) => (
                            <div key={item.id} className="list-item">
                              <div><strong>{item.name}</strong></div>
                              <div className="meta-text">العملاء: {item.count}</div>
                              <div className="meta-text">المغلق: {item.won}</div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  <div className="saas-page-panel">
                    <h2>أحدث العملاء</h2>
                    <div className="list-block">
                      {recentClients.length === 0 ? (
                        <EmptyState text="لا يوجد عملاء حديثون" />
                      ) : (
                        recentClients.map((lead) => (
                          <div key={lead.id} className="list-item">
                            <div><strong>{lead.company}</strong></div>
                            <div className="meta-text">{formatDate(lead.createdAt)}</div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </aside>
              </section>
            ) : (
              <section className="saas-board">
                {STAGES.map((stage) => (
                  <div key={stage} className="saas-column">
                    <div className="saas-column-header">
                      <h3>{stageLabel(stage)}</h3>
                      <span>{filteredLeads.filter((lead) => lead.stage === stage).length}</span>
                    </div>

                    <div className="saas-column-body">
                      {filteredLeads.filter((lead) => lead.stage === stage).map((lead) => (
                        <div
                          key={lead.id}
                          className={`saas-lead-card ${lead.temperature === 'Hot' ? 'lead-hot' : 'lead-warm'}`}
                          style={{ borderRightColor: lead.temperature === 'Hot' ? '#ef4444' : '#f59e0b' }}
                          onClick={() => {
                            setSelectedClient(lead)
                            setActiveTab('overview')
                          }}
                        >
                          <div className="saas-lead-header">
                            <strong>{lead.company}</strong>
                            <span className="saas-stage-chip">{stageLabel(lead.stage)}</span>
                          </div>
                          <div className="saas-lead-meta">{AR.service}: {lead.service || '-'}</div>
                          <div className="saas-lead-meta">{AR.quote}: {formatMoney(lead.quoteAmount)} {settings.currency}</div>
                          <div className="saas-lead-meta">المسؤول: {lead.ownerName || '-'}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </section>
            )}
          </>
        )}

        {currentPage === 'tasks' && (
          <section className="saas-page-panel">
            <div className="tasks-page-header">
              <h2>{AR.tasks}</h2>
              <div className="tasks-filter-row">
                <select value={taskViewFilter} onChange={(e) => setTaskViewFilter(e.target.value)}>
                  <option value="All">{AR.allTasks}</option>
                  <option value="Today">{AR.todayTasks}</option>
                  <option value="Overdue">{AR.overdueTasks}</option>
                  <option value="Done">{AR.doneTasks}</option>
                </select>
              </div>
            </div>

            <div className="list-block">
              {filteredAllTasks.length === 0 ? (
                <EmptyState text="لا توجد مهام مسجلة" />
              ) : (
                filteredAllTasks.map((task) => (
                  <div key={task.id} className={`list-item ${taskStatusClass(task)}`}>
                    {editingTaskId === task.id ? (
                      <>
                        <div className="saas-grid-4">
                          <input value={editingTaskData.title} onChange={(e) => setEditingTaskData({ ...editingTaskData, title: e.target.value })} placeholder="اسم المهمة" />
                          <input type="date" value={editingTaskData.dueDate} onChange={(e) => setEditingTaskData({ ...editingTaskData, dueDate: e.target.value })} />
                          <input value={editingTaskData.owner} onChange={(e) => setEditingTaskData({ ...editingTaskData, owner: e.target.value })} placeholder="المسؤول" />
                          <select value={editingTaskData.status} onChange={(e) => setEditingTaskData({ ...editingTaskData, status: e.target.value })}>
                            {TASK_STATUSES.map((status) => <option key={status} value={status}>{taskStatusLabel(status)}</option>)}
                          </select>
                        </div>

                        <div className="saas-inline-actions top-gap">
                          <button className="primary-btn small-btn" onClick={() => saveEditedTask(task)}>💾 {AR.save}</button>
                          <button className="danger-btn small-btn" onClick={() => {
                            setEditingTaskId(null)
                            setEditingTaskData({ title: '', dueDate: '', owner: '', status: 'Pending' })
                          }}>
                            {AR.cancel}
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div><strong>{AR.company}:</strong> {task.clientName}</div>
                        <div><strong>المهمة:</strong> {task.title}</div>
                        <div><strong>التاريخ:</strong> {task.dueDate}</div>
                        <div><strong>المسؤول:</strong> {task.owner}</div>
                        <div><strong>الحالة:</strong> {taskStatusLabel(task.status)}</div>

                        <div className="saas-inline-actions top-gap">
                          <select value={task.status} onChange={(e) => updateTaskStatus(task.id, e.target.value, task.clientId)}>
                            {TASK_STATUSES.map((status) => <option key={status} value={status}>{taskStatusLabel(status)}</option>)}
                          </select>

                          <button className="primary-btn small-btn" onClick={() => startEditTask(task)}>✏️ {AR.edit}</button>

                          <button
                            className="danger-btn small-btn"
                            onClick={() =>
                              openConfirmDialog({
                                title: 'حذف المهمة',
                                message: `هل تريد حذف المهمة "${task.title}"؟`,
                                confirmText: 'نعم، احذف',
                                type: 'danger',
                                onConfirm: async () => {
                                  await deleteTask(task.id, task.clientId)
                                  closeConfirmDialog()
                                  showToast('تم حذف المهمة', 'success')
                                }
                              })
                            }
                          >
                            🗑️ {AR.delete}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {currentPage === 'reports' && canAccessReports(currentUser) && (
          <section className="saas-page-panel">
            <h2>{AR.reports}</h2>

            <div className="saas-grid-4">
              <InfoBox label="إجمالي العملاء" value={total} />
              <InfoBox label="إجمالي قيمة الصفقات" value={`${formatMoney(totalDealValue)} ${settings.currency}`} />
              <InfoBox label="إجمالي الصفقات المغلقة" value={wonCount} />
              <InfoBox label="إجمالي الصفقات الضائعة" value={lostCount} />
              <InfoBox label="إجمالي المدفوع" value={`${formatMoney(activeLeads.reduce((s, x) => s + Number(x.paidAmount || 0), 0))} ${settings.currency}`} />
              <InfoBox label="إجمالي المتبقي" value={`${formatMoney(activeLeads.reduce((s, x) => s + Number(x.remainingAmount || 0), 0))} ${settings.currency}`} />
              <InfoBox label="نسبة التحويل" value={`${conversionRate}%`} />
              <InfoBox label="Win Rate Closed" value={`${winRateVsClosed}%`} />
            </div>

            <div className="dashboard-grid top-gap">
              <div className="saas-page-panel">
                <h2>تقرير المراحل</h2>
                <div className="list-block">
                  {reportByStage.map((item) => (
                    <div key={item.stage} className="list-item report-row">
                      <div><strong>{stageLabel(item.stage)}</strong></div>
                      <div>العدد: {item.count}</div>
                      <div>القيمة: {formatMoney(item.value)} {settings.currency}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="saas-page-panel">
                <h2>تقرير حالات القرار</h2>
                <div className="list-block">
                  {reportByDecision.map((item) => (
                    <div key={item.status} className="list-item report-row">
                      <div><strong>{decisionLabel(item.status)}</strong></div>
                      <div>العدد: {item.count}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="saas-page-panel">
                <h2>ملخص المهام</h2>
                <div className="list-block">
                  <div className="list-item report-row"><div><strong>{AR.todayTasks}</strong></div><div>{todayTasksCount}</div></div>
                  <div className="list-item report-row"><div><strong>{AR.overdueTasks}</strong></div><div>{overdueTasksCount}</div></div>
                  <div className="list-item report-row"><div><strong>{AR.doneTasks}</strong></div><div>{doneTasksCount}</div></div>
                </div>
              </div>

              {canSeeAllLeads(currentUser) && (
                <div className="saas-page-panel">
                  <h2>تقرير الموظفين</h2>
                  <div className="list-block">
                    {reportByUser.length === 0 ? (
                      <EmptyState text="لا توجد بيانات موظفين حاليًا" />
                    ) : (
                      reportByUser.map((item) => (
                        <div key={item.id} className="list-item report-row">
                          <div>
                            <strong>{item.name}</strong>
                            <div className="meta-text">{getRoleLabel(item.role)}</div>
                          </div>
                          <div>العملاء: {item.count}</div>
                          <div>المغلق: {item.won}</div>
                          <div>القيمة: {formatMoney(item.value)} {settings.currency}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {currentPage === 'archived' && (
          <section className="saas-page-panel">
            <h2>{AR.archived}</h2>
            <div className="list-block">
              {filteredArchivedLeads.length === 0 ? (
                <EmptyState text="لا يوجد عملاء مؤرشفون" />
              ) : (
                filteredArchivedLeads.map((lead) => (
                  <div key={lead.id} className="list-item">
                    <div><strong>{AR.company}:</strong> {lead.company}</div>
                    <div><strong>{AR.phone}:</strong> {lead.phone}</div>
                    <div><strong>{AR.service}:</strong> {lead.service || '-'}</div>
                    <div><strong>{AR.dealStatus}:</strong> {dealLabel(lead.dealStatus)}</div>
                    <div><strong>المسؤول:</strong> {lead.ownerName || '-'}</div>

                    <div className="saas-inline-actions top-gap">
                      {canArchiveLead(currentUser, lead) && (
                        <button
                          className="primary-btn small-btn"
                          onClick={() =>
                            openConfirmDialog({
                              title: 'استرجاع العميل',
                              message: `هل تريد استرجاع العميل "${lead.company}"؟`,
                              confirmText: 'نعم، استرجع',
                              type: 'success',
                              onConfirm: async () => {
                                await restoreLead(lead.id)
                                closeConfirmDialog()
                                showToast('تم استرجاع العميل', 'success')
                              }
                            })
                          }
                        >
                          ♻️ {AR.restore}
                        </button>
                      )}

                      {canDeleteLead(currentUser) && (
                        <button
                          className="danger-btn small-btn"
                          onClick={() =>
                            openConfirmDialog({
                              title: 'حذف نهائي',
                              message: `سيتم حذف العميل "${lead.company}" نهائيًا، هل أنت متأكد؟`,
                              confirmText: 'نعم، احذف',
                              type: 'danger',
                              onConfirm: async () => {
                                await deleteLead(lead.id)
                                closeConfirmDialog()
                                showToast('تم حذف العميل نهائيًا', 'success')
                              }
                            })
                          }
                        >
                          🗑️ حذف نهائي
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {currentPage === 'settings' && (
          <section className="saas-page-panel">
            <h2>{AR.settings}</h2>

            <div className="saas-grid-2">
              <div className="info-box">
                <div className="info-box-label">اسم النظام / الشركة</div>
                <input value={settings.companyName} onChange={(e) => setSettings({ ...settings, companyName: e.target.value })} placeholder="اسم الشركة" />
              </div>

              <div className="info-box">
                <div className="info-box-label">العملة</div>
                <input value={settings.currency} onChange={(e) => setSettings({ ...settings, currency: e.target.value })} placeholder="ريال" />
              </div>

              <div className="info-box">
                <div className="info-box-label">نسبة الضريبة %</div>
                <input type="number" value={settings.vatPercent} onChange={(e) => setSettings({ ...settings, vatPercent: e.target.value })} placeholder="15" />
              </div>

              <div className="info-box">
                <div className="info-box-label">المسؤول الافتراضي للمهام</div>
                <input value={settings.defaultTaskOwner} onChange={(e) => setSettings({ ...settings, defaultTaskOwner: e.target.value })} placeholder="مثال: مدير المبيعات" />
              </div>

              <div className="info-box full-span">
                <div className="info-box-label">توقيع واتساب الذكي</div>
                <textarea rows="4" value={settings.whatsappSignature} onChange={(e) => setSettings({ ...settings, whatsappSignature: e.target.value })} placeholder="مع تحيات فريق المبيعات" />
              </div>

              <div className="info-box full-span">
                <div className="toggle-row">
                  <div>
                    <div className="info-box-label">الإشعارات داخل النظام</div>
                    <div className="muted-text">تفعيل تنبيهات المتابعات والمهام المتأخرة واليوم</div>
                  </div>

                  <label className="switch">
                    <input type="checkbox" checked={settings.notificationsEnabled} onChange={(e) => setSettings({ ...settings, notificationsEnabled: e.target.checked })} />
                    <span className="slider"></span>
                  </label>
                </div>
              </div>
            </div>

            <div className="saas-inline-actions top-gap">
              <button className="primary-btn" onClick={saveSettings}>💾 حفظ الإعدادات</button>
              <button className="secondary-btn" onClick={resetSettings}>إعادة الافتراضي</button>
            </div>

            {canManageUsers(currentUser) && (
              <div className="top-gap">
                <div className="saas-page-panel">
                  <h2>إدارة المستخدمين</h2>

                  <div className="saas-grid-4">
                    <input placeholder="اسم المستخدم" value={userForm.name} onChange={(e) => setUserForm({ ...userForm, name: e.target.value })} />
                    <input placeholder="البريد الإلكتروني" value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} />
                    <input placeholder="كلمة المرور" value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} />
                    <select value={userForm.role} onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}>
                      <option value="admin">أدمن</option>
                      <option value="manager">مدير</option>
                      <option value="sales">موظف مبيعات</option>
                    </select>
                  </div>

                  <div className="saas-inline-actions top-gap">
                    <label className="toggle-row">
                      <span>الحساب مفعل</span>
                      <label className="switch">
                        <input type="checkbox" checked={userForm.active} onChange={(e) => setUserForm({ ...userForm, active: e.target.checked })} />
                        <span className="slider"></span>
                      </label>
                    </label>
                  </div>

                  <div className="saas-inline-actions top-gap">
                    {editingUserId ? (
                      <>
                        <button className="primary-btn" onClick={saveEditedUser}>حفظ تعديل المستخدم</button>
                        <button className="danger-btn" onClick={() => {
                          setEditingUserId(null)
                          setUserForm(emptyUserForm)
                        }}>
                          إلغاء
                        </button>
                      </>
                    ) : (
                      <button className="primary-btn" onClick={createUser}>+ إضافة مستخدم</button>
                    )}
                  </div>

                  <div className="list-block top-gap">
                    {users.map((user) => (
                      <div key={user.id} className="list-item">
                        <div><strong>الاسم:</strong> {user.name}</div>
                        <div><strong>البريد:</strong> {user.email}</div>
                        <div><strong>الدور:</strong> {getRoleLabel(user.role)}</div>
                        <div><strong>الحالة:</strong> {user.active ? 'مفعل' : 'موقوف'}</div>

                        <div className="saas-inline-actions top-gap">
                          <button className="primary-btn small-btn" onClick={() => startEditUser(user)}>✏️ تعديل</button>
                          <button
                            className="danger-btn small-btn"
                            onClick={() =>
                              openConfirmDialog({
                                title: 'حذف المستخدم',
                                message: `هل تريد حذف المستخدم "${user.name}"؟`,
                                confirmText: 'نعم، احذف',
                                type: 'danger',
                                onConfirm: async () => {
                                  removeUser(user.id)
                                  closeConfirmDialog()
                                  showToast('تم حذف المستخدم', 'success')
                                }
                              })
                            }
                          >
                            🗑️ حذف
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </section>
        )}
      </main>

      {showAddPanel && (
        <div className="drawer-overlay" onClick={() => setShowAddPanel(false)}>
          <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <h2>{AR.addClient}</h2>
              <button className="danger-btn small-btn" onClick={() => setShowAddPanel(false)}>إغلاق</button>
            </div>

            <div className="saas-grid-2">
              <input placeholder={AR.company} value={newLead.company} onChange={(e) => setNewLead({ ...newLead, company: e.target.value })} />
              <input placeholder={AR.phone} value={newLead.phone} onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })} />
              <input placeholder={AR.service} value={newLead.service} onChange={(e) => setNewLead({ ...newLead, service: e.target.value })} />
              <input placeholder={AR.quote} type="number" value={newLead.quoteAmount} onChange={(e) => setNewLead({ ...newLead, quoteAmount: e.target.value })} />
              <input type="date" value={newLead.nextFollowUpDate} onChange={(e) => setNewLead({ ...newLead, nextFollowUpDate: e.target.value })} />
              <input type="date" value={newLead.expectedCloseDate} onChange={(e) => setNewLead({ ...newLead, expectedCloseDate: e.target.value })} />

              <select value={newLead.temperature} onChange={(e) => setNewLead({ ...newLead, temperature: e.target.value })}>
                {TEMPERATURES.map((temp) => <option key={temp} value={temp}>{tempLabel(temp)}</option>)}
              </select>

              <select value={newLead.stage} onChange={(e) => setNewLead({ ...newLead, stage: e.target.value })}>
                {STAGES.map((stage) => <option key={stage} value={stage}>{stageLabel(stage)}</option>)}
              </select>

              <select value={newLead.dealStatus} onChange={(e) => setNewLead({ ...newLead, dealStatus: e.target.value })}>
                {DEAL_STATUSES.map((status) => <option key={status} value={status}>{dealLabel(status)}</option>)}
              </select>

              <select value={newLead.decisionStatus} onChange={(e) => setNewLead({ ...newLead, decisionStatus: e.target.value })}>
                {DECISION_STATUSES.map((status) => <option key={status} value={status}>{decisionLabel(status)}</option>)}
              </select>

              <select value={newLead.lostReason} onChange={(e) => setNewLead({ ...newLead, lostReason: e.target.value })}>
                <option value="">{AR.lostReason}</option>
                {LOST_REASONS.map((reason) => <option key={reason} value={reason}>{reason}</option>)}
              </select>
            </div>

            <div className="drawer-footer">
              <button className="primary-btn" onClick={addLead}>+ {AR.save}</button>
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
                  href={`https://wa.me/${selectedClient.phone}?text=${buildWhatsAppMessage(selectedClient, settings)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="wa-btn"
                >
                  {AR.whatsapp}
                </a>
                <button className="danger-btn small-btn" onClick={() => setSelectedClient(null)}>إغلاق</button>
              </div>
            </div>

            <div className="tabs">
              {TABS.map((tab) => (
                <button key={tab} className={activeTab === tab ? 'active' : ''} onClick={() => setActiveTab(tab)}>
                  {tab === 'overview' && AR.overview}
                  {tab === 'tasks' && AR.tasks}
                  {tab === 'notes' && AR.notes}
                  {tab === 'files' && AR.files}
                  {tab === 'payments' && AR.payments}
                  {tab === 'activity' && AR.activity}
                </button>
              ))}
            </div>

            {activeTab === 'overview' && (
              <div className="saas-grid-2">
                <InfoBox label={AR.phone} value={selectedClient.phone} />
                <InfoBox label={AR.stage} value={stageLabel(selectedClient.stage)} />
                <InfoBox label={AR.temperature} value={tempLabel(selectedClient.temperature)} />
                <InfoBox label={AR.dealStatus} value={dealLabel(selectedClient.dealStatus)} />
                <InfoBox label={AR.decisionStatus} value={decisionLabel(selectedClient.decisionStatus)} />
                <InfoBox label={AR.createdAt} value={formatDate(selectedClient.createdAt)} />
                <InfoBox label={AR.lastActivity} value={formatDate(selectedClient.lastActivityAt)} />
                <InfoBox label={AR.followup} value={selectedClient.nextFollowUpDate || '-'} />
                <InfoBox label={AR.expectedCloseDate} value={selectedClient.expectedCloseDate || '-'} />
                <InfoBox label={AR.quote} value={`${formatMoney(selectedClientPaymentsSummary.quote)} ${settings.currency}`} />
                <InfoBox label={AR.paid} value={`${formatMoney(selectedClientPaymentsSummary.paid)} ${settings.currency}`} />
                <InfoBox label={AR.remaining} value={`${formatMoney(selectedClientPaymentsSummary.remaining)} ${settings.currency}`} />
                <InfoBox label={AR.lostReason} value={selectedClient.lostReason || '-'} />
                <InfoBox label="المسؤول" value={selectedClient.ownerName || '-'} />
                <InfoBox label="عدد المهام" value={clientTasks.length} />
                <InfoBox label="عدد الملاحظات" value={clientNotes.length} />
                <InfoBox label="عدد الملفات" value={clientFiles.length} />
              </div>
            )}

            {activeTab === 'tasks' && (
              <>
                <div className="saas-grid-4">
                  <input placeholder="اسم المهمة" value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} />
                  <input type="date" value={taskForm.dueDate} onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })} />
                  <input placeholder="المسؤول" value={taskForm.owner} onChange={(e) => setTaskForm({ ...taskForm, owner: e.target.value })} />
                  <select value={taskForm.status} onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value })}>
                    {TASK_STATUSES.map((status) => <option key={status} value={status}>{taskStatusLabel(status)}</option>)}
                  </select>
                </div>

                <div className="top-gap">
                  <button className="primary-btn" onClick={addTask}>+ إضافة مهمة</button>
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
                          <select value={task.status} onChange={(e) => updateTaskStatus(task.id, e.target.value)}>
                            {TASK_STATUSES.map((status) => <option key={status} value={status}>{taskStatusLabel(status)}</option>)}
                          </select>

                          <button
                            className="danger-btn small-btn"
                            onClick={() =>
                              openConfirmDialog({
                                title: 'حذف المهمة',
                                message: `هل تريد حذف المهمة "${task.title}"؟`,
                                confirmText: 'نعم، احذف',
                                type: 'danger',
                                onConfirm: async () => {
                                  await deleteTask(task.id)
                                  closeConfirmDialog()
                                  showToast('تم حذف المهمة', 'success')
                                }
                              })
                            }
                          >
                            🗑️ {AR.delete}
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
                  <input className="flex-1" placeholder="اكتب ملاحظة" value={noteText} onChange={(e) => setNoteText(e.target.value)} />
                  <button className="primary-btn" onClick={addNote}>+ إضافة ملاحظة</button>
                </div>

                <div className="list-block">
                  {clientNotes.length === 0 ? (
                    <EmptyState text="لا توجد ملاحظات" />
                  ) : (
                    clientNotes.map((note) => (
                      <div key={note.id} className="list-item">
                        <div>{note.text}</div>
                        <div className="meta-text">{formatDate(note.createdAt)}</div>
                        <button
                          className="danger-btn small-btn top-gap"
                          onClick={() =>
                            openConfirmDialog({
                              title: 'حذف الملاحظة',
                              message: 'هل تريد حذف هذه الملاحظة؟',
                              confirmText: 'نعم، احذف',
                              type: 'danger',
                              onConfirm: async () => {
                                await deleteNote(note.id)
                                closeConfirmDialog()
                                showToast('تم حذف الملاحظة', 'success')
                              }
                            })
                          }
                        >
                          🗑️ {AR.delete}
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
                  <select value={fileForm.type} onChange={(e) => setFileForm({ ...fileForm, type: e.target.value })}>
                    <option value="عرض سعر">عرض سعر</option>
                    <option value="عقد">عقد</option>
                    <option value="ملف آخر">ملف آخر</option>
                  </select>

                  <input placeholder="رابط الملف" value={fileForm.url} onChange={(e) => setFileForm({ ...fileForm, url: e.target.value })} />
                  <button className="primary-btn" onClick={addFile}>+ إضافة ملف</button>
                </div>

                <div className="list-block">
                  {clientFiles.length === 0 ? (
                    <EmptyState text="لا توجد ملفات" />
                  ) : (
                    clientFiles.map((file) => (
                      <div key={file.id} className="list-item">
                        <div><strong>النوع:</strong> {file.type}</div>
                        <div className="top-gap">
                          <a href={file.url} target="_blank" rel="noreferrer">فتح الملف</a>
                        </div>
                        <div className="meta-text">{formatDate(file.createdAt)}</div>
                        <button
                          className="danger-btn small-btn top-gap"
                          onClick={() =>
                            openConfirmDialog({
                              title: 'حذف الملف',
                              message: 'هل تريد حذف هذا الملف؟',
                              confirmText: 'نعم، احذف',
                              type: 'danger',
                              onConfirm: async () => {
                                await deleteFile(file.id)
                                closeConfirmDialog()
                                showToast('تم حذف الملف', 'success')
                              }
                            })
                          }
                        >
                          🗑️ {AR.delete}
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
                  <input placeholder="اسم الدفعة" value={paymentForm.title} onChange={(e) => setPaymentForm({ ...paymentForm, title: e.target.value })} />
                  <input placeholder="المبلغ" type="number" value={paymentForm.amount} onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })} />
                  <input type="date" value={paymentForm.date} onChange={(e) => setPaymentForm({ ...paymentForm, date: e.target.value })} />
                  <select value={paymentForm.status} onChange={(e) => setPaymentForm({ ...paymentForm, status: e.target.value })}>
                    {PAYMENT_STATUSES.map((status) => <option key={status} value={status}>{paymentStatusLabel(status)}</option>)}
                  </select>
                </div>

                <div className="top-gap">
                  <button className="primary-btn" onClick={addPayment}>+ إضافة دفعة</button>
                </div>

                <div className="list-block">
                  {clientPayments.length === 0 ? (
                    <EmptyState text="لا توجد دفعات" />
                  ) : (
                    clientPayments.map((payment) => (
                      <div key={payment.id} className="list-item">
                        <div><strong>اسم الدفعة:</strong> {payment.title}</div>
                        <div><strong>المبلغ:</strong> {formatMoney(payment.amount)} {settings.currency}</div>
                        <div><strong>التاريخ:</strong> {payment.date}</div>
                        <div><strong>الحالة:</strong> {paymentStatusLabel(payment.status)}</div>

                        <div className="saas-inline-actions top-gap">
                          <select value={payment.status} onChange={(e) => updatePaymentStatus(payment.id, e.target.value)}>
                            {PAYMENT_STATUSES.map((status) => <option key={status} value={status}>{paymentStatusLabel(status)}</option>)}
                          </select>

                          <button
                            className="danger-btn small-btn"
                            onClick={() =>
                              openConfirmDialog({
                                title: 'حذف الدفعة',
                                message: `هل تريد حذف الدفعة "${payment.title}"؟`,
                                confirmText: 'نعم، احذف',
                                type: 'danger',
                                onConfirm: async () => {
                                  await deletePayment(payment.id)
                                  closeConfirmDialog()
                                  showToast('تم حذف الدفعة', 'success')
                                }
                              })
                            }
                          >
                            🗑️ {AR.delete}
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}

            {activeTab === 'activity' && (
              <div className="list-block">
                {clientActivity.length === 0 ? (
                  <EmptyState text="لا يوجد نشاط مسجل" />
                ) : (
                  clientActivity.map((item) => (
                    <div key={item.id} className="list-item">
                      <div><strong>{item.action}</strong></div>
                      <div className="top-gap">{item.details || '-'}</div>
                      <div className="meta-text">{formatDate(item.createdAt)}</div>
                      <div className="meta-text">بواسطة: {item.actorName || '-'}</div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {showNotificationsPanel && (
        <div className="drawer-overlay" onClick={() => setShowNotificationsPanel(false)}>
          <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <div>
                <h2>الإشعارات</h2>
                <p className="muted-text">متابعات اليوم، المهام المتأخرة، وعروض الأسعار المعلقة</p>
              </div>

              <div className="saas-inline-actions">
                <button className="secondary-btn small-btn" onClick={markAllNotificationsAsRead}>تعليم الكل كمقروء</button>
                <button className="danger-btn small-btn" onClick={() => setShowNotificationsPanel(false)}>إغلاق</button>
              </div>
            </div>

            <div className="list-block">
              {notifications.length === 0 ? (
                <EmptyState text="لا توجد إشعارات حاليًا" />
              ) : (
                notifications.map((notification) => {
                  const isRead = readNotifications.includes(notification.id)
                  return (
                    <div key={notification.id} className={`list-item notification-item notification-${notification.type} ${isRead ? 'is-read' : ''}`}>
                      <div><strong>{notification.title}</strong></div>
                      <div className="top-gap">{notification.text}</div>
                      <div className="meta-text">{notification.date || '-'}</div>

                      <div className="saas-inline-actions top-gap">
                        <button className="primary-btn small-btn" onClick={() => openClientFromNotification(notification)}>فتح العميل</button>
                        {!isRead && (
                          <button className="secondary-btn small-btn" onClick={() => markNotificationAsRead(notification.id)}>تعليم كمقروء</button>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}

      {toast.open && (
        <div className={`toast toast-${toast.type}`}>
          <div className="toast-content">
            <span>{toast.message}</span>
            <button className="toast-close" onClick={closeToast}>✕</button>
          </div>
        </div>
      )}

      {confirmDialog.open && (
        <div className="confirm-overlay" onClick={closeConfirmDialog}>
          <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <h3>{confirmDialog.title}</h3>
            <p>{confirmDialog.message}</p>

            <div className="saas-inline-actions top-gap">
              <button
                className={confirmDialog.type === 'danger' ? 'danger-btn' : 'primary-btn'}
                onClick={async () => {
                  if (typeof confirmDialog.onConfirm === 'function') {
                    await confirmDialog.onConfirm()
                  }
                }}
              >
                {confirmDialog.confirmText}
              </button>

              <button className="secondary-btn" onClick={closeConfirmDialog}>
                {confirmDialog.cancelText}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
