'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
// Pastikan path import '@' ini sesuai. Jika error, ganti '../utils/...'

export default function CreateRestaurantPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')

    try {
      // 1. Ambil User ID
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('Anda harus login terlebih dahulu')
      }

      // 2. Insert ke tabel restaurants
      // Kita tidak pakai slug dulu biar simpel (pakai ID saja nanti di URL)
      const { data, error } = await supabase
        .from('restaurants')
        .insert({
          name: name,
          user_id: user.id,
          // slug: name.toLowerCase().replace(/ /g, '-'), // Opsional kalau mau pakai slug
        })
        .select()

      if (error) throw error

      // 3. Sukses! Kembali ke Dashboard
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
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Daftarkan Restoran</h1>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 border border-red-200 rounded text-sm">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Restoran</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-black"
              placeholder="Contoh: Nasi Goreng Barokah"
            />
          </div>

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
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50"
            >
              {loading ? 'Menyimpan...' : 'Simpan Restoran'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}