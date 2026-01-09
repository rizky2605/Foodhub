'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Loader2, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react'

// Tipe data
type UserRole = 'owner' | 'employee'
type EmployeeRole = 'kasir' | 'pelayan' | 'admin'

export default function SignupPage() {
  const router = useRouter()
  const supabase = createClient()
  
  // State UI
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // State Form
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [userRole, setUserRole] = useState<UserRole>('owner')

  // State Khusus Employee (Owner tidak butuh ini di awal)
  const [restaurantId, setRestaurantId] = useState('')
  const [employeeRole, setEmployeeRole] = useState<EmployeeRole>('kasir')

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')

    try {
      // Validasi Dasar
      if (!email || !password || !fullName) throw new Error('Mohon lengkapi data akun.')
      if (password.length < 6) throw new Error('Password minimal 6 karakter.')
      
      // Validasi Khusus Employee
      if (userRole === 'employee' && !restaurantId) {
        throw new Error('ID Restoran wajib diisi untuk karyawan.')
      }

      // 1. Buat Akun Auth Supabase
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName }
        }
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('Gagal membuat user.')

      const userId = authData.user.id

      // 2. Simpan ke Tabel 'users'
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: userId,
          full_name: fullName,
          email: email
        })

      if (userError) {
        // Abaikan error duplicate key jika user sudah ada (opsional)
        console.error('User insert warning:', userError)
      }

      // 3. Logic Cabang
      if (userRole === 'owner') {
        // OWNER: CUKUP SAMPAI SINI.
        // Restoran akan dibuat nanti di halaman dashboard/create-restaurant
        // Tidak perlu insert ke tabel 'owners' atau 'restaurants' sekarang.
      } else {
        // EMPLOYEE: Tetap perlu insert ke tabel employees
        const { error: empError } = await supabase
          .from('employees')
          .insert({
            user_id: userId,
            restaurant_id: restaurantId,
            role: employeeRole,
            status: 'pending'
          })

        if (empError) throw new Error('Gagal mendaftar karyawan: ' + empError.message)
      }

      setSuccessMsg('Pendaftaran Berhasil! Mengalihkan...')
      
      setTimeout(() => {
        // Redirect ke Dashboard. 
        // Di Dashboard nanti akan dicek: Kalau owner & belum punya resto -> Redirect ke Create Restaurant
        router.push('/dashboard')
        router.refresh()
      }, 1500)

    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan sistem.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-blue-600 p-6 text-white">
          <button onClick={() => router.back()} className="flex items-center text-blue-100 hover:text-white mb-4 transition">
            <ArrowLeft size={18} className="mr-1" /> Kembali
          </button>
          <h1 className="text-2xl font-bold">Buat Akun Baru</h1>
          <p className="text-blue-100 mt-1">Langkah awal bergabung dengan FoodHub</p>
        </div>

        <div className="p-8">
          {errorMsg && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg flex items-start">
              <AlertCircle className="mr-2 mt-0.5 flex-shrink-0" size={18} />
              <span>{errorMsg}</span>
            </div>
          )}
          
          {successMsg && (
            <div className="mb-6 p-4 bg-green-50 text-green-700 border border-green-200 rounded-lg flex items-center">
              <CheckCircle className="mr-2 flex-shrink-0" size={18} />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            {/* Data Diri */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
              <input type="text" required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Contoh: Budi Santoso" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@contoh.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input type="password" required minLength={6} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>

            {/* Pilihan Role */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Daftar Sebagai</label>
              <div className="grid grid-cols-2 gap-4">
                <button type="button" onClick={() => setUserRole('owner')}
                  className={`py-2 px-4 rounded-lg border text-center transition ${userRole === 'owner' ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold ring-1 ring-blue-500' : 'border-gray-200 text-gray-600'}`}>
                  Owner
                </button>
                <button type="button" onClick={() => setUserRole('employee')}
                  className={`py-2 px-4 rounded-lg border text-center transition ${userRole === 'employee' ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold ring-1 ring-blue-500' : 'border-gray-200 text-gray-600'}`}>
                  Karyawan
                </button>
              </div>
            </div>

            {/* Form Tambahan Khusus Employee */}
            {userRole === 'employee' && (
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-3 animate-in fade-in slide-in-from-top-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ID Restoran</label>
                  <input type="text" required className="w-full px-4 py-2 border rounded-lg text-black bg-white"
                    value={restaurantId} onChange={(e) => setRestaurantId(e.target.value)} placeholder="Minta ID dari Owner" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Posisi</label>
                  <select className="w-full px-4 py-2 border rounded-lg text-black bg-white"
                    value={employeeRole} onChange={(e) => setEmployeeRole(e.target.value as EmployeeRole)}>
                    <option value="kasir">Kasir</option>
                    <option value="pelayan">Pelayan</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
            )}

            <button type="submit" disabled={loading} className="w-full mt-6 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium flex justify-center items-center disabled:bg-blue-300">
              {loading ? <Loader2 className="animate-spin" /> : 'Buat Akun'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}