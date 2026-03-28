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
  getDocs
} from 'firebase/firestore'

import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from 'firebase/storage'

const firebaseConfig = {
  apiKey: "AIzaSyB53c1aa_CGtDzE0JnUQjbzntYVRBQmx14",
  authDomain: "tamakan-crm.firebaseapp.com",
  projectId: "tamakan-crm",
  storageBucket: "tamakan-crm.firebasestorage.app",
  messagingSenderId: "180077608637",
  appId: "1:180077608637:web:bd09d667e20ed830f541d4"
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)
const storage = getStorage(app)

const stages = ['Lead', 'Contacted', 'Meeting', 'Proposal', 'Won']
const serviceOptions = [
  'برنامج بصمة',
  'OPSS360',
  'نظام CRM',
  'موقع إلكتروني',
  'تطبيق جوال',
  'متجر إلكتروني',
  'نظام داخلي للشركات',
  'نقاط بيع POS',
  'دعم فني',
  'خدمات أخرى'
]

const sampleLead = {
  company: 'تمكن لتقنية المعلومات',
  phone: '966553909589',
  email: 'info@tamakan.com.sa',
  temperature: 'Hot',
  stage: 'Lead',
  status: 'جديد',
  serviceType: 'برنامج بصمة',
  needDescription: 'العميل يحتاج نظام حضور وانصراف وربط تقارير الموظفين',
  offerDate: '',
  offerAmount: 0,
  paidAmount: 0,
  contractNumber: '',
  contractDate: '',
  contractSigned: false,
  closed: false,
  comments: [
    {
      text: 'تمت إضافة العميل إلى النظام',
      createdAt: new Date().toISOString()
    }
  ],
  files: []
}

const emptyLead = {
  company: '',
  phone: '',
  email: '',
  temperature: 'Warm',
  stage: 'Lead',
  status: 'جديد',
  serviceType: 'برنامج بصمة',
  needDescription: '',
  offerDate: '',
  offerAmount: '',
  paidAmount: '',
  contractNumber: '',
  contractDate: '',
  contractSigned: false,
  closed: false,
  comments: [],
  files: []
}

function toNumber(value) {
  const num = Number(value || 0)
  return Number.isNaN(num) ? 0 : num
}

function getPendingAmount(lead) {
  const offer = toNumber(lead.offerAmount)
  const paid = toNumber(lead.paidAmount)
  const pending = offer - paid
  return pending > 0 ? pending : 0
}

function formatMoney(value) {
  return new Intl.NumberFormat('en-US').format(toNumber(value))
}

export default function App() {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

  const [newLead, setNewLead] = useState(emptyLead)
  const [selectedLeadId, setSelectedLeadId] = useState(null)
  const [detailComment, setDetailComment] = useState('')

  useEffect(() => {
    async function seedIfEmpty() {
      const leadsRef = collection(db, 'leads')
      const snapshot = await getDocs(leadsRef)

      if (snapshot.empty) {
        await addDoc(leadsRef, sampleLead)
      }
    }

    let unsubscribeRef

    seedIfEmpty().then(() => {
      unsubscribeRef = onSnapshot(collection(db, 'leads'), (snapshot) => {
        const data = snapshot.docs.map((item) => ({
          id: item.id,
          ...item.data()
        }))
        setLeads(data)
        setLoading(false)
      })
    })

    return () => {
      if (unsubscribeRef) unsubscribeRef()
    }
  }, [])

  const selectedLead = useMemo(
    () => leads.find((item) => item.id === selectedLeadId) || null,
    [leads, selectedLeadId]
  )

  const stats = useMemo(() => {
    const wonLeads = leads.filter((l) => l.stage === 'Won' || l.closed)
    const totalWonAmount = wonLeads.reduce(
      (sum, item) => sum + toNumber(item.offerAmount),
      0
    )
    const totalPendingAmount = leads.reduce(
      (sum, item) => sum + getPendingAmount(item),
      0
    )

    return {
      total: leads.length,
      hot: leads.filter((l) => l.temperature === 'Hot').length,
      warm: leads.filter((l) => l.temperature === 'Warm').length,
      won: wonLeads.length,
      wonAmount: totalWonAmount,
      pendingAmount: totalPendingAmount
    }
  }, [leads])

  async function addLead() {
    if (!newLead.company || !newLead.phone) {
      alert('اكمل اسم الشركة ورقم الجوال')
      return
    }

    await addDoc(collection(db, 'leads'), {
      ...newLead,
      offerAmount: toNumber(newLead.offerAmount),
      paidAmount: toNumber(newLead.paidAmount),
      closed: newLead.stage === 'Won' ? true : Boolean(newLead.closed),
      comments: [
        {
          text: 'تم إضافة العميل',
          createdAt: new Date().toISOString()
        }
      ],
      files: []
    })

    setNewLead(emptyLead)
  }

  async function deleteLead(id) {
    const ok = window.confirm('هل أنت متأكد من حذف العميل؟')
    if (!ok) return

    await deleteDoc(doc(db, 'leads', id))

    if (selectedLeadId === id) {
      setSelectedLeadId(null)
    }
  }

  async function saveLeadDetails() {
    if (!selectedLead) return

    const { id, ...payload } = selectedLead

    await updateDoc(doc(db, 'leads', id), {
      ...payload,
      offerAmount: toNumber(payload.offerAmount),
      paidAmount: toNumber(payload.paidAmount),
      closed: payload.stage === 'Won' || Boolean(payload.closed)
    })
  }

  async function updateStage(id, stage) {
    const lead = leads.find((item) => item.id === id)
    if (!lead) return

    await updateDoc(doc(db, 'leads', id), {
      stage,
      closed: stage === 'Won' ? true : Boolean(lead.closed)
    })
  }

  function patchSelectedLead(field, value) {
    setLeads((prev) =>
      prev.map((item) =>
        item.id === selectedLeadId ? { ...item, [field]: value } : item
      )
    )
  }

  async function addComment() {
    if (!selectedLead || !detailComment.trim()) return

    const nextComments = [
      ...(selectedLead.comments || []),
      {
        text: detailComment.trim(),
        createdAt: new Date().toISOString()
      }
    ]

    await updateDoc(doc(db, 'leads', selectedLead.id), {
      comments: nextComments
    })

    setDetailComment('')
  }

  async function uploadLeadFile(file) {
    if (!selectedLead || !file) return

    try {
      setUploading(true)

      const filePath = `leads/${selectedLead.id}/${Date.now()}-${file.name}`
      const storageRef = ref(storage, filePath)

      await uploadBytes(storageRef, file)
      const url = await getDownloadURL(storageRef)

      const nextFiles = [
        ...(selectedLead.files || []),
        {
          name: file.name,
          url,
          path: filePath,
          uploadedAt: new Date().toISOString()
        }
      ]

      await updateDoc(doc(db, 'leads', selectedLead.id), {
        files: nextFiles
      })
    } finally {
      setUploading(false)
    }
  }

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

      <div className="stats-grid stats-grid-extended">
        <div className="stat-card">
          <span>📊 العملاء</span>
          <strong>{stats.total}</strong>
        </div>

        <div className="stat-card">
          <span>🔥 Hot</span>
          <strong>{stats.hot}</strong>
        </div>

        <div className="stat-card">
          <span>🟡 Warm</span>
          <strong>{stats.warm}</strong>
        </div>

        <div className="stat-card">
          <span>💰 الصفقات المغلقة</span>
          <strong>{stats.won}</strong>
        </div>

        <div className="stat-card">
          <span>💵 إجمالي العقود</span>
          <strong>{formatMoney(stats.wonAmount)}</strong>
        </div>

        <div className="stat-card">
          <span>⏳ المبلغ المعلّق</span>
          <strong>{formatMoney(stats.pendingAmount)}</strong>
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
          placeholder="الإيميل"
          value={newLead.email}
          onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
        />

        <select
          value={newLead.serviceType}
          onChange={(e) => setNewLead({ ...newLead, serviceType: e.target.value })}
        >
          {serviceOptions.map((service) => (
            <option key={service} value={service}>
              {service}
            </option>
          ))}
        </select>

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
          {stages.map((stage) => (
            <option key={stage} value={stage}>
              {stage}
            </option>
          ))}
        </select>

        <input
          placeholder="مبلغ عرض السعر"
          value={newLead.offerAmount}
          onChange={(e) => setNewLead({ ...newLead, offerAmount: e.target.value })}
        />

        <button className="primary-btn" onClick={addLead}>
          ➕ إضافة
        </button>
      </div>

      <div className="pipeline">
        {stages.map((stage) => (
          <div key={stage} className="pipe-col">
            <h3>{stage}</h3>

            {leads
              .filter((item) => item.stage === stage)
              .map((lead) => {
                const pendingAmount = getPendingAmount(lead)

                return (
                  <div
                    key={lead.id}
                    className="card clickable-card"
                    onClick={() => setSelectedLeadId(lead.id)}
                  >
                    <div className="card-top">
                      <b>{lead.company}</b>
                      {lead.closed || lead.stage === 'Won' ? (
                        <span className="closed-badge">✅ مغلقة</span>
                      ) : null}
                    </div>

                    <div className="mini-line">{lead.serviceType || 'بدون خدمة محددة'}</div>
                    <div className="mini-line">{lead.phone}</div>

                    <div className="mini-tags">
                      <span className={lead.temperature === 'Hot' ? 'danger' : 'warn'}>
                        {lead.temperature}
                      </span>
                      <span className="stage-pill">{lead.stage}</span>
                    </div>

                    {toNumber(lead.offerAmount) > 0 ? (
                      <div className="deal-box">
                        عرض السعر: {formatMoney(lead.offerAmount)}
                      </div>
                    ) : null}

                    {pendingAmount > 0 ? (
                      <div className="pending-box">
                        معلّق: {formatMoney(pendingAmount)}
                      </div>
                    ) : null}

                    <div className="actions">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteLead(lead.id)
                        }}
                      >
                        🗑️
                      </button>

                      <select
                        value={lead.stage}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => updateStage(lead.id, e.target.value)}
                      >
                        {stages.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )
              })}
          </div>
        ))}
      </div>

      {selectedLead ? (
        <div className="details-overlay" onClick={() => setSelectedLeadId(null)}>
          <div className="details-panel" onClick={(e) => e.stopPropagation()}>
            <div className="details-header">
              <h2>تفاصيل العميل</h2>
              <button
                className="close-btn"
                onClick={() => setSelectedLeadId(null)}
              >
                ✖
              </button>
            </div>

            <div className="details-grid">
              <label>
                اسم الشركة
                <input
                  value={selectedLead.company || ''}
                  onChange={(e) => patchSelectedLead('company', e.target.value)}
                />
              </label>

              <label>
                رقم الجوال
                <input
                  value={selectedLead.phone || ''}
                  onChange={(e) => patchSelectedLead('phone', e.target.value)}
                />
              </label>

              <label>
                الإيميل
                <input
                  value={selectedLead.email || ''}
                  onChange={(e) => patchSelectedLead('email', e.target.value)}
                />
              </label>

              <label>
                نوع الخدمة
                <select
                  value={selectedLead.serviceType || serviceOptions[0]}
                  onChange={(e) => patchSelectedLead('serviceType', e.target.value)}
                >
                  {serviceOptions.map((service) => (
                    <option key={service} value={service}>
                      {service}
                    </option>
                  ))}
                </select>
              </label>

              <label className="full-width">
                احتياج العميل
                <textarea
                  value={selectedLead.needDescription || ''}
                  onChange={(e) => patchSelectedLead('needDescription', e.target.value)}
                />
              </label>

              <label>
                الحالة
                <input
                  value={selectedLead.status || ''}
                  onChange={(e) => patchSelectedLead('status', e.target.value)}
                />
              </label>

              <label>
                الحرارة
                <select
                  value={selectedLead.temperature || 'Warm'}
                  onChange={(e) => patchSelectedLead('temperature', e.target.value)}
                >
                  <option value="Hot">Hot</option>
                  <option value="Warm">Warm</option>
                </select>
              </label>

              <label>
                المرحلة
                <select
                  value={selectedLead.stage || 'Lead'}
                  onChange={(e) => patchSelectedLead('stage', e.target.value)}
                >
                  {stages.map((stage) => (
                    <option key={stage} value={stage}>
                      {stage}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                تاريخ عرض السعر
                <input
                  type="date"
                  value={selectedLead.offerDate || ''}
                  onChange={(e) => patchSelectedLead('offerDate', e.target.value)}
                />
              </label>

              <label>
                مبلغ عرض السعر
                <input
                  value={selectedLead.offerAmount || ''}
                  onChange={(e) => patchSelectedLead('offerAmount', e.target.value)}
                />
              </label>

              <label>
                المبلغ المدفوع
                <input
                  value={selectedLead.paidAmount || ''}
                  onChange={(e) => patchSelectedLead('paidAmount', e.target.value)}
                />
              </label>

              <label>
                المبلغ المعلّق
                <input
                  value={getPendingAmount(selectedLead)}
                  readOnly
                />
              </label>

              <label>
                رقم العقد
                <input
                  value={selectedLead.contractNumber || ''}
                  onChange={(e) => patchSelectedLead('contractNumber', e.target.value)}
                />
              </label>

              <label>
                تاريخ العقد
                <input
                  type="date"
                  value={selectedLead.contractDate || ''}
                  onChange={(e) => patchSelectedLead('contractDate', e.target.value)}
                />
              </label>

              <label className="checkbox-line">
                <input
                  type="checkbox"
                  checked={Boolean(selectedLead.closed || selectedLead.stage === 'Won')}
                  onChange={(e) => patchSelectedLead('closed', e.target.checked)}
                />
                تم إغلاق الصفقة
              </label>

              <label className="checkbox-line">
                <input
                  type="checkbox"
                  checked={Boolean(selectedLead.contractSigned)}
                  onChange={(e) => patchSelectedLead('contractSigned', e.target.checked)}
                />
                تم توقيع العقد
              </label>
            </div>

            <div className="details-actions">
              <a
                href={`https://wa.me/${selectedLead.phone}`}
                target="_blank"
                rel="noreferrer"
                className="wa-btn"
              >
                واتساب
              </a>

              <button className="primary-btn" onClick={saveLeadDetails}>
                💾 حفظ التعديلات
              </button>
            </div>

            <div className="section-box">
              <h3>ملخص العرض والعقد</h3>

              <div className="summary-grid">
                <div className="summary-item">
                  <span>نوع الخدمة</span>
                  <strong>{selectedLead.serviceType || '-'}</strong>
                </div>

                <div className="summary-item">
                  <span>تاريخ العرض</span>
                  <strong>{selectedLead.offerDate || '-'}</strong>
                </div>

                <div className="summary-item">
                  <span>مبلغ العرض</span>
                  <strong>{formatMoney(selectedLead.offerAmount)}</strong>
                </div>

                <div className="summary-item">
                  <span>المدفوع</span>
                  <strong>{formatMoney(selectedLead.paidAmount)}</strong>
                </div>

                <div className="summary-item">
                  <span>المعلّق</span>
                  <strong>{formatMoney(getPendingAmount(selectedLead))}</strong>
                </div>

                <div className="summary-item">
                  <span>رقم العقد</span>
                  <strong>{selectedLead.contractNumber || '-'}</strong>
                </div>
              </div>
            </div>

            <div className="section-box">
              <h3>التعليقات والملاحظات</h3>

              <div className="comment-form">
                <textarea
                  placeholder="مثال: تم عمل مقابلة وتقديم عرض السعر"
                  value={detailComment}
                  onChange={(e) => setDetailComment(e.target.value)}
                />
                <button className="primary-btn" onClick={addComment}>
                  إضافة تعليق
                </button>
              </div>

              <div className="comment-list">
                {(selectedLead.comments || []).length === 0 ? (
                  <p className="muted-text">لا توجد تعليقات بعد</p>
                ) : (
                  selectedLead.comments.map((comment, index) => (
                    <div className="comment-item" key={index}>
                      <div>{comment.text}</div>
                      <small>{new Date(comment.createdAt).toLocaleString()}</small>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="section-box">
              <h3>ملفات العميل</h3>

              <div className="upload-row">
                <input
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) uploadLeadFile(file)
                  }}
                />
                {uploading ? <span className="muted-text">جاري الرفع...</span> : null}
              </div>

              <div className="files-list">
                {(selectedLead.files || []).length === 0 ? (
                  <p className="muted-text">لا توجد ملفات مرفوعة</p>
                ) : (
                  selectedLead.files.map((file, index) => (
                    <a
                      key={index}
                      href={file.url}
                      target="_blank"
                      rel="noreferrer"
                      className="file-link"
                    >
                      📎 {file.name}
                    </a>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
