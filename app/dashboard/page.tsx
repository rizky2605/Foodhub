'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { 
  Store, Utensils, Users, Clock, 
  LogOut, ExternalLink, Settings, QrCode, 
  TrendingUp, BookOpen, ShoppingBag, 
  ChevronRight, ArrowUpRight, CheckCircle, ChefHat, AlertCircle, XCircle
} from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()
  const supabase = createClient()
  
  // State Data
  const [user, setUser] = useState<any>(null)
  const [restaurant, setRestaurant] = useState<any>(null)
  const [role, setRole] = useState<string>('') 
  const [loading, setLoading] = useState(true)

  // Statistik
  const [stats, setStats] = useState({
    todayRevenue: 0,
    todayOrders: 0,
    pendingOrders: 0
  })

  // Pesanan Terbaru (Live Feed)
  const [recentOrders, setRecentOrders] = useState<any[]>([])

  // Greeting
  const [greeting, setGreeting] = useState('')

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 11) setGreeting('Selamat Pagi')
    else if (hour < 15) setGreeting('Selamat Siang')
    else if (hour < 19) setGreeting('Selamat Sore')
    else setGreeting('Selamat Malam')

    fetchDashboardData()

    // Setup Realtime Subscription untuk update pesanan otomatis
    const channel = supabase.channel('dashboard_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchDashboardData() // Refresh data jika ada order baru/update
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const fetchDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/login'); return }
      setUser(user)

      // 1. Cek Restaurant & Role
      let restoData = null
      let userRole = ''
      
      const { data: ownerResto } = await supabase.from('restaurants').select('*').eq('user_id', user.id).single()
      if (ownerResto) {
        restoData = ownerResto; userRole = 'owner'
      } else {
        const { data: emp } = await supabase.from('employees').select('*, restaurants(*)').eq('user_id', user.id).eq('status', 'approved').single()
        if (emp && emp.restaurants) {
          // @ts-ignore
          restoData = emp.restaurants; userRole = emp.role
        }
      }

      if (restoData) {
        setRestaurant(restoData)
        setRole(userRole)

        // 2. Hitung Statistik Hari Ini
        const today = new Date().toISOString().split('T')[0]
        const { data: todayData } = await supabase
          .from('orders')
          .select('total_amount, status')
          .eq('restaurant_id', restoData.id)
          .gte('created_at', `${today}T00:00:00`)
          .neq('status', 'cancelled')

        if (todayData) {
          const revenue = todayData
            .filter(o => o.status === 'completed')
            .reduce((acc, curr) => acc + curr.total_amount, 0)
          
          const pending = todayData.filter(o => o.status === 'pending').length

          setStats({
            todayRevenue: revenue,
            todayOrders: todayData.length,
            pendingOrders: pending
          })
        }

        // 3. Ambil 5 Pesanan Terakhir (Recent Activity)
        const { data: recent } = await supabase
          .from('orders')
          .select('id, customer_name, total_amount, status, created_at, table_no')
          .eq('restaurant_id', restoData.id)
          .order('created_at', { ascending: false })
          .limit(5)
        
        if (recent) setRecentOrders(recent)
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

  const toggleStoreStatus = async () => {
    if (role !== 'owner') return alert('Hanya owner yang bisa mengubah status toko.')
    
    const newStatus = !restaurant.is_open
    // Optimistic Update
    setRestaurant({ ...restaurant, is_open: newStatus })
    
    await supabase.from('restaurants').update({ is_open: newStatus }).eq('id', restaurant.id)
  }

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="animate-pulse flex flex-col items-center">
        <div className="h-12 w-12 bg-slate-200 rounded-full mb-4"></div>
        <div className="h-4 w-32 bg-slate-200 rounded"></div>
      </div>
    </div>
  )

  if (!restaurant && role !== 'kasir' && role !== 'pelayan') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="text-center max-w-md">
          <Store size={48} className="mx-auto text-slate-300 mb-4"/>
          <h2 className="text-2xl font-bold text-slate-800">Belum ada Restoran</h2>
          <p className="text-slate-500 mb-6">Buat profil restoran Anda untuk memulai.</p>
          <button onClick={() => router.push('/create-restaurant')} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition">
            Buat Restoran
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F1F5F9]">
      
      {/* --- HEADER --- */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-6 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            {restaurant?.logo_url ? (
              <img src={restaurant.logo_url} alt="Logo" className="w-10 h-10 rounded-full object-cover border border-slate-200" />
            ) : (
              <div className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                {restaurant?.name?.charAt(0)}
              </div>
            )}
            <div>
              <h1 className="font-bold text-slate-800 leading-tight">{restaurant?.name}</h1>
              <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                <span className={`w-2 h-2 rounded-full ${restaurant?.is_open ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span>
                {restaurant?.is_open ? 'Operational' : 'Closed'}
                <span className="text-slate-300">|</span>
                <span className="capitalize">{role === 'owner' ? 'Owner' : role}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={() => window.open(`/restaurant/${restaurant.slug}`, '_blank')} className="hidden md:flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-indigo-600 transition">
              <ExternalLink size={16} /> <span className="hidden sm:inline">Lihat Web</span>
            </button>
            <div className="h-8 w-[1px] bg-slate-200 hidden md:block"></div>
            <button onClick={handleLogout} className="text-slate-400 hover:text-red-600 transition p-2 hover:bg-red-50 rounded-full">
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        
        {/* --- WELCOME & STORE TOGGLE --- */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-800">{greeting}, {user?.user_metadata?.full_name || 'Admin'}</h2>
            <p className="text-slate-500 mt-1">Berikut ringkasan performa restoran Anda hari ini.</p>
          </div>
          
          {role === 'owner' && (
            <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-sm font-medium text-slate-600 pl-2">Status Toko:</span>
              <button 
                onClick={toggleStoreStatus}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition flex items-center gap-2 ${
                  restaurant.is_open 
                  ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' 
                  : 'bg-red-100 text-red-700 hover:bg-red-200'
                }`}
              >
                {restaurant.is_open ? <CheckCircle size={16}/> : <LogOut size={16}/>}
                {restaurant.is_open ? 'BUKA' : 'TUTUP'}
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* --- LEFT COLUMN: STATS & LIVE FEED (2/3 Width) --- */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* 1. STATS CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Revenue */}
              <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-6 rounded-2xl text-white shadow-lg shadow-indigo-200 relative overflow-hidden group">
                <div className="relative z-10">
                  <p className="text-indigo-100 text-sm font-medium mb-1">Omset Hari Ini</p>
                  <h3 className="text-2xl font-bold">Rp {stats.todayRevenue.toLocaleString('id-ID')}</h3>
                </div>
                <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:scale-110 transition transform">
                  <TrendingUp size={48} />
                </div>
              </div>

              {/* Total Orders */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
                <div className="relative z-10">
                  <p className="text-slate-500 text-sm font-medium mb-1">Total Pesanan</p>
                  <h3 className="text-2xl font-bold text-slate-800">{stats.todayOrders} <span className="text-sm font-normal text-slate-400">trx</span></h3>
                </div>
                <div className="absolute right-0 top-0 p-4 text-slate-100 group-hover:text-slate-200 transition transform">
                  <ShoppingBag size={48} />
                </div>
              </div>

              {/* Pending Orders (Action Needed) */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
                 {stats.pendingOrders > 0 && <span className="absolute top-3 right-3 flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span></span>}
                <div className="relative z-10">
                  <p className="text-slate-500 text-sm font-medium mb-1">Perlu Diproses</p>
                  <h3 className="text-2xl font-bold text-orange-600">{stats.pendingOrders} <span className="text-sm font-normal text-slate-400">pesanan</span></h3>
                </div>
                 <div className="absolute right-0 top-0 p-4 text-orange-50 group-hover:text-orange-100 transition transform">
                  <Clock size={48} />
                </div>
              </div>
            </div>

            {/* 2. LIVE ORDER FEED */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Aktivitas Pesanan Terbaru
                </h3>
                <button onClick={() => router.push('/dashboard/orders')} className="text-sm text-indigo-600 font-medium hover:underline flex items-center">
                  Lihat Semua <ArrowUpRight size={14} className="ml-1"/>
                </button>
              </div>
              
              <div className="divide-y divide-slate-100">
                {recentOrders.length === 0 ? (
                  <div className="p-8 text-center text-slate-400">Belum ada pesanan hari ini.</div>
                ) : (
                  recentOrders.map((order) => (
                    <div key={order.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm
                          ${order.status === 'pending' ? 'bg-orange-100 text-orange-600' : 
                            order.status === 'cooking' ? 'bg-blue-100 text-blue-600' :
                            order.status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}
                        `}>
                          {order.table_no === '-' ? 'TA' : order.table_no}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">{order.customer_name}</p>
                          <p className="text-xs text-slate-500">{new Date(order.created_at).toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'})} • ID: {order.id.slice(0,6)}</p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-sm font-bold text-slate-700">Rp {order.total_amount.toLocaleString('id-ID')}</p>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full
                          ${order.status === 'pending' ? 'bg-orange-50 text-orange-600' : 
                            order.status === 'cooking' ? 'bg-blue-50 text-blue-600' :
                            order.status === 'completed' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}
                        `}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

          {/* --- RIGHT COLUMN: QUICK ACTIONS MENU (1/3 Width) --- */}
          <div className="space-y-6">
            
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h3 className="font-bold text-slate-800 mb-4 text-sm uppercase tracking-wider text-opacity-70">Menu Manajemen</h3>
              <div className="grid grid-cols-1 gap-3">
                
                <MenuButton 
                  icon={<Clock size={20}/>} 
                  label="Pesanan Masuk" 
                  desc="Kelola status pesanan"
                  color="text-blue-600" bg="bg-blue-50"
                  onClick={() => router.push('/dashboard/orders')}
                  badge={stats.pendingOrders > 0 ? stats.pendingOrders : undefined}
                />
                
                <MenuButton 
                  icon={<Utensils size={20}/>} 
                  label="Daftar Menu" 
                  desc="Harga & Stok"
                  color="text-orange-600" bg="bg-orange-50"
                  onClick={() => router.push('/dashboard/menu')}
                />

                 <MenuButton 
                  icon={<BookOpen size={20}/>} 
                  label="Desain Buku" 
                  desc="Upload gambar menu"
                  color="text-purple-600" bg="bg-purple-50"
                  onClick={() => router.push('/dashboard/pages')}
                />

              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h3 className="font-bold text-slate-800 mb-4 text-sm uppercase tracking-wider text-opacity-70">Lainnya</h3>
              <div className="grid grid-cols-1 gap-3">
                
                <MenuButton 
                  icon={<TrendingUp size={20}/>} 
                  label="Laporan" 
                  color="text-emerald-600" bg="bg-emerald-50"
                  onClick={() => router.push('/dashboard/report')}
                />

                <MenuButton 
                  icon={<QrCode size={20}/>} 
                  label="QR Code Meja" 
                  color="text-slate-600" bg="bg-slate-100"
                  onClick={() => router.push('/dashboard/qr')}
                />

                {role === 'owner' && (
                  <>
                    <MenuButton 
                      icon={<Users size={20}/>} 
                      label="Pegawai" 
                      color="text-pink-600" bg="bg-pink-50"
                      onClick={() => router.push('/dashboard/employees')}
                    />
                    <MenuButton 
                      icon={<Settings size={20}/>} 
                      label="Pengaturan" 
                      color="text-gray-600" bg="bg-gray-100"
                      onClick={() => router.push('/dashboard/settings')}
                    />
                  </>
                )}

              </div>
            </div>

          </div>

        </div>
      </main>
    </div>
  )
}

// Component Helper untuk Tombol Menu
function MenuButton({icon, label, desc, color, bg, onClick, badge}: any) {
  return (
    <button 
      onClick={onClick}
      className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition group w-full text-left border border-transparent hover:border-slate-100"
    >
      <div className={`w-10 h-10 ${bg} ${color} rounded-lg flex items-center justify-center shrink-0 group-hover:scale-110 transition`}>
        {icon}
      </div>
      <div className="flex-1">
        <h4 className="font-bold text-slate-800 text-sm flex items-center justify-between">
          {label}
          {badge && <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{badge}</span>}
        </h4>
        {desc && <p className="text-xs text-slate-400">{desc}</p>}
      </div>
      <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-500"/>
    </button>
  )
}