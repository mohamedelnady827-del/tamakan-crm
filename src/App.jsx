import './styles.css'
import { useEffect, useState } from 'react'

// Firebase
import { initializeApp } from "firebase/app"
import {
  getFirestore,
  collection,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  onSnapshot
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

export default function App() {
  const [leads, setLeads] = useState([])
  const [newLead, setNewLead] = useState({
    company: '',
    phone: '',
    temperature: 'Warm',
    stage: 'Lead'
  })

  const [editingId, setEditingId] = useState(null)

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "leads"), (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setLeads(data)
    })

    return () => unsubscribe()
  }, [])

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
  }

  async function updateLead(lead) {
    const ref = doc(db, "leads", lead.id)
    await updateDoc(ref, lead)
    setEditingId(null)
  }

  function updateStage(id, stage) {
    setLeads(
      leads.map(l => l.id === id ? { ...l, stage } : l)
    )
  }

  return (
    <div className="container" dir="rtl">
      <h1>🚀 Tamakan CRM</h1>

      {/* الإحصائيات */}
      <div className="stats-grid stats-grid-extended">
        <div className="stat-card">
          <span>📊 العملاء</span>
          <strong>{leads.length}</strong>
        </div>

        <div className="stat-card">
          <span>🔥 Hot</span>
          <strong>{leads.filter(l => l.temperature === 'Hot').length}</strong>
        </div>

        <div className="stat-card">
          <span>🟡 Warm</span>
          <strong>{leads.filter(l => l.temperature === 'Warm').length}</strong>
        </div>

        <div className="stat-card">
          <span>💰 Won</span>
          <strong>{leads.filter(l => l.stage === 'Won').length}</strong>
        </div>
      </div>

      {/* الفورم */}
      <div className="form-box">
        <input
          placeholder="اسم الشركة"
          value={newLead.company}
          onChange={e => setNewLead({ ...newLead, company: e.target.value })}
        />

        <input
          placeholder="رقم الجوال"
          value={newLead.phone}
          onChange={e => setNewLead({ ...newLead, phone: e.target.value })}
        />

        <select
          value={newLead.temperature}
          onChange={e => setNewLead({ ...newLead, temperature: e.target.value })}
        >
          <option>Hot</option>
          <option>Warm</option>
        </select>

        <select
          value={newLead.stage}
          onChange={e => setNewLead({ ...newLead, stage: e.target.value })}
        >
          <option>Lead</option>
          <option>Contacted</option>
          <option>Meeting</option>
          <option>Proposal</option>
          <option>Won</option>
        </select>

        <button className="primary-btn" onClick={addLead}>
          ➕ إضافة
        </button>
      </div>

      {/* Pipeline */}
      <div className="pipeline">
        {['Lead', 'Contacted', 'Meeting', 'Proposal', 'Won'].map(stage => (
          <div key={stage} className="pipe-col">
            <h3>{stage}</h3>

            {leads
              .filter(l => l.stage === stage)
              .map(lead => (
                <div key={lead.id} className="card">

                  <b>{lead.company}</b>

                  {/* زر واتساب احترافي */}
                  <div style={{ marginTop: '8px' }}>
                    <a
                      href={`https://wa.me/${lead.phone}`}
                      target="_blank"
                      rel="noreferrer"
                      className="wa-btn"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="white"
                        style={{ marginLeft: "6px" }}
                      >
                        <path d="M20.52 3.48A11.82 11.82 0 0012.05 0C5.47 0 .08 5.38.08 11.97c0 2.11.55 4.18 1.6 6.01L0 24l6.2-1.62a11.94 11.94 0 005.85 1.5h.01c6.58 0 11.97-5.38 11.97-11.97 0-3.2-1.25-6.21-3.51-8.43z"/>
                      </svg>
                      واتساب
                    </a>
                  </div>

                  {/* التحكم */}
                  <div className="actions">
                    {editingId === lead.id ? (
                      <button onClick={() => updateLead(lead)}>💾</button>
                    ) : (
                      <button onClick={() => setEditingId(lead.id)}>✏️</button>
                    )}

                    <button onClick={() => deleteLead(lead.id)}>🗑️</button>
                  </div>

                  {/* تغيير المرحلة */}
                  <select
                    value={lead.stage}
                    onChange={(e) => updateStage(lead.id, e.target.value)}
                  >
                    <option>Lead</option>
                    <option>Contacted</option>
                    <option>Meeting</option>
                    <option>Proposal</option>
                    <option>Won</option>
                  </select>

                </div>
              ))}
          </div>
        ))}
      </div>
    </div>
  )
}
