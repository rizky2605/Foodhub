'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Loader2, Store, Utensils, Users } from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [user, setUser] = useState<any>(null)
  const [restaurant, setRestaurant] = useState<any>(null)
  const [role, setRole] = useState<string>('') // 'owner' atau role karyawan
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getData = async () => {
      // 1. Ambil User
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)

      // 2. Cek apakah user ini OWNER?
      const { data: ownerResto } = await supabase
        .from('restaurants')
        .select('*')
        .eq('user_id', user.id)
        .single()
      
      if (ownerResto) {
        setRestaurant(ownerResto)
        setRole('owner')
        setLoading(false)
        return
      }

      // 3. Jika bukan Owner, cek apakah dia EMPLOYEE?
      const { data: employeeData } = await supabase
        .from('employees')
        .select('*, restaurants(*)') // Join ke tabel restaurants
        .eq('user_id', user.id)
        .eq('status', 'approved') // Hanya yang sudah diapprove (opsional, bisa dihapus jika ingin test langsung)
        .single()

      if (employeeData && employeeData.restaurants) {
        // @ts-ignore
        setRestaurant(employeeData.restaurants)
        setRole(employeeData.role) 
      }

      setLoading(false)
    }

    getData()
  }, [router, supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">
        <Loader2 className="animate-spin mr-2" /> Memuat Dashboard...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header Dashboard */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-500">Halo, {user?.email} ({role === 'owner' ? 'Pemilik' : 'Karyawan'})</p>
          </div>
          <button onClick={handleLogout} className="px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 text-sm font-medium transition">
            Keluar Aplikasi
          </button>
        </div>

        {restaurant ? (
          // JIKA SUDAH PUNYA RESTORAN (ATAU KERJA DI RESTORAN)
          <div className="space-y-6">
            {/* Kartu Info Restoran */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-6 md:p-8 text-white shadow-lg">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold mb-2">{restaurant.name}</h2>
                  <p className="text-blue-100 flex items-center">
                    <Store size={16} className="mr-2" /> 
                    foodhub.com/{restaurant.slug}
                  </p>
                </div>
                <div className="bg-white/10 p-3 rounded-lg backdrop-blur-sm">
                  <span className="font-mono font-bold text-xl">ID: {restaurant.id.slice(0, 8)}...</span>
                </div>
              </div>
            </div>

            {/* Grid Menu Aksi */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Menu Management Card */}
              <div 
                onClick={() => router.push('/dashboard/menu')}
                className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer group"
              >
                <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition">
                  <Utensils size={24} />
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">Manajemen Menu</h3>
                <p className="text-gray-500 text-sm">Tambah, edit, dan atur ketersediaan menu makanan restoran.</p>
              </div>

              {/* Employee Management (Khusus Owner) */}
              {role === 'owner' && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer group">
                  <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition">
                    <Users size={24} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">Karyawan</h3>
                  <p className="text-gray-500 text-sm">Kelola data karyawan, posisi, dan persetujuan akun baru.</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          // JIKA BELUM PUNYA RESTORAN (Hanya Owner yang melihat ini)
          <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-300">
            <div className="w-16 h-16 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <Store size={32} />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Belum Ada Restoran</h2>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              Anda terdaftar sebagai Owner tetapi belum membuat restoran. Silakan buat sekarang untuk mulai berjualan.
            </p>
            <button
              onClick={() => router.push('/create-restaurant')}
              className="bg-blue-600 text-white px-8 py-3 rounded-xl hover:bg-blue-700 transition font-medium shadow-lg shadow-blue-200"
            >
              + Buat Restoran Baru
            </button>
          </div>
        )}
      </div>
    </div>
  )
}