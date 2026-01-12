'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { 
  ArrowLeft, Plus, Trash2, Utensils, Tag, 
  Loader2, X, Image as ImageIcon, Sparkles 
} from 'lucide-react'
import Image from 'next/image'

export default function MenuPage() {
  const router = useRouter()
  const supabase = createClient()

  // Data State
  const [menus, setMenus] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [restaurantId, setRestaurantId] = useState('')
  
  // Form State - Menu
  const [isAddingMenu, setIsAddingMenu] = useState(false)
  const [menuName, setMenuName] = useState('')
  const [menuPrice, setMenuPrice] = useState('')         // Harga Jual (Setelah Diskon)
  const [originalPrice, setOriginalPrice] = useState('') // Harga Coret (Sebelum Diskon)
  const [menuCategoryId, setMenuCategoryId] = useState('')
  const [menuImage, setMenuImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  // Form State - Kategori
  const [isAddingCat, setIsAddingCat] = useState(false)
  const [categoryName, setCategoryName] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      let { data: resto } = await supabase.from('restaurants').select('id').eq('user_id', user.id).single()
      
      if (!resto) {
        const { data: emp } = await supabase.from('employees').select('restaurant_id').eq('user_id', user.id).single()
        if (emp) resto = { id: emp.restaurant_id }
      }

      if (resto) {
        setRestaurantId(resto.id)
        
        const { data: catData } = await supabase
          .from('categories')
          .select('*')
          .eq('restaurant_id', resto.id)
          .order('created_at', { ascending: true })
        if (catData) setCategories(catData)

        const { data: menuData } = await supabase
          .from('menu_items')
          .select('*, categories(name)')
          .eq('restaurant_id', resto.id)
          .order('created_at', { ascending: false })
        if (menuData) setMenus(menuData)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Ukuran gambar maksimal 2MB')
        return
      }
      setMenuImage(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const handleAddMenu = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!menuName || !menuPrice) return
    setIsAddingMenu(true)
    
    try {
      let imageUrl = null

      if (menuImage) {
        const fileExt = menuImage.name.split('.').pop()
        const fileName = `${restaurantId}/${Date.now()}.${fileExt}`
        
        const { error: uploadError } = await supabase.storage
          .from('menu-images')
          .upload(fileName, menuImage)
        
        if (uploadError) throw new Error('Gagal upload gambar: ' + uploadError.message)
        
        const { data: publicUrlData } = supabase.storage
          .from('menu-images')
          .getPublicUrl(fileName)
          
        imageUrl = publicUrlData.publicUrl
      }

      // Logic Harga Coret: Jika kosong, set null
      const finalOriginalPrice = originalPrice ? parseInt(originalPrice) : null

      const { error } = await supabase.from('menu_items').insert({
        restaurant_id: restaurantId,
        name: menuName,
        price: parseInt(menuPrice),
        original_price: finalOriginalPrice, // Simpan harga coret
        category_id: menuCategoryId || null,
        image_url: imageUrl,
        is_available: true
      })

      if (error) throw error

      setMenuName('')
      setMenuPrice('')
      setOriginalPrice('')
      setMenuCategoryId('')
      setMenuImage(null)
      setImagePreview(null)
      fetchData()
      
    } catch (err: any) {
      alert('Gagal: ' + err.message)
    } finally {
      setIsAddingMenu(false)
    }
  }

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!categoryName) return
    setIsAddingCat(true)
    try {
      const { error } = await supabase.from('categories').insert({
        restaurant_id: restaurantId,
        name: categoryName
      })
      if (error) throw error
      setCategoryName('')
      fetchData()
    } catch (err: any) {
      alert('Gagal: ' + err.message)
    } finally {
      setIsAddingCat(false)
    }
  }

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Hapus kategori ini?')) return
    await supabase.from('categories').delete().eq('id', id)
    fetchData()
  }

  const handleDeleteMenu = async (item: any) => {
    if (!confirm('Hapus menu ini?')) return
    const { error } = await supabase.from('menu_items').delete().eq('id', item.id)
    if (!error) fetchData()
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <button onClick={() => router.push('/dashboard')} className="flex items-center text-gray-500 hover:text-blue-600 mb-6 transition">
          <ArrowLeft size={20} className="mr-2"/> Kembali ke Dashboard
        </button>

        <h1 className="text-2xl font-bold text-gray-900 mb-6">Manajemen Menu</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* KOLOM KIRI: KATEGORI */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 sticky top-6">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
                <Tag size={18} className="mr-2 text-blue-600" /> Kategori
              </h3>
              
              <form onSubmit={handleAddCategory} className="flex gap-2 mb-4">
                <input
                  type="text"
                  placeholder="Nama Kategori..."
                  className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-blue-500 text-black"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                />
                <button disabled={isAddingCat} className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {isAddingCat ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
                </button>
              </form>

              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                {categories.map((cat) => (
                  <div key={cat.id} className="flex justify-between items-center bg-gray-50 px-3 py-2 rounded-lg text-sm group hover:bg-blue-50 transition">
                    <span className="text-gray-700 font-medium">{cat.name}</span>
                    <button onClick={() => handleDeleteCategory(cat.id)} className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* KOLOM KANAN: FORM & LIST MENU */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Form Tambah Menu */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
                <Utensils size={18} className="mr-2 text-blue-600" /> Tambah Menu Baru
              </h3>
              <form onSubmit={handleAddMenu} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Nama Makanan</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border rounded-lg text-black focus:outline-blue-500"
                      value={menuName}
                      onChange={(e) => setMenuName(e.target.value)}
                      placeholder="Contoh: Nasi Goreng Spesial"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Kategori</label>
                    <select
                      className="w-full px-3 py-2 border rounded-lg text-black focus:outline-blue-500 bg-white"
                      value={menuCategoryId}
                      onChange={(e) => setMenuCategoryId(e.target.value)}
                    >
                      <option value="">- Tanpa Kategori -</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Harga Jual */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Harga Jual (Net)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-gray-400 text-sm">Rp</span>
                      <input
                        type="number"
                        className="w-full pl-8 pr-3 py-2 border rounded-lg text-black focus:outline-blue-500 font-bold"
                        value={menuPrice}
                        onChange={(e) => setMenuPrice(e.target.value)}
                        placeholder="25000"
                      />
                    </div>
                  </div>

                  {/* Harga Coret (Diskon) */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1 flex items-center">
                       Harga Coret <span className="text-[10px] ml-1 text-red-500 bg-red-50 px-1 rounded">(Opsional - Untuk Diskon)</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-gray-400 text-sm">Rp</span>
                      <input
                        type="number"
                        className="w-full pl-8 pr-3 py-2 border rounded-lg text-black focus:outline-blue-500"
                        value={originalPrice}
                        onChange={(e) => setOriginalPrice(e.target.value)}
                        placeholder="30000"
                      />
                    </div>
                  </div>
                </div>

                {/* Input Gambar */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Foto Menu</label>
                  <div className="flex items-center gap-3">
                    <label className="cursor-pointer flex items-center justify-center px-4 py-2 border border-dashed border-gray-300 rounded-lg hover:bg-gray-50 transition w-full text-gray-600 text-sm">
                      <ImageIcon size={16} className="mr-2" /> 
                      {menuImage ? 'Ganti Foto' : 'Pilih Foto'}
                      <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                    </label>
                  </div>
                </div>

                {/* Preview Gambar */}
                {imagePreview && (
                  <div className="relative w-full h-40 rounded-lg overflow-hidden border border-gray-200">
                    <Image src={imagePreview} alt="Preview" fill className="object-cover" />
                    <button 
                      type="button"
                      onClick={() => { setMenuImage(null); setImagePreview(null) }}
                      className="absolute top-2 right-2 bg-white/80 text-gray-700 rounded-full p-1 hover:bg-red-500 hover:text-white transition"
                    >
                      <X size={16} />
                    </button>
                    {originalPrice && parseInt(originalPrice) > parseInt(menuPrice) && (
                       <div className="absolute bottom-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded shadow-sm">
                          Diskon {Math.round(((parseInt(originalPrice) - parseInt(menuPrice)) / parseInt(originalPrice)) * 100)}%
                       </div>
                    )}
                  </div>
                )}

                <button type="submit" disabled={isAddingMenu} className="w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 font-medium flex items-center justify-center disabled:opacity-50 shadow-sm">
                  {isAddingMenu ? <Loader2 className="animate-spin mr-2" size={18} /> : 'Simpan Menu'}
                </button>
              </form>
            </div>

            {/* List Menu */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="divide-y divide-gray-100">
                {menus.map((item) => {
                  const isDiscount = item.original_price && item.original_price > item.price
                  const discountPercent = isDiscount ? Math.round(((item.original_price - item.price) / item.original_price) * 100) : 0
                  
                  return (
                    <div key={item.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition group">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden relative border border-gray-200">
                          {item.image_url ? (
                            <Image src={item.image_url} alt={item.name} fill className="object-cover" />
                          ) : (
                            <div className="flex items-center justify-center w-full h-full text-gray-300"><Utensils size={20} /></div>
                          )}
                          {isDiscount && (
                            <div className="absolute top-0 right-0 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-bl-lg">
                              -{discountPercent}%
                            </div>
                          )}
                        </div>
                        
                        <div>
                          <h4 className="font-semibold text-gray-900">{item.name}</h4>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mt-1">
                            <div className="flex items-center gap-2">
                              <span className="text-blue-600 font-bold text-sm">
                                Rp {item.price.toLocaleString('id-ID')}
                              </span>
                              {isDiscount && (
                                <span className="text-gray-400 text-xs line-through">
                                  Rp {item.original_price.toLocaleString('id-ID')}
                                </span>
                              )}
                            </div>
                            {item.categories && (
                              <span className="text-gray-500 bg-gray-100 px-2 py-0.5 rounded text-[10px] w-fit">
                                {item.categories.name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <button onClick={() => handleDeleteMenu(item)} className="text-gray-400 hover:text-red-600 transition p-2 bg-white rounded-full hover:bg-red-50 border border-transparent hover:border-red-100">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}