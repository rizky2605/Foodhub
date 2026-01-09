'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Loader2, MapPin, Phone, Clock, ShoppingBag } from 'lucide-react'

// Interface TypeScript untuk struktur data
interface MenuItem {
  id: string
  name: string
  price: number
  description?: string
  image_url?: string
  category_id?: string
}

interface Category {
  id: string
  name: string
  items: MenuItem[] // Kita akan memasukkan item menu ke dalam kategori ini secara manual di frontend
}

export default function PublicRestaurantPage() {
  const params = useParams()
  const supabase = createClient()
  
  const [restaurant, setRestaurant] = useState<any>(null)
  const [groupedMenu, setGroupedMenu] = useState<Category[]>([]) // State untuk menu yang sudah dikelompokkan
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const slug = params.slug
        // 1. Ambil Info Restoran
        const { data: resto, error: restoError } = await supabase
          .from('restaurants')
          .select('*')
          .eq('slug', slug)
          .single()
        
        if (restoError || !resto) {
          setError('Restoran tidak ditemukan')
          setLoading(false)
          return
        }
        setRestaurant(resto)

        // 2. Ambil Kategori
        const { data: categories } = await supabase
          .from('categories')
          .select('*')
          .eq('restaurant_id', resto.id)
          .order('created_at', { ascending: true })

        // 3. Ambil Menu Items
        const { data: menuItems } = await supabase
          .from('menu_items')
          .select('*')
          .eq('restaurant_id', resto.id)
          .eq('is_available', true)
        
        // 4. Proses Pengelompokan (Grouping)
        // Kita buat kategori "Lainnya" untuk menu yang tidak punya kategori
        const others: Category = { id: 'others', name: 'Lainnya', items: [] }
        
        // Siapkan struktur data kategori
        const processedCategories: Category[] = (categories || []).map((cat: any) => ({
          id: cat.id,
          name: cat.name,
          items: []
        }))

        // Masukkan setiap menu ke kategori yang sesuai
        menuItems?.forEach((item: MenuItem) => {
          if (item.category_id) {
            const catIndex = processedCategories.findIndex(c => c.id === item.category_id)
            if (catIndex >= 0) {
              processedCategories[catIndex].items.push(item)
            } else {
              others.items.push(item)
            }
          } else {
            others.items.push(item)
          }
        })

        // Gabungkan kategori asli + "Lainnya" (jika ada isinya)
        if (others.items.length > 0) {
          processedCategories.push(others)
        }

        // Hapus kategori yang kosong agar tampilan bersih
        const finalMenu = processedCategories.filter(c => c.items.length > 0)
        
        setGroupedMenu(finalMenu)

      } catch (err) {
        console.error(err)
        setError('Terjadi kesalahan memuat data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [params.slug, supabase])

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-blue-600" size={32} /></div>
  
  if (error) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-center p-4"><h1 className="text-xl font-bold text-gray-800">{error}</h1></div>

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* HEADER */}
      <div className="bg-blue-600 text-white pt-10 pb-16 px-6 relative overflow-hidden">
        <div className="max-w-3xl mx-auto relative z-10 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">{restaurant.name}</h1>
          <div className="flex flex-wrap justify-center gap-4 text-blue-100 text-sm mt-4">
            {restaurant.address && <span className="flex items-center"><MapPin size={16} className="mr-1" /> {restaurant.address}</span>}
            <span className="flex items-center"><Clock size={16} className="mr-1" /> Buka Setiap Hari</span>
          </div>
        </div>
      </div>

      {/* MENU LIST (GROUPED) */}
      <div className="max-w-3xl mx-auto px-4 -mt-8 relative z-20 space-y-8">
        {groupedMenu.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-10 text-center text-gray-500">
            Belum ada menu yang tersedia.
          </div>
        ) : (
          groupedMenu.map((category) => (
            <div key={category.id} className="bg-white rounded-xl shadow-md overflow-hidden">
              {/* Judul Kategori */}
              <div className="bg-gray-50 px-6 py-3 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-800 flex items-center">
                  <span className="w-2 h-6 bg-blue-600 rounded-full mr-3"></span>
                  {category.name}
                </h2>
              </div>
              
              {/* Item dalam Kategori */}
              <div className="p-4">
                {category.items.map((item) => (
                  <div key={item.id} className="flex justify-between items-start border-b border-gray-100 py-4 last:border-0 last:pb-0 first:pt-0">
                    <div className="flex-1 pr-4">
                      <h3 className="font-semibold text-gray-900 text-lg">{item.name}</h3>
                      {item.description && <p className="text-gray-500 text-sm mt-1 line-clamp-2">{item.description}</p>}
                      <p className="text-blue-600 font-bold mt-2">Rp {item.price.toLocaleString('id-ID')}</p>
                    </div>
                    {/* Placeholder Gambar */}
                    <div className="w-20 h-20 bg-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center text-gray-300">
                      <ShoppingBag size={20} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="text-center text-gray-400 text-sm py-8">Powered by FoodHub</div>
    </div>
  )
}