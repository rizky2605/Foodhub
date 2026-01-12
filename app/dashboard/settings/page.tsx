'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { 
  ArrowLeft, Save, Store, MapPin, Phone, 
  Loader2, Image as ImageIcon, X 
} from 'lucide-react'
import Image from 'next/image'

export default function SettingsPage() {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [restaurantId, setRestaurantId] = useState('')
  
  // Form State
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [isOpen, setIsOpen] = useState(true)
  const [slug, setSlug] = useState('')
  
  // Logo State
  const [logoUrl, setLogoUrl] = useState('')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: resto } = await supabase
        .from('restaurants')
        .select('*')
        .eq('user_id', user.id)
        .single()
      
      if (!resto) {
        alert('Akses Ditolak.')
        router.push('/dashboard')
        return
      }

      setRestaurantId(resto.id)
      setName(resto.name)
      setAddress(resto.address)
      setPhone(resto.phone_number || '')
      setIsOpen(resto.is_open)
      setSlug(resto.slug)
      setLogoUrl(resto.logo_url || '')

    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // Max 2MB
        alert('Ukuran file maksimal 2MB')
        return
      }
      setLogoFile(file)
      setLogoPreview(URL.createObjectURL(file))
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      let finalLogoUrl = logoUrl

      // 1. Upload Logo Baru jika ada
      if (logoFile) {
        const fileExt = logoFile.name.split('.').pop()
        const fileName = `${restaurantId}-${Date.now()}.${fileExt}`
        
        const { error: uploadError } = await supabase.storage
          .from('restaurant-logos')
          .upload(fileName, logoFile)
        
        if (uploadError) throw new Error('Gagal upload logo: ' + uploadError.message)
        
        const { data: publicUrlData } = supabase.storage
          .from('restaurant-logos')
          .getPublicUrl(fileName)
          
        finalLogoUrl = publicUrlData.publicUrl
      }

      // 2. Update Database
      const { error } = await supabase
        .from('restaurants')
        .update({
          name,
          address,
          phone_number: phone,
          is_open: isOpen,
          logo_url: finalLogoUrl
        })
        .eq('id', restaurantId)

      if (error) throw error
      
      setLogoUrl(finalLogoUrl)
      setLogoFile(null)
      alert('Pengaturan berhasil disimpan!')
      
    } catch (err: any) {
      alert('Gagal menyimpan: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-10 text-center"><Loader2 className="animate-spin inline mr-2"/> Memuat...</div>

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        <button onClick={() => router.push('/dashboard')} className="flex items-center text-gray-500 hover:text-blue-600 mb-6 transition">
          <ArrowLeft size={20} className="mr-2"/> Kembali ke Dashboard
        </button>

        <h1 className="text-2xl font-bold text-gray-900 mb-6">Pengaturan Restoran</h1>

        <form onSubmit={handleSave} className="space-y-6">
          
          {/* Status Buka/Tutup */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-gray-800 text-lg">Status Toko</h3>
              <p className="text-sm text-gray-500">Jika dimatikan, pelanggan tidak bisa membuat pesanan baru.</p>
            </div>
            
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors focus:outline-none ${
                isOpen ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${isOpen ? 'translate-x-9' : 'translate-x-1'}`} />
            </button>
          </div>

          {/* Logo Upload */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-800 text-lg border-b pb-2 mb-4">Logo Restoran</h3>
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 bg-gray-100 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden relative">
                {logoPreview || logoUrl ? (
                  <Image 
                    src={logoPreview || logoUrl} 
                    alt="Logo" 
                    fill 
                    className="object-cover"
                  />
                ) : (
                  <Store className="text-gray-400" size={32} />
                )}
              </div>
              <div>
                <label className="cursor-pointer bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition inline-flex items-center">
                  <ImageIcon size={18} className="mr-2" />
                  {logoUrl || logoPreview ? 'Ganti Logo' : 'Upload Logo'}
                  <input type="file" className="hidden" accept="image/*" onChange={handleLogoChange} />
                </label>
                <p className="text-xs text-gray-500 mt-2">Format: JPG, PNG. Maksimal 2MB.</p>
              </div>
            </div>
          </div>

          {/* Form Informasi Dasar */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
            <h3 className="font-bold text-gray-800 text-lg border-b pb-2 mb-4">Informasi Dasar</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Restoran</label>
              <div className="relative">
                <Store className="absolute left-3 top-2.5 text-gray-400" size={18} />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Link Restoran (Slug)</label>
              <input
                type="text"
                disabled
                value={slug}
                className="w-full px-4 py-2 border rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nomor WhatsApp</label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 text-gray-400" size={18} />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Alamat Lengkap</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-2.5 text-gray-400" size={18} />
                <textarea
                  rows={3}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                />
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={saving}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition flex items-center justify-center shadow-lg shadow-blue-200 disabled:opacity-70"
          >
            {saving ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" size={20} />}
            Simpan Perubahan
          </button>
        </form>
      </div>
    </div>
  )
}