'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Loader2, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react'

// Tipe data untuk form
type UserRole = 'owner' | 'employee'
type EmployeeRole = 'kasir' | 'pelayan' | 'admin'

export default function SignupPage() {
  const router = useRouter()
  const supabase = createClient()
  
  // State UI
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [step, setStep] = useState(1) // 1: Akun, 2: Detail Restoran/Pekerjaan

  // State Form Dasar
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [userRole, setUserRole] = useState<UserRole>('owner')

  // State Form Owner
  const [restaurantName, setRestaurantName] = useState('')
  const [restaurantSlug, setRestaurantSlug] = useState('')
  const [restaurantPhone, setRestaurantPhone] = useState('')
  const [restaurantAddress, setRestaurantAddress] = useState('')
  
  // State Slug Check
  const [slugChecking, setSlugChecking] = useState(false)
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null)

  // State Form Employee
  const [restaurantId, setRestaurantId] = useState('')
  const [employeeRole, setEmployeeRole] = useState<EmployeeRole>('kasir')

  // Cek ketersediaan Slug (URL Restoran)
  useEffect(() => {
    const checkSlug = async () => {
      if (!restaurantSlug || restaurantSlug.length < 3) {
        setSlugAvailable(null)
        return
      }
      
      setSlugChecking(true)
      try {
        const { data } = await supabase
          .from('restaurants')
          .select('id')
          .eq('slug', restaurantSlug)
          .single()
        
        // Jika data ada, berarti slug sudah dipakai (false). Jika null, berarti tersedia (true).
        setSlugAvailable(!data)
      } catch (error) {
        // Jika error karena 'row not found', berarti aman (tersedia)
        setSlugAvailable(true)
      } finally {
        setSlugChecking(false)
      }
    }

    // Delay sedikit agar tidak cek setiap ketikan (debounce manual)
    const timeout = setTimeout(checkSlug, 500)
    return () => clearTimeout(timeout)
  }, [restaurantSlug, supabase])

  const generateSlug = (name: string) => {
    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-')
    setRestaurantSlug(slug)
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')

    try {
      // Validasi Manual Sederhana
      if (!email || !password || !fullName) throw new Error('Mohon lengkapi data akun.')
      if (userRole === 'owner') {
        if (!restaurantName || !restaurantSlug) throw new Error('Data restoran wajib diisi.')
        if (slugAvailable === false) throw new Error('Username restoran sudah dipakai.')
      } else {
        if (!restaurantId) throw new Error('ID Restoran wajib diisi untuk karyawan.')
      }

      // 1. Buat Akun Auth Supabase
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName } // Simpan nama di metadata juga biar aman
        }
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('Gagal membuat user.')

      const userId = authData.user.id

      // 2. Simpan ke Tabel 'users' (Wajib ada tabel public.users)
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: userId,
          full_name: fullName,
          email: email
        })

      if (userError) {
        // Jika user sudah ada (duplicate), kita lanjut saja (biar tidak stuck), tapi idealnya di-handle.
        console.error('User insert warning:', userError)
      }

      // 3. Logic Cabang: Owner vs Employee
      if (userRole === 'owner') {
        // A. Buat Restoran
        const { data: restoData, error: restoError } = await supabase
          .from('restaurants')
          .insert({
            name: restaurantName,
            slug: restaurantSlug,
            address: restaurantAddress,
            phone_number: restaurantPhone
          })
          .select('id') // Minta balikan ID
          .single()

        if (restoError) throw new Error('Gagal membuat restoran: ' + restoError.message)
        
        const newRestoId = restoData.id

        // B. Hubungkan Owner ke Restoran
        const { error: ownerError } = await supabase
          .from('owners')
          .insert({
            user_id: userId,
            restaurant_id: newRestoId
          })

        if (ownerError) throw new Error('Gagal set status owner: ' + ownerError.message)

      } else {
        // Logic Employee
        const { error: empError } = await supabase
          .from('employees')
          .insert({
            user_id: userId,
            restaurant_id: restaurantId,
            role: employeeRole,
            status: 'pending' // Menunggu approve owner
          })

        if (empError) throw new Error('Gagal mendaftar karyawan: ' + empError.message)
      }

      setSuccessMsg('Pendaftaran Berhasil! Mengalihkan...')
      
      // Tunggu sebentar lalu redirect ke Dashboard (atau Login)
      setTimeout(() => {
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
      <div className="max-w-xl w-full bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 p-6 text-white">
          <button 
            onClick={() => router.back()} 
            className="flex items-center text-blue-100 hover:text-white mb-4 transition"
          >
            <ArrowLeft size={18} className="mr-1" /> Kembali
          </button>
          <h1 className="text-2xl font-bold">Buat Akun Baru</h1>
          <p className="text-blue-100 mt-1">Bergabung dengan FoodHub</p>
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

          <form onSubmit={handleRegister}>
            {/* Step 1: Data Diri */}
            <div className={step === 1 ? 'block' : 'hidden'}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Contoh: Budi Santoso"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@contoh.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Daftar Sebagai</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setUserRole('owner')}
                      className={`py-3 px-4 rounded-lg border text-center transition ${
                        userRole === 'owner' 
                          ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold ring-1 ring-blue-500' 
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      Owner Restoran
                    </button>
                    <button
                      type="button"
                      onClick={() => setUserRole('employee')}
                      className={`py-3 px-4 rounded-lg border text-center transition ${
                        userRole === 'employee' 
                          ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold ring-1 ring-blue-500' 
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      Karyawan
                    </button>
                  </div>
                </div>
              </div>
              
              <button
                type="button"
                onClick={() => {
                  if (fullName && email && password.length >= 6) setStep(2)
                  else setErrorMsg('Lengkapi data diri & password minimal 6 karakter.')
                }}
                className="w-full mt-6 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium"
              >
                Lanjut ke Detail &rarr;
              </button>
            </div>

            {/* Step 2: Data Restoran / Pekerjaan */}
            <div className={step === 2 ? 'block' : 'hidden'}>
              {userRole === 'owner' ? (
                // FORM OWNER
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">Detail Restoran</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nama Restoran</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border rounded-lg text-black"
                      value={restaurantName}
                      onChange={(e) => {
                        setRestaurantName(e.target.value)
                        generateSlug(e.target.value)
                      }}
                      placeholder="Contoh: Kopi Senja"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Username / Link Restoran
                    </label>
                    <div className="flex">
                      <span className="bg-gray-100 border border-r-0 px-3 py-2 text-gray-500 rounded-l-lg text-sm flex items-center">
                        foodhub/
                      </span>
                      <input
                        type="text"
                        className={`w-full px-4 py-2 border rounded-r-lg text-black ${
                          slugAvailable === false ? 'border-red-500' : slugAvailable ? 'border-green-500' : ''
                        }`}
                        value={restaurantSlug}
                        onChange={(e) => setRestaurantSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      />
                    </div>
                    {/* Indikator Slug */}
                    <div className="mt-1 text-xs h-4">
                      {slugChecking && <span className="text-blue-500 flex items-center"><Loader2 size={12} className="animate-spin mr-1"/> Mengecek...</span>}
                      {slugAvailable === true && <span className="text-green-600 font-medium">✓ Username tersedia</span>}
                      {slugAvailable === false && <span className="text-red-600 font-medium">✗ Username sudah dipakai</span>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">No. Telepon (Opsional)</label>
                    <input
                      type="tel"
                      className="w-full px-4 py-2 border rounded-lg text-black"
                      value={restaurantPhone}
                      onChange={(e) => setRestaurantPhone(e.target.value)}
                    />
                  </div>
                </div>
              ) : (
                // FORM EMPLOYEE
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">Detail Pekerjaan</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ID Restoran</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border rounded-lg text-black"
                      value={restaurantId}
                      onChange={(e) => setRestaurantId(e.target.value)}
                      placeholder="Minta ID dari Owner"
                    />
                    <p className="text-xs text-gray-500 mt-1">Pastikan ID ini valid.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Posisi</label>
                    <select
                      className="w-full px-4 py-2 border rounded-lg text-black"
                      value={employeeRole}
                      onChange={(e) => setEmployeeRole(e.target.value as EmployeeRole)}
                    >
                      <option value="kasir">Kasir</option>
                      <option value="pelayan">Pelayan</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="flex gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-1/3 bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200"
                >
                  Kembali
                </button>
                <button
                  type="submit"
                  disabled={loading || (userRole === 'owner' && !slugAvailable)}
                  className="w-2/3 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium flex justify-center items-center disabled:bg-blue-300"
                >
                  {loading ? <Loader2 className="animate-spin" /> : 'Buat Akun Sekarang'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}