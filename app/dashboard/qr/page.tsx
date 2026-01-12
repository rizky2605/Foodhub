'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { ArrowLeft, Download, Printer, Copy, ExternalLink, Loader2 } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'

export default function QrCodePage() {
  const router = useRouter()
  const supabase = createClient()
  const qrRef = useRef<SVGSVGElement>(null)

  const [loading, setLoading] = useState(true)
  const [restaurant, setRestaurant] = useState<any>(null)
  const [url, setUrl] = useState('')

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
        alert('Restoran tidak ditemukan')
        router.push('/dashboard')
        return
      }

      setRestaurant(resto)
      // Set URL Publik Restoran
      // window.location.origin akan mengambil "http://localhost:3000" atau domain asli nanti
      const publicUrl = `${window.location.origin}/restaurant/${resto.slug}`
      setUrl(publicUrl)

    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  // Fungsi Download QR sebagai Gambar PNG
  const downloadQR = () => {
    if (!qrRef.current) return
    
    const svg = qrRef.current
    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    const img = new Image()
    
    img.onload = () => {
      canvas.width = img.width + 40 // Padding
      canvas.height = img.height + 40
      if (ctx) {
        // Background Putih
        ctx.fillStyle = "white"
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        // Gambar QR
        ctx.drawImage(img, 20, 20)
        
        const pngFile = canvas.toDataURL("image/png")
        const downloadLink = document.createElement("a")
        downloadLink.download = `QR-${restaurant.slug}.png`
        downloadLink.href = pngFile
        downloadLink.click()
      }
    }
    
    img.src = "data:image/svg+xml;base64," + btoa(svgData)
  }

  const copyLink = () => {
    navigator.clipboard.writeText(url)
    alert('Link berhasil disalin!')
  }

  if (loading) return <div className="p-10 text-center flex justify-center"><Loader2 className="animate-spin mr-2"/> Memuat...</div>

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => router.push('/dashboard')} className="flex items-center text-gray-500 hover:text-blue-600 mb-6 transition">
          <ArrowLeft size={20} className="mr-2"/> Kembali ke Dashboard
        </button>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">QR Code Restoran</h1>
        <p className="text-gray-500 mb-8">Cetak dan tempel QR ini di meja pelanggan Anda.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* PREVIEW CARD */}
          <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 flex flex-col items-center text-center">
            <div className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-bold mb-6">
              Scan untuk Pesan
            </div>

            <div className="p-4 bg-white border-2 border-gray-900 rounded-xl mb-4">
              {url && (
                <QRCodeSVG 
                  value={url} 
                  size={200}
                  level="H" // High error correction
                  ref={qrRef}
                />
              )}
            </div>

            <h2 className="text-xl font-bold text-gray-800">{restaurant.name}</h2>
            <p className="text-gray-400 text-sm mt-1">{url.replace('http://', '').replace('https://', '')}</p>
          </div>

          {/* ACTION BUTTONS */}
          <div className="space-y-4">
            
            <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
              <h3 className="font-bold text-blue-800 mb-2">Link Publik</h3>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  readOnly 
                  value={url} 
                  className="w-full px-3 py-2 border rounded-lg bg-white text-gray-600 text-sm"
                />
                <button onClick={copyLink} className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700">
                  <Copy size={18} />
                </button>
              </div>
              <button 
                onClick={() => window.open(url, '_blank')}
                className="text-sm text-blue-600 mt-2 flex items-center hover:underline"
              >
                <ExternalLink size={14} className="mr-1" /> Buka Link
              </button>
            </div>

            <button 
              onClick={downloadQR}
              className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold hover:bg-gray-800 transition flex items-center justify-center shadow-lg"
            >
              <Download size={20} className="mr-2" /> Download Gambar QR (.PNG)
            </button>

            <button 
              onClick={() => window.print()}
              className="w-full bg-white border border-gray-300 text-gray-700 py-4 rounded-xl font-bold hover:bg-gray-50 transition flex items-center justify-center"
            >
              <Printer size={20} className="mr-2" /> Print Halaman Ini
            </button>

             <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 text-sm text-yellow-800">
              <strong>Tips:</strong> Tempel QR Code ini di setiap meja. Pelanggan cukup scan menggunakan kamera HP mereka untuk melihat menu dan memesan.
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}