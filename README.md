# 🍽️ FoodHub - Sistem Manajemen Restoran & Menu Digital

Aplikasi manajemen restoran modern berbasis web yang mencakup sistem POS kasir, manajemen inventaris menu, dan buku menu digital interaktif (Flipbook) untuk pelanggan.


## 🎥 Video Demo

Tonton demonstrasi lengkap penggunaan aplikasi di sini:

[![Tonton Video Demo](https://drive.google.com/drive/folders/1CilND-4tjixdk4Mt-7K3cyz8wBntPaqh?usp=sharing)]

*(Klik gambar di atas untuk memutar video)*

## ✨ Fitur Unggulan

### 📱 Untuk Pelanggan (Client Side)
* **Interactive Flipbook Menu:** Pengalaman membuka menu seperti buku fisik dengan animasi 3D.
* **Order System:** Pemesanan langsung dari meja dengan input nama & nomor meja.
* **QRIS Payment:** Integrasi pembayaran digital.
* **Digital Receipt:** Struk belanja yang bisa dicetak langsung dari browser.

### 🛡️ Untuk Pemilik & Staf (Dashboard)
* **Multi-Role Access:** Login berbeda untuk Owner, Admin, Kasir, dan Pelayan.
* **Realtime Dashboard:** Memantau omset, total pesanan, dan item terlaris secara langsung.
* **Manajemen Pegawai:** Owner dapat menyetujui (Approve) atau menolak pendaftaran staf baru.
* **Laporan Penjualan:** Grafik penjualan dan ekspor laporan.

## 🛠️ Teknologi yang Digunakan

* **Frontend:** Next.js 14 (App Router), Tailwind CSS, Lucide Icons.
* **Backend & Database:** Supabase (PostgreSQL, Auth, Realtime, Storage).
* **Deployment:** Vercel.

## 🚀 Cara Menjalankan Project

1.  Clone repository:
    ```bash
    git clone [https://github.com/rizky2605/Foodhub.git]
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Setup Environment Variables (`.env.local`):
    ```env
    NEXT_PUBLIC_SUPABASE_URL=your_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key

    kontak saya untuk kodenya
    ```
4.  Jalankan server development:
    ```bash
    npm run dev
    ```

---
Dibuat dengan ❤️ oleh Rizky Maulana