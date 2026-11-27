# Design Spec: Adaptive 3D Living Binder with Touch-Swipe Flip

**Date:** 2026-11-27  
**Target Route:** `/b/[id]` (e.g. `http://localhost:3000/b/binder-grail-hits`)  
**Status:** Pending Approval  

---

## 1. Intent & The Why
Mengubah antarmuka katalog binder pembeli (`/b/[id]`) agar menyerupai binder kartu koleksi fisik nyata yang "hidup" (*tactile book aesthetic*). Saat pembeli di meja bazaar membuka katalog lewat scan QR dari HP mereka, pengalaman membolak-balik halaman binder terasa nyata, interaktif, dan memikat lewat animasi 3D page-flip serta gesture swipe dengan jari.

---

## 2. Goals, Non-Goals, & Anti-Goals

### Goals:
1. **Adaptive Binder Layout:**
   - **Mobile View (< 768px):** Tampilan 1 lembar binder saku vertikal (*single sleeve*) dengan aksen ring binder di sisi kiri/tulang, proporsional dan jelas di layar ponsel.
   - **Desktop / Tablet View (≥ 768px):** Tampilan buku binder terbuka penuh (*2-page spread*) dengan cincin besi ring binder di tengah (spine) dan pinggiran sampul binder vintage di sekelilingnya.
2. **Realistic 3D Page Flip Animation:**
   - Animasi rotasi lembaran mika plastik 3D halus saat berpindah halaman (arah maju: kanan ke kiri; arah mundur: kiri ke kanan).
   - Efek pencahayaan/bayangan dinamis (*dynamic glare & drop-shadow gradient*) selama lembaran membalik untuk mensimulasikan ketebalan mika plastik binder.
3. **Touch Swipe & Drag Gestures:**
   - Pembeli di layar sentuh HP dapat langsung menggeser/swipe layar ke kiri untuk halaman berikutnya dan swipe ke kanan untuk halaman sebelumnya.
   - Tetap menyediakan tombol navigasi panah manual yang jelas dan nyaman ditekan.
4. **Preserved Interactivity:**
   - Semua fungsi interaktif (klik saku untuk detail, tambah ke keranjang, zoom kartu, sound effect, filter harga & pencarian) tetap bekerja 100% tanpa gangguan.

### Non-Goals:
- Mengubah alur checkout kasir atau API backend pesanan.
- Menambahkan dependensi berat berbasis Canvas/WebGL yang membebani kinerja HP pembeli di event.

### Anti-Goals:
- Animasi lambat/patah-patah yang membuat pembeli frustrasi saat buru-buru melihat kartu.
- Teks atau kartu yang mengecil di layar HP akibat memaksakan tampilan 2 halaman di layar ponsel vertikal.

---

## 3. UI Layout & Visual Structure

### A. Mobile View (< 768px): Single-Sheet Binder
```text
+---------------------------------------------------+
|  [Header: Nama Binder, Booth, Tombol Rak/View]    |
+---------------------------------------------------+
|  [Bar Filter & Pencarian Kartu]                   |
+---------------------------------------------------+
|  +-[ Ring Spine ]-------------------------------+ |
|  | (o)                                          | |
|  |     [ Saku #1 ]     [ Saku #2 ]              | |
|  | (o)                                          | |
|  |     [ Saku #3 ]     [ Saku #4 ]              | |
|  | (o)                                          | |
|  |     [ Saku #5 ]     [ Saku #6 ]              | |
|  +----------------------------------------------+ |
|        < Swipe kiri / kanan untuk membalik >      |
|  [ < Hal. Sebelumnya ]  Hal 1/3  [ Hal. Berikut > ]|
+---------------------------------------------------+
|  [ Bar Floating Keranjang Belanja ]               |
+---------------------------------------------------+
```

### B. Desktop/Tablet View (≥ 768px): Open 2-Page Spread
```text
+-------------------------------------------------------------------+
|               [ Sampul Luar Binder Kulit / Tekstur ]              |
|  +------------------------+-[RING]-+----------------------------+ |
|  |      HALAMAN KIRI      |  (O)   |       HALAMAN KANAN        | |
|  | [Slot 1] [Slot 2] [Slot3] |  (O)   | [Slot 10] [Slot 11] [Slot12] |
|  | [Slot 4] [Slot 5] [Slot6] |  (O)   | [Slot 13] [Slot 14] [Slot15] |
|  | [Slot 7] [Slot 8] [Slot9] |  (O)   | [Slot 16] [Slot 17] [Slot18] |
|  +------------------------+-[RING]-+----------------------------+ |
|       [ < Halaman Sebelumnya ]         [ Halaman Berikutnya > ]   |
+-------------------------------------------------------------------+
```

---

## 4. Approaches Considered

1. **Opsi 1 (Dipilih): Native CSS 3D Transforms + Hardware-Accelerated Gestures**
   - Menggunakan `perspective: 1400px`, `transform-style: preserve-3d`, dan `rotateY` dengan transisi easing cubic-bezier.
   - Menggunakan native touch listener (`onTouchStart`, `onTouchMove`, `onTouchEnd`) dengan threshold swipe 50px.
   - *Alasan Dipilih:* Kompatibel penuh dengan React 19 / Next.js 16, 0kb library tambahan, super cepat di HP Android/iOS, dan DOM kartu tetap interaktif penuh.
2. **Opsi 2 (Ditolak): External Canvas/WebGL Page-Flip Library**
   - *Alasan Ditolak:* Konflik ref/DOM dengan React 19 (`findDOMNode`), bundle berat, boros memori/baterai ponsel di event, dan mengganggu responsivitas klik saku kartu.

---

## 5. Technical Implementation Details

1. **State & Navigasi Halaman:**
   - State `isFlipping: boolean`, `flipDirection: 'next' | 'prev'`.
   - Durasi animasi membalik: ~450ms (cepat, responsif, tidak membuang waktu pembeli).
   - Audio feedback opsional: bunyi gemerisik plastik mika / kertas saat membalik halaman (menggunakan Web Audio API sintetis ringan atau 8-bit click).
2. **Gesture Swipe Handler:**
   - `touchStartX`, `touchCurrentX`. Jarak geser horizontal > 50px memicu `handlePageChange(next/prev)`.
   - Mengabaikan swipe vertikal agar pembeli tetap bisa scroll halaman ke atas-bawah dengan alami tanpa macet.
3. **Styling Binder Fisik:**
   - Punggung binder: efek ring binder metalik melingkar dengan lubang cincin saku mika (*binder holes*).
   - Kilau mika plastik: lapisan refleksi glaze tipis pada saku kartu (*pocket reflection*).
   - Sudut melengkung dan jahitan pinggir cover binder (*stitched border effect*).

---

## 6. What's Left to the Builder
- Menyesuaikan pembagian slot ganda pada mode Desktop 2-page spread agar transisi antar halaman genap/ganjil berjalan mulus.
- Menjaga tampilan grid biasa (mode "Semua/Grid") tetap tersedia jika pembeli ingin melihat semua kartu sekaligus dalam bentuk daftar biasa.
