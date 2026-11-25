# Login Screen, Google Auth, & Permanent Sales History Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menambahkan sistem autentikasi (Google Login + Login Screen bertema PokéVend), proteksi akses seller, serta pencatatan riwayat transaksi penjualan kartu (`SOLD`) secara permanen ke Supabase PostgreSQL lengkap dengan dashboard rekap penjualan (`/admin/sales`).

**Architecture:** Menggunakan Supabase Auth / OAuth untuk autentikasi Google dengan dukungan dev/demo session fallback, memperluas Prisma schema dengan model `SaleRecord` untuk menyimpan snapshot data kartu yang laku terjual, menghubungkan mutasi status kartu `SOLD` (di `EditSlotModal`, `QuickSellBar`, dan grid binder) ke endpoint pencatatan penjualan, serta menghadirkan halaman `/login` dan `/admin/sales`.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Lucide React, Prisma ORM 6.4.1, PostgreSQL (Supabase).

**Spec:** Berdasarkan hasil brainstorming tim mengenai sistem multi-user Google Login, halaman login khusus, dan pelacakan riwayat penjualan kartu yang laku.

## Global Constraints
- Bahasa antarmuka: Bahasa Indonesia untuk semua UI, label, dan pesan feedback.
- Public Viewer zero-friction: Halaman pembeli via QR Code (`/b/[id]` dan `/b/[id]/slot/[num]`) tetap bisa diakses tanpa login.
- Penanganan kartu terjual: Setiap kartu yang ditandai `SOLD` harus tersimpan sebagai snapshot permanen di database sehingga tidak akan hilang meskipun slot fisiknya dikosongkan atau diganti kartu baru.
- Backward compatibility: Data binder dan slot yang sudah ada tetap berfungsi normal.

## Review Focus
1. Apakah kartu yang ditandai `SOLD` melalui `QuickSellBar` otomatis tercatat ke riwayat penjualan?
2. Apakah kartu yang ditandai `SOLD` melalui `EditSlotModal` otomatis tercatat ke riwayat penjualan?
3. Apakah kartu yang ditandai `SOLD` melalui tombol cepat di halaman admin binder otomatis tercatat ke riwayat penjualan?
4. Apakah halaman login (`/login`) tampil responsif di mobile dan desktop dengan tombol Google Login yang jelas?
5. Apakah halaman pembeli (`/b/[id]`) tetap dapat diakses publik tanpa hambatan login?

---

### Task 1: Skema Prisma untuk Model `SaleRecord` & Sinkronisasi Database
**Files:**
- Modify: `prisma/schema.prisma`
- Action: Jalankan `npx prisma db push` & `npx prisma generate`

**Detail:**
Tambahkan model `SaleRecord` di `prisma/schema.prisma`:
```prisma
model SaleRecord {
  id            String   @id @default(cuid())
  userId        String?  @default("default-seller")
  binderId      String
  binderName    String
  slotNumber    Int
  cardName      String
  setName       String?  @default("")
  cardNumber    String?  @default("")
  rarity        String?  @default("")
  condition     String   @default("Raw - NM")
  game          String   @default("pokemon")
  imageUrl      String?  @default("")
  soldPrice     Float    @default(0)
  costPrice     Float?
  currency      String   @default("IDR")
  notes         String?
  soldAt        DateTime @default(now())

  @@index([binderId])
  @@index([soldAt])
  @@index([game])
}
```

- [ ] Update `prisma/schema.prisma` dengan model `SaleRecord`.
- [ ] Jalankan `npx prisma db push` untuk memperbarui tabel di Supabase.
- [ ] Jalankan `npx prisma generate` untuk mengupdate Prisma Client.

---

### Task 2: Service API untuk Riwayat Penjualan & Pencatatan Transaksi (`/api/sales`)
**Files:**
- Create: `src/app/api/sales/route.ts`
- Modify: `src/lib/storage.ts`

**Detail:**
1. Tambahkan fungsi di `src/lib/storage.ts`:
   - `recordSale(saleData)`: Menyimpan data penjualan ke Prisma `prisma.saleRecord.create`.
   - `getSalesRecords(filters)`: Mengambil daftar penjualan yang diurutkan dari yang terbaru (`soldAt: 'desc'`).
   - `deleteSaleRecord(id)`: Opsi membatalkan catatan penjualan jika terjadi kesalahan input.
2. Hubungkan fungsi `quickToggleCardStatus` dan `updateSlotCard` di `src/lib/storage.ts`:
   - Saat status kartu beralih ke `SOLD`, panggil `recordSale` secara otomatis dengan data snapshot kartu (nama, set, nomor, rarity, condition, harga, gambar, binder).
3. Buat API endpoint `src/app/api/sales/route.ts` (GET & POST & DELETE) untuk melayani frontend.

- [ ] Implementasikan helper `recordSale` & `getSalesRecords` di `src/lib/storage.ts`.
- [ ] Hubungkan mutasi status `SOLD` agar otomatis mencatat ke `SaleRecord`.
- [ ] Buat rute API `src/app/api/sales/route.ts`.

---

### Task 3: Auth Provider & Client Layer (Supabase Auth Client + Session Store)
**Files:**
- Create: `src/lib/supabaseClient.ts`
- Create: `src/lib/authContext.tsx`
- Modify: `src/app/layout.tsx`

**Detail:**
1. Buat `src/lib/supabaseClient.ts` yang menginisialisasi client Supabase dengan graceful fallback jika ENV anon key belum terisi, sehingga tidak membuat aplikasi crash.
2. Buat `src/lib/authContext.tsx` (React Context) untuk mengelola state pengguna (`user`, `loading`, `signInWithGoogle`, `signOut`, `signInAsDemoSeller`).
3. Bungkus layout root di `src/app/layout.tsx` dengan `AuthProvider`.

- [ ] Buat `src/lib/supabaseClient.ts`.
- [ ] Buat `src/lib/authContext.tsx` dengan dukungan Google OAuth dan Demo Seller fallback.
- [ ] Pasang `AuthProvider` di `src/app/layout.tsx`.

---

### Task 4: Halaman Login Screen Khusus (`/login`)
**Files:**
- Create: `src/app/login/page.tsx`

**Detail:**
Buat antarmuka login yang memukau dengan nuansa PokéVault:
1. Header & logo PokéBall neon bercahaya.
2. Judul: "Masuk ke PokéVault Seller Dashboard".
3. Tombol "Lanjutkan dengan Google" dengan logo resmi Google.
4. Tombol cepat "Mode Demo Seller (Masuk Cepat)" untuk pengujian instan tanpa perlu menunggu config OAuth Google Cloud.
5. Fitur keuntungan seller (Kelola Binder, Referensi Harga Pasaran, Catat Omset & Transaksi).
6. Informasi ramah pengunjung: "Bagi pembeli di meja event, scan QR code langsung di binder tanpa perlu login."

- [ ] Buat halaman `src/app/login/page.tsx` dengan desain responsif mobile & desktop.
- [ ] Tambahkan navigasi kembali ke Beranda atau redirect otomatis setelah login.

---

### Task 5: Pembaruan Navbar dengan Informasi Akun & Menu Penjualan
**Files:**
- Modify: `src/components/Navbar.tsx`

**Detail:**
1. Integrasikan `useAuth()` ke `src/components/Navbar.tsx`.
2. Jika seller sedang login:
   - Tampilkan badge/avatar user & nama seller.
   - Tambahkan menu link ke `Riwayat Penjualan` (`/admin/sales`) dengan ikon grafik/omset.
   - Tambahkan tombol Logout (Keluar).
3. Jika belum login:
   - Tampilkan tombol "Masuk / Login Seller" yang mengarah ke `/login`.

- [ ] Perbarui `src/components/Navbar.tsx` dengan status login dan navigasi riwayat penjualan.

---

### Task 6: Halaman Dashboard Riwayat Penjualan (`/admin/sales/page.tsx`)
**Files:**
- Create: `src/app/admin/sales/page.tsx`

**Detail:**
Halaman komprehensif bagi seller untuk melihat kinerja penjualan:
1. Kartu Metrik Keuangan:
   - Total Omset Terjual (Rp)
   - Total Kartu Laku (Pcs)
   - Rata-rata Harga Kartu (Rp)
   - Estimasi Keuntungan Kotor (jika modal diisi)
2. Filter & Pencarian:
   - Filter Game TCG (Pokémon / One Piece / Riftbound / Semua)
   - Filter Tanggal Transaksi
   - Search nama kartu
3. Tabel Riwayat Penjualan Interaktif:
   - Tanggal & jam terjual
   - Thumbnail gambar & nama kartu + nomor kartu
   - Binder asal & nomor slot
   - Harga jual (dan harga modal)
   - Tombol hapus catatan (jika void transaksi)

- [ ] Buat halaman `src/app/admin/sales/page.tsx`.
- [ ] Tambahkan kalkulasi metrik omset dan filter interaktif.

---

### Task 7: Verifikasi End-to-End & Build Validation
- [ ] Jalankan `npx tsc --noEmit` untuk memastikan 0 type error.
- [ ] Uji alur: Buka `/login` -> Login Seller -> Masuk ke Binder -> Tandai kartu `SOLD` -> Buka `/admin/sales` -> Pastikan kartu muncul lengkap dengan harga dan tanggal.
- [ ] Uji alur: Buka halaman pembeli `/b/[id]` tanpa login untuk memastikan pengunjung tetap bisa melihat binder dengan normal.
- [ ] Commit dan push ke repository git.
