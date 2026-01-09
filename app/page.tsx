'use client'

import { useEffect, useState } from 'react'
import { createClient } from 'utils/supabase/client' // Import dari file yang baru kita buat

export default function Home() {
  const [status, setStatus] = useState('Memeriksa koneksi...')
  const supabase = createClient()

  useEffect(() => {
    async function checkConnection() {
      // Coba ambil data sembarang, misalnya cek session
      const { data, error } = await supabase.auth.getSession()
      
      if (error) {
        setStatus('Error: ' + error.message)
      } else {
        setStatus('Sukses! Terhubung ke Supabase. Project siap dibangun.')
        console.log('Session:', data)
      }
    }

    checkConnection()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="p-8 bg-white rounded shadow-md text-center">
        <h1 className="text-2xl font-bold mb-4 text-black">FoodHub V2</h1>
        <p className={`font-mono ${status.includes('Sukses') ? 'text-green-600' : 'text-red-600'}`}>
          Status: {status}
        </p>
      </div>
    </div>
  )
}