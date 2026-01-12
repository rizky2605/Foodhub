'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { ArrowLeft, Clock, CheckCircle, ChefHat, XCircle, RefreshCw } from 'lucide-react'

// Tipe Data Order
interface Order {
  id: string
  customer_name: string
  table_no: string
  total_amount: number
  status: 'pending' | 'cooking' | 'completed' | 'cancelled'
  created_at: string
  items?: any[] // Kita akan fetch items secara terpisah atau via join
}

export default function IncomingOrdersPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [restaurantId, setRestaurantId] = useState('')

  // Bunyi Notifikasi (Optional)
  const playNotificationSound = () => {
    try {
      const audio = new Audio('/notification.mp3') // Pastikan ada file mp3 di folder public
      audio.play().catch(e => console.log('Audio play failed', e))
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    fetchOrders()

    // Setup Realtime Subscription
    const channel = supabase
      .channel('orders_channel')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen semua event (INSERT, UPDATE)
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          // Jika ada order baru masuk atau status berubah
          console.log('Realtime update:', payload)
          if (payload.eventType === 'INSERT') {
            playNotificationSound()
            // Fetch ulang agar data sinkron
            fetchOrders() 
          } else if (payload.eventType === 'UPDATE') {
            fetchOrders()
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchOrders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // 1. Dapatkan ID Restoran (Logic Owner/Employee)
      let restoId = ''
      const { data: owner } = await supabase.from('restaurants').select('id').eq('user_id', user.id).single()
      if (owner) restoId = owner.id
      else {
        const { data: emp } = await supabase.from('employees').select('restaurant_id').eq('user_id', user.id).single()
        if (emp) restoId = emp.restaurant_id
      }
      
      setRestaurantId(restoId)

      // 2. Ambil Orders beserta Items-nya
      if (restoId) {
        const { data: ordersData, error } = await supabase
          .from('orders')
          .select(`
            *,
            order_items (
              id, name, quantity, price
            )
          `)
          .eq('restaurant_id', restoId)
          .order('created_at', { ascending: false }) // Yang baru di atas
          // Filter status agar order lama/selesai tidak menumpuk (opsional)
          .neq('status', 'cancelled') 
        
        if (error) console.error(error)
        else setOrders(ordersData || [])
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (orderId: string, newStatus: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId)
    
    if (error) alert('Gagal update status')
    else fetchOrders() // Refresh UI
  }

  // Helper warna status
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'cooking': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'completed': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch(status) {
      case 'pending': return 'Baru Masuk'
      case 'cooking': return 'Diproses'
      case 'completed': return 'Selesai'
      default: return status
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <button onClick={() => router.push('/dashboard')} className="mr-4 bg-white p-2 rounded-full shadow hover:bg-gray-50">
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Pesanan Masuk</h1>
          </div>
          <button onClick={fetchOrders} className="flex items-center gap-2 text-sm bg-white px-4 py-2 rounded-lg shadow hover:bg-gray-50">
             <RefreshCw size={16} /> Refresh
          </button>
        </div>

        {loading ? (
          <div className="text-center py-10">Memuat pesanan...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {orders.map((order) => (
              <div key={order.id} className={`bg-white rounded-xl shadow-sm border-l-4 overflow-hidden ${
                order.status === 'pending' ? 'border-yellow-400' : 
                order.status === 'cooking' ? 'border-blue-500' : 'border-green-500'
              }`}>
                {/* Header Kartu */}
                <div className="p-4 border-b border-gray-100 flex justify-between items-start bg-gray-50/50">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-lg text-gray-800">{order.customer_name}</span>
                      <span className="text-xs font-mono bg-gray-200 px-2 py-0.5 rounded">Meja {order.table_no}</span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {new Date(order.created_at).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}
                    </p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full border ${getStatusColor(order.status)}`}>
                    {getStatusLabel(order.status)}
                  </span>
                </div>

                {/* List Item */}
                <div className="p-4 max-h-60 overflow-y-auto">
                  <ul className="space-y-2">
                    {/* @ts-ignore */}
                    {order.order_items?.map((item, idx) => (
                      <li key={idx} className="flex justify-between text-sm">
                        <span className="text-gray-700">
                          <span className="font-bold mr-2">{item.quantity}x</span> 
                          {item.name}
                        </span>
                        <span className="text-gray-500">Rp {item.price.toLocaleString('id-ID')}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 pt-3 border-t border-dashed flex justify-between font-bold text-gray-900">
                    <span>Total</span>
                    <span>Rp {order.total_amount.toLocaleString('id-ID')}</span>
                  </div>
                </div>

                {/* Tombol Aksi */}
                <div className="p-4 bg-gray-50 border-t border-gray-100 grid grid-cols-2 gap-2">
                  {order.status === 'pending' && (
                    <>
                      <button 
                        onClick={() => updateStatus(order.id, 'cancelled')}
                        className="flex items-center justify-center gap-1 bg-white border border-red-200 text-red-600 py-2 rounded-lg hover:bg-red-50 text-sm font-medium"
                      >
                        <XCircle size={16} /> Tolak
                      </button>
                      <button 
                        onClick={() => updateStatus(order.id, 'cooking')}
                        className="flex items-center justify-center gap-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 text-sm font-medium"
                      >
                        <ChefHat size={16} /> Proses
                      </button>
                    </>
                  )}

                  {order.status === 'cooking' && (
                    <button 
                      onClick={() => updateStatus(order.id, 'completed')}
                      className="col-span-2 flex items-center justify-center gap-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 text-sm font-medium"
                    >
                      <CheckCircle size={16} /> Selesai / Antar
                    </button>
                  )}
                  
                  {order.status === 'completed' && (
                    <div className="col-span-2 text-center text-sm text-green-600 font-medium py-2 flex items-center justify-center gap-2">
                      <CheckCircle size={16} /> Pesanan Selesai
                    </div>
                  )}
                </div>
              </div>
            ))}

            {orders.length === 0 && (
              <div className="col-span-full text-center py-20 text-gray-400">
                <Clock size={48} className="mx-auto mb-4 opacity-50" />
                <p>Belum ada pesanan masuk.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}