'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { 
  Store, Utensils, Users, Clock, 
  LogOut, ExternalLink, Settings, QrCode, 
  TrendingUp, BookOpen, ShoppingBag, 
  ChevronRight, Copy, CheckCircle
} from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()
  const supabase = createClient()
  
  // State Data
  const [user, setUser] = useState<any>(null)
  const [restaurant, setRestaurant] = useState<any>(null)
  const [role, setRole] = useState<string>('') 
  const [loading, setLoading] = useState(true)

  // State Statistik Hari Ini
  const [todayRevenue, setTodayRevenue] = useState(0)
  const [todayOrders, setTodayOrders] = useState(0)
  
  // State UI
  const [greeting, setGreeting] = useState('')

  useEffect(() => {
    // Set Greeting
    const hour = new Date().getHours()
    if (hour < 12) setGreeting('Selamat Pagi')
    else if (hour < 15) setGreeting('Selamat Siang')
    else if (hour < 18) setGreeting('Selamat Sore')
    else setGreeting('Selamat Malam')

    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // 1. User & Role
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.replace('/login')
        return
      }
      setUser(user)

      // 2. Cek Restaurant (Owner vs Employee)
      let restoData = null
      let userRole = ''

      // Cek Owner
      const { data: ownerResto } = await supabase.from('restaurants').select('*').eq('user_id', user.id).single()
      
      if (ownerResto) {
        restoData = ownerResto
        userRole = 'owner'
      } else {
        // Cek Employee
        const { data: emp } = await supabase.from('employees').select('*, restaurants(*)').eq('user_id', user.id).eq('status', 'approved').single()
        if (emp && emp.restaurants) {
          // @ts-ignore
          restoData = emp.restaurants
          userRole = emp.role
        }
      }

      if (restoData) {
        setRestaurant(restoData)
        setRole(userRole)

        // 3. Hitung Statistik Harian (Hanya order hari ini)
        const today = new Date().toISOString().split('T')[0]
        const { data: orders } = await supabase
          .from('orders')
          .select('total_amount, status')
          .eq('restaurant_id', restoData.id)
          .gte('created_at', `${today}T00:00:00`)
          .lte('created_at', `${today}T23:59:59`)
          .neq('status', 'cancelled') // Jangan hitung yang batal

        if (orders) {
          const revenue = orders
            .filter(o => o.status === 'completed') // Omset hanya dari yang completed
            .reduce((acc, curr) => acc + curr.total_amount, 0)
          
          setTodayRevenue(revenue)
          setTodayOrders(orders.length)
        }
      }

    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.replace('/login')
  }

  const copyLink = () => {
    if (!restaurant) return
    const url = `${window.location.origin}/restaurant/${restaurant.slug}`
    navigator.clipboard.writeText(url)
    alert('Link restoran disalin!')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium text-sm">Memuat Dashboard...</p>
        </div>
      </div>
    )
  }

  // TAMPILAN JIKA BELUM PUNYA RESTORAN (OWNER BARU)
  if (!restaurant && role !== 'kasir' && role !== 'pelayan') {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="bg-white p-10 rounded-3xl shadow-xl max-w-lg text-center border border-gray-100">
          <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Store size={40} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Selamat Datang, Owner!</h2>
          <p className="text-gray-500 mb-8 leading-relaxed">
            Anda belum memiliki restoran. Mulailah perjalanan bisnis kuliner Anda dengan membuat profil restoran pertama Anda.
          </p>
          <button
            onClick={() => router.push('/create-restaurant')}
            className="w-full bg-blue-600 text-white px-6 py-4 rounded-xl hover:bg-blue-700 transition font-bold shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
          >
            <Store size={20} /> Buat Restoran Baru
          </button>
          <button onClick={handleLogout} className="mt-6 text-gray-400 hover:text-red-500 text-sm">Keluar Akun</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-12">
      {/* --- TOP NAVBAR --- */}
      <div className="bg-white border-b border-gray-100 px-6 py-4 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            {restaurant?.logo_url ? (
              <img src={restaurant.logo_url} alt="Logo" className="w-10 h-10 rounded-full object-cover border border-gray-200" />
            ) : (
              <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                {restaurant?.name?.charAt(0)}
              </div>
            )}
            <div>
              <h1 className="font-bold text-gray-900 leading-tight">{restaurant?.name}</h1>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className={`w-2 h-2 rounded-full ${restaurant?.is_open ? 'bg-green-500' : 'bg-red-500'}`}></span>
                {restaurant?.is_open ? 'Buka' : 'Tutup'}
                <span className="text-gray-300">|</span>
                <span className="capitalize">{role === 'owner' ? 'Pemilik' : role}</span>
              </div>
            </div>
          </div>
          <button onClick={handleLogout} className="text-gray-400 hover:text-red-600 p-2 rounded-full hover:bg-gray-50 transition">
            <LogOut size={20} />
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        
        {/* --- GREETING & HEADER --- */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
          <div>
            <p className="text-gray-500 text-sm font-medium mb-1">{greeting}, {user?.email?.split('@')[0]}</p>
            <h2 className="text-3xl font-bold text-gray-900">Ringkasan Hari Ini</h2>
          </div>
          <button onClick={copyLink} className="flex items-center gap-2 bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-50 transition shadow-sm">
            <ExternalLink size={14} /> Lihat Web Resto
          </button>
        </div>

        {/* --- STATS CARDS --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {/* Card 1: Revenue */}
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg shadow-blue-200 relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center gap-2 text-blue-100 text-sm font-medium mb-2">
                <TrendingUp size={16} /> Omset Penjualan (Selesai)
              </div>
              <h3 className="text-3xl font-bold">Rp {todayRevenue.toLocaleString('id-ID')}</h3>
              <p className="text-xs text-blue-200 mt-1">Total pendapatan hari ini</p>
            </div>
            <div className="absolute right-0 top-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-10 -mt-10"></div>
          </div>

          {/* Card 2: Orders */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col justify-center">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-500 text-sm font-medium">Total Pesanan Masuk</span>
              <div className="bg-orange-100 p-2 rounded-lg text-orange-600">
                <ShoppingBag size={20} />
              </div>
            </div>
            <h3 className="text-3xl font-bold text-gray-900">{todayOrders}</h3>
            <p className="text-xs text-gray-400 mt-1">Transaksi hari ini (Semua Status)</p>
          </div>

          {/* Card 3: Status Toko */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col justify-center">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-500 text-sm font-medium">Status Operasional</span>
              <div className={`p-2 rounded-lg ${restaurant?.is_open ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                {restaurant?.is_open ? <Clock size={20} /> : <LogOut size={20} />}
              </div>
            </div>
            <h3 className={`text-xl font-bold ${restaurant?.is_open ? 'text-green-600' : 'text-red-600'}`}>
              {restaurant?.is_open ? 'Sedang Buka' : 'Tutup Sementara'}
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              {role === 'owner' ? 'Ubah status di menu Pengaturan' : 'Hubungi Owner untuk mengubah'}
            </p>
          </div>
        </div>

        {/* --- MENU GRID --- */}
        <h3 className="text-lg font-bold text-gray-800 mb-4">Menu Cepat</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          
          {/* 1. PESANAN MASUK */}
          <div 
            onClick={() => router.push('/dashboard/orders')}
            className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-300 cursor-pointer transition group"
          >
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition">
              <Clock size={24} />
            </div>
            <h4 className="font-bold text-gray-900">Pesanan Masuk</h4>
            <p className="text-xs text-gray-500 mt-1">Cek pesanan realtime</p>
          </div>

          {/* 2. DAFTAR MENU (Input Harga) */}
          <div 
            onClick={() => router.push('/dashboard/menu')}
            className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-orange-300 cursor-pointer transition group"
          >
            <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition">
              <Utensils size={24} />
            </div>
            <h4 className="font-bold text-gray-900">Daftar Harga Menu</h4>
            <p className="text-xs text-gray-500 mt-1">Input nama & harga</p>
          </div>

          {/* 3. DESAIN BUKU MENU (Flipbook) */}
          <div 
            onClick={() => router.push('/dashboard/pages')}
            className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-purple-300 cursor-pointer transition group"
          >
            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition">
              <BookOpen size={24} />
            </div>
            <h4 className="font-bold text-gray-900">Desain Buku Menu</h4>
            <p className="text-xs text-gray-500 mt-1">Upload gambar halaman</p>
          </div>

          {/* 4. LAPORAN */}
          <div 
            onClick={() => router.push('/dashboard/report')}
            className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-green-300 cursor-pointer transition group"
          >
            <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition">
              <TrendingUp size={24} />
            </div>
            <h4 className="font-bold text-gray-900">Laporan</h4>
            <p className="text-xs text-gray-500 mt-1">Lihat riwayat omset</p>
          </div>

          {/* 5. QR CODE */}
          <div 
            onClick={() => router.push('/dashboard/qr')}
            className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-300 cursor-pointer transition group"
          >
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition">
              <QrCode size={24} />
            </div>
            <h4 className="font-bold text-gray-900">QR Code</h4>
            <p className="text-xs text-gray-500 mt-1">Cetak QR Meja</p>
          </div>

          {/* 6. PEGAWAI (Owner Only) */}
          {role === 'owner' && (
            <div 
              onClick={() => router.push('/dashboard/employees')}
              className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-pink-300 cursor-pointer transition group"
            >
              <div className="w-12 h-12 bg-pink-50 text-pink-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition">
                <Users size={24} />
              </div>
              <h4 className="font-bold text-gray-900">Pegawai</h4>
              <p className="text-xs text-gray-500 mt-1">Kelola staf restoran</p>
            </div>
          )}

          {/* 7. PENGATURAN (Owner Only) */}
          {role === 'owner' && (
            <div 
              onClick={() => router.push('/dashboard/settings')}
              className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-400 cursor-pointer transition group"
            >
              <div className="w-12 h-12 bg-gray-100 text-gray-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition">
                <Settings size={24} />
              </div>
              <h4 className="font-bold text-gray-900">Pengaturan</h4>
              <p className="text-xs text-gray-500 mt-1">Profil & Buka/Tutup</p>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}