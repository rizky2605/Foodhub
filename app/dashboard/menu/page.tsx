'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { 
  ArrowLeft, Plus, Trash2, Utensils, Tag, 
  Loader2, X, Image as ImageIcon, Edit, Save, 
  RotateCcw, CheckCircle, Search, Power
} from 'lucide-react'
import Image from 'next/image'

// --- TYPES ---
interface MenuItem {
  id: string
  name: string
  description?: string
  price: number
  original_price?: number
  image_url?: string
  category_id?: string
  is_available: boolean
}

interface Category {
  id: string
  name: string
}

export default function MenuPage() {
  const router = useRouter()
  const supabase = createClient()

  // Data State
  const [menus, setMenus] = useState<MenuItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [restaurantId, setRestaurantId] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  // Form State
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editId, setEditId] = useState<string | null>(null) // Jika ada ID, berarti Mode Edit
  
  // Input Fields
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [originalPrice, setOriginalPrice] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [isAvailable, setIsAvailable] = useState(true)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  // Category Form
  const [newCategoryName, setNewCategoryName] = useState('')
  const [isAddingCat, setIsAddingCat] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      let restoId = ''
      let { data: resto } = await supabase.from('restaurants').select('id').eq('user_id', user.id).single()
      
      if (!resto) {
        const { data: emp } = await supabase.from('employees').select('restaurant_id').eq('user_id', user.id).single()
        if (emp) resto = { id: emp.restaurant_id }
      }

      if (resto) {
        setRestaurantId(resto.id)
        restoId = resto.id
        
        // Fetch Categories
        const { data: catData } = await supabase
          .from('categories')
          .select('*')
          .eq('restaurant_id', restoId)
          .order('created_at', { ascending: true })
        if (catData) setCategories(catData)

        // Fetch Menu
        const { data: menuData } = await supabase
          .from('menu_items')
          .select('*')
          .eq('restaurant_id', restoId)
          .order('created_at', { ascending: false })
        if (menuData) setMenus(menuData)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  // --- HANDLERS ---

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) return alert('Max 2MB')
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const resetForm = () => {
    setEditId(null)
    setName('')
    setDescription('')
    setPrice('')
    setOriginalPrice('')
    setCategoryId('')
    setIsAvailable(true)
    setImageFile(null)
    setImagePreview(null)
  }

  const handleEditClick = (item: MenuItem) => {
    setEditId(item.id)
    setName(item.name)
    setDescription(item.description || '')
    setPrice(item.price.toString())
    setOriginalPrice(item.original_price?.toString() || '')
    setCategoryId(item.category_id || '')
    setIsAvailable(item.is_available)
    setImagePreview(item.image_url || null)
    setImageFile(null) // Reset file baru
    
    // Scroll ke atas
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !price) return alert('Nama dan Harga wajib diisi')
    setIsSubmitting(true)

    try {
      let finalImageUrl = imagePreview // Default ke URL lama (jika edit)

      // 1. Upload Gambar Baru (Jika ada)
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop()
        const fileName = `${restaurantId}/${Date.now()}.${fileExt}`
        
        const { error: uploadError } = await supabase.storage
          .from('menu-images')
          .upload(fileName, imageFile)
        
        if (uploadError) throw uploadError
        
        const { data: publicUrlData } = supabase.storage
          .from('menu-images')
          .getPublicUrl(fileName)
          
        finalImageUrl = publicUrlData.publicUrl
      }

      const payload = {
        restaurant_id: restaurantId,
        name,
        description,
        price: parseInt(price),
        original_price: originalPrice ? parseInt(originalPrice) : null,
        category_id: categoryId || null,
        image_url: finalImageUrl, // URL Baru atau Lama
        is_available: isAvailable
      }

      if (editId) {
        // UPDATE MODE
        const { error } = await supabase
          .from('menu_items')
          .update(payload)
          .eq('id', editId)
        if (error) throw error
      } else {
        // INSERT MODE
        const { error } = await supabase
          .from('menu_items')
          .insert(payload)
        if (error) throw error
      }

      resetForm()
      fetchData()
      
    } catch (err: any) {
      alert('Gagal: ' + err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin hapus menu ini?')) return
    await supabase.from('menu_items').delete().eq('id', id)
    fetchData()
  }

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCategoryName) return
    setIsAddingCat(true)
    try {
      const { error } = await supabase.from('categories').insert({ restaurant_id: restaurantId, name: newCategoryName })
      if (error) throw error
      setNewCategoryName('')
      fetchData()
    } catch (err) { alert('Gagal tambah kategori') } finally { setIsAddingCat(false) }
  }

  const handleDeleteCategory = async (id: string) => {
    if(!confirm('Hapus kategori? Menu di dalamnya akan kehilangan kategori.')) return
    await supabase.from('categories').delete().eq('id', id)
    fetchData()
  }

  const handleToggleAvailability = async (item: MenuItem) => {
    // Optimistic UI Update
    const newStatus = !item.is_available
    setMenus(menus.map(m => m.id === item.id ? { ...m, is_available: newStatus } : m))
    await supabase.from('menu_items').update({ is_available: newStatus }).eq('id', item.id)
  }

  // Filter Search
  const filteredMenus = menus.filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <div className="min-h-screen bg-slate-50 p-6 pb-20">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <button onClick={() => router.push('/dashboard')} className="flex items-center text-slate-500 hover:text-blue-600 mb-2 transition">
              <ArrowLeft size={20} className="mr-2"/> Dashboard
            </button>
            <h1 className="text-3xl font-bold text-slate-900">Manajemen Menu</h1>
            <p className="text-slate-500">Tambah, edit, dan atur ketersediaan menu restoran.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* --- LEFT COLUMN: FORM (Sticky) --- */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* 1. MANAGE CATEGORIES */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
              <h3 className="font-bold text-slate-800 mb-3 flex items-center">
                <Tag size={18} className="mr-2 text-indigo-600" /> Kategori
              </h3>
              <div className="flex flex-wrap gap-2 mb-4">
                {categories.map(cat => (
                  <span key={cat.id} className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs font-bold flex items-center group cursor-default">
                    {cat.name}
                    <button onClick={() => handleDeleteCategory(cat.id)} className="ml-2 text-slate-400 hover:text-red-500 hidden group-hover:block"><X size={12}/></button>
                  </span>
                ))}
              </div>
              <form onSubmit={handleAddCategory} className="flex gap-2">
                <input 
                  value={newCategoryName} onChange={e=>setNewCategoryName(e.target.value)} 
                  placeholder="Kategori Baru..." 
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                />
                <button disabled={isAddingCat} className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                  {isAddingCat ? <Loader2 className="animate-spin" size={16}/> : <Plus size={16}/>}
                </button>
              </form>
            </div>

            {/* 2. MENU FORM (Add/Edit) */}
            <div className="bg-white p-5 rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-200 sticky top-6">
              <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3">
                 <h3 className="font-bold text-slate-800 flex items-center">
                    {editId ? <Edit size={18} className="mr-2 text-orange-500" /> : <Plus size={18} className="mr-2 text-blue-600" />}
                    {editId ? 'Edit Menu' : 'Tambah Menu Baru'}
                 </h3>
                 {editId && (
                   <button onClick={resetForm} className="text-xs text-red-500 hover:underline flex items-center">
                     <RotateCcw size={12} className="mr-1"/> Batal
                   </button>
                 )}
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Image Upload */}
                <div className="relative group cursor-pointer border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 hover:bg-slate-100 transition h-40 flex flex-col items-center justify-center overflow-hidden">
                  <input type="file" className="absolute inset-0 opacity-0 cursor-pointer z-20" accept="image/*" onChange={handleImageChange} />
                  {imagePreview ? (
                    <>
                      <Image src={imagePreview} alt="Preview" fill className="object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition z-10 text-white font-bold text-xs">
                        Ganti Foto
                      </div>
                    </>
                  ) : (
                    <div className="text-center p-4">
                      <div className="bg-white p-2 rounded-full inline-block mb-2 shadow-sm"><ImageIcon size={20} className="text-slate-400"/></div>
                      <p className="text-xs text-slate-500">Upload Foto Menu</p>
                    </div>
                  )}
                </div>

                {/* Name & Category */}
                <div>
                   <label className="text-xs font-bold text-slate-500 mb-1 block">Nama Menu</label>
                   <input required value={name} onChange={e=>setName(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 text-slate-800" placeholder="Contoh: Nasi Goreng" />
                </div>

                <div>
                   <label className="text-xs font-bold text-slate-500 mb-1 block">Deskripsi (Opsional)</label>
                   <textarea value={description} onChange={e=>setDescription(e.target.value)} rows={2} className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 text-slate-800" placeholder="Penjelasan singkat menu..." />
                </div>

                <div className="grid grid-cols-2 gap-3">
                   <div>
                      <label className="text-xs font-bold text-slate-500 mb-1 block">Harga (Rp)</label>
                      <input required type="number" value={price} onChange={e=>setPrice(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 font-bold" placeholder="0" />
                   </div>
                   <div>
                      <label className="text-xs font-bold text-slate-500 mb-1 block text-orange-600">Harga Coret (Diskon)</label>
                      <input type="number" value={originalPrice} onChange={e=>setOriginalPrice(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 text-slate-800" placeholder="Opsional" />
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-3 items-end">
                   <div>
                      <label className="text-xs font-bold text-slate-500 mb-1 block">Kategori</label>
                      <select value={categoryId} onChange={e=>setCategoryId(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 bg-white">
                        <option value="">- Pilih -</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                   </div>
                   
                   {/* Availability Toggle */}
                   <div 
                     onClick={() => setIsAvailable(!isAvailable)}
                     className={`cursor-pointer px-3 py-2 rounded-lg border flex items-center justify-center gap-2 transition ${isAvailable ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}
                   >
                     <Power size={16} />
                     <span className="text-xs font-bold">{isAvailable ? 'Tersedia' : 'Habis'}</span>
                   </div>
                </div>

                <button disabled={isSubmitting} className={`w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition shadow-md ${editId ? 'bg-orange-600 hover:bg-orange-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
                  {isSubmitting ? <Loader2 className="animate-spin"/> : editId ? <><Save size={18}/> Update Menu</> : <><Plus size={18}/> Simpan Menu</>}
                </button>
              </form>
            </div>

          </div>

          {/* --- RIGHT COLUMN: LIST MENU (Grid) --- */}
          <div className="lg:col-span-8">
            
            {/* Search Bar */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-6 flex items-center gap-3">
               <Search size={20} className="text-slate-400"/>
               <input 
                 value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} 
                 placeholder="Cari nama menu..." 
                 className="flex-1 bg-transparent outline-none text-slate-700 placeholder-slate-400"
               />
               <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">
                 {filteredMenus.length} Item
               </span>
            </div>

            {loading ? (
               <div className="text-center py-20 text-slate-400"><Loader2 className="animate-spin mx-auto mb-2"/> Memuat menu...</div>
            ) : filteredMenus.length === 0 ? (
               <div className="text-center py-20 text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">Tidak ada menu ditemukan.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredMenus.map((item) => {
                   const isDiscount = item.original_price && item.original_price > item.price
                   const discountPercent = isDiscount ? Math.round(((item.original_price! - item.price) / item.original_price!) * 100) : 0
                   const catName = categories.find(c => c.id === item.category_id)?.name

                   return (
                     <div key={item.id} className={`bg-white rounded-2xl border transition hover:shadow-lg flex flex-col overflow-hidden group ${item.is_available ? 'border-slate-200' : 'border-red-200 opacity-75'}`}>
                        
                        {/* Image Area */}
                        <div className="relative h-48 bg-slate-100">
                           {item.image_url ? (
                              <Image src={item.image_url} alt={item.name} fill className="object-cover" />
                           ) : (
                              <div className="flex items-center justify-center w-full h-full text-slate-300"><Utensils size={32}/></div>
                           )}
                           
                           {/* Badges */}
                           <div className="absolute top-3 left-3 flex flex-col gap-1">
                             {catName && <span className="bg-white/90 backdrop-blur text-slate-700 text-[10px] font-bold px-2 py-1 rounded-md shadow-sm">{catName}</span>}
                             {!item.is_available && <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-sm flex items-center"><Power size={10} className="mr-1"/> STOK HABIS</span>}
                           </div>

                           {/* Edit Button Overlay */}
                           <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition duration-300">
                              <button onClick={() => handleEditClick(item)} className="bg-white text-slate-800 p-2 rounded-full hover:scale-110 transition shadow-lg" title="Edit">
                                <Edit size={18} />
                              </button>
                              <button onClick={() => handleDelete(item.id)} className="bg-red-600 text-white p-2 rounded-full hover:scale-110 transition shadow-lg" title="Hapus">
                                <Trash2 size={18} />
                              </button>
                           </div>

                           {/* Toggle Availability Quick Action */}
                           <button 
                             onClick={(e) => { e.stopPropagation(); handleToggleAvailability(item) }}
                             className={`absolute bottom-3 right-3 p-1.5 rounded-full shadow-md transition ${item.is_available ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-slate-200 text-slate-400 hover:bg-slate-300'}`}
                             title="Ubah Status Stok"
                           >
                             <Power size={14} />
                           </button>
                        </div>

                        {/* Content Area */}
                        <div className="p-4 flex-1 flex flex-col">
                           <div className="flex justify-between items-start mb-1">
                             <h4 className="font-bold text-slate-800 text-lg leading-tight">{item.name}</h4>
                           </div>
                           <p className="text-slate-500 text-xs line-clamp-2 mb-3 flex-1">{item.description || 'Tidak ada deskripsi.'}</p>
                           
                           <div className="mt-auto border-t border-slate-100 pt-3 flex items-center gap-2">
                              <span className="font-bold text-blue-600 text-lg">Rp {item.price.toLocaleString('id-ID')}</span>
                              {isDiscount && (
                                <>
                                  <span className="text-xs text-slate-400 line-through">Rp {item.original_price?.toLocaleString('id-ID')}</span>
                                  <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold">-{discountPercent}%</span>
                                </>
                              )}
                           </div>
                        </div>
                     </div>
                   )
                })}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}