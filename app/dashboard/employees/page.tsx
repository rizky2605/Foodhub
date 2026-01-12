'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { 
  ArrowLeft, Users, Check, X, Loader2, Copy, 
  ShieldAlert, UserCheck, Trash2, Mail
} from 'lucide-react'

interface Employee {
  id: string
  user_id: string
  role: 'kasir' | 'pelayan' | 'admin'
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  users?: { full_name: string; email: string }
}

export default function EmployeesPage() {
  const router = useRouter()
  const supabase = createClient()

  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [restaurantId, setRestaurantId] = useState('')
  const [activeTab, setActiveTab] = useState<'active' | 'pending'>('active')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // 1. Ambil ID Restoran Owner
      const { data: resto } = await supabase.from('restaurants').select('id').eq('user_id', user.id).single()
      if (!resto) {
        alert('Hanya Owner yang bisa mengakses halaman ini')
        router.push('/dashboard')
        return
      }
      setRestaurantId(resto.id)

      // 2. Ambil Data Karyawan
      const { data: empData, error: empError } = await supabase
        .from('employees')
        .select('*')
        .eq('restaurant_id', resto.id)
        .order('created_at', { ascending: false })

      if (empError) throw empError

      // 3. Gabungkan dengan data User
      if (empData && empData.length > 0) {
        const userIds = empData.map((e: any) => e.user_id)
        const { data: usersData } = await supabase.from('users').select('id, full_name, email').in('id', userIds)
        
        const mergedData = empData.map((emp: any) => {
          const userDetail = usersData?.find((u: any) => u.id === emp.user_id)
          return {
            ...emp,
            users: userDetail ? { full_name: userDetail.full_name, email: userDetail.email } : { full_name: 'Unknown User', email: '-' }
          }
        })
        
        setEmployees(mergedData)
        if (mergedData.some((e: any) => e.status === 'pending')) setActiveTab('pending')
      } else {
        setEmployees([])
      }
    } catch (error: any) {
      console.error('Error:', error.message)
    } finally {
      setLoading(false)
    }
  }

  // Actions
  const handleApprove = async (id: string) => {
    if(!confirm('Terima karyawan ini?')) return
    await supabase.from('employees').update({ status: 'approved' }).eq('id', id)
    fetchData()
  }

  const handleReject = async (id: string) => {
    if (!confirm('Tolak/Hapus karyawan ini?')) return
    await supabase.from('employees').delete().eq('id', id)
    fetchData()
  }

  const copyRestoID = () => {
    navigator.clipboard.writeText(restaurantId)
    alert('ID Restoran disalin!')
  }

  const pendingList = employees.filter(e => e.status === 'pending')
  const activeList = employees.filter(e => e.status === 'approved')

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-blue-600" size={32}/></div>

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-5xl mx-auto">
        <button onClick={() => router.push('/dashboard')} className="flex items-center text-slate-500 hover:text-blue-600 mb-6 transition font-medium text-sm">
          <ArrowLeft size={18} className="mr-2"/> Kembali ke Dashboard
        </button>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Tim Restoran</h1>
            <p className="text-slate-500 mt-1">Kelola staf dan hak akses aplikasi.</p>
          </div>
          <div className="bg-white p-3 rounded-xl border border-blue-100 shadow-sm flex flex-col gap-1 w-full md:w-auto hover:shadow-md transition">
             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ID Restoran (Untuk Pendaftaran)</span>
             <div className="flex items-center gap-2">
                <code className="bg-slate-100 px-3 py-1.5 rounded text-sm font-mono text-slate-700 font-bold border border-slate-200">{restaurantId}</code>
                <button onClick={copyRestoID} className="text-blue-600 hover:text-blue-700 p-1.5 hover:bg-blue-50 rounded-lg transition"><Copy size={18}/></button>
             </div>
          </div>
        </div>

        <div className="flex gap-4 border-b border-slate-200 mb-6">
          <button onClick={() => setActiveTab('active')} className={`pb-3 px-2 text-sm font-bold flex items-center gap-2 transition ${activeTab === 'active' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>
            <UserCheck size={18}/> Karyawan Aktif <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs">{activeList.length}</span>
          </button>
          <button onClick={() => setActiveTab('pending')} className={`pb-3 px-2 text-sm font-bold flex items-center gap-2 transition ${activeTab === 'pending' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-slate-500 hover:text-slate-700'}`}>
            <ShieldAlert size={18}/> Permintaan Akses {pendingList.length > 0 && <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-xs animate-pulse">{pendingList.length}</span>}
          </button>
        </div>

        {activeTab === 'active' ? (
          <div className="space-y-4">
            {activeList.length === 0 ? <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-dashed">Belum ada karyawan aktif.</div> : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeList.map(emp => (
                  <div key={emp.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">{emp.users?.full_name?.charAt(0)}</div>
                      <div>
                        <h4 className="font-bold text-slate-800">{emp.users?.full_name}</h4>
                        <div className="flex items-center gap-2 mt-1"><span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded font-bold uppercase">{emp.role}</span><span className="text-xs text-slate-400">{emp.users?.email}</span></div>
                      </div>
                    </div>
                    <button onClick={() => handleReject(emp.id)} className="p-2 text-slate-300 hover:text-red-600"><Trash2 size={18}/></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {pendingList.length === 0 ? <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-dashed">Tidak ada permintaan baru.</div> : (
              <div className="bg-white rounded-2xl border border-orange-100 shadow-sm overflow-hidden">
                {pendingList.map(emp => (
                  <div key={emp.id} className="p-6 border-b border-slate-100 last:border-0 flex flex-col sm:flex-row justify-between items-center gap-4 bg-orange-50/30">
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                      <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center font-bold text-lg">{emp.users?.full_name?.charAt(0)}</div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-lg">{emp.users?.full_name}</h4>
                        <p className="text-sm text-slate-500">{emp.users?.email} • <span className="font-bold uppercase">{emp.role}</span></p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => handleApprove(emp.id)} className="bg-green-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-green-700 flex items-center gap-2"><Check size={18}/> Terima</button>
                      <button onClick={() => handleReject(emp.id)} className="bg-white border border-red-200 text-red-600 px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-red-50 flex items-center gap-2"><X size={18}/> Tolak</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}