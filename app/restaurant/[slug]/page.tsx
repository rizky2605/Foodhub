'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { 
  Loader2, ChevronLeft, ChevronRight, 
  ShoppingBag, User, Hash, X, Plus, Minus, 
  MessageCircle, QrCode, CreditCard, 
  MapPin, Clock, Info, Utensils
} from 'lucide-react'
import Image from 'next/image'

// --- TYPES ---
interface MenuPage { id: string; image_url: string; page_number: number }
interface MenuItem { id: string; name: string; price: number; original_price?: number; category_id?: string }
interface Category { id: string; name: string }
interface CartItem extends MenuItem { quantity: number }

export default function FlipbookMenuPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  
  // Data State
  const [restaurant, setRestaurant] = useState<any>(null)
  const [pages, setPages] = useState<MenuPage[]>([])
  const [categories, setCategories] = useState<Category[]>([]) 
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)

  // Flipbook State
  const [currentPageIdx, setCurrentPageIdx] = useState(0)

  // Order & Cart State
  const [cart, setCart] = useState<CartItem[]>([])
  const [isOrderSheetOpen, setIsOrderSheetOpen] = useState(false)
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all')
  
  // Payment State
  const [customerName, setCustomerName] = useState('')
  const [tableNo, setTableNo] = useState('')
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const slug = params.slug
        const { data: resto } = await supabase.from('restaurants').select('*').eq('slug', slug).single()
        if (!resto) return
        setRestaurant(resto)

        const { data: pagesData } = await supabase.from('menu_pages').select('*').eq('restaurant_id', resto.id).order('page_number', { ascending: true })
        setPages(pagesData || [])

        const { data: catData } = await supabase.from('categories').select('*').eq('restaurant_id', resto.id).order('created_at', { ascending: true })
        setCategories(catData || [])

        const { data: itemsData } = await supabase.from('menu_items').select('*').eq('restaurant_id', resto.id).eq('is_available', true).order('name', { ascending: true })
        setMenuItems(itemsData || [])

      } catch (err) { console.error(err) } finally { setLoading(false) }
    }
    fetchData()
  }, [params.slug, supabase])

  // --- LOGIC ---
  const nextPage = () => { if (currentPageIdx < pages.length - 1) setCurrentPageIdx(c => c + 1) }
  const prevPage = () => { if (currentPageIdx > 0) setCurrentPageIdx(c => c - 1) }

  const updateQty = (item: MenuItem, delta: number) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === item.id)
      if (existing) {
        const newQty = existing.quantity + delta
        if (newQty <= 0) return prev.filter(c => c.id !== item.id)
        return prev.map(c => c.id === item.id ? { ...c, quantity: newQty } : c)
      } else {
        if (delta > 0) return [...prev, { ...item, quantity: 1 }]
        return prev
      }
    })
  }

  const getItemQty = (id: string) => cart.find(c => c.id === id)?.quantity || 0
  const getTotalPrice = () => cart.reduce((total, item) => total + (item.price * item.quantity), 0)

  // Payment Logic
  const handleOpenPayment = () => {
    // Validasi di sini sebelum buka modal
    if (!customerName.trim()) return alert('Mohon isi Nama Pemesan terlebih dahulu.')
    
    setIsOrderSheetOpen(false) 
    setIsPaymentModalOpen(true)
  }

  const handleConfirmPayment = async () => {
    setIsProcessing(true)
    try {
      const { data: order } = await supabase.from('orders').insert({
        restaurant_id: restaurant.id, customer_name: customerName, table_no: tableNo || '-',
        total_amount: getTotalPrice(), status: 'pending'
      }).select().single()

      const itemsPayload = cart.map(c => ({
        order_id: order.id, menu_item_id: c.id, name: c.name, price: c.price, quantity: c.quantity
      }))
      await supabase.from('order_items').insert(itemsPayload)
      router.push(`/restaurant/${params.slug}/status/${order.id}`)
    } catch (err) { alert('Gagal memproses pesanan') } finally { setIsProcessing(false) }
  }

  const handleWhatsApp = () => {
    if (!restaurant?.phone_number) return alert('Nomor WhatsApp belum disetting.')
    let phone = restaurant.phone_number.replace(/\D/g, '')
    if (phone.startsWith('0')) phone = '62' + phone.substring(1)
    window.open(`https://wa.me/${phone}`, '_blank')
  }

  const filteredItems = activeCategoryFilter === 'all' ? menuItems : menuItems.filter(i => i.category_id === activeCategoryFilter)

  if (loading) return <div className="min-h-screen bg-[#F9F7F2] flex items-center justify-center"><Loader2 className="animate-spin text-[#4A3B32]"/></div>

  if (pages.length === 0) return <div className="min-h-screen bg-[#F9F7F2] flex items-center justify-center text-[#4A3B32] font-serif">Buku menu belum tersedia.</div>

  return (
    <div className="fixed inset-0 bg-[#F9F7F2] overflow-hidden flex flex-col font-sans">
      
      {/* Background Texture */}
      <div className="absolute inset-0 opacity-40 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] pointer-events-none z-0"></div>

      {/* --- HEADER --- */}
      <header className="relative z-40 px-4 py-3 md:py-4 flex justify-between items-center bg-white/60 backdrop-blur-md border-b border-white/40 shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-[#CC8F4C] overflow-hidden shadow-md bg-white">
            {restaurant.logo_url ? (
               <Image src={restaurant.logo_url} alt="Logo" fill className="object-cover" />
            ) : (
               <div className="w-full h-full flex items-center justify-center text-[#4A3B32]"><Utensils size={20}/></div>
            )}
          </div>
          <div className="flex flex-col">
            <h1 className="font-serif font-bold text-[#4A3B32] text-lg md:text-xl leading-none tracking-wide">{restaurant.name}</h1>
            <div className="flex items-center gap-2 text-xs text-[#8c7b70] mt-1 font-medium">
              <span className="flex items-center"><MapPin size={10} className="mr-0.5"/> {restaurant.address?.slice(0, 20)}...</span>
              <span className="w-1 h-1 rounded-full bg-[#CC8F4C]"></span>
              <span className={`flex items-center ${restaurant.is_open ? 'text-green-700' : 'text-red-600'}`}>{restaurant.is_open ? 'Buka' : 'Tutup'}</span>
            </div>
          </div>
        </div>
        <button className="w-8 h-8 flex items-center justify-center rounded-full bg-[#e5e0d8]/50 text-[#4A3B32] hover:bg-[#CC8F4C] hover:text-white transition">
           <Info size={18} />
        </button>
      </header>

      {/* --- FLIPBOOK MAIN --- */}
      <main className="flex-1 relative w-full flex items-center justify-center p-4 overflow-hidden pb-20">
        <div className="relative w-full h-full max-w-2xl flex items-center justify-center perspective-container">
          <div className="relative w-full h-full max-h-full aspect-[3/4] preserve-3d transition-transform duration-500">
              {pages.map((page, index) => {
                  let transformStyle = index < currentPageIdx ? 'rotateY(-180deg)' : 'rotateY(0deg)'
                  let zIndex = pages.length - index
                  return (
                      <div key={page.id} 
                          className="absolute inset-0 bg-transparent rounded-r-lg rounded-l-sm drop-shadow-2xl transition-transform duration-700 ease-[cubic-bezier(0.645,0.045,0.355,1)] origin-left overflow-hidden backface-hidden"
                          style={{ zIndex, transform: transformStyle }}>
                          <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-black/10 to-transparent z-10 pointer-events-none mix-blend-multiply"></div>
                          <div className="relative w-full h-full">
                             <Image src={page.image_url} alt={`Page ${index + 1}`} fill className="object-contain" priority={index <= 1} />
                          </div>
                      </div>
                  )
              })}
          </div>
          <div className="absolute bottom-0 md:bottom-auto md:top-1/2 md:-translate-y-1/2 w-full flex justify-between px-4 md:px-0 md:-mx-16 z-30 pointer-events-none">
              <button onClick={prevPage} disabled={currentPageIdx===0} className="pointer-events-auto p-3 bg-white/80 backdrop-blur text-[#4A3B32] rounded-full shadow-lg disabled:opacity-0 hover:scale-110 transition active:scale-95"><ChevronLeft size={24}/></button>
              <button onClick={nextPage} disabled={currentPageIdx===pages.length-1} className="pointer-events-auto p-3 bg-white/80 backdrop-blur text-[#4A3B32] rounded-full shadow-lg disabled:opacity-0 hover:scale-110 transition active:scale-95"><ChevronRight size={24}/></button>
          </div>
        </div>
      </main>

      {/* --- FLOATING BUTTONS --- */}
      {restaurant.is_open && (
        <div className="absolute bottom-6 right-6 z-50 flex flex-col gap-3 items-end">
          <button onClick={handleWhatsApp} className="flex items-center justify-center w-12 h-12 bg-[#25D366] text-white rounded-full shadow-lg hover:brightness-110 transition hover:scale-105 border-2 border-white" title="Chat WhatsApp"><MessageCircle size={24} /></button>
          <button onClick={() => setIsOrderSheetOpen(true)} className="group flex items-center gap-3 bg-[#CC8F4C] text-white pl-4 pr-6 py-3 rounded-full shadow-xl hover:bg-[#b0783d] transition transform hover:scale-105 border-2 border-white">
            <div className="bg-white/20 p-2 rounded-full"><ShoppingBag size={20} /></div>
            <div className="text-left leading-tight">
              <div className="font-bold text-sm tracking-wide">ORDER</div>
              <div className="text-[10px] opacity-90">Klik disini</div>
            </div>
            {cart.length > 0 && <span className="absolute -top-2 -right-1 bg-[#4A3B32] text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full border-2 border-white shadow-sm animate-bounce">{cart.reduce((a,b)=>a+b.quantity,0)}</span>}
          </button>
        </div>
      )}

      {/* --- DRAWER ORDER SHEET --- */}
      {isOrderSheetOpen && (
        <div className="absolute inset-0 z-[60] flex flex-col justify-end bg-[#4A3B32]/30 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-[#F9F7F2] rounded-t-[2rem] h-[90vh] w-full max-w-lg mx-auto flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.2)] animate-in slide-in-from-bottom duration-300 border-t-4 border-[#CC8F4C]">
            
            {/* Drawer Header */}
            <div className="px-6 pt-6 pb-2 bg-[#F9F7F2] rounded-t-[2rem] shadow-sm z-10 shrink-0">
              <div className="flex justify-between items-center mb-4">
                <div><h3 className="font-serif font-bold text-xl text-[#4A3B32]">Daftar Menu</h3></div>
                <button onClick={() => setIsOrderSheetOpen(false)} className="p-2 bg-[#e5e0d8] rounded-full hover:bg-[#d4cec5] text-[#4A3B32]"><X size={20} /></button>
              </div>
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                <button onClick={() => setActiveCategoryFilter('all')} className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition ${activeCategoryFilter === 'all' ? 'bg-[#4A3B32] text-white shadow-md' : 'bg-white border border-[#e5e0d8] text-[#8c7b70]'}`}>Semua</button>
                {categories.map(cat => (
                  <button key={cat.id} onClick={() => setActiveCategoryFilter(cat.id)} className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition ${activeCategoryFilter === cat.id ? 'bg-[#4A3B32] text-white shadow-md' : 'bg-white border border-[#e5e0d8] text-[#8c7b70]'}`}>{cat.name}</button>
                ))}
              </div>
            </div>

            {/* Menu List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-white/50">
              {filteredItems.map(item => {
                const qty = getItemQty(item.id)
                const isDiscount = item.original_price && item.original_price > item.price
                return (
                  <div key={item.id} className="flex flex-col p-4 bg-white rounded-2xl shadow-sm border border-[#f0ebe0]">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 pr-2">
                        <div className="font-bold text-[#4A3B32] text-base leading-tight">{item.name}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-sm font-bold ${isDiscount ? 'text-red-600' : 'text-[#CC8F4C]'}`}>Rp {item.price.toLocaleString('id-ID')}</span>
                          {isDiscount && <span className="text-xs text-gray-400 line-through decoration-red-300">{item.original_price?.toLocaleString('id-ID')}</span>}
                        </div>
                      </div>
                      {qty === 0 ? (
                        <button onClick={() => updateQty(item, 1)} className="bg-[#f4f1ea] text-[#8c7b70] px-4 py-2 rounded-xl text-xs font-bold hover:bg-[#CC8F4C] hover:text-white transition border border-[#e5e0d8]">+ Add</button>
                      ) : (
                        <div className="flex items-center bg-[#CC8F4C] text-white rounded-xl shadow-md">
                          <button onClick={() => updateQty(item, -1)} className="p-2 hover:bg-[#b0783d] rounded-l-xl"><Minus size={14}/></button>
                          <span className="w-8 text-center font-bold text-sm bg-white/10 h-full flex items-center justify-center">{qty}</span>
                          <button onClick={() => updateQty(item, 1)} className="p-2 hover:bg-[#b0783d] rounded-r-xl"><Plus size={14}/></button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
              {filteredItems.length === 0 && <div className="text-center py-10 text-gray-400 text-sm">Tidak ada menu di kategori ini.</div>}
            </div>

            {/* Footer Checkout + INPUT NAMA */}
            <div className="p-6 border-t border-[#e5e0d8] bg-white safe-area-bottom shrink-0">
              <div className="flex justify-between items-center mb-4 bg-[#F9F7F2] p-3 rounded-xl border border-[#e5e0d8]">
                <span className="text-[#8c7b70] font-bold text-sm">Total Estimasi</span>
                <span className="text-2xl font-bold text-[#4A3B32]">Rp {getTotalPrice().toLocaleString('id-ID')}</span>
              </div>
              
              {cart.length > 0 ? (
                <div className="space-y-3 animate-in slide-in-from-bottom fade-in">
                  
                  {/* INPUT FIELDS (PINDAH KE SINI) */}
                  <div className="grid grid-cols-2 gap-3">
                     <div className="space-y-1">
                        <label className="text-[10px] font-bold text-[#8c7b70] uppercase ml-1">Nama Pemesan</label>
                        <div className="relative">
                          <User size={16} className="absolute left-3 top-3 text-[#CC8F4C]"/>
                          <input 
                            required 
                            value={customerName} 
                            onChange={e=>setCustomerName(e.target.value)} 
                            className="w-full pl-9 py-2.5 border border-[#e5e0d8] rounded-xl bg-[#F9F7F2] text-[#4A3B32] text-sm focus:bg-white focus:ring-2 focus:ring-[#CC8F4C] outline-none"
                            placeholder="Nama"
                          />
                        </div>
                     </div>
                     <div className="space-y-1">
                        <label className="text-[10px] font-bold text-[#8c7b70] uppercase ml-1">No. Meja</label>
                        <div className="relative">
                          <Hash size={16} className="absolute left-3 top-3 text-[#CC8F4C]"/>
                          <input 
                            value={tableNo} 
                            onChange={e=>setTableNo(e.target.value)} 
                            className="w-full pl-9 py-2.5 border border-[#e5e0d8] rounded-xl bg-[#F9F7F2] text-[#4A3B32] text-sm focus:bg-white focus:ring-2 focus:ring-[#CC8F4C] outline-none"
                            placeholder="Nomor"
                          />
                        </div>
                     </div>
                  </div>

                  <button onClick={handleOpenPayment} className="w-full bg-[#4A3B32] text-[#F9F7F2] py-4 rounded-xl font-bold hover:bg-[#33281d] flex items-center justify-center shadow-lg transition active:scale-[0.98]">
                     <CreditCard size={18} className="mr-2"/> LANJUT PEMBAYARAN
                  </button>
                </div>
              ) : (
                <div className="text-center text-sm text-[#8c7b70] py-2">Pilih menu di atas untuk memesan</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- PAYMENT MODAL (CONFIRMATION ONLY) --- */}
      {isPaymentModalOpen && (
        <div className="absolute inset-0 z-[70] flex items-center justify-center bg-[#4A3B32]/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="bg-[#F9F7F2] rounded-[2rem] p-6 w-full max-w-sm text-center shadow-2xl relative border-4 border-white">
            <button onClick={() => setIsPaymentModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X size={24}/></button>
            
            <h3 className="text-xl font-serif font-bold text-[#4A3B32] mb-1">Scan QRIS</h3>
            <p className="text-xs text-[#8c7b70] mb-6">Selesaikan pembayaran di kasir/scan</p>

            <div className="bg-white p-4 rounded-xl border border-[#e5e0d8] flex flex-col items-center">
               <div className="w-full flex justify-between text-xs text-[#8c7b70] mb-2 border-b border-dashed pb-2">
                  <span>A.n. {customerName}</span>
                  <span>Meja {tableNo || '-'}</span>
               </div>

               <div className="w-40 h-40 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                  <QrCode size={100} className="text-gray-400"/>
               </div>
               <div className="mt-3 text-lg font-bold text-[#4A3B32]">Rp {getTotalPrice().toLocaleString('id-ID')}</div>
            </div>

            <button onClick={handleConfirmPayment} disabled={isProcessing} className="w-full bg-[#CC8F4C] text-white py-4 rounded-xl font-bold hover:bg-[#b0783d] flex items-center justify-center shadow-lg mt-6">
              {isProcessing ? <Loader2 className="animate-spin mr-2"/> : "SAYA SUDAH BAYAR"}
            </button>
          </div>
        </div>
      )}

      {/* Global Styles */}
      <style jsx global>{`
        .perspective-container { perspective: 1500px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; -webkit-backface-visibility: hidden; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  )
}