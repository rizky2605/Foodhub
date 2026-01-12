'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { 
  Loader2, CheckCircle, AlertCircle, ArrowLeft, 
  User, Mail, Lock, Store, Briefcase, KeyRound, ChefHat 
} from 'lucide-react'
import Link from 'next/link'

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
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [userRole, setUserRole] = useState<UserRole>('owner')

  // State Khusus Employee
  const [restaurantId, setRestaurantId] = useState('')
  const [employeeRole, setEmployeeRole] = useState<EmployeeRole>('pelayan')

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')

    try {
      // 1. Validasi Input Dasar
      if (!email || !password || !fullName) throw new Error('Mohon lengkapi data akun.')
      if (password.length < 6) throw new Error('Password minimal 6 karakter.')
      if (password !== confirmPassword) throw new Error('Konfirmasi password tidak cocok.')
      
      let finalRestaurantId = ''

      // 2. Validasi Khusus Employee (CEK ID RESTORAN DULU)
      if (userRole === 'employee') {
        if (!restaurantId) throw new Error('ID Restoran wajib diisi untuk karyawan.')
        finalRestaurantId = restaurantId.trim()

        // Cek ke database: Apakah restoran ini ada?
        const { data: restoCheck, error: restoCheckError } = await supabase
          .from('restaurants')
          .select('id, name')
          .eq('id', finalRestaurantId)
          .single()
        
        if (restoCheckError || !restoCheck) {
          throw new Error('ID Restoran tidak ditemukan! Pastikan ID benar.')
        }
      }

      // 3. Buat Akun Auth Supabase
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName } // Metadata
        }
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('Gagal membuat user.')

      const userId = authData.user.id

      // 4. Simpan ke Tabel Public 'users'
      // PERBAIKAN: Jika ini gagal, kita harus STOP (Throw Error)
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: userId,
          full_name: fullName,
          email: email,
          role: userRole === 'owner' ? 'owner' : 'user'
        })

      if (userError) {
        // Jika user sudah ada (duplicate), kita abaikan. Tapi jika error lain, kita lempar.
        if (!userError.message.includes('duplicate key')) {
           throw new Error('Gagal membuat profil pengguna: ' + userError.message)
        }
      }

      // 5. Insert ke tabel employees (Hanya jika role Employee)
      if (userRole === 'employee') {
        const { error: empError } = await supabase
          .from('employees')
          .insert({
            user_id: userId,
            restaurant_id: finalRestaurantId,
            role: employeeRole,
            status: 'pending'
          })

        if (empError) {
            // Jika gagal insert employee, hapus user auth agar tidak nyangkut (Opsional, manual rollback)
            // await supabase.auth.admin.deleteUser(userId) 
            throw new Error('Gagal mendaftar karyawan: ' + empError.message)
        }
      }

      // 6. Sukses
      setSuccessMsg('Akun berhasil dibuat! Silakan login.')
      
      setTimeout(() => {
        router.push('/login')
      }, 1500)

    } catch (err: any) {
      console.error(err)
      setErrorMsg(err.message || 'Terjadi kesalahan sistem.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-white font-sans">
      
      {/* --- BAGIAN KIRI: ARTWORK --- */}
      <div className="hidden lg:flex w-1/2 bg-slate-900 relative overflow-hidden flex-col justify-between p-12 text-white">
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600 rounded-full blur-[100px] opacity-20 translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-600 rounded-full blur-[100px] opacity-20 -translate-x-1/2 translate-y-1/2"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-8">
            <div className="bg-blue-600 p-2 rounded-lg">
              <ChefHat size={24} />
            </div>
            <span className="text-xl font-bold tracking-tight">FoodHub</span>
          </div>
          <h2 className="text-4xl font-bold leading-tight mb-4">
            Kelola Restoran Anda <br /> Menjadi Lebih Modern.
          </h2>
          <p className="text-slate-400 text-lg max-w-md">
            Bergabunglah dengan ribuan pemilik bisnis kuliner yang telah mendigitalkan operasional mereka.
          </p>
        </div>

        <div className="relative z-10 bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/10">
          <p className="italic text-slate-200 mb-4">
            "Sistem ini mengubah cara kami bekerja. Pesanan jadi lebih cepat dan laporan keuangan sangat rapi."
          </p>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center font-bold">A</div>
            <div>
              <p className="font-bold text-sm">Andi Saputra</p>
              <p className="text-xs text-slate-400">Owner, Kopi Senja</p>
            </div>
          </div>
        </div>
      </div>

      {/* --- BAGIAN KANAN: FORM --- */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 md:px-16 lg:px-24 py-12 overflow-y-auto">
        <div className="max-w-md w-full mx-auto">
          
          <div className="flex lg:hidden items-center gap-2 mb-8">
            <div className="bg-blue-600 p-2 rounded-lg text-white"><ChefHat size={20} /></div>
            <span className="text-xl font-bold text-gray-900">FoodHub</span>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">Buat Akun Baru</h1>
          <p className="text-gray-500 mb-8">Silakan lengkapi data untuk mendaftar.</p>

          {/* Role Switcher */}
          <div className="bg-gray-100 p-1 rounded-xl flex mb-6">
            <button 
              type="button"
              onClick={() => setUserRole('owner')}
              className={`flex-1 py-2.5 text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${userRole === 'owner' ? 'bg-white text-blue-600 shadow-sm ring-1 ring-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Store size={16} /> Pemilik
            </button>
            <button 
              type="button"
              onClick={() => setUserRole('employee')}
              className={`flex-1 py-2.5 text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${userRole === 'employee' ? 'bg-white text-blue-600 shadow-sm ring-1 ring-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Briefcase size={16} /> Karyawan
            </button>
          </div>

          {errorMsg && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl flex items-start text-sm">
              <AlertCircle className="mr-2 mt-0.5 flex-shrink-0" size={16} />
              <span>{errorMsg}</span>
            </div>
          )}
          
          {successMsg && (
            <div className="mb-6 p-4 bg-green-50 text-green-700 border border-green-200 rounded-xl flex items-center text-sm">
              <CheckCircle className="mr-2 flex-shrink-0" size={16} />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Nama Lengkap</label>
              <div className="relative">
                <User className="absolute left-4 top-3.5 text-gray-400" size={18} />
                <input 
                  type="text" required 
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-gray-900"
                  value={fullName} onChange={(e) => setFullName(e.target.value)} 
                  placeholder="Masukkan nama anda" 
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 text-gray-400" size={18} />
                <input 
                  type="email" required 
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-gray-900"
                  value={email} onChange={(e) => setEmail(e.target.value)} 
                  placeholder="email@contoh.com" 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-3.5 text-gray-400" size={18} />
                  <input 
                    type="password" required minLength={6}
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition text-gray-900"
                    value={password} onChange={(e) => setPassword(e.target.value)} 
                    placeholder="Min 6 karakter" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Konfirmasi</label>
                <div className="relative">
                  <Lock className={`absolute left-4 top-3.5 ${confirmPassword && password === confirmPassword ? 'text-green-500' : 'text-gray-400'}`} size={18} />
                  <input 
                    type="password" required
                    className={`w-full pl-11 pr-4 py-3 bg-gray-50 border rounded-xl focus:bg-white focus:ring-2 outline-none transition text-gray-900 ${confirmPassword && password !== confirmPassword ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-blue-500'}`}
                    value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} 
                    placeholder="Ulangi password" 
                  />
                </div>
              </div>
            </div>

            {/* KHUSUS EMPLOYEE */}
            {userRole === 'employee' && (
              <div className="bg-orange-50 p-5 rounded-2xl border border-orange-100 animate-in slide-in-from-top-4 mt-2">
                <div className="flex items-center gap-2 mb-3 text-orange-800">
                   <KeyRound size={18} />
                   <h3 className="font-bold text-sm">Data Karyawan</h3>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-orange-700 mb-1 ml-1">ID Restoran (UUID)</label>
                    <input 
                      type="text" required 
                      className="w-full px-4 py-2.5 border border-orange-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 outline-none text-gray-900 bg-white placeholder-gray-400"
                      value={restaurantId} onChange={(e) => setRestaurantId(e.target.value)} 
                      placeholder="Minta ID ini kepada Owner" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-orange-700 mb-1 ml-1">Posisi / Jabatan</label>
                    <div className="relative">
                      <select 
                        className="w-full px-4 py-2.5 border border-orange-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 outline-none text-gray-900 bg-white appearance-none cursor-pointer"
                        value={employeeRole} onChange={(e) => setEmployeeRole(e.target.value as EmployeeRole)}
                      >
                        <option value="pelayan">Pelayan</option>
                        <option value="kasir">Kasir</option>
                        <option value="admin">Admin / Manajer</option>
                      </select>
                      <div className="absolute right-4 top-3 pointer-events-none text-orange-400">
                        <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading} 
              className="w-full mt-6 bg-slate-900 text-white py-3.5 rounded-xl font-bold hover:bg-slate-800 transition flex justify-center items-center shadow-lg shadow-slate-200 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="animate-spin" /> : 'Buat Akun Sekarang'}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-gray-500">
            Sudah punya akun?{' '}
            <Link href="/login" className="text-blue-600 font-bold hover:underline">
              Masuk disini
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}