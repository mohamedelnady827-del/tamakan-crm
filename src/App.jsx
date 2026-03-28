import './styles.css'
import { useEffect, useState } from 'react'

// 🔥 Firebase
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

// 🔥 إعداد Firebase (من عندك)
const firebaseConfig = {
  apiKey: "AIzaSyB53c1aa_CGtDzE0JnUQjbntYVRBQmx14",
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
    temperature: 'Warm'
  })

  const [editingId, setEditingId] = useState(null)

  // 🔥 تحميل البيانات من Firebase
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

  // 🔥 إضافة عميل
  async function addLead() {
    if (!newLead.company || !newLead.phone) {
      alert('اكمل البيانات')
      return
    }

    await addDoc(collection(db, "leads"), {
      ...newLead,
      status: 'جديد'
    })

    setNewLead({ company: '', phone: '', temperature: 'Warm' })
  }

  // 🔥 حذف
  async function deleteLead(id) {
    await deleteDoc(doc(db, "leads", id))
  }

  // 🔥 تعديل
  async function updateLead(lead) {
    const ref = doc(db, "leads", lead.id)
    await updateDoc(ref, lead)
    setEditingId(null)
  }

  return (
    <div className="container" dir="rtl">
      <h1>🚀 Tamakan CRM</h1>

      {/* 🔥 الفورم */}
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

        <button className="primary-btn" onClick={addLead}>
          إضافة
        </button>
      </div>

      {/* 🔥 الجدول */}
      <table>
        <thead>
          <tr>
            <th>الشركة</th>
            <th>الحالة</th>
            <th>الحرارة</th>
            <th>واتساب</th>
            <th>إدارة</th>
          </tr>
        </thead>

        <tbody>
          {leads.map((lead) => (
            <tr key={lead.id}>
              <td>
                {editingId === lead.id ? (
                  <input
                    value={lead.company}
                    onChange={(e) =>
                      setLeads(leads.map(l =>
                        l.id === lead.id ? { ...l, company: e.target.value } : l
                      ))
                    }
                  />
                ) : (
                  lead.company
                )}
              </td>

              <td>{lead.status}</td>

              <td>
                <span className={lead.temperature === 'Hot' ? 'danger' : 'warn'}>
                  {lead.temperature}
                </span>
              </td>

              <td>
                <a
                  href={`https://wa.me/${lead.phone}`}
                  target="_blank"
                  className="wa-btn"
                >
                  واتساب
                </a>
              </td>

              <td>
                {editingId === lead.id ? (
                  <button onClick={() => updateLead(lead)}>💾 حفظ</button>
                ) : (
                  <button onClick={() => setEditingId(lead.id)}>✏️ تعديل</button>
                )}

                <button onClick={() => deleteLead(lead.id)}>🗑 حذف</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
