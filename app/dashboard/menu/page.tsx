'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { ArrowLeft, Plus, Trash2, Utensils, Tag, Loader2, X, Image as ImageIcon } from 'lucide-react'
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
  const [menuPrice, setMenuPrice] = useState('')
  const [menuCategoryId, setMenuCategoryId] = useState('')
  const [menuImage, setMenuImage] = useState<File | null>(null) // State untuk file gambar
  const [imagePreview, setImagePreview] = useState<string | null>(null) // Preview gambar

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

  // --- HANDLER IMAGE ---
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validasi ukuran (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert('Ukuran gambar maksimal 2MB')
        return
      }
      setMenuImage(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  // --- HANDLER MENU & UPLOAD ---
  const handleAddMenu = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!menuName || !menuPrice) return
    setIsAddingMenu(true)
    
    try {
      let imageUrl = null

      // 1. Upload Gambar jika ada
      if (menuImage) {
        const fileExt = menuImage.name.split('.').pop()
        const fileName = `${restaurantId}/${Date.now()}.${fileExt}` // Folder per restoran
        
        const { error: uploadError } = await supabase.storage
          .from('menu-images')
          .upload(fileName, menuImage)
        
        if (uploadError) throw new Error('Gagal upload gambar: ' + uploadError.message)
        
        // Dapatkan URL Public
        const { data: publicUrlData } = supabase.storage
          .from('menu-images')
          .getPublicUrl(fileName)
          
        imageUrl = publicUrlData.publicUrl
      }

      // 2. Simpan Data Menu ke Database
      const { error } = await supabase.from('menu_items').insert({
        restaurant_id: restaurantId,
        name: menuName,
        price: parseInt(menuPrice),
        category_id: menuCategoryId || null,
        image_url: imageUrl, // Masukkan URL gambar
        is_available: true
      })

      if (error) throw error

      // Reset Form
      setMenuName('')
      setMenuPrice('')
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

  // --- HANDLER KATEGORI & DELETE ---
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
    
    // Hapus data di DB
    const { error } = await supabase.from('menu_items').delete().eq('id', item.id)
    
    // Opsional: Hapus gambar dari storage juga jika ingin bersih-bersih
    // Tapi untuk sekarang kita skip agar simpel
    
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
          
          {/* KOLOM KIRI: LIST KATEGORI */}
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
                {categories.length === 0 && <p className="text-sm text-gray-400 text-center py-2">Belum ada kategori</p>}
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
                    <label className="block text-xs font-medium text-gray-500 mb-1">Harga (Rp)</label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border rounded-lg text-black focus:outline-blue-500"
                      value={menuPrice}
                      onChange={(e) => setMenuPrice(e.target.value)}
                      placeholder="Contoh: 25000"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  
                  {/* INPUT GAMBAR */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Foto Menu (Opsional)</label>
                    <div className="flex items-center gap-3">
                      <label className="cursor-pointer flex items-center justify-center px-4 py-2 border border-dashed border-gray-300 rounded-lg hover:bg-gray-50 transition w-full">
                        <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                        <span className="text-sm text-gray-600 flex items-center">
                          <ImageIcon size={16} className="mr-2" /> 
                          {menuImage ? 'Ganti Foto' : 'Pilih Foto'}
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Preview Gambar */}
                {imagePreview && (
                  <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-gray-200">
                    <Image src={imagePreview} alt="Preview" fill className="object-cover" />
                    <button 
                      type="button"
                      onClick={() => { setMenuImage(null); setImagePreview(null) }}
                      className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 hover:bg-red-500 transition"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}

                <button type="submit" disabled={isAddingMenu} className="w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 font-medium flex items-center justify-center disabled:opacity-50 transition shadow-sm">
                  {isAddingMenu ? <Loader2 className="animate-spin mr-2" size={18} /> : 'Simpan Menu'}
                </button>
              </form>
            </div>

            {/* List Menu */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              {loading ? (
                <div className="p-10 text-center text-gray-500">Memuat menu...</div>
              ) : menus.length === 0 ? (
                <div className="p-10 text-center text-gray-500">Belum ada menu.</div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {menus.map((item) => (
                    <div key={item.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition group">
                      <div className="flex items-center gap-4">
                        {/* Thumbnail Gambar di List */}
                        <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden relative border border-gray-200">
                          {item.image_url ? (
                            <Image src={item.image_url} alt={item.name} fill className="object-cover" />
                          ) : (
                            <div className="flex items-center justify-center w-full h-full text-gray-300">
                              <Utensils size={20} />
                            </div>
                          )}
                        </div>
                        
                        <div>
                          <h4 className="font-semibold text-gray-900">{item.name}</h4>
                          <div className="flex items-center gap-2 text-xs mt-1">
                            <span className="text-blue-600 font-bold">
                              Rp {item.price.toLocaleString('id-ID')}
                            </span>
                            {item.categories && (
                              <span className="text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                {item.categories.name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <button onClick={() => handleDeleteMenu(item)} className="text-gray-400 hover:text-red-600 transition p-2 bg-white rounded-full hover:bg-red-50">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}