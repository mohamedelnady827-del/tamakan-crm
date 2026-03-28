import './styles.css'
import { useEffect, useState } from 'react'

import { initializeApp } from "firebase/app"
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
} from "firebase/firestore"

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

const sampleLead = {
  company: 'تمكن لتقنية المعلومات',
  phone: '966553909589',
  temperature: 'Hot',
  stage: 'Lead',
  status: 'جديد'
}

export default function App() {
  const [leads, setLeads] = useState([])
  const [newLead, setNewLead] = useState({
    company: '',
    phone: '',
    temperature: 'Warm',
    stage: 'Lead'
  })
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)

  const [selectedClient, setSelectedClient] = useState(null)
  const [clientTasks, setClientTasks] = useState([])
  const [taskForm, setTaskForm] = useState({
    title: '',
    dueDate: '',
    owner: '',
    status: 'Pending'
  })

  useEffect(() => {
    async function migrateOldDataIfNeeded() {
      const leadsRef = collection(db, "leads")
      const snapshot = await getDocs(leadsRef)

      if (!snapshot.empty) {
        return
      }

      const oldLocal = localStorage.getItem('leads')

      if (oldLocal) {
        try {
          const parsed = JSON.parse(oldLocal)

          if (Array.isArray(parsed) && parsed.length > 0) {
            for (const item of parsed) {
              const { id, ...cleanItem } = item
              await addDoc(leadsRef, {
                company: cleanItem.company || '',
                phone: cleanItem.phone || '',
                temperature: cleanItem.temperature || 'Warm',
                stage: cleanItem.stage || 'Lead',
                status: cleanItem.status || 'جديد'
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

      const unsubscribe = onSnapshot(collection(db, "leads"), (snapshot) => {
        const data = snapshot.docs.map((item) => ({
          id: item.id,
          ...item.data()
        }))
        setLeads(data)
        setLoading(false)

        if (selectedClient) {
          const updatedClient = data.find((item) => item.id === selectedClient.id)
          if (updatedClient) {
            setSelectedClient(updatedClient)
          }
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
      const data = snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data()
      }))
      setClientTasks(data)
    })

    return () => unsubscribe()
  }, [selectedClient])

  async function addLead() {
    if (!newLead.company || !newLead.phone) {
      alert('اكمل البيانات')
      return
    }

    await addDoc(collection(db, "leads"), {
      ...newLead,
      status: 'جديد'
    })

    setNewLead({
      company: '',
      phone: '',
      temperature: 'Warm',
      stage: 'Lead'
    })
  }

  async function deleteLead(id) {
    await deleteDoc(doc(db, "leads", id))

    if (selectedClient?.id === id) {
      setSelectedClient(null)
      setClientTasks([])
    }
  }

  async function updateLead(lead) {
    const ref = doc(db, "leads", lead.id)
    const { id, ...payload } = lead
    await updateDoc(ref, payload)
    setEditingId(null)
  }

  function updateStage(id, stage) {
    setLeads(
      leads.map((item) =>
        item.id === id ? { ...item, stage } : item
      )
    )
  }

  function updateTemp(id, temperature) {
    setLeads(
      leads.map((item) =>
        item.id === id ? { ...item, temperature } : item
      )
    )
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

    setTaskForm({
      title: '',
      dueDate: '',
      owner: '',
      status: 'Pending'
    })
  }

  const total = leads.length
  const hotCount = leads.filter((l) => l.temperature === 'Hot').length
  const warmCount = leads.filter((l) => l.temperature === 'Warm').length
  const wonCount = leads.filter((l) => l.stage === 'Won').length

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
          <strong>{total}</strong>
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
          <span>💰 Won</span>
          <strong>{wonCount}</strong>
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
          <option value="Lead">Lead</option>
          <option value="Contacted">Contacted</option>
          <option value="Meeting">Meeting</option>
          <option value="Proposal">Proposal</option>
          <option value="Won">Won</option>
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
              marginBottom: '14px'
            }}
          >
            <h2 style={{ margin: 0 }}>تفاصيل العميل</h2>
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

          <div style={{ lineHeight: '2', marginBottom: '20px' }}>
            <div><strong>اسم الشركة:</strong> {selectedClient.company}</div>
            <div><strong>رقم الجوال:</strong> {selectedClient.phone}</div>
            <div><strong>الحالة:</strong> {selectedClient.status}</div>
            <div><strong>المرحلة:</strong> {selectedClient.stage}</div>
            <div><strong>درجة العميل:</strong> {selectedClient.temperature}</div>
          </div>

          <div
            style={{
              marginTop: '20px',
              background: '#0f2347',
              padding: '16px',
              borderRadius: '10px'
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
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Done">Done</option>
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
                      border: '1px solid rgba(255,255,255,0.08)'
                    }}
                  >
                    <div><strong>المهمة:</strong> {task.title}</div>
                    <div><strong>التاريخ:</strong> {task.dueDate}</div>
                    <div><strong>المسؤول:</strong> {task.owner}</div>
                    <div><strong>الحالة:</strong> {task.status}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <div className="pipeline">
        {['Lead', 'Contacted', 'Meeting', 'Proposal', 'Won'].map((stage) => (
          <div key={stage} className="pipe-col">
            <h3>{stage}</h3>

            {leads
              .filter((item) => item.stage === stage)
              .map((lead) => (
                <div
                  key={lead.id}
                  className="card"
                  onClick={() => setSelectedClient(lead)}
                  style={{ cursor: 'pointer' }}
                >
                  {editingId === lead.id ? (
                    <>
                      <input
                        value={lead.company}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) =>
                          setLeads(
                            leads.map((item) =>
                              item.id === lead.id
                                ? { ...item, company: e.target.value }
                                : item
                            )
                          )
                        }
                      />

                      <input
                        value={lead.phone}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) =>
                          setLeads(
                            leads.map((item) =>
                              item.id === lead.id
                                ? { ...item, phone: e.target.value }
                                : item
                            )
                          )
                        }
                      />

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

                      <div style={{ marginTop: '8px' }}>
                        <a
                          href={`https://wa.me/${lead.phone}`}
                          target="_blank"
                          rel="noreferrer"
                          className="wa-btn"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="white"
                            style={{ marginLeft: '6px' }}
                          >
                            <path d="M20.52 3.48A11.82 11.82 0 0012.05 0C5.47 0 .08 5.38.08 11.97c0 2.11.55 4.18 1.6 6.01L0 24l6.2-1.62a11.94 11.94 0 005.85 1.5h.01c6.58 0 11.97-5.38 11.97-11.97 0-3.2-1.25-6.21-3.51-8.43z" />
                          </svg>
                          واتساب
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
                      onChange={(e) => updateStage(lead.id, e.target.value)}
                    >
                      <option value="Lead">Lead</option>
                      <option value="Contacted">Contacted</option>
                      <option value="Meeting">Meeting</option>
                      <option value="Proposal">Proposal</option>
                      <option value="Won">Won</option>
                    </select>

                    <select
                      value={lead.temperature}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => updateTemp(lead.id, e.target.value)}
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
