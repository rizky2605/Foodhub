'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { ArrowLeft, Plus, Trash2, Utensils, Tag, Loader2, X } from 'lucide-react'

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

      // Cari ID Restoran
      let { data: resto } = await supabase.from('restaurants').select('id').eq('user_id', user.id).single()
      
      if (!resto) {
        const { data: emp } = await supabase.from('employees').select('restaurant_id').eq('user_id', user.id).single()
        if (emp) resto = { id: emp.restaurant_id }
      }

      if (resto) {
        setRestaurantId(resto.id)
        
        // Ambil Kategori
        const { data: catData } = await supabase
          .from('categories')
          .select('*')
          .eq('restaurant_id', resto.id)
          .order('created_at', { ascending: true })
        
        if (catData) setCategories(catData)

        // Ambil Menu
        const { data: menuData } = await supabase
          .from('menu_items')
          .select('*, categories(name)') // Join untuk ambil nama kategori
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

  // --- HANDLER KATEGORI ---
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
      fetchData() // Refresh
    } catch (err: any) {
      alert('Gagal: ' + err.message)
    } finally {
      setIsAddingCat(false)
    }
  }

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Hapus kategori ini? Menu di dalamnya tidak akan terhapus, tapi menjadi "Tanpa Kategori".')) return
    await supabase.from('categories').delete().eq('id', id)
    fetchData()
  }

  // --- HANDLER MENU ---
  const handleAddMenu = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!menuName || !menuPrice) return
    setIsAddingMenu(true)
    try {
      const { error } = await supabase.from('menu_items').insert({
        restaurant_id: restaurantId,
        name: menuName,
        price: parseInt(menuPrice),
        category_id: menuCategoryId || null, // Masukkan ID Kategori
        is_available: true
      })
      if (error) throw error
      setMenuName('')
      setMenuPrice('')
      setMenuCategoryId('')
      fetchData()
    } catch (err: any) {
      alert('Gagal: ' + err.message)
    } finally {
      setIsAddingMenu(false)
    }
  }

  const handleDeleteMenu = async (id: string) => {
    if (!confirm('Hapus menu ini?')) return
    await supabase.from('menu_items').delete().eq('id', id)
    fetchData()
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <button onClick={() => router.push('/dashboard')} className="flex items-center text-gray-500 hover:text-blue-600 mb-6 transition">
          <ArrowLeft size={20} className="mr-2"/> Kembali ke Dashboard
        </button>

        <h1 className="text-2xl font-bold text-gray-900 mb-6">Manajemen Menu & Kategori</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* KOLOM KIRI: LIST KATEGORI */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
                <Tag size={18} className="mr-2 text-blue-600" /> Kategori Menu
              </h3>
              
              {/* Form Tambah Kategori */}
              <form onSubmit={handleAddCategory} className="flex gap-2 mb-4">
                <input
                  type="text"
                  placeholder="Nama (mis: Minuman)"
                  className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-blue-500 text-black"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                />
                <button disabled={isAddingCat} className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {isAddingCat ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
                </button>
              </form>

              {/* List Kategori */}
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {categories.length === 0 && <p className="text-sm text-gray-400 text-center py-2">Belum ada kategori</p>}
                {categories.map((cat) => (
                  <div key={cat.id} className="flex justify-between items-center bg-gray-50 px-3 py-2 rounded-lg text-sm group">
                    <span className="text-gray-700">{cat.name}</span>
                    <button onClick={() => handleDeleteCategory(cat.id)} className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* KOLOM KANAN: LIST MENU */}
          <div className="lg:col-span-2 space-y-6">
            {/* Form Tambah Menu */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
                <Utensils size={18} className="mr-2 text-blue-600" /> Tambah Menu Baru
              </h3>
              <form onSubmit={handleAddMenu} className="grid grid-cols-1 md:grid-cols-12 gap-3">
                <div className="md:col-span-4">
                  <input
                    type="text"
                    placeholder="Nama Makanan"
                    className="w-full px-3 py-2 border rounded-lg text-black focus:outline-blue-500"
                    value={menuName}
                    onChange={(e) => setMenuName(e.target.value)}
                  />
                </div>
                <div className="md:col-span-3">
                  <input
                    type="number"
                    placeholder="Harga"
                    className="w-full px-3 py-2 border rounded-lg text-black focus:outline-blue-500"
                    value={menuPrice}
                    onChange={(e) => setMenuPrice(e.target.value)}
                  />
                </div>
                <div className="md:col-span-3">
                  <select
                    className="w-full px-3 py-2 border rounded-lg text-black focus:outline-blue-500 bg-white"
                    value={menuCategoryId}
                    onChange={(e) => setMenuCategoryId(e.target.value)}
                  >
                    <option value="">- Kategori -</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <button type="submit" disabled={isAddingMenu} className="w-full bg-blue-600 text-white h-full rounded-lg hover:bg-blue-700 font-medium flex items-center justify-center disabled:opacity-50">
                    {isAddingMenu ? <Loader2 className="animate-spin" size={18} /> : 'Simpan'}
                  </button>
                </div>
              </form>
            </div>

            {/* Tabel Menu */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              {loading ? (
                <div className="p-10 text-center text-gray-500">Memuat menu...</div>
              ) : menus.length === 0 ? (
                <div className="p-10 text-center text-gray-500">Belum ada menu.</div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {menus.map((item) => (
                    <div key={item.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                          <Utensils size={18} />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{item.name}</h4>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded">
                              Rp {item.price.toLocaleString('id-ID')}
                            </span>
                            {item.categories && (
                              <span className="text-gray-500 border px-2 py-0.5 rounded">
                                {item.categories.name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button onClick={() => handleDeleteMenu(item.id)} className="text-gray-400 hover:text-red-600 transition p-2">
                          <Trash2 size={18} />
                        </button>
                      </div>
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