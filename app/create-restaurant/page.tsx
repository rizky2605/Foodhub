'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react'

export default function CreateRestaurantPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('') // Pindah ke sini
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  
  // State Slug Check
  const [slugChecking, setSlugChecking] = useState(false)
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null)

  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // 1. Auto-generate Slug saat mengetik Nama
  const generateSlug = (text: string) => {
    const newSlug = text.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-')
    setSlug(newSlug)
  }

  // 2. Cek Ketersediaan Slug (Effect)
  useEffect(() => {
    const checkSlug = async () => {
      if (!slug || slug.length < 3) {
        setSlugAvailable(null)
        return
      }
      
      setSlugChecking(true)
      try {
        const { data } = await supabase
          .from('restaurants')
          .select('id')
          .eq('slug', slug)
          .single()
        
        // Jika data ketemu, berarti slug TERPAKAI (available = false)
        setSlugAvailable(!data)
      } catch (error) {
        // Jika error (biasanya row not found), berarti AMAN (available = true)
        setSlugAvailable(true)
      } finally {
        setSlugChecking(false)
      }
    }

    const timeout = setTimeout(checkSlug, 500) // Debounce
    return () => clearTimeout(timeout)
  }, [slug, supabase])


  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')

    try {
      if (!slugAvailable) throw new Error('Username/Slug restoran tidak tersedia')

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Anda harus login terlebih dahulu')

      // Insert Restoran dengan Slug
      const { data, error } = await supabase
        .from('restaurants')
        .insert({
          name: name,
          slug: slug, // Masukkan slug di sini
          address: address,
          phone_number: phone,
          user_id: user.id, // Sesuai dengan kolom yang kita tambahkan di database tadi
        })
        .select()
        .single()

      if (error) throw error

      alert('Restoran berhasil dibuat!')
      router.push('/dashboard')
      router.refresh()

    } catch (err: any) {
      console.error('Error:', err)
      setErrorMsg(err.message || 'Gagal membuat restoran')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white max-w-lg w-full p-8 rounded-xl shadow-md border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Setup Restoran Anda</h1>
        <p className="text-gray-500 mb-6 text-sm">Lengkapi data restoran agar pelanggan bisa mengakses menu Anda.</p>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 border border-red-200 rounded text-sm">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleCreate} className="space-y-4">
          
          {/* Nama Restoran */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Restoran</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                generateSlug(e.target.value) // Auto generate slug
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-black"
              placeholder="Contoh: Kopi Senja"
            />
          </div>

          {/* Slug Restoran */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Link Restoran (Slug)
            </label>
            <div className="flex">
              <span className="bg-gray-100 border border-r-0 px-3 py-2 text-gray-500 rounded-l-lg text-sm flex items-center">
                foodhub/
              </span>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                className={`w-full px-4 py-2 border rounded-r-lg text-black focus:outline-none ${
                   slugAvailable === false ? 'border-red-500 focus:ring-red-500' : 
                   slugAvailable === true ? 'border-green-500 focus:ring-green-500' : 
                   'border-gray-300 focus:ring-blue-500'
                }`}
                placeholder="kopi-senja"
              />
            </div>
            {/* Indikator Slug */}
            <div className="mt-1 text-xs h-4">
              {slugChecking && <span className="text-blue-500 flex items-center"><Loader2 size={12} className="animate-spin mr-1"/> Mengecek...</span>}
              {slugAvailable === true && <span className="text-green-600 font-medium flex items-center"><CheckCircle size={12} className="mr-1"/> Username tersedia</span>}
              {slugAvailable === false && <span className="text-red-600 font-medium flex items-center"><AlertCircle size={12} className="mr-1"/> Username sudah digunakan</span>}
            </div>
          </div>

          {/* Alamat */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Alamat Lengkap</label>
            <textarea
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-black"
              placeholder="Jalan..."
            />
          </div>

          {/* Telepon */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nomor Telepon (Opsional)</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-black"
              placeholder="08..."
            />
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading || !slugAvailable}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Menyimpan...' : 'Simpan Restoran'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}