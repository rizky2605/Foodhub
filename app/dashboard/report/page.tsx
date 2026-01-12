'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { 
  ArrowLeft, Calendar, DollarSign, 
  ShoppingBag, TrendingUp, Loader2 
} from 'lucide-react'

interface Order {
  id: string
  customer_name: string
  total_amount: number
  status: string
  created_at: string
}

export default function ReportPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<Order[]>([])
  
  // Statistik
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [totalOrders, setTotalOrders] = useState(0)
  
  // Filter Tanggal (Default: Hari ini)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    fetchReport()
  }, [selectedDate]) // Fetch ulang saat tanggal diganti

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
        // Cek employee (biasanya Admin yg boleh lihat report, tapi kita buka dulu untuk test)
        const { data: emp } = await supabase.from('employees').select('restaurant_id').eq('user_id', user.id).single()
        if (emp) restoId = emp.restaurant_id
      }

      if (!restoId) return

      // 2. Query Pesanan yang SELESAI (completed) pada tanggal terpilih
      // Trik filter tanggal di Supabase:
      const startDate = `${selectedDate}T00:00:00`
      const endDate = `${selectedDate}T23:59:59`

      const { data, error } = await supabase
        .from('orders')
        .select('id, customer_name, total_amount, status, created_at')
        .eq('restaurant_id', restoId)
        .eq('status', 'completed') // Hanya hitung yang sudah bayar/selesai
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: false })

      if (error) throw error

      if (data) {
        setOrders(data)
        
        // Hitung Total
        const revenue = data.reduce((acc, curr) => acc + curr.total_amount, 0)
        setTotalRevenue(revenue)
        setTotalOrders(data.length)
      }

    } catch (error) {
      console.error('Error fetching report:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <button onClick={() => router.push('/dashboard')} className="flex items-center text-gray-500 hover:text-blue-600 mb-6 transition">
          <ArrowLeft size={20} className="mr-2"/> Kembali ke Dashboard
        </button>

        <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Laporan Penjualan</h1>
            <p className="text-gray-500">Ringkasan pendapatan restoran Anda</p>
          </div>
          
          {/* Date Picker */}
          <div className="flex items-center bg-white border rounded-lg px-3 py-2 shadow-sm">
            <Calendar size={18} className="text-gray-400 mr-2" />
            <input 
              type="date" 
              className="outline-none text-gray-700 bg-transparent"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
        </div>

        {/* STATISTIK CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Card Pendapatan */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-white/20 p-3 rounded-lg">
                <DollarSign size={24} />
              </div>
              <span className="text-blue-100 text-sm font-medium">Hari Ini ({selectedDate})</span>
            </div>
            <p className="text-blue-100 text-sm mb-1">Total Pendapatan</p>
            <h2 className="text-3xl font-bold">Rp {totalRevenue.toLocaleString('id-ID')}</h2>
          </div>

          {/* Card Jumlah Pesanan */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
             <div className="flex items-center justify-between mb-4">
              <div className="bg-orange-100 text-orange-600 p-3 rounded-lg">
                <ShoppingBag size={24} />
              </div>
              <span className="text-gray-400 text-sm font-medium">Status: Selesai</span>
            </div>
            <p className="text-gray-500 text-sm mb-1">Total Transaksi</p>
            <h2 className="text-3xl font-bold text-gray-800">{totalOrders} <span className="text-sm font-normal text-gray-500">pesanan</span></h2>
          </div>
        </div>

        {/* TABEL RIWAYAT */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-gray-800 flex items-center">
              <TrendingUp size={18} className="mr-2 text-green-600" /> Riwayat Transaksi
            </h3>
          </div>

          {loading ? (
            <div className="p-10 text-center flex justify-center text-gray-500">
              <Loader2 className="animate-spin mr-2" /> Memuat data...
            </div>
          ) : orders.length === 0 ? (
            <div className="p-10 text-center text-gray-400">
              Belum ada transaksi selesai pada tanggal ini.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-500 font-medium border-b">
                  <tr>
                    <th className="p-4">Jam</th>
                    <th className="p-4">Pelanggan</th>
                    <th className="p-4">ID Pesanan</th>
                    <th className="p-4 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="p-4 text-gray-500">
                        {new Date(order.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="p-4 font-medium text-gray-900">{order.customer_name}</td>
                      <td className="p-4 text-gray-400 font-mono text-xs">{order.id.slice(0, 8)}...</td>
                      <td className="p-4 text-right font-bold text-green-600">
                        + Rp {order.total_amount.toLocaleString('id-ID')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}