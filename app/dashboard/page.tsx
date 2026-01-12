'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { 
  Store, Utensils, Users, Clock, 
  LogOut, ExternalLink, Settings, QrCode, 
  TrendingUp, BookOpen, ShoppingBag, 
  ChevronRight, ArrowUpRight, CheckCircle, 
  ShieldAlert, Lock, DollarSign, Coffee, Loader2 // <--- Loader2 ditambahkan di sini
} from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()
  const supabase = createClient()
  
  // State Data
  const [user, setUser] = useState<any>(null)
  const [restaurant, setRestaurant] = useState<any>(null)
  const [role, setRole] = useState<string>('') 
  const [employeeStatus, setEmployeeStatus] = useState<string>('') 
  const [loading, setLoading] = useState(true)

  // Statistik
  const [stats, setStats] = useState({
    todayRevenue: 0,
    todayOrders: 0,
    pendingOrders: 0
  })

  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [greeting, setGreeting] = useState('')

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 11) setGreeting('Selamat Pagi')
    else if (hour < 15) setGreeting('Selamat Siang')
    else if (hour < 19) setGreeting('Selamat Sore')
    else setGreeting('Selamat Malam')

    fetchDashboardData()

    const channel = supabase.channel('dashboard_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchDashboardData() 
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const fetchDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/login'); return }
      setUser(user)

      let restoData = null
      let userRole = ''
      let empStatus = ''

      // 1. Cek Owner
      const { data: ownerResto } = await supabase.from('restaurants').select('*').eq('user_id', user.id).single()
      
      if (ownerResto) {
        restoData = ownerResto
        userRole = 'owner'
        empStatus = 'approved'
      } else {
        // 2. Cek Employee
        const { data: emp } = await supabase.from('employees').select('*, restaurants(*)').eq('user_id', user.id).single()
        if (emp && emp.restaurants) {
          // @ts-ignore
          restoData = emp.restaurants
          userRole = emp.role
          empStatus = emp.status
        }
      }

      if (restoData) {
        setRestaurant(restoData)
        setRole(userRole)
        setEmployeeStatus(empStatus)

        if (empStatus === 'approved') {
          const today = new Date().toISOString().split('T')[0]
          
          // Fetch Stats
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

          // Fetch Recent Orders
          const { data: recent } = await supabase
            .from('orders')
            .select('id, customer_name, total_amount, status, created_at, table_no')
            .eq('restaurant_id', restoData.id)
            .order('created_at', { ascending: false })
            .limit(5)
          
          if (recent) setRecentOrders(recent)
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

  const toggleStoreStatus = async () => {
    if (role !== 'owner') return alert('Hanya owner yang bisa mengubah status toko.')
    const newStatus = !restaurant.is_open
    setRestaurant({ ...restaurant, is_open: newStatus })
    await supabase.from('restaurants').update({ is_open: newStatus }).eq('id', restaurant.id)
  }

  // --- LOGIC PERMISSION / HAK AKSES ---
  const canViewRevenue = ['owner', 'admin', 'kasir'].includes(role) // Pelayan gak boleh liat duit
  const canManageMenu = ['owner', 'admin'].includes(role)
  const canEditBook = ['owner', 'admin'].includes(role) // Kasir/Pelayan cuma view
  const canViewReport = ['owner', 'admin', 'kasir'].includes(role)
  const canManageEmployees = ['owner'].includes(role) // Hanya Owner
  const canSettings = ['owner'].includes(role)

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <Loader2 className="animate-spin text-indigo-600" size={32}/>
    </div>
  )

  // Block Access Logic
  if (role !== 'owner' && employeeStatus === 'pending') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white max-w-md w-full p-8 rounded-3xl shadow-xl text-center border border-slate-100">
          <div className="w-20 h-20 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse"><Clock size={40} /></div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Menunggu Persetujuan</h2>
          <p className="text-slate-500 mb-8">Akun Anda berhasil dibuat. Silakan minta Owner untuk menyetujui (Approve) akses Anda.</p>
          <button onClick={handleLogout} className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition flex items-center justify-center gap-2"><LogOut size={18}/> Keluar</button>
        </div>
      </div>
    )
  }

  if (role !== 'owner' && employeeStatus === 'rejected') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white max-w-md w-full p-8 rounded-3xl shadow-xl text-center border border-red-100">
          <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6"><Lock size={40} /></div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Akses Ditolak</h2>
          <p className="text-slate-500 mb-8">Akses Anda ke restoran ini telah dicabut.</p>
          <button onClick={handleLogout} className="w-full bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 transition flex items-center justify-center gap-2"><LogOut size={18}/> Keluar</button>
        </div>
      </div>
    )
  }

  if (!restaurant && role !== 'kasir' && role !== 'pelayan') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="text-center max-w-md">
          <Store size={48} className="mx-auto text-slate-300 mb-4"/>
          <h2 className="text-2xl font-bold text-slate-800">Belum ada Restoran</h2>
          <button onClick={() => router.push('/create-restaurant')} className="mt-4 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition">Buat Restoran</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      
      {/* HEADER */}
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
                <span className={`capitalize px-2 py-0.5 rounded text-white text-[10px] 
                  ${role === 'owner' ? 'bg-slate-800' : role === 'admin' ? 'bg-purple-600' : role === 'kasir' ? 'bg-blue-600' : 'bg-orange-500'}`}>
                  {role}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={() => window.open(`/restaurant/${restaurant.slug}`, '_blank')} className="hidden md:flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-indigo-600 transition">
              <ExternalLink size={16} /> <span className="hidden sm:inline">Web Menu</span>
            </button>
            <button onClick={handleLogout} className="text-slate-400 hover:text-red-600 transition p-2 hover:bg-red-50 rounded-full">
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        
        {/* WELCOME */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-800">{greeting}, {user?.user_metadata?.full_name?.split(' ')[0]}</h2>
            <p className="text-slate-500 mt-1 flex items-center gap-2">
              <ShieldAlert size={14} className="text-slate-400"/>
              Anda login sebagai <span className="font-bold capitalize text-slate-700">{role}</span>
            </p>
          </div>
          
          {role === 'owner' && (
            <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-sm font-medium text-slate-600 pl-2">Toko:</span>
              <button onClick={toggleStoreStatus} className={`px-4 py-2 rounded-lg text-sm font-bold transition flex items-center gap-2 ${restaurant.is_open ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}>
                {restaurant.is_open ? 'BUKA' : 'TUTUP'}
              </button>
            </div>
          )}
        </div>

        {/* STATS GRID (DIBEDAKAN BERDASARKAN ROLE) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              {/* 1. REVENUE (Hanya Owner, Admin, Kasir) */}
              {canViewRevenue ? (
                <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-6 rounded-2xl text-white shadow-lg shadow-indigo-200 relative overflow-hidden group">
                  <div className="relative z-10">
                    <p className="text-indigo-100 text-sm font-medium mb-1">Omset Hari Ini</p>
                    <h3 className="text-2xl font-bold">Rp {stats.todayRevenue.toLocaleString('id-ID')}</h3>
                  </div>
                  <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:scale-110 transition transform"><TrendingUp size={48} /></div>
                </div>
              ) : (
                /* Pelayan melihat ini pengganti Revenue */
                <div className="bg-gradient-to-br from-orange-400 to-pink-500 p-6 rounded-2xl text-white shadow-lg shadow-orange-200 relative overflow-hidden">
                  <div className="relative z-10">
                    <p className="text-white/80 text-sm font-medium mb-1">Halo Pelayan!</p>
                    <h3 className="text-xl font-bold">Semangat Kerja 💪</h3>
                  </div>
                  <div className="absolute right-0 top-0 p-4 opacity-20"><Coffee size={48} /></div>
                </div>
              )}

              {/* 2. TOTAL ORDERS (Semua) */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
                <div className="relative z-10">
                  <p className="text-slate-500 text-sm font-medium mb-1">Total Pesanan</p>
                  <h3 className="text-2xl font-bold text-slate-800">{stats.todayOrders} <span className="text-sm font-normal text-slate-400">trx</span></h3>
                </div>
                <div className="absolute right-0 top-0 p-4 text-slate-100 group-hover:text-slate-200 transition transform"><ShoppingBag size={48} /></div>
              </div>

              {/* 3. PENDING (Semua butuh lihat ini untuk action) */}
              <div onClick={() => router.push('/dashboard/orders')} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group cursor-pointer hover:border-orange-300 transition">
                 {stats.pendingOrders > 0 && <span className="absolute top-3 right-3 flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span></span>}
                <div className="relative z-10">
                  <p className="text-slate-500 text-sm font-medium mb-1">Pesanan Baru</p>
                  <h3 className="text-2xl font-bold text-orange-600">{stats.pendingOrders} <span className="text-sm font-normal text-slate-400">menunggu</span></h3>
                </div>
                 <div className="absolute right-0 top-0 p-4 text-orange-50 group-hover:text-orange-100 transition transform"><Clock size={48} /></div>
              </div>
            </div>

            {/* LIVE FEED (Semua Bisa Lihat) */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div> Aktivitas Terbaru
                </h3>
                <button onClick={() => router.push('/dashboard/orders')} className="text-sm text-indigo-600 font-medium hover:underline flex items-center">Lihat Semua <ArrowUpRight size={14} className="ml-1"/></button>
              </div>
              <div className="divide-y divide-slate-100">
                {recentOrders.length === 0 ? (
                  <div className="p-8 text-center text-slate-400">Belum ada pesanan hari ini.</div>
                ) : (
                  recentOrders.map((order) => (
                    <div key={order.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${order.status === 'pending' ? 'bg-orange-100 text-orange-600' : order.status === 'cooking' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                          {order.table_no === '-' ? 'TA' : order.table_no}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">{order.customer_name}</p>
                          <p className="text-xs text-slate-500">{new Date(order.created_at).toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'})}</p>
                        </div>
                      </div>
                      
                      {/* Pelayan tidak lihat harga di feed, hanya status */}
                      <div className="text-right">
                        {canViewRevenue && <p className="text-sm font-bold text-slate-700">Rp {order.total_amount.toLocaleString('id-ID')}</p>}
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${order.status === 'pending' ? 'bg-orange-50 text-orange-600' : order.status === 'cooking' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: ACTION MENU (DIBEDAKAN BERDASARKAN ROLE) */}
          <div className="space-y-6">
            
            {/* 1. OPERATIONAL MENU (Semua Perlu) */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h3 className="font-bold text-slate-800 mb-4 text-sm uppercase tracking-wider text-opacity-70">Operasional</h3>
              <div className="grid grid-cols-1 gap-3">
                <MenuButton 
                  icon={<Clock size={20}/>} 
                  label="Pesanan Masuk" 
                  desc="Proses pesanan pelanggan" 
                  color="text-blue-600" bg="bg-blue-50" 
                  onClick={() => router.push('/dashboard/orders')} 
                  badge={stats.pendingOrders > 0 ? stats.pendingOrders : undefined}
                />
                
                {/* Daftar Menu: Semua bisa lihat, tapi akses edit dibatasi di dalam halamannya */}
                <MenuButton 
                  icon={<Utensils size={20}/>} 
                  label={canManageMenu ? "Manajemen Menu" : "Daftar Menu"} 
                  desc={canManageMenu ? "Edit Harga & Stok" : "Cek Harga & Stok"}
                  color="text-orange-600" bg="bg-orange-50" 
                  onClick={() => router.push('/dashboard/menu')}
                />
              </div>
            </div>

            {/* 2. MANAGEMENT MENU (Admin/Owner/Kasir) */}
            {(canEditBook || canViewReport) && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <h3 className="font-bold text-slate-800 mb-4 text-sm uppercase tracking-wider text-opacity-70">Manajemen</h3>
                <div className="grid grid-cols-1 gap-3">
                  
                  {canEditBook && (
                    <MenuButton icon={<BookOpen size={20}/>} label="Desain Buku Menu" desc="Upload gambar menu" color="text-purple-600" bg="bg-purple-50" onClick={() => router.push('/dashboard/pages')}/>
                  )}

                  {canViewReport && (
                    <MenuButton icon={<TrendingUp size={20}/>} label="Laporan" desc="Analisa Penjualan" color="text-emerald-600" bg="bg-emerald-50" onClick={() => router.push('/dashboard/report')}/>
                  )}

                  {/* QR Code semua bisa akses untuk print ulang */}
                  <MenuButton icon={<QrCode size={20}/>} label="QR Code Meja" color="text-slate-600" bg="bg-slate-100" onClick={() => router.push('/dashboard/qr')}/>
                </div>
              </div>
            )}

            {/* 3. ADMIN MENU (Owner Only) */}
            {(canManageEmployees || canSettings) && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <h3 className="font-bold text-slate-800 mb-4 text-sm uppercase tracking-wider text-opacity-70">Admin Zone</h3>
                <div className="grid grid-cols-1 gap-3">
                  {canManageEmployees && (
                    <MenuButton icon={<Users size={20}/>} label="Pegawai" desc="Approval & Akses" color="text-pink-600" bg="bg-pink-50" onClick={() => router.push('/dashboard/employees')}/>
                  )}
                  {canSettings && (
                    <MenuButton icon={<Settings size={20}/>} label="Pengaturan" desc="Profil Resto" color="text-gray-600" bg="bg-gray-100" onClick={() => router.push('/dashboard/settings')}/>
                  )}
                </div>
              </div>
            )}

          </div>

        </div>
      </main>
    </div>
  )
}

function MenuButton({icon, label, desc, color, bg, onClick, badge}: any) {
  return (
    <button onClick={onClick} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition group w-full text-left border border-transparent hover:border-slate-100">
      <div className={`w-10 h-10 ${bg} ${color} rounded-lg flex items-center justify-center shrink-0 group-hover:scale-110 transition`}>{icon}</div>
      <div className="flex-1">
        <h4 className="font-bold text-slate-800 text-sm flex items-center justify-between">{label} {badge && <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{badge}</span>}</h4>
        {desc && <p className="text-xs text-slate-400">{desc}</p>}
      </div>
      <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-500"/>
    </button>
  )
}