'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { 
  ArrowLeft, Calendar, DollarSign, 
  ShoppingBag, TrendingUp, Loader2, 
  Filter, Download, ChevronDown, Package, PieChart
} from 'lucide-react'

// --- TYPES ---
interface OrderItem {
  name: string
  quantity: number
  price: number
}

interface Order {
  id: string
  customer_name: string
  total_amount: number
  status: string
  created_at: string
  order_items: OrderItem[]
}

interface TopItem {
  name: string
  totalQty: number
  totalSales: number
}

export default function ReportPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<Order[]>([])
  
  // Filter State
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month'>('today')

  // Calculated Stats
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [totalOrders, setTotalOrders] = useState(0)
  const [totalItemsSold, setTotalItemsSold] = useState(0)
  const [averageOrderValue, setAverageOrderValue] = useState(0)
  const [topItems, setTopItems] = useState<TopItem[]>([])

  useEffect(() => {
    fetchReport()
  }, [dateRange])

  const fetchReport = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // 1. Ambil ID Restoran
      let restoId = ''
      const { data: owner } = await supabase.from('restaurants').select('id').eq('user_id', user.id).single()
      if (owner) restoId = owner.id
      else {
        const { data: emp } = await supabase.from('employees').select('restaurant_id').eq('user_id', user.id).single()
        if (emp) restoId = emp.restaurant_id
      }
      if (!restoId) return

      // 2. Tentukan Rentang Waktu
      const now = new Date()
      let startDate = new Date()

      if (dateRange === 'today') {
        startDate = new Date(now.setHours(0, 0, 0, 0))
      } else if (dateRange === 'week') {
        startDate.setDate(now.getDate() - 7)
      } else if (dateRange === 'month') {
        startDate.setDate(now.getDate() - 30)
      }

      // 3. Query Pesanan + Item Detail
      // Kita butuh order_items untuk menghitung best seller
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id, customer_name, total_amount, status, created_at,
          order_items (name, quantity, price)
        `)
        .eq('restaurant_id', restoId)
        .eq('status', 'completed') // Hanya hitung yang lunas
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false })

      if (error) throw error

      if (data) {
        // @ts-ignore
        const safeData: Order[] = data
        setOrders(safeData)
        processAnalytics(safeData)
      }

    } catch (error) {
      console.error('Error fetching report:', error)
    } finally {
      setLoading(false)
    }
  }

  // --- LOGIC ANALISA DATA ---
  const processAnalytics = (data: Order[]) => {
    // 1. Total Pendapatan & Order
    const revenue = data.reduce((acc, curr) => acc + curr.total_amount, 0)
    setTotalRevenue(revenue)
    setTotalOrders(data.length)

    // 2. Average Order Value (AOV)
    setAverageOrderValue(data.length > 0 ? revenue / data.length : 0)

    // 3. Analisa Item (Best Seller & Total Items)
    let itemCount = 0
    const itemMap: Record<string, TopItem> = {}

    data.forEach(order => {
      order.order_items.forEach(item => {
        itemCount += item.quantity
        
        if (!itemMap[item.name]) {
          itemMap[item.name] = { name: item.name, totalQty: 0, totalSales: 0 }
        }
        itemMap[item.name].totalQty += item.quantity
        itemMap[item.name].totalSales += (item.price * item.quantity)
      })
    })

    setTotalItemsSold(itemCount)

    // Urutkan Best Seller (Top 5)
    const sortedItems = Object.values(itemMap)
      .sort((a, b) => b.totalQty - a.totalQty)
      .slice(0, 5)
    
    setTopItems(sortedItems)
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 pb-20 print:bg-white print:p-0">
      <div className="max-w-6xl mx-auto">
        
        {/* --- HEADER --- */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 print:hidden">
          <div>
            <button onClick={() => router.push('/dashboard')} className="flex items-center text-slate-500 hover:text-blue-600 mb-2 transition text-sm font-medium">
              <ArrowLeft size={16} className="mr-1"/> Kembali ke Dashboard
            </button>
            <h1 className="text-2xl font-bold text-slate-900">Analisa Bisnis</h1>
            <p className="text-slate-500 text-sm">Pantau performa penjualan restoran Anda.</p>
          </div>
          
          <div className="flex gap-2">
            {/* Date Filter Tabs */}
            <div className="bg-white border border-slate-200 p-1 rounded-xl flex shadow-sm">
              <button 
                onClick={() => setDateRange('today')}
                className={`px-4 py-2 text-sm font-bold rounded-lg transition ${dateRange === 'today' ? 'bg-slate-900 text-white shadow' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                Hari Ini
              </button>
              <button 
                onClick={() => setDateRange('week')}
                className={`px-4 py-2 text-sm font-bold rounded-lg transition ${dateRange === 'week' ? 'bg-slate-900 text-white shadow' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                7 Hari
              </button>
              <button 
                onClick={() => setDateRange('month')}
                className={`px-4 py-2 text-sm font-bold rounded-lg transition ${dateRange === 'month' ? 'bg-slate-900 text-white shadow' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                30 Hari
              </button>
            </div>

            <button onClick={handlePrint} className="bg-white border border-slate-200 text-slate-600 p-2.5 rounded-xl hover:bg-slate-50 shadow-sm" title="Print Laporan">
              <Download size={20} />
            </button>
          </div>
        </div>

        {/* --- LOADING STATE --- */}
        {loading ? (
           <div className="h-64 flex flex-col items-center justify-center text-slate-400">
             <Loader2 className="animate-spin mb-2" size={32}/>
             <p>Mengambil data transaksi...</p>
           </div>
        ) : (
          <>
            {/* --- 1. KPI CARDS (GRID) --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              
              {/* Total Revenue */}
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-5 rounded-2xl text-white shadow-lg shadow-blue-200">
                <div className="flex items-center gap-2 mb-2 opacity-90">
                  <div className="p-1.5 bg-white/20 rounded-lg"><DollarSign size={16}/></div>
                  <span className="text-sm font-medium">Total Omset</span>
                </div>
                <h3 className="text-2xl font-bold">Rp {totalRevenue.toLocaleString('id-ID')}</h3>
                <p className="text-xs text-blue-100 mt-1 opacity-80">
                  {dateRange === 'today' ? 'Pendapatan hari ini' : 'Pendapatan periode ini'}
                </p>
              </div>

              {/* Total Orders */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 mb-2 text-slate-500">
                   <div className="p-1.5 bg-orange-100 text-orange-600 rounded-lg"><ShoppingBag size={16}/></div>
                   <span className="text-sm font-medium">Total Transaksi</span>
                </div>
                <h3 className="text-2xl font-bold text-slate-800">{totalOrders}</h3>
                <p className="text-xs text-slate-400 mt-1">Pesanan selesai</p>
              </div>

              {/* Items Sold */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 mb-2 text-slate-500">
                   <div className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg"><Package size={16}/></div>
                   <span className="text-sm font-medium">Item Terjual</span>
                </div>
                <h3 className="text-2xl font-bold text-slate-800">{totalItemsSold}</h3>
                <p className="text-xs text-slate-400 mt-1">Porsi makanan/minuman</p>
              </div>

              {/* Average Order Value */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 mb-2 text-slate-500">
                   <div className="p-1.5 bg-purple-100 text-purple-600 rounded-lg"><TrendingUp size={16}/></div>
                   <span className="text-sm font-medium">Rata-rata Order</span>
                </div>
                <h3 className="text-2xl font-bold text-slate-800">Rp {Math.round(averageOrderValue).toLocaleString('id-ID')}</h3>
                <p className="text-xs text-slate-400 mt-1">Per pelanggan</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
              
              {/* --- 2. MENU TERLARIS (BEST SELLER) --- */}
              <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                 <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                       <PieChart className="text-orange-500" size={20}/>
                       Menu Terlaris
                    </h3>
                    <span className="text-xs font-bold bg-orange-100 text-orange-700 px-2 py-1 rounded">TOP 5</span>
                 </div>

                 {topItems.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 text-sm">Belum ada data penjualan.</div>
                 ) : (
                    <div className="space-y-5">
                       {topItems.map((item, index) => {
                          // Hitung persentase bar chart sederhana
                          const maxQty = topItems[0].totalQty
                          const percent = Math.round((item.totalQty / maxQty) * 100)
                          
                          return (
                             <div key={index}>
                                <div className="flex justify-between items-end mb-1 text-sm">
                                   <span className="font-bold text-slate-700">
                                      {index + 1}. {item.name}
                                   </span>
                                   <span className="font-bold text-slate-900">
                                      {item.totalQty} <span className="text-xs font-normal text-slate-400">terjual</span>
                                   </span>
                                </div>
                                {/* Bar Chart CSS */}
                                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                                   <div 
                                      className="h-full bg-blue-500 rounded-full transition-all duration-1000" 
                                      style={{ width: `${percent}%` }}
                                   ></div>
                                </div>
                                <div className="text-right mt-1 text-[10px] text-slate-400">
                                   Omset: Rp {item.totalSales.toLocaleString('id-ID')}
                                </div>
                             </div>
                          )
                       })}
                    </div>
                 )}
              </div>

              {/* --- 3. RECENT TRANSACTIONS (Simplified) --- */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col h-full">
                 <h3 className="font-bold text-slate-800 mb-4">Transaksi Terakhir</h3>
                 <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar max-h-[400px]">
                    {orders.slice(0, 10).map(order => (
                       <div key={order.id} className="flex justify-between items-center py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 px-2 rounded-lg transition">
                          <div>
                             <p className="font-bold text-slate-700 text-sm">{order.customer_name}</p>
                             <p className="text-xs text-slate-400">
                                {new Date(order.created_at).toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'})}
                             </p>
                          </div>
                          <div className="text-right">
                             <p className="font-bold text-green-600 text-sm">+ {order.total_amount.toLocaleString('id-ID')}</p>
                             <p className="text-[10px] bg-green-50 text-green-600 px-1.5 rounded inline-block">Lunas</p>
                          </div>
                       </div>
                    ))}
                    {orders.length === 0 && <div className="text-slate-400 text-sm text-center mt-10">Belum ada transaksi.</div>}
                 </div>
              </div>
            </div>

            {/* --- 4. PRINT FOOTER (Only visible when printing) --- */}
            <div className="hidden print:block text-center border-t pt-4 mt-8">
               <p className="font-bold text-xl">Laporan Penjualan</p>
               <p className="text-sm">Dicetak pada: {new Date().toLocaleString('id-ID')}</p>
               <p className="text-sm mt-2">Periode Data: {dateRange.toUpperCase()}</p>
            </div>
          </>
        )}
      </div>

      <style jsx global>{`
         .custom-scrollbar::-webkit-scrollbar { width: 4px; }
         .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; }
         .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 10px; }
      `}</style>
    </div>
  )
}