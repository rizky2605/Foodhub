'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export default function DashboardPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [user, setUser] = useState<any>(null)
  const [restaurant, setRestaurant] = useState<any>(null)
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

      // 2. Cek apakah user ini punya restoran?
      const { data: restoData, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('user_id', user.id)
        .single() // Ambil satu saja
      
      if (restoData) {
        setRestaurant(restoData)
      }

      setLoading(false)
    }

    getData()
  }, [router, supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) return <div className="p-10 text-center">Memuat data...</div>

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
          <button onClick={handleLogout} className="text-red-600 hover:text-red-800 font-medium">
            Keluar
          </button>
        </div>

        {/* WELCOME SECTION */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
          <p className="text-gray-600">Selamat datang kembali,</p>
          <p className="text-xl font-semibold text-gray-900">{user?.email}</p>
        </div>

        {/* LOGIC RESTORAN */}
        {restaurant ? (
          // JIKA SUDAH PUNYA RESTORAN
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-blue-600 text-white p-6 rounded-xl shadow-lg">
              <h2 className="text-2xl font-bold mb-2">{restaurant.name}</h2>
              <p className="opacity-90">Status: Aktif</p>
              <button 
                onClick={() => router.push(`/FoodHub.com/${restaurant.id}/menu`)}
                className="mt-4 bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 transition"
              >
                Kelola Menu
              </button>
            </div>
            
            {/* Card Statistik Dummy */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-gray-500 font-medium mb-2">Total Pesanan Hari Ini</h3>
              <p className="text-3xl font-bold text-gray-800">0</p>
            </div>
          </div>
        ) : (
          // JIKA BELUM PUNYA RESTORAN
          <div className="text-center py-12 bg-white rounded-xl border-2 border-dashed border-gray-300">
            <h2 className="text-xl font-bold text-gray-700 mb-2">Anda belum memiliki restoran</h2>
            <p className="text-gray-500 mb-6">Mulai kelola bisnis kuliner Anda sekarang.</p>
            <button
              onClick={() => router.push('/create-restaurant')} // Kita akan buat halaman ini nanti
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition shadow-md"
            >
              + Buat Restoran Baru
            </button>
          </div>
        )}
      </div>
    </div>
  )
}