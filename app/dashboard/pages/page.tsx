'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { ArrowLeft, Upload, Trash2, Loader2, FileImage } from 'lucide-react'
import Image from 'next/image'

export default function MenuPagesAdmin() {
  const router = useRouter()
  const supabase = createClient()
  
  const [pages, setPages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [restaurantId, setRestaurantId] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Ambil Restaurant ID
      let { data: resto } = await supabase.from('restaurants').select('id').eq('user_id', user.id).single()
      if (!resto) {
         // Cek employee
         const { data: emp } = await supabase.from('employees').select('restaurant_id').eq('user_id', user.id).single()
         if (emp) resto = { id: emp.restaurant_id }
      }

      if (resto) {
        setRestaurantId(resto.id)
        // Ambil Halaman
        const { data: pagesData } = await supabase
          .from('menu_pages')
          .select('*')
          .eq('restaurant_id', resto.id)
          .order('page_number', { ascending: true })
        
        setPages(pagesData || [])
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    setUploading(true)

    try {
      const file = e.target.files[0]
      const fileExt = file.name.split('.').pop()
      const fileName = `${restaurantId}/page-${Date.now()}.${fileExt}`

      // 1. Upload ke Storage
      const { error: uploadError } = await supabase.storage
        .from('menu-pages')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      const { data: publicUrlData } = supabase.storage
        .from('menu-pages')
        .getPublicUrl(fileName)

      // 2. Simpan ke Database (Page Number = Last + 1)
      const nextPage = pages.length + 1
      const { error: dbError } = await supabase.from('menu_pages').insert({
        restaurant_id: restaurantId,
        image_url: publicUrlData.publicUrl,
        page_number: nextPage
      })

      if (dbError) throw dbError

      fetchData() // Refresh

    } catch (error: any) {
      alert('Gagal upload: ' + error.message)
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: string, url: string) => {
    if(!confirm('Hapus halaman ini?')) return
    
    // Hapus dari DB
    await supabase.from('menu_pages').delete().eq('id', id)
    // Hapus dari Storage (Opsional, biar bersih)
    // ... logic delete storage
    
    fetchData()
  }

  if (loading) return <div className="p-10 text-center"><Loader2 className="animate-spin inline"/></div>

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => router.push('/dashboard')} className="flex items-center text-gray-500 hover:text-blue-600 mb-6 transition">
          <ArrowLeft size={20} className="mr-2"/> Kembali ke Dashboard
        </button>

        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Desain Buku Menu</h1>
            <p className="text-gray-500 text-sm">Upload gambar desain menu Anda urut per halaman.</p>
          </div>
          
          <label className="bg-blue-600 text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-blue-700 transition flex items-center shadow-lg">
            {uploading ? <Loader2 className="animate-spin mr-2" size={18}/> : <Upload className="mr-2" size={18}/>}
            Tambah Halaman
            <input type="file" hidden accept="image/*" onChange={handleUpload} disabled={uploading}/>
          </label>
        </div>

        {/* List Pages */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {pages.map((page, index) => (
            <div key={page.id} className="relative group bg-white p-2 rounded-lg shadow-sm border">
              <div className="absolute top-2 left-2 bg-black/50 text-white w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold z-10">
                {index + 1}
              </div>
              <div className="relative aspect-[3/4] w-full bg-gray-100 rounded overflow-hidden">
                <Image src={page.image_url} alt={`Page ${page.page_number}`} fill className="object-cover" />
              </div>
              <button 
                onClick={() => handleDelete(page.id, page.image_url)}
                className="absolute top-2 right-2 bg-red-600 text-white p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition hover:scale-110"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          
          {pages.length === 0 && (
            <div className="col-span-full py-16 text-center border-2 border-dashed border-gray-300 rounded-xl text-gray-400">
              <FileImage size={48} className="mx-auto mb-2 opacity-50"/>
              <p>Belum ada halaman menu.</p>
              <p className="text-xs">Upload desain menu Anda (Format A4/Portrait disarankan)</p>
            </div>
          )}
        </div>

        <div className="mt-8 bg-yellow-50 p-4 rounded-lg border border-yellow-200 text-sm text-yellow-800">
          <strong>Catatan Penting:</strong> 
          Meskipun Anda mengupload gambar menu di sini, Anda <strong>tetap harus menginput Nama & Harga Menu</strong> di halaman "Daftar Menu" agar pelanggan bisa memilih item tersebut saat checkout. Gambar di sini hanya sebagai tampilan visual (Buku Menu).
        </div>
      </div>
    </div>
  )
}