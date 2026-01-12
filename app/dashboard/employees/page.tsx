'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { 
  ArrowLeft, Users, CheckCircle, XCircle, 
  Loader2, Trash2, Shield 
} from 'lucide-react'

// Interface
interface Employee {
  id: string
  user_id: string
  role: 'kasir' | 'pelayan' | 'admin'
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  // Data User kita ambil manual, jadi ditandai optional
  users?: {
    full_name: string
    email: string
  }
}

export default function EmployeesPage() {
  const router = useRouter()
  const supabase = createClient()

  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchEmployees()
  }, [])

  const fetchEmployees = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // 1. Ambil ID Restoran Owner
      const { data: resto } = await supabase
        .from('restaurants')
        .select('id')
        .eq('user_id', user.id)
        .single()
      
      if (!resto) {
        alert('Hanya Owner yang bisa mengakses halaman ini')
        router.push('/dashboard')
        return
      }

      // 2. Ambil Data Karyawan (TANPA Join dulu biar aman)
      const { data: empData, error: empError } = await supabase
        .from('employees')
        .select('*')
        .eq('restaurant_id', resto.id)
        .order('created_at', { ascending: false })

      if (empError) throw empError

      // 3. Jika ada karyawan, ambil data nama/email mereka dari tabel 'users'
      if (empData && empData.length > 0) {
        // Kumpulkan semua user_id karyawan
        const userIds = empData.map((e: any) => e.user_id)
        
        // Fetch data users berdasarkan ID tersebut
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('id, full_name, email')
          .in('id', userIds)
        
        if (usersError) console.error('Error fetching users:', usersError)

        // 4. Gabungkan (Merge) data Karyawan + User
        const mergedData = empData.map((emp: any) => {
          const userDetail = usersData?.find((u: any) => u.id === emp.user_id)
          return {
            ...emp,
            users: userDetail ? {
              full_name: userDetail.full_name,
              email: userDetail.email
            } : { full_name: 'Unknown', email: '-' }
          }
        })
        
        setEmployees(mergedData)
      } else {
        setEmployees([])
      }

    } catch (error: any) {
      console.error('Error fetching employees:', error.message || error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (id: string) => {
    const { error } = await supabase
      .from('employees')
      .update({ status: 'approved' })
      .eq('id', id)
    
    if (error) alert('Gagal menyetujui: ' + error.message)
    else fetchEmployees()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus karyawan ini? Akses mereka akan dicabut.')) return

    const { error } = await supabase
      .from('employees')
      .delete()
      .eq('id', id)
    
    if (error) alert('Gagal menghapus: ' + error.message)
    else fetchEmployees()
  }

  const getRoleBadge = (role: string) => {
    switch(role) {
      case 'admin': return 'bg-purple-100 text-purple-700'
      case 'kasir': return 'bg-blue-100 text-blue-700'
      case 'pelayan': return 'bg-orange-100 text-orange-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  if (loading) {
    return <div className="p-10 text-center text-gray-500 flex justify-center"><Loader2 className="animate-spin mr-2"/> Memuat data karyawan...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <button onClick={() => router.push('/dashboard')} className="flex items-center text-gray-500 hover:text-blue-600 mb-6 transition">
          <ArrowLeft size={20} className="mr-2"/> Kembali ke Dashboard
        </button>

        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manajemen Pegawai</h1>
            <p className="text-gray-500">Kelola akses karyawan restoran Anda</p>
          </div>
          <div className="bg-white px-4 py-2 rounded-lg border shadow-sm flex items-center gap-2">
            <Users size={20} className="text-blue-600" />
            <span className="font-bold text-gray-800">{employees.length}</span>
            <span className="text-gray-500 text-sm">Total</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          {employees.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Users size={48} className="mx-auto mb-4 opacity-50" />
              <p>Belum ada karyawan yang mendaftar.</p>
              <p className="text-sm mt-2">Bagikan ID Restoran Anda agar karyawan bisa mendaftar.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {employees.map((emp) => (
                <div key={emp.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-gray-50 transition">
                  
                  {/* Info Karyawan */}
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${
                      emp.status === 'approved' ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-500'
                    }`}>
                      {emp.users?.full_name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-gray-900">{emp.users?.full_name || 'Tanpa Nama'}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded uppercase font-bold ${getRoleBadge(emp.role)}`}>
                          {emp.role}
                        </span>
                      </div>
                      <p className="text-gray-500 text-sm">{emp.users?.email}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Daftar: {new Date(emp.created_at).toLocaleDateString('id-ID')}
                      </p>
                    </div>
                  </div>

                  {/* Status & Action */}
                  <div className="flex items-center gap-3">
                    {emp.status === 'pending' ? (
                      <>
                        <div className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-full mr-2">
                          Menunggu Persetujuan
                        </div>
                        <button 
                          onClick={() => handleApprove(emp.id)}
                          className="flex items-center bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 text-sm font-medium transition"
                          title="Setujui"
                        >
                          <CheckCircle size={16} className="mr-1" /> Terima
                        </button>
                        <button 
                          onClick={() => handleDelete(emp.id)}
                          className="flex items-center bg-white border border-red-200 text-red-600 px-3 py-2 rounded-lg hover:bg-red-50 text-sm font-medium transition"
                          title="Tolak"
                        >
                          <XCircle size={16} className="mr-1" /> Tolak
                        </button>
                      </>
                    ) : (
                      <>
                         <div className="flex items-center text-green-600 text-sm font-medium mr-4">
                          <Shield size={16} className="mr-1" /> Aktif
                        </div>
                        <button 
                          onClick={() => handleDelete(emp.id)}
                          className="p-2 text-gray-400 hover:text-red-600 transition"
                          title="Hapus Pegawai"
                        >
                          <Trash2 size={18} />
                        </button>
                      </>
                    )}
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}