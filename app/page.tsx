import Link from 'next/link'
import { 
  ChefHat, QrCode, TrendingUp, Smartphone, 
  ArrowRight, CheckCircle, Star, ShieldCheck 
} from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      
      {/* --- NAVBAR --- */}
      <nav className="fixed top-0 left-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg text-white">
              <ChefHat size={24} />
            </div>
            <span className="text-xl font-bold text-gray-900 tracking-tight">FoodHub</span>
          </div>
          
          <div className="flex items-center gap-4">
            <Link 
              href="/login" 
              className="hidden md:block text-gray-600 font-medium hover:text-blue-600 transition"
            >
              Masuk
            </Link>
            <Link 
              href="/signup" 
              className="bg-gray-900 text-white px-5 py-2 rounded-full font-medium hover:bg-gray-800 transition shadow-lg shadow-gray-200"
            >
              Daftar Gratis
            </Link>
          </div>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="pt-32 pb-20 px-6 relative overflow-hidden">
        {/* Background Blob Decoration */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-100 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2 -z-10"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-100 rounded-full blur-3xl opacity-50 translate-y-1/2 -translate-x-1/2 -z-10"></div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* Text Content */}
          <div className="space-y-8 animate-in slide-in-from-left-5 duration-700">
            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full text-sm font-bold border border-blue-100">
              <Star size={14} fill="currentColor" /> Solusi #1 Restoran Modern
            </div>
            
            <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight">
              Kelola Restoran Jadi <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Lebih Mudah.</span>
            </h1>
            
            <p className="text-xl text-gray-500 leading-relaxed max-w-lg">
              Satu aplikasi untuk manajemen menu, pesanan QR Code, kasir digital, hingga laporan penjualan otomatis.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link 
                href="/signup" 
                className="px-8 py-4 bg-blue-600 text-white text-lg font-bold rounded-xl hover:bg-blue-700 transition shadow-xl shadow-blue-200 flex items-center justify-center"
              >
                Mulai Sekarang <ArrowRight className="ml-2" size={20} />
              </Link>
              <Link 
                href="/login" 
                className="px-8 py-4 bg-white text-gray-700 border border-gray-200 text-lg font-bold rounded-xl hover:bg-gray-50 transition flex items-center justify-center"
              >
                Masuk Dashboard
              </Link>
            </div>

            <div className="flex items-center gap-6 pt-4 text-gray-500 text-sm font-medium">
              <span className="flex items-center"><CheckCircle size={16} className="text-green-500 mr-2" /> Gratis Setup</span>
              <span className="flex items-center"><CheckCircle size={16} className="text-green-500 mr-2" /> Tanpa Kartu Kredit</span>
            </div>
          </div>

          {/* Hero Illustration (Card Mockup) */}
          <div className="relative animate-in slide-in-from-right-5 duration-1000 delay-200">
            <div className="relative z-10 bg-white rounded-3xl shadow-2xl border border-gray-100 p-6 rotate-2 hover:rotate-0 transition duration-500">
              {/* Mockup Header */}
              <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                    <ChefHat size={20} />
                  </div>
                  <div>
                    <div className="h-2 w-24 bg-gray-200 rounded mb-1"></div>
                    <div className="h-2 w-16 bg-gray-100 rounded"></div>
                  </div>
                </div>
                <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">Buka</div>
              </div>

              {/* Mockup Stats */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-xl">
                  <TrendingUp className="text-blue-600 mb-2" />
                  <div className="text-2xl font-bold text-gray-800">Rp 2.5jt</div>
                  <div className="text-xs text-gray-500">Omset Hari Ini</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-xl">
                  <QrCode className="text-purple-600 mb-2" />
                  <div className="text-2xl font-bold text-gray-800">45</div>
                  <div className="text-xs text-gray-500">Pesanan QR</div>
                </div>
              </div>

              {/* Mockup Menu Item */}
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-lg transition">
                    <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                    <div className="flex-1">
                      <div className="h-3 w-32 bg-gray-200 rounded mb-2"></div>
                      <div className="h-2 w-20 bg-gray-100 rounded"></div>
                    </div>
                    <div className="h-6 w-16 bg-blue-100 rounded"></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Decorative Elements behind card */}
            <div className="absolute top-10 -right-10 w-24 h-24 bg-yellow-400 rounded-full opacity-20 blur-xl"></div>
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-blue-600 rounded-full opacity-20 blur-xl"></div>
          </div>
        </div>
      </section>

      {/* --- FEATURES SECTION --- */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Semua Fitur yang Anda Butuhkan</h2>
            <p className="text-gray-500 text-lg">Kami menyederhanakan operasional restoran agar Anda bisa fokus pada rasa dan pelayanan.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition duration-300 border border-gray-100 group">
              <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition">
                <QrCode size={28} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Pemesanan QR Code</h3>
              <p className="text-gray-500 leading-relaxed">
                Pelanggan scan QR di meja, lihat menu digital, dan pesan langsung tanpa panggil pelayan. Hemat waktu & tenaga.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition duration-300 border border-gray-100 group">
              <div className="w-14 h-14 bg-green-100 text-green-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition">
                <Smartphone size={28} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Manajemen Menu Mudah</h3>
              <p className="text-gray-500 leading-relaxed">
                Ubah harga, tambah menu baru, atau matikan menu yang habis stoknya secara realtime dari HP Anda.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition duration-300 border border-gray-100 group">
              <div className="w-14 h-14 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition">
                <TrendingUp size={28} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Laporan Penjualan</h3>
              <p className="text-gray-500 leading-relaxed">
                Pantau omset harian secara otomatis. Data tersimpan rapi tanpa perlu rekap manual pakai kertas.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- HOW IT WORKS --- */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Mulai dalam 3 Langkah Mudah</h2>
              <div className="space-y-8">
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">1</div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-900">Daftar Akun</h4>
                    <p className="text-gray-500">Buat akun FoodHub gratis dan isi profil restoran Anda.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">2</div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-900">Input Menu</h4>
                    <p className="text-gray-500">Masukkan foto makanan, harga, dan kategori menu.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">3</div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-900">Cetak QR & Jualan</h4>
                    <p className="text-gray-500">Download QR Code dari dashboard, tempel di meja, dan siap terima pesanan.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-8 rounded-3xl border border-gray-100 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-32 bg-blue-100 rounded-full blur-3xl opacity-50"></div>
               <div className="relative z-10 text-center">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Siap Transformasi Restoran Anda?</h3>
                  <p className="text-gray-500 mb-8">Bergabunglah dengan pemilik bisnis kuliner lainnya.</p>
                  <Link 
                    href="/signup" 
                    className="inline-block bg-gray-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-gray-800 transition"
                  >
                    Coba Gratis Sekarang
                  </Link>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="bg-gray-900 text-gray-400 py-12 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 text-white">
            <ChefHat size={24} />
            <span className="text-xl font-bold">FoodHub</span>
          </div>
          <div className="text-sm">
            © {new Date().getFullYear()} FoodHub. All rights reserved.
          </div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition">Privacy</a>
            <a href="#" className="hover:text-white transition">Terms</a>
            <a href="#" className="hover:text-white transition">Contact</a>
          </div>
        </div>
      </footer>

    </div>
  )
}