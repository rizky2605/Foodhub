'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { ChefHat, Mail, Lock, Loader2, ArrowRight, LayoutDashboard } from 'lucide-react'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Gagal login. Periksa email dan password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-white">
      
      {/* --- BAGIAN KIRI: FORMULIR --- */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 md:px-16 lg:px-24 py-12">
        <div className="max-w-md w-full mx-auto">
          
          {/* Logo Header */}
          <div className="flex items-center gap-2 mb-8">
            <div className="bg-blue-600 p-2 rounded-lg text-white">
              <ChefHat size={24} />
            </div>
            <span className="text-xl font-bold text-gray-900 tracking-tight">FoodHub</span>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">Selamat Datang Kembali</h1>
          <p className="text-gray-500 mb-8">Masuk untuk mengelola restoran Anda.</p>

          {/* Alert Error */}
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6 flex items-center border border-red-100">
               ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-gray-400" size={20} />
                <input 
                  type="email" 
                  required
                  placeholder="nama@email.com"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-gray-900"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <a href="#" className="text-sm text-blue-600 hover:underline">Lupa password?</a>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
                <input 
                  type="password" 
                  required
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-gray-900"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition flex items-center justify-center shadow-lg shadow-blue-200"
            >
              {loading ? <Loader2 className="animate-spin" /> : 'Masuk Dashboard'}
            </button>
          </form>

          <p className="mt-8 text-center text-gray-500">
            Belum punya akun?{' '}
            <Link href="/signup" className="text-blue-600 font-bold hover:underline">
              Daftar Gratis
            </Link>
          </p>
        </div>
      </div>

      {/* --- BAGIAN KANAN: ARTWORK / BRANDING (Hidden on Mobile) --- */}
      <div className="hidden lg:flex w-1/2 bg-blue-600 relative overflow-hidden items-center justify-center p-12">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-500 rounded-full blur-[100px] opacity-30 mix-blend-multiply"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-cyan-400 rounded-full blur-[100px] opacity-30 mix-blend-multiply"></div>

        <div className="relative z-10 text-white max-w-lg">
           <div className="bg-white/10 backdrop-blur-lg p-8 rounded-3xl border border-white/20 shadow-2xl">
              <div className="w-12 h-12 bg-white text-blue-600 rounded-xl flex items-center justify-center mb-6 shadow-md">
                 <LayoutDashboard size={24} />
              </div>
              <h2 className="text-3xl font-bold mb-4 leading-tight">Kelola bisnis kuliner Anda dalam satu genggaman.</h2>
              <ul className="space-y-3 text-blue-100">
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-white rounded-full"></div> Laporan penjualan realtime</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-white rounded-full"></div> Manajemen menu & stok mudah</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-white rounded-full"></div> QR Code menu digital</li>
              </ul>
           </div>
        </div>
      </div>

    </div>
  )
}