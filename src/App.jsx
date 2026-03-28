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

const sampleLead = {
  company: 'تمكن لتقنية المعلومات',
  phone: '966553909589',
  email: 'info@tamakan.com.sa',
  temperature: 'Hot',
  stage: 'Lead',
  status: 'جديد',
  dealAmount: 0,
  closed: false,
  comments: [
    {
      text: 'تم إنشاء العميل في النظام',
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
  dealAmount: '',
  closed: false,
  comments: [],
  files: []
}

const stages = ['Lead', 'Contacted', 'Meeting', 'Proposal', 'Won']

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
      (sum, item) => sum + Number(item.dealAmount || 0),
      0
    )

    return {
      total: leads.length,
      hot: leads.filter((l) => l.temperature === 'Hot').length,
      warm: leads.filter((l) => l.temperature === 'Warm').length,
      won: wonLeads.length,
      wonAmount: totalWonAmount
    }
  }, [leads])

  async function addLead() {
    if (!newLead.company || !newLead.phone) {
      alert('اكمل اسم الشركة ورقم الجوال')
      return
    }

    await addDoc(collection(db, 'leads'), {
      ...newLead,
      dealAmount: Number(newLead.dealAmount || 0),
      closed: newLead.stage === 'Won',
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
      dealAmount: Number(payload.dealAmount || 0),
      closed: payload.stage === 'Won' || Boolean(payload.closed)
    })
  }

  async function updateStage(id, stage) {
    const lead = leads.find((item) => item.id === id)
    if (!lead) return

    await updateDoc(doc(db, 'leads', id), {
      stage,
      closed: stage === 'Won' ? true : lead.closed
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

  function formatMoney(value) {
    return new Intl.NumberFormat('en-US').format(Number(value || 0))
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
          <span>💵 إجمالي المبالغ</span>
          <strong>{formatMoney(stats.wonAmount)}</strong>
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
          value={newLead.temperature}
          onChange={(e) =>
            setNewLead({ ...newLead, temperature: e.target.value })
          }
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
          placeholder="مبلغ الصفقة"
          value={newLead.dealAmount}
          onChange={(e) =>
            setNewLead({ ...newLead, dealAmount: e.target.value })
          }
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
              .map((lead) => (
                <div
                  key={lead.id}
                  className="card clickable-card"
                  onClick={() => setSelectedLeadId(lead.id)}
                >
                  <div className="card-top">
                    <b>{lead.company}</b>
                    {lead.closed || lead.stage === 'Won' ? (
                      <span className="closed-badge">✅ صفقة مغلقة</span>
                    ) : null}
                  </div>

                  <div className="mini-line">{lead.phone}</div>

                  <div className="mini-line">
                    {lead.email || 'لا يوجد إيميل'}
                  </div>

                  <div className="mini-tags">
                    <span className={lead.temperature === 'Hot' ? 'danger' : 'warn'}>
                      {lead.temperature}
                    </span>
                    <span className="stage-pill">{lead.stage}</span>
                  </div>

                  {(lead.closed || lead.stage === 'Won') && Number(lead.dealAmount) > 0 ? (
                    <div className="deal-box">
                      المبلغ: {formatMoney(lead.dealAmount)}
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
              ))}
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
                مبلغ الصفقة
                <input
                  value={selectedLead.dealAmount || ''}
                  onChange={(e) => patchSelectedLead('dealAmount', e.target.value)}
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
                      <small>
                        {new Date(comment.createdAt).toLocaleString()}
                      </small>
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
