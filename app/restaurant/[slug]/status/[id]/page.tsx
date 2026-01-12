'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { 
  ArrowLeft, CheckCircle, Clock, ChefHat, 
  Loader2, MapPin, Printer, Star, Calendar, 
  Hash, User, CreditCard, MessageCircle, Receipt
} from 'lucide-react'

export default function OrderStatusPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()

  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  // Review State
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [reviewSubmitted, setReviewSubmitted] = useState(false)
  const [submittingReview, setSubmittingReview] = useState(false)

  useEffect(() => {
    fetchOrder()
    
    // Realtime Tracking
    const channel = supabase.channel('order_tracking')
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'orders', 
        filter: `id=eq.${params.id}` 
      }, 
      (payload) => {
        setOrder((prev: any) => ({ ...prev, status: payload.new.status }))
      })
      .subscribe()
      
    return () => { supabase.removeChannel(channel) }
  }, [params.id])

  const fetchOrder = async () => {
    try {
      // Join ke order_items & restaurants
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (name, quantity, price),
          restaurants (id, name, slug, address, phone_number, logo_url)
        `)
        .eq('id', params.id)
        .single()

      if (error) throw error
      setOrder(data)
    } catch (err) {
      alert('Pesanan tidak ditemukan')
      router.push(`/dashboard`) 
    } finally {
      setLoading(false)
    }
  }

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (rating === 0) return alert('Silakan berikan bintang')
    setSubmittingReview(true)
    try {
      const { error } = await supabase.from('reviews').insert({
        restaurant_id: order.restaurants.id,
        order_id: order.id,
        customer_name: order.customer_name,
        rating,
        comment
      })
      if (error) throw error
      setReviewSubmitted(true)
    } catch (err) {
      alert('Gagal mengirim ulasan')
    } finally {
      setSubmittingReview(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const getStatusStep = (status: string) => {
    switch (status) {
      case 'pending': return 1
      case 'cooking': return 2
      case 'completed': return 3
      case 'cancelled': return 0
      default: return 1
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#F9F7F2]"><Loader2 className="animate-spin text-[#4A3B32]" size={32} /></div>
  if (!order) return null

  const currentStep = getStatusStep(order.status)
  const isCancelled = order.status === 'cancelled'

  return (
    <div className="min-h-screen bg-[#F9F7F2] font-sans pb-12 print:bg-white print:p-0">
      
      {/* --- HEADER NAV (Hidden on Print) --- */}
      <div className="bg-white/80 backdrop-blur-md sticky top-0 z-20 border-b border-[#e5e0d8] px-4 py-3 print:hidden">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <button onClick={() => router.push(`/restaurant/${params.slug}`)} className="flex items-center text-[#8c7b70] hover:text-[#4A3B32] transition">
            <ArrowLeft size={20} className="mr-1" /> <span className="text-sm font-bold">Menu</span>
          </button>
          <span className="font-serif font-bold text-[#4A3B32] text-lg">Detail Pesanan</span>
          <div className="w-8"></div> {/* Spacer */}
        </div>
      </div>

      <div className="max-w-md mx-auto p-6 space-y-6 print:hidden">

        {/* 1. STATUS CARD */}
        <div className="bg-white rounded-3xl shadow-xl border border-[#f0ebe0] overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#C8D6B9] to-[#CC8F4C]"></div>
          
          <div className="p-6 text-center">
             <div className="mb-4 inline-flex items-center justify-center w-20 h-20 bg-[#F9F7F2] rounded-full border-4 border-white shadow-inner">
                {currentStep === 1 && <Clock size={40} className="text-[#CC8F4C] animate-pulse"/>}
                {currentStep === 2 && <ChefHat size={40} className="text-[#556b46] animate-bounce"/>}
                {currentStep === 3 && <CheckCircle size={40} className="text-green-600"/>}
                {isCancelled && <X size={40} className="text-red-500"/>}
             </div>
             
             <h2 className="text-2xl font-serif font-bold text-[#4A3B32] mb-1">
               {isCancelled ? 'Pesanan Dibatalkan' : 
                currentStep === 1 ? 'Pesanan Diterima' : 
                currentStep === 2 ? 'Sedang Dimasak' : 'Pesanan Selesai'}
             </h2>
             <p className="text-[#8c7b70] text-sm">
               {isCancelled ? 'Hubungi kasir untuk info lebih lanjut' :
                currentStep === 1 ? 'Mohon tunggu konfirmasi dapur' : 
                currentStep === 2 ? 'Chef kami sedang menyiapkan hidangan' : 'Silakan nikmati hidangan Anda!'}
             </p>
          </div>

          {/* Stepper */}
          {!isCancelled && (
            <div className="bg-[#fcfbf9] p-6 border-t border-[#f0ebe0]">
              <div className="flex justify-between items-center relative">
                {/* Line Background */}
                <div className="absolute top-1/2 left-0 w-full h-1 bg-[#e5e0d8] -z-10 rounded-full"></div>
                {/* Line Progress */}
                <div className="absolute top-1/2 left-0 h-1 bg-[#CC8F4C] -z-10 rounded-full transition-all duration-700" 
                     style={{ width: currentStep === 1 ? '0%' : currentStep === 2 ? '50%' : '100%' }}></div>
                
                <StepIndicator step={1} current={currentStep} label="Masuk" />
                <StepIndicator step={2} current={currentStep} label="Proses" />
                <StepIndicator step={3} current={currentStep} label="Selesai" />
              </div>
            </div>
          )}
        </div>

        {/* 2. DETAIL PESANAN (Receipt Style) */}
        <div className="bg-white rounded-3xl shadow-sm border border-[#e5e0d8] p-6 relative">
          {/* Hiasan Gerigi Kertas di Atas */}
          <div className="absolute -top-2 left-0 w-full h-4 bg-[url('https://www.transparenttextures.com/patterns/saw-tooth.png')] opacity-50"></div>

          <div className="flex justify-between items-start mb-6 border-b border-dashed border-[#e5e0d8] pb-4">
            <div>
              <p className="text-xs text-[#8c7b70] mb-1">ID Pesanan</p>
              <p className="font-mono font-bold text-[#4A3B32] bg-[#F9F7F2] px-2 py-1 rounded text-xs tracking-wider">#{order.id.slice(0,8).toUpperCase()}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-[#8c7b70] mb-1">Tanggal</p>
              <p className="font-bold text-[#4A3B32] text-sm flex items-center justify-end gap-1">
                <Calendar size={14}/>
                {new Date(order.created_at).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: '2-digit'})}
              </p>
              <p className="text-xs text-[#CC8F4C] font-bold">
                {new Date(order.created_at).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}
              </p>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            {order.order_items.map((item: any, idx: number) => (
              <div key={idx} className="flex justify-between items-start">
                <div className="flex gap-3">
                  <div className="bg-[#F9F7F2] w-6 h-6 flex items-center justify-center rounded text-xs font-bold text-[#CC8F4C] border border-[#e5e0d8]">
                    {item.quantity}x
                  </div>
                  <span className="text-[#4A3B32] font-medium text-sm">{item.name}</span>
                </div>
                <span className="text-[#4A3B32] font-bold text-sm">
                  Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-dashed border-[#e5e0d8] pt-4 space-y-2">
            <div className="flex justify-between text-sm text-[#8c7b70]">
              <span>Subtotal</span>
              <span>Rp {order.total_amount.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between text-sm text-[#8c7b70]">
              <span>Pajak & Layanan (0%)</span>
              <span>Rp 0</span>
            </div>
            <div className="flex justify-between items-center pt-2 mt-2 border-t border-[#e5e0d8]">
              <span className="font-bold text-[#4A3B32] text-lg">TOTAL</span>
              <span className="font-bold text-[#CC8F4C] text-xl">Rp {order.total_amount.toLocaleString('id-ID')}</span>
            </div>
          </div>

          <div className="mt-6 flex gap-2">
             <div className="flex-1 bg-[#F9F7F2] p-3 rounded-xl flex items-center gap-3 border border-[#e5e0d8]">
                <User size={18} className="text-[#8c7b70]"/>
                <div>
                  <p className="text-[10px] text-[#8c7b70] uppercase font-bold">Pelanggan</p>
                  <p className="text-sm font-bold text-[#4A3B32] line-clamp-1">{order.customer_name}</p>
                </div>
             </div>
             <div className="flex-1 bg-[#F9F7F2] p-3 rounded-xl flex items-center gap-3 border border-[#e5e0d8]">
                <Hash size={18} className="text-[#8c7b70]"/>
                <div>
                  <p className="text-[10px] text-[#8c7b70] uppercase font-bold">Meja</p>
                  <p className="text-sm font-bold text-[#4A3B32]">{order.table_no}</p>
                </div>
             </div>
          </div>

          {/* Payment Status Badge */}
          <div className="mt-4 flex items-center justify-center gap-2 text-green-700 bg-green-50 p-2 rounded-lg border border-green-200">
             <CreditCard size={16} />
             <span className="text-xs font-bold uppercase tracking-wide">Pembayaran Lunas (QRIS)</span>
          </div>
        </div>

        {/* 3. ACTION BUTTONS */}
        <div className="grid grid-cols-2 gap-4">
           {/* Tombol Print (Muncul jika selesai) */}
           {currentStep === 3 && (
             <button 
               onClick={handlePrint}
               className="bg-[#4A3B32] text-white py-4 rounded-xl font-bold flex flex-col items-center justify-center gap-1 hover:bg-black transition shadow-lg col-span-1"
             >
               <Printer size={20} />
               <span className="text-xs">CETAK STRUK</span>
             </button>
           )}
           
           {/* Tombol WA (Selalu muncul) */}
           <button 
             onClick={() => {
                let phone = order.restaurants.phone_number?.replace(/\D/g, '') || ''
                if (phone.startsWith('0')) phone = '62' + phone.substring(1)
                window.open(`https://wa.me/${phone}`, '_blank')
             }}
             className={`bg-green-600 text-white py-4 rounded-xl font-bold flex flex-col items-center justify-center gap-1 hover:bg-green-700 transition shadow-lg ${currentStep === 3 ? 'col-span-1' : 'col-span-2'}`}
           >
             <MessageCircle size={20} />
             <span className="text-xs">HUBUNGI STAFF</span>
           </button>
        </div>

        {/* 4. REVIEW FORM (Only if Completed & Not Reviewed) */}
        {currentStep === 3 && !reviewSubmitted && (
          <div className="bg-white rounded-3xl shadow-lg border-2 border-[#CC8F4C]/20 p-6 animate-in slide-in-from-bottom">
            <div className="text-center mb-4">
               <h3 className="font-serif font-bold text-[#4A3B32] text-xl">Suka Makanannya?</h3>
               <p className="text-xs text-[#8c7b70]">Bantu kami dengan ulasan Anda ✨</p>
            </div>
            
            <form onSubmit={submitReview} className="space-y-4">
              <div className="flex justify-center gap-2 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} type="button" onClick={() => setRating(star)} className="focus:outline-none transform hover:scale-110 transition active:scale-95">
                    <Star 
                      size={36} 
                      className={`${star <= rating ? 'fill-[#CC8F4C] text-[#CC8F4C]' : 'text-gray-200 fill-gray-100'} transition-colors`} 
                    />
                  </button>
                ))}
              </div>
              <textarea 
                placeholder="Ceritakan pengalaman Anda..." 
                className="w-full p-4 bg-[#F9F7F2] rounded-xl border border-[#e5e0d8] text-sm focus:outline-none focus:ring-2 focus:ring-[#CC8F4C] text-[#4A3B32] placeholder-[#8c7b70]" 
                rows={3} 
                value={comment} 
                onChange={e=>setComment(e.target.value)}
              ></textarea>
              <button disabled={submittingReview} className="w-full bg-[#CC8F4C] text-white py-3 rounded-xl font-bold hover:bg-[#b0783d] transition shadow-md">
                {submittingReview ? 'Mengirim...' : 'Kirim Ulasan'}
              </button>
            </form>
          </div>
        )}

        {/* REVIEW SUCCESS MSG */}
        {reviewSubmitted && (
          <div className="bg-[#C8D6B9]/30 border border-[#C8D6B9] p-6 rounded-3xl text-center">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-2 text-[#556b46] shadow-sm">
               <Star size={24} fill="currentColor" />
            </div>
            <h3 className="font-bold text-[#425232]">Terima Kasih!</h3>
            <p className="text-xs text-[#556b46]">Ulasan Anda telah kami terima.</p>
          </div>
        )}

      </div>

      {/* --- STRUK CETAK (Thermal Printer 80mm Layout) --- */}
      {/* Hidden by default, Visible on Print */}
      <div className="hidden print:block font-mono text-black p-2 max-w-[80mm] mx-auto text-[12px] leading-tight">
        
        {/* Header Struk */}
        <div className="text-center mb-4 pb-4 border-b border-black border-dashed">
          <div className="flex justify-center mb-2">
             {/* Icon/Logo Placeholder untuk Struk */}
             <Receipt size={32} />
          </div>
          <h1 className="font-bold text-lg uppercase mb-1">{order.restaurants.name}</h1>
          <p className="text-[10px] px-4">{order.restaurants.address}</p>
        </div>

        {/* Info Transaksi */}
        <div className="mb-4 space-y-1">
          <div className="flex justify-between">
            <span>TGL : {new Date(order.created_at).toLocaleDateString('id-ID')}</span>
            <span>JAM : {new Date(order.created_at).toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'})}</span>
          </div>
          <div className="flex justify-between">
            <span>ORDER ID :</span>
            <span>#{order.id.slice(0,6).toUpperCase()}</span>
          </div>
          <div className="flex justify-between">
            <span>PELANGGAN :</span>
            <span>{order.customer_name}</span>
          </div>
           <div className="flex justify-between">
            <span>MEJA :</span>
            <span>{order.table_no}</span>
          </div>
        </div>

        {/* Item List */}
        <div className="mb-4 pb-4 border-b border-black border-dashed">
          <table className="w-full">
            <thead>
              <tr className="border-b border-black text-left">
                <th className="pb-1">ITEM</th>
                <th className="pb-1 text-center">QTY</th>
                <th className="pb-1 text-right">TOTAL</th>
              </tr>
            </thead>
            <tbody className="pt-2">
              {order.order_items.map((item: any, i: number) => (
                <tr key={i}>
                  <td className="pt-2 pr-1">{item.name}</td>
                  <td className="pt-2 text-center align-top">{item.quantity}</td>
                  <td className="pt-2 text-right align-top">{(item.price * item.quantity).toLocaleString('id-ID')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="mb-6 space-y-1 text-right">
          <div className="flex justify-between font-bold text-sm">
            <span>TOTAL TAGIHAN</span>
            <span>Rp {order.total_amount.toLocaleString('id-ID')}</span>
          </div>
          <div className="flex justify-between text-[10px] mt-2">
            <span>PEMBAYARAN</span>
            <span>QRIS / CASHLESS</span>
          </div>
        </div>

        {/* Footer Struk */}
        <div className="text-center border-t border-black border-dashed pt-4 mb-8">
          <p className="font-bold mb-1">TERIMA KASIH</p>
          <p className="text-[10px]">Silakan datang kembali!</p>
          <p className="text-[8px] mt-2 text-gray-500">Powered by FoodHub App</p>
        </div>

      </div>

    </div>
  )
}

// Komponen Helper untuk Stepper
function StepIndicator({step, current, label}: any) {
  const active = current >= step
  return (
    <div className="relative z-10 flex flex-col items-center gap-1">
      <div className={`w-4 h-4 rounded-full border-2 transition-all duration-500 ${active ? 'bg-[#CC8F4C] border-[#CC8F4C] scale-125' : 'bg-white border-gray-300'}`}></div>
      <span className={`text-[10px] font-bold uppercase tracking-wider transition-colors duration-500 ${active ? 'text-[#CC8F4C]' : 'text-gray-300'}`}>{label}</span>
    </div>
  )
}

// Icon Import (Pastikan X ada di Lucide import di atas)
import { X } from 'lucide-react'