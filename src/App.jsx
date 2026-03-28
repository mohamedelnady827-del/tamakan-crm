import './styles.css'
import { useEffect, useMemo, useState } from 'react'

import { initializeApp } from 'firebase/app'
import {
  getFirestore,
  collection,
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
const DEAL_STATUSES = ['Open', 'Won', 'Lost']
const DECISION_STATUSES = ['Pending', 'Approved', 'Rejected', 'No Response']
const TASK_STATUSES = ['Pending', 'In Progress', 'Done']
const PAYMENT_STATUSES = ['Pending', 'Paid', 'Partial']

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

export default function App() {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [selectedClient, setSelectedClient] = useState(null)

  const [searchTerm, setSearchTerm] = useState('')
  const [stageFilter, setStageFilter] = useState('All')
  const [tempFilter, setTempFilter] = useState('All')
  const [dealStatusFilter, setDealStatusFilter] = useState('All')

  const [newLead, setNewLead] = useState({
    company: '',
    phone: '',
    service: '',
    temperature: 'Warm',
    stage: 'Lead',
    status: 'جديد',
    dealStatus: 'Open',
    decisionStatus: 'Pending',
    quoteAmount: '',
    paidAmount: '',
    remainingAmount: '',
    expectedCloseDate: '',
    nextFollowUpDate: ''
  })

  const [clientTasks, setClientTasks] = useState([])
  const [taskForm, setTaskForm] = useState({
    title: '',
    dueDate: '',
    owner: '',
    status: 'Pending'
  })

  const [clientNotes, setClientNotes] = useState([])
  const [noteText, setNoteText] = useState('')

  const [clientFiles, setClientFiles] = useState([])
  const [fileForm, setFileForm] = useState({
    type: 'عرض سعر',
    url: ''
  })

  const [clientPayments, setClientPayments] = useState([])
  const [paymentForm, setPaymentForm] = useState({
    title: '',
    amount: '',
    date: '',
    status: 'Pending'
  })

  useEffect(() => {
    async function migrateOldDataIfNeeded() {
      const leadsRef = collection(db, 'leads')
      const snapshot = await getDocs(leadsRef)

      if (!snapshot.empty) return

      const oldLocal = localStorage.getItem('leads')

      if (oldLocal) {
        try {
          const parsed = JSON.parse(oldLocal)

          if (Array.isArray(parsed) && parsed.length > 0) {
            for (const item of parsed) {
              const { id, ...cleanItem } = item
              const quoteAmount = Number(cleanItem.quoteAmount || 0)
              const paidAmount = Number(cleanItem.paidAmount || 0)

              await addDoc(leadsRef, {
                company: cleanItem.company || '',
                phone: cleanItem.phone || '',
                service: cleanItem.service || '',
                temperature: cleanItem.temperature || 'Warm',
                stage: cleanItem.stage || 'Lead',
                status: cleanItem.status || 'جديد',
                dealStatus: cleanItem.dealStatus || 'Open',
                decisionStatus: cleanItem.decisionStatus || 'Pending',
                quoteAmount,
                paidAmount,
                remainingAmount: Math.max(quoteAmount - paidAmount, 0),
                expectedCloseDate: cleanItem.expectedCloseDate || '',
                nextFollowUpDate: cleanItem.nextFollowUpDate || '',
                lastActivityAt: cleanItem.lastActivityAt || Date.now(),
                createdAt: cleanItem.createdAt || Date.now()
              })
            }
            return
          }
        } catch (error) {
          console.error('خطأ في قراءة localStorage:', error)
        }
      }

      await addDoc(leadsRef, sampleLead)
    }

    async function init() {
      await migrateOldDataIfNeeded()

      const unsubscribe = onSnapshot(collection(db, 'leads'), (snapshot) => {
        const data = snapshot.docs.map((item) => ({
          id: item.id,
          ...item.data()
        }))

        setLeads(data)
        setLoading(false)

        if (selectedClient) {
          const updatedClient = data.find((item) => item.id === selectedClient.id)
          if (updatedClient) setSelectedClient(updatedClient)
        }
      })

      return unsubscribe
    }

    let unsubscribeRef

    init().then((unsubscribe) => {
      unsubscribeRef = unsubscribe
    })

    return () => {
      if (unsubscribeRef) unsubscribeRef()
    }
  }, [selectedClient])

  useEffect(() => {
    if (!selectedClient) {
      setClientTasks([])
      return
    }

    const tasksRef = collection(db, 'leads', selectedClient.id, 'tasks')
    const q = query(tasksRef, orderBy('createdAt', 'desc'))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setClientTasks(
        snapshot.docs.map((item) => ({
          id: item.id,
          ...item.data()
        }))
      )
    })

    return () => unsubscribe()
  }, [selectedClient])

  useEffect(() => {
    if (!selectedClient) {
      setClientNotes([])
      return
    }

    const notesRef = collection(db, 'leads', selectedClient.id, 'notes')
    const q = query(notesRef, orderBy('createdAt', 'desc'))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setClientNotes(
        snapshot.docs.map((item) => ({
          id: item.id,
          ...item.data()
        }))
      )
    })

    return () => unsubscribe()
  }, [selectedClient])

  useEffect(() => {
    if (!selectedClient) {
      setClientFiles([])
      return
    }

    const filesRef = collection(db, 'leads', selectedClient.id, 'files')
    const q = query(filesRef, orderBy('createdAt', 'desc'))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setClientFiles(
        snapshot.docs.map((item) => ({
          id: item.id,
          ...item.data()
        }))
      )
    })

    return () => unsubscribe()
  }, [selectedClient])

  useEffect(() => {
    if (!selectedClient) {
      setClientPayments([])
      return
    }

    const paymentsRef = collection(db, 'leads', selectedClient.id, 'payments')
    const q = query(paymentsRef, orderBy('createdAt', 'desc'))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setClientPayments(
        snapshot.docs.map((item) => ({
          id: item.id,
          ...item.data()
        }))
      )
    })

    return () => unsubscribe()
  }, [selectedClient])

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

  function isTaskOverdue(task) {
    if (!task?.dueDate || task?.status === 'Done') return false
    const today = new Date()
    const current = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const due = new Date(task.dueDate)
    return due < current
  }

  function isTaskToday(task) {
    if (!task?.dueDate || task?.status === 'Done') return false
    const today = new Date()
    const current = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
      today.getDate()
    ).padStart(2, '0')}`
    return task.dueDate === current
  }

  function getTaskStatusColor(task) {
    if (task.status === 'Done') return '#16a34a'
    if (isTaskOverdue(task)) return '#dc2626'
    if (isTaskToday(task)) return '#ca8a04'
    return '#2563eb'
  }

  function getDecisionLabel(status) {
    switch (status) {
      case 'Approved':
        return 'موافق'
      case 'Rejected':
        return 'مرفوض'
      case 'No Response':
        return 'لا يوجد رد'
      default:
        return 'بانتظار القرار'
    }
  }

  function getDealLabel(status) {
    switch (status) {
      case 'Won':
        return 'مغلقة - ربح'
      case 'Lost':
        return 'مغلقة - خسارة'
      default:
        return 'مفتوحة'
    }
  }

  function buildWhatsappMessage(lead) {
    const company = lead.company || 'العميل'
    const service = lead.service || 'الخدمة المطلوبة'
    const quoteAmount = Number(lead.quoteAmount || 0)
    const paidAmount = Number(lead.paidAmount || 0)
    const remainingAmount = Number(lead.remainingAmount || 0)

    let message = `السلام عليكم ${company}\n\n`

    if (lead.dealStatus === 'Won') {
      message += `نشكركم على ثقتكم.\n`
      message += `حالة المشروع: ${getDealLabel(lead.dealStatus)}\n`
      message += `الخدمة: ${service}\n`
      message += `قيمة عرض السعر: ${formatMoney(quoteAmount)} ريال\n`
      message += `المدفوع: ${formatMoney(paidAmount)} ريال\n`
      message += `المتبقي: ${formatMoney(remainingAmount)} ريال\n\n`
      message += `يسعدنا متابعة بقية الإجراءات معكم.`
      return encodeURIComponent(message)
    }

    if (lead.dealStatus === 'Lost') {
      message += `نشكركم على وقتكم.\n`
      message += `إذا رغبتم لاحقًا بإعادة فتح النقاش حول خدمة ${service} فنحن جاهزون لخدمتكم.`
      return encodeURIComponent(message)
    }

    if (lead.stage === 'Proposal' || lead.decisionStatus === 'Pending') {
      message += `نود متابعتكم بخصوص عرض السعر الخاص بخدمة ${service}.\n`
      message += `قيمة العرض: ${formatMoney(quoteAmount)} ريال.\n`
      message += `حالة القرار الحالية: ${getDecisionLabel(lead.decisionStatus)}.\n\n`
      message += `في حال رغبتكم بإكمال الإجراءات أو لديكم أي استفسار، نحن جاهزون لخدمتكم.`
      return encodeURIComponent(message)
    }

    if (lead.decisionStatus === 'No Response') {
      message += `نود التذكير بخصوص عرض السعر لخدمة ${service}.\n`
      message += `قيمة العرض: ${formatMoney(quoteAmount)} ريال.\n\n`
      message += `يسعدنا استكمال الخطوات معكم عند جاهزيتكم.`
      return encodeURIComponent(message)
    }

    message += `هذه متابعة بخصوص طلبكم لخدمة ${service}.\n`
    message += `المرحلة الحالية: ${lead.stage}\n`
    message += `حالة الصفقة: ${getDealLabel(lead.dealStatus)}\n`
    message += `عرض السعر: ${formatMoney(quoteAmount)} ريال\n`
    message += `المدفوع: ${formatMoney(paidAmount)} ريال\n`
    message += `المتبقي: ${formatMoney(remainingAmount)} ريال\n\n`
    message += `يسعدنا خدمتكم ومتابعة الطلب معكم.`
    return encodeURIComponent(message)
  }

  async function touchClientActivity(clientId) {
    await updateDoc(doc(db, 'leads', clientId), {
      lastActivityAt: Date.now()
    })
  }

  async function recalculateClientFinancials(clientId, quoteAmountOverride = null) {
    const paymentsSnapshot = await getDocs(collection(db, 'leads', clientId, 'payments'))
    let paid = 0

    paymentsSnapshot.forEach((item) => {
      const data = item.data()
      if (data.status === 'Paid' || data.status === 'Partial') {
        paid += Number(data.amount || 0)
      }
    })

    const currentClient = leads.find((item) => item.id === clientId)
    const quoteAmount =
      quoteAmountOverride !== null
        ? Number(quoteAmountOverride || 0)
        : Number(currentClient?.quoteAmount || 0)

    await updateDoc(doc(db, 'leads', clientId), {
      paidAmount: paid,
      remainingAmount: Math.max(quoteAmount - paid, 0),
      lastActivityAt: Date.now()
    })
  }

  async function addLead() {
    if (!newLead.company || !newLead.phone) {
      alert('اكمل البيانات الأساسية')
      return
    }

    const quoteAmount = Number(newLead.quoteAmount || 0)
    const paidAmount = Number(newLead.paidAmount || 0)

    await addDoc(collection(db, 'leads'), {
      company: newLead.company,
      phone: newLead.phone,
      service: newLead.service || '',
      temperature: newLead.temperature,
      stage: newLead.stage,
      status: newLead.status || 'جديد',
      dealStatus: newLead.dealStatus || 'Open',
      decisionStatus: newLead.decisionStatus || 'Pending',
      quoteAmount,
      paidAmount,
      remainingAmount: Math.max(quoteAmount - paidAmount, 0),
      expectedCloseDate: newLead.expectedCloseDate || '',
      nextFollowUpDate: newLead.nextFollowUpDate || '',
      lastActivityAt: Date.now(),
      createdAt: Date.now()
    })

    setNewLead({
      company: '',
      phone: '',
      service: '',
      temperature: 'Warm',
      stage: 'Lead',
      status: 'جديد',
      dealStatus: 'Open',
      decisionStatus: 'Pending',
      quoteAmount: '',
      paidAmount: '',
      remainingAmount: '',
      expectedCloseDate: '',
      nextFollowUpDate: ''
    })
  }

  async function deleteLead(id) {
    await deleteDoc(doc(db, 'leads', id))
    if (selectedClient?.id === id) {
      setSelectedClient(null)
      setClientTasks([])
      setClientNotes([])
      setClientFiles([])
      setClientPayments([])
    }
  }

  async function updateLead(lead) {
    const ref = doc(db, 'leads', lead.id)
    const { id, ...payload } = lead

    const quoteAmount = Number(payload.quoteAmount || 0)
    const paidAmount = Number(payload.paidAmount || 0)

    await updateDoc(ref, {
      ...payload,
      quoteAmount,
      paidAmount,
      remainingAmount: Math.max(quoteAmount - paidAmount, 0),
      lastActivityAt: Date.now()
    })

    await recalculateClientFinancials(lead.id, quoteAmount)
    setEditingId(null)
  }

  function updateLeadField(id, field, value) {
    setLeads(
      leads.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    )
  }

  function updateStageLocally(id, stage) {
    setLeads(leads.map((item) => (item.id === id ? { ...item, stage } : item)))
  }

  function updateTempLocally(id, temperature) {
    setLeads(leads.map((item) => (item.id === id ? { ...item, temperature } : item)))
  }

  async function saveQuickStage(id, stage) {
    await updateDoc(doc(db, 'leads', id), {
      stage,
      lastActivityAt: Date.now()
    })
  }

  async function saveQuickTemp(id, temperature) {
    await updateDoc(doc(db, 'leads', id), {
      temperature,
      lastActivityAt: Date.now()
    })
  }

  async function addTask() {
    if (!selectedClient) return
    if (!taskForm.title || !taskForm.dueDate || !taskForm.owner) {
      alert('اكمل بيانات المهمة')
      return
    }

    await addDoc(collection(db, 'leads', selectedClient.id, 'tasks'), {
      title: taskForm.title,
      dueDate: taskForm.dueDate,
      owner: taskForm.owner,
      status: taskForm.status,
      createdAt: Date.now()
    })

    await touchClientActivity(selectedClient.id)

    setTaskForm({
      title: '',
      dueDate: '',
      owner: '',
      status: 'Pending'
    })
  }

  async function updateTaskStatus(taskId, status) {
    if (!selectedClient) return
    await updateDoc(doc(db, 'leads', selectedClient.id, 'tasks', taskId), { status })
    await touchClientActivity(selectedClient.id)
  }

  async function deleteTask(taskId) {
    if (!selectedClient) return
    await deleteDoc(doc(db, 'leads', selectedClient.id, 'tasks', taskId))
    await touchClientActivity(selectedClient.id)
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

    await touchClientActivity(selectedClient.id)
    setNoteText('')
  }

  async function deleteNote(noteId) {
    if (!selectedClient) return
    await deleteDoc(doc(db, 'leads', selectedClient.id, 'notes', noteId))
    await touchClientActivity(selectedClient.id)
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

    await touchClientActivity(selectedClient.id)
    setFileForm({
      type: 'عرض سعر',
      url: ''
    })
  }

  async function deleteFile(fileId) {
    if (!selectedClient) return
    await deleteDoc(doc(db, 'leads', selectedClient.id, 'files', fileId))
    await touchClientActivity(selectedClient.id)
  }

  async function addPayment() {
    if (!selectedClient) return
    if (!paymentForm.title || !paymentForm.amount || !paymentForm.date) {
      alert('اكمل بيانات الدفعة')
      return
    }

    await addDoc(collection(db, 'leads', selectedClient.id, 'payments'), {
      title: paymentForm.title,
      amount: Number(paymentForm.amount || 0),
      date: paymentForm.date,
      status: paymentForm.status,
      createdAt: Date.now()
    })

    await touchClientActivity(selectedClient.id)
    await recalculateClientFinancials(selectedClient.id)

    setPaymentForm({
      title: '',
      amount: '',
      date: '',
      status: 'Pending'
    })
  }

  async function updatePaymentStatus(paymentId, status) {
    if (!selectedClient) return
    await updateDoc(doc(db, 'leads', selectedClient.id, 'payments', paymentId), { status })
    await touchClientActivity(selectedClient.id)
    await recalculateClientFinancials(selectedClient.id)
  }

  async function deletePayment(paymentId) {
    if (!selectedClient) return
    await deleteDoc(doc(db, 'leads', selectedClient.id, 'payments', paymentId))
    await touchClientActivity(selectedClient.id)
    await recalculateClientFinancials(selectedClient.id)
  }

  function exportCsv() {
    const headers = [
      'اسم الشركة',
      'الجوال',
      'الخدمة',
      'المرحلة',
      'حالة الصفقة',
      'حالة القرار',
      'عرض السعر',
      'المدفوع',
      'المتبقي',
      'تاريخ التسجيل',
      'المتابعة القادمة'
    ]

    const rows = filteredLeads.map((lead) => [
      lead.company || '',
      lead.phone || '',
      lead.service || '',
      lead.stage || '',
      lead.dealStatus || '',
      lead.decisionStatus || '',
      Number(lead.quoteAmount || 0),
      Number(lead.paidAmount || 0),
      Number(lead.remainingAmount || 0),
      formatDate(lead.createdAt),
      lead.nextFollowUpDate || ''
    ])

    const csv = [headers, ...rows]
      .map((row) =>
        row
          .map((field) => `"${String(field).replace(/"/g, '""')}"`)
          .join(',')
      )
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
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
      const text = searchTerm.trim().toLowerCase()

      const matchesSearch =
        !text ||
        (lead.company || '').toLowerCase().includes(text) ||
        (lead.phone || '').toLowerCase().includes(text) ||
        (lead.status || '').toLowerCase().includes(text) ||
        (lead.stage || '').toLowerCase().includes(text) ||
        (lead.service || '').toLowerCase().includes(text)

      const matchesStage = stageFilter === 'All' || lead.stage === stageFilter
      const matchesTemp = tempFilter === 'All' || lead.temperature === tempFilter
      const matchesDeal = dealStatusFilter === 'All' || lead.dealStatus === dealStatusFilter

      return matchesSearch && matchesStage && matchesTemp && matchesDeal
    })
  }, [leads, searchTerm, stageFilter, tempFilter, dealStatusFilter])

  const allTasks = useMemo(() => {
    return clientTasks
  }, [clientTasks])

  const total = leads.length
  const filteredTotal = filteredLeads.length
  const hotCount = leads.filter((l) => l.temperature === 'Hot').length
  const warmCount = leads.filter((l) => l.temperature === 'Warm').length
  const wonCount = leads.filter((l) => l.stage === 'Won' || l.dealStatus === 'Won').length
  const lostCount = leads.filter((l) => l.dealStatus === 'Lost').length
  const contactedCount = leads.filter((l) => l.stage === 'Contacted').length
  const meetingCount = leads.filter((l) => l.stage === 'Meeting').length
  const proposalCount = leads.filter((l) => l.stage === 'Proposal').length
  const totalDealValue = leads.reduce((sum, item) => sum + Number(item.quoteAmount || 0), 0)
  const totalWonValue = leads
    .filter((item) => item.dealStatus === 'Won')
    .reduce((sum, item) => sum + Number(item.quoteAmount || 0), 0)

  const todayTasksCount = allTasks.filter((task) => isTaskToday(task)).length
  const overdueTasksCount = allTasks.filter((task) => isTaskOverdue(task)).length
  const doneTasksCount = allTasks.filter((task) => task.status === 'Done').length

  const selectedClientPaid = Number(selectedClient?.paidAmount || 0)
  const selectedClientQuote = Number(selectedClient?.quoteAmount || 0)
  const selectedClientRemaining = Number(selectedClient?.remainingAmount || 0)

  if (loading) {
    return (
      <div className="container" dir="rtl">
        <h1>🚀 Tamakan CRM</h1>
        <p>جاري تحميل البيانات...</p>
      </div>
    )
  }

  return (
    <div className="container" dir="rtl">
      <h1>🚀 Tamakan CRM</h1>

      <div style={{ display: 'grid', gap: '12px', marginBottom: '20px' }}>
        <input
          placeholder="بحث باسم الشركة أو الجوال أو الخدمة أو الحالة أو المرحلة"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '10px',
            border: '1px solid rgba(255,255,255,0.12)',
            background: '#12264d',
            color: 'white'
          }}
        />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '10px' }}>
          <select value={stageFilter} onChange={(e) => setStageFilter(e.target.value)}>
            <option value="All">كل المراحل</option>
            {STAGES.map((stage) => (
              <option key={stage} value={stage}>
                {stage}
              </option>
            ))}
          </select>

          <select value={tempFilter} onChange={(e) => setTempFilter(e.target.value)}>
            <option value="All">كل الدرجات</option>
            <option value="Hot">Hot</option>
            <option value="Warm">Warm</option>
          </select>

          <select value={dealStatusFilter} onChange={(e) => setDealStatusFilter(e.target.value)}>
            <option value="All">كل حالات الصفقة</option>
            {DEAL_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>

          <button className="primary-btn" onClick={exportCsv}>
            ⬇️ تصدير CSV
          </button>
        </div>
      </div>

      <div className="stats-grid stats-grid-extended">
        <div className="stat-card">
          <span>📊 إجمالي العملاء</span>
          <strong>{total}</strong>
        </div>
        <div className="stat-card">
          <span>🔎 نتائج البحث</span>
          <strong>{filteredTotal}</strong>
        </div>
        <div className="stat-card">
          <span>🔥 Hot</span>
          <strong>{hotCount}</strong>
        </div>
        <div className="stat-card">
          <span>🟡 Warm</span>
          <strong>{warmCount}</strong>
        </div>
        <div className="stat-card">
          <span>☎️ Contacted</span>
          <strong>{contactedCount}</strong>
        </div>
        <div className="stat-card">
          <span>🤝 Meeting</span>
          <strong>{meetingCount}</strong>
        </div>
        <div className="stat-card">
          <span>📄 Proposal</span>
          <strong>{proposalCount}</strong>
        </div>
        <div className="stat-card">
          <span>💰 Won</span>
          <strong>{wonCount}</strong>
        </div>
        <div className="stat-card">
          <span>❌ Lost</span>
          <strong>{lostCount}</strong>
        </div>
        <div className="stat-card">
          <span>💵 قيمة الصفقات</span>
          <strong>{formatMoney(totalDealValue)}</strong>
        </div>
        <div className="stat-card">
          <span>✅ أرباح محققة</span>
          <strong>{formatMoney(totalWonValue)}</strong>
        </div>
        <div className="stat-card">
          <span>📅 مهام اليوم</span>
          <strong>{todayTasksCount}</strong>
        </div>
        <div className="stat-card">
          <span>🚨 مهام متأخرة</span>
          <strong>{overdueTasksCount}</strong>
        </div>
        <div className="stat-card">
          <span>✔️ مهام مكتملة</span>
          <strong>{doneTasksCount}</strong>
        </div>
      </div>

      <div className="form-box">
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
          placeholder="المتابعة القادمة"
          type="date"
          value={newLead.nextFollowUpDate}
          onChange={(e) => setNewLead({ ...newLead, nextFollowUpDate: e.target.value })}
        />

        <select
          value={newLead.temperature}
          onChange={(e) => setNewLead({ ...newLead, temperature: e.target.value })}
        >
          <option value="Hot">Hot</option>
          <option value="Warm">Warm</option>
        </select>

        <select
          value={newLead.stage}
          onChange={(e) => setNewLead({ ...newLead, stage: e.target.value })}
        >
          {STAGES.map((stage) => (
            <option key={stage} value={stage}>
              {stage}
            </option>
          ))}
        </select>

        <select
          value={newLead.dealStatus}
          onChange={(e) => setNewLead({ ...newLead, dealStatus: e.target.value })}
        >
          {DEAL_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>

        <select
          value={newLead.decisionStatus}
          onChange={(e) => setNewLead({ ...newLead, decisionStatus: e.target.value })}
        >
          {DECISION_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>

        <button className="primary-btn" onClick={addLead}>
          ➕ إضافة
        </button>
      </div>

      {selectedClient && (
        <div
          style={{
            background: '#12264d',
            padding: '20px',
            borderRadius: '12px',
            marginBottom: '20px',
            border: '1px solid rgba(255,255,255,0.08)'
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '14px',
              gap: '12px',
              flexWrap: 'wrap'
            }}
          >
            <h2 style={{ margin: 0 }}>تفاصيل العميل</h2>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <a
                href={`https://wa.me/${selectedClient.phone}?text=${buildWhatsappMessage(selectedClient)}`}
                target="_blank"
                rel="noreferrer"
                className="wa-btn"
              >
                واتساب ذكي
              </a>

              <button
                onClick={() => setSelectedClient(null)}
                style={{
                  background: '#ff5c5c',
                  border: 'none',
                  color: 'white',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                إغلاق
              </button>
            </div>
          </div>

          <div style={{ lineHeight: '2', marginBottom: '20px' }}>
            <div><strong>اسم الشركة:</strong> {selectedClient.company}</div>
            <div><strong>رقم الجوال:</strong> {selectedClient.phone}</div>
            <div><strong>الخدمة:</strong> {selectedClient.service || '-'}</div>
            <div><strong>الحالة:</strong> {selectedClient.status}</div>
            <div><strong>المرحلة:</strong> {selectedClient.stage}</div>
            <div><strong>درجة العميل:</strong> {selectedClient.temperature}</div>
            <div><strong>حالة الصفقة:</strong> {getDealLabel(selectedClient.dealStatus)}</div>
            <div><strong>حالة القرار:</strong> {getDecisionLabel(selectedClient.decisionStatus)}</div>
            <div><strong>تاريخ التسجيل:</strong> {formatDate(selectedClient.createdAt)}</div>
            <div><strong>آخر نشاط:</strong> {formatDate(selectedClient.lastActivityAt)}</div>
            <div><strong>المتابعة القادمة:</strong> {selectedClient.nextFollowUpDate || '-'}</div>
            <div><strong>الإغلاق المتوقع:</strong> {selectedClient.expectedCloseDate || '-'}</div>
          </div>

          <div
            style={{
              background: '#0f2347',
              padding: '16px',
              borderRadius: '10px',
              marginBottom: '16px'
            }}
          >
            <h3 style={{ marginTop: 0 }}>التقرير المالي</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '10px' }}>
              <div className="stat-card">
                <span>عرض السعر</span>
                <strong>{formatMoney(selectedClientQuote)}</strong>
              </div>
              <div className="stat-card">
                <span>المدفوع</span>
                <strong>{formatMoney(selectedClientPaid)}</strong>
              </div>
              <div className="stat-card">
                <span>المتبقي</span>
                <strong>{formatMoney(selectedClientRemaining)}</strong>
              </div>
              <div className="stat-card">
                <span>عدد المهام</span>
                <strong>{clientTasks.length}</strong>
              </div>
              <div className="stat-card">
                <span>عدد الملاحظات</span>
                <strong>{clientNotes.length}</strong>
              </div>
              <div className="stat-card">
                <span>عدد الملفات</span>
                <strong>{clientFiles.length}</strong>
              </div>
            </div>
          </div>

          <div
            style={{
              marginTop: '20px',
              background: '#0f2347',
              padding: '16px',
              borderRadius: '10px',
              marginBottom: '16px'
            }}
          >
            <h3 style={{ marginTop: 0 }}>المهام والمتابعات</h3>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '10px',
                marginBottom: '14px'
              }}
            >
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
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={addTask}
              style={{
                background: '#1d4ed8',
                border: 'none',
                color: 'white',
                padding: '10px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
                marginBottom: '16px'
              }}
            >
              ➕ إضافة مهمة
            </button>

            <div style={{ display: 'grid', gap: '10px' }}>
              {clientTasks.length === 0 ? (
                <div style={{ opacity: 0.7 }}>لا توجد مهام لهذا العميل</div>
              ) : (
                clientTasks.map((task) => (
                  <div
                    key={task.id}
                    style={{
                      background: '#16315f',
                      padding: '12px',
                      borderRadius: '8px',
                      border: `1px solid ${getTaskStatusColor(task)}`
                    }}
                  >
                    <div><strong>المهمة:</strong> {task.title}</div>
                    <div><strong>التاريخ:</strong> {task.dueDate}</div>
                    <div><strong>المسؤول:</strong> {task.owner}</div>
                    <div><strong>الحالة:</strong> {task.status}</div>

                    <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
                      <select
                        value={task.status}
                        onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                      >
                        {TASK_STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>

                      <button onClick={() => deleteTask(task.id)}>🗑️ حذف</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div
            style={{
              marginTop: '20px',
              background: '#0f2347',
              padding: '16px',
              borderRadius: '10px',
              marginBottom: '16px'
            }}
          >
            <h3 style={{ marginTop: 0 }}>الملاحظات</h3>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' }}>
              <input
                placeholder="اكتب ملاحظة"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                style={{ flex: 1 }}
              />
              <button onClick={addNote}>➕ إضافة ملاحظة</button>
            </div>

            <div style={{ display: 'grid', gap: '10px' }}>
              {clientNotes.length === 0 ? (
                <div style={{ opacity: 0.7 }}>لا توجد ملاحظات</div>
              ) : (
                clientNotes.map((note) => (
                  <div
                    key={note.id}
                    style={{
                      background: '#16315f',
                      padding: '12px',
                      borderRadius: '8px'
                    }}
                  >
                    <div>{note.text}</div>
                    <div style={{ opacity: 0.7, marginTop: '6px', fontSize: '13px' }}>
                      {formatDate(note.createdAt)}
                    </div>
                    <button style={{ marginTop: '8px' }} onClick={() => deleteNote(note.id)}>
                      🗑️ حذف
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div
            style={{
              marginTop: '20px',
              background: '#0f2347',
              padding: '16px',
              borderRadius: '10px',
              marginBottom: '16px'
            }}
          >
            <h3 style={{ marginTop: 0 }}>الملفات</h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '10px', marginBottom: '12px' }}>
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

              <button onClick={addFile}>➕ إضافة ملف</button>
            </div>

            <div style={{ display: 'grid', gap: '10px' }}>
              {clientFiles.length === 0 ? (
                <div style={{ opacity: 0.7 }}>لا توجد ملفات</div>
              ) : (
                clientFiles.map((file) => (
                  <div
                    key={file.id}
                    style={{
                      background: '#16315f',
                      padding: '12px',
                      borderRadius: '8px'
                    }}
                  >
                    <div><strong>النوع:</strong> {file.type}</div>
                    <div style={{ marginTop: '8px' }}>
                      <a href={file.url} target="_blank" rel="noreferrer">
                        فتح الملف
                      </a>
                    </div>
                    <div style={{ opacity: 0.7, marginTop: '6px', fontSize: '13px' }}>
                      {formatDate(file.createdAt)}
                    </div>
                    <button style={{ marginTop: '8px' }} onClick={() => deleteFile(file.id)}>
                      🗑️ حذف
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div
            style={{
              marginTop: '20px',
              background: '#0f2347',
              padding: '16px',
              borderRadius: '10px'
            }}
          >
            <h3 style={{ marginTop: 0 }}>الدفعات</h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '10px', marginBottom: '12px' }}>
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
                    {status}
                  </option>
                ))}
              </select>

              <button onClick={addPayment}>➕ إضافة دفعة</button>
            </div>

            <div style={{ display: 'grid', gap: '10px' }}>
              {clientPayments.length === 0 ? (
                <div style={{ opacity: 0.7 }}>لا توجد دفعات</div>
              ) : (
                clientPayments.map((payment) => (
                  <div
                    key={payment.id}
                    style={{
                      background: '#16315f',
                      padding: '12px',
                      borderRadius: '8px'
                    }}
                  >
                    <div><strong>اسم الدفعة:</strong> {payment.title}</div>
                    <div><strong>المبلغ:</strong> {formatMoney(payment.amount)} ريال</div>
                    <div><strong>التاريخ:</strong> {payment.date}</div>
                    <div><strong>الحالة:</strong> {payment.status}</div>

                    <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
                      <select
                        value={payment.status}
                        onChange={(e) => updatePaymentStatus(payment.id, e.target.value)}
                      >
                        {PAYMENT_STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>

                      <button onClick={() => deletePayment(payment.id)}>🗑️ حذف</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <div className="pipeline">
        {STAGES.map((stage) => (
          <div key={stage} className="pipe-col">
            <h3>{stage}</h3>

            {filteredLeads
              .filter((item) => item.stage === stage)
              .map((lead) => (
                <div
                  key={lead.id}
                  className="card"
                  onClick={() => setSelectedClient(lead)}
                  style={{
                    cursor: 'pointer',
                    borderLeft: lead.temperature === 'Hot' ? '4px solid #dc2626' : '4px solid #ca8a04'
                  }}
                >
                  {editingId === lead.id ? (
                    <>
                      <input
                        value={lead.company}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => updateLeadField(lead.id, 'company', e.target.value)}
                      />

                      <input
                        value={lead.phone}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => updateLeadField(lead.id, 'phone', e.target.value)}
                      />

                      <input
                        value={lead.service || ''}
                        placeholder="الخدمة"
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => updateLeadField(lead.id, 'service', e.target.value)}
                      />

                      <input
                        type="number"
                        value={lead.quoteAmount || 0}
                        placeholder="عرض السعر"
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => updateLeadField(lead.id, 'quoteAmount', e.target.value)}
                      />

                      <input
                        type="date"
                        value={lead.nextFollowUpDate || ''}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => updateLeadField(lead.id, 'nextFollowUpDate', e.target.value)}
                      />

                      <select
                        value={lead.dealStatus || 'Open'}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => updateLeadField(lead.id, 'dealStatus', e.target.value)}
                      >
                        {DEAL_STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>

                      <select
                        value={lead.decisionStatus || 'Pending'}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => updateLeadField(lead.id, 'decisionStatus', e.target.value)}
                      >
                        {DECISION_STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>

                      <div className="actions">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            updateLead(lead)
                          }}
                        >
                          💾
                        </button>
                        <button
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
                      <b>{lead.company}</b>

                      <div style={{ marginTop: '8px', fontSize: '13px', opacity: 0.9 }}>
                        <strong>{lead.stage}</strong>
                      </div>

                      <div style={{ marginTop: '8px' }}>الخدمة: {lead.service || '-'}</div>
                      <div>حالة الصفقة: {getDealLabel(lead.dealStatus)}</div>
                      <div>حالة القرار: {getDecisionLabel(lead.decisionStatus)}</div>
                      <div>عرض السعر: {formatMoney(lead.quoteAmount)} ريال</div>
                      <div>المدفوع: {formatMoney(lead.paidAmount)} ريال</div>
                      <div>المتبقي: {formatMoney(lead.remainingAmount)} ريال</div>

                      <div style={{ marginTop: '8px', fontSize: '13px', opacity: 0.8 }}>
                        📅 {formatDate(lead.createdAt)}
                      </div>

                      <div style={{ marginTop: '8px', fontSize: '13px', opacity: 0.8 }}>
                        📌 متابعة: {lead.nextFollowUpDate || '-'}
                      </div>

                      <div style={{ marginTop: '8px' }}>
                        <a
                          href={`https://wa.me/${lead.phone}?text=${buildWhatsappMessage(lead)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="wa-btn"
                          onClick={(e) => e.stopPropagation()}
                        >
                          واتساب ذكي
                        </a>
                      </div>

                      <div className="actions">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditingId(lead.id)
                          }}
                        >
                          ✏️
                        </button>
                        <button
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

                  <div style={{ marginTop: '10px' }}>
                    <select
                      value={lead.stage}
                      onClick={(e) => e.stopPropagation()}
                      onChange={async (e) => {
                        const value = e.target.value
                        updateStageLocally(lead.id, value)
                        await saveQuickStage(lead.id, value)
                      }}
                    >
                      {STAGES.map((stageOption) => (
                        <option key={stageOption} value={stageOption}>
                          {stageOption}
                        </option>
                      ))}
                    </select>

                    <select
                      value={lead.temperature}
                      onClick={(e) => e.stopPropagation()}
                      onChange={async (e) => {
                        const value = e.target.value
                        updateTempLocally(lead.id, value)
                        await saveQuickTemp(lead.id, value)
                      }}
                      style={{ marginRight: '8px' }}
                    >
                      <option value="Hot">Hot</option>
                      <option value="Warm">Warm</option>
                    </select>
                  </div>
                </div>
              ))}
          </div>
        ))}
      </div>
    </div>
  )
}
