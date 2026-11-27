# Adaptive 3D Living Binder with Touch-Swipe Flip Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menghadirkan tampilan binder interaktif 3D adaptif dengan animasi lembaran membalik (*page-flip*) dan gesture swipe di halaman pembeli `/b/[id]`.

**Architecture:** Membangun komponen reusable `InteractiveBinder3D` yang memanfaatkan CSS 3D Transforms (`perspective`, `rotateY`, `transform-origin: left/right center`, dan dynamic shadow lighting) tanpa external canvas library. Komponen mengelola transisi adaptif: 1 halaman di Mobile (< 768px) dan 2-page spread berdampingan di Desktop (≥ 768px) dengan ring binder di tengah. Navigasi touch gesture membedakan swipe horizontal vs scroll vertikal.

**Tech Stack:** Next.js 16 (App Router), React 19, Tailwind CSS 4, Lucide React, TypeScript.

**Spec:** `docs/superpowers/specs/2026-11-27-adaptive-3d-binder-flip-design.md`

## Global Constraints
- React 19 & Next.js 16 kompatibilitas penuh (hindari library berbasis `findDOMNode`).
- Zero heavy 3rd-party dependencies (gunakan pure CSS 3D + native pointer/touch events).
- Slot & Page Parity: Kapasitas per lembar wajib mengikuti `binder.layoutType` (4, 9, atau 12 saku) agar nomor slot selalu identik dengan binder fisik seller.
- Search & Filter: Menggunakan *In-Place Dimming* (kartu tidak cocok menjadi transparan/grayscale, urutan slot tidak berubah).
- Interaktivitas penuh: Klik slot untuk membuka detail drawer, zoom kartu (lightbox), dan tombol keranjang harus tetap responsif.

## Review Focus
1. Swipe gesture tidak boleh memblokir scroll vertikal pembeli saat menggulir halaman ke bawah di layar HP.
2. Animasi membalik cepat (350-450ms) dengan akselerasi GPU tanpa lag pada browser mobile.
3. Tombol navigasi ("Hal. Sebelumnya" & "Hal. Berikutnya") harus otomatis disabled saat di halaman pertama/terakhir atau saat animasi flip sedang berjalan.
4. Mode Desktop 2-page spread harus mengelompokkan halaman kiri (ganjil) dan kanan (genap) dengan benar, serta menangani binder dengan jumlah halaman ganjil (halaman terakhir kanan kosong/cover).
5. Tab toggle "Binder" vs "Semua" (Grid Mode) tetap berfungsi mulus tanpa reset cart atau state.

---

### Task 1: Buat Komponen Core `InteractiveBinder3D` dengan CSS 3D Transforms & Visual Binder Fisik

**Files:**
- Create: `src/components/InteractiveBinder3D.tsx`

**Interfaces:**
- Consumes:
  - `PokemonCard` dari `src/types/pokemon`
  - Props: `binder`, `currentPage`, `onPageChange`, `isCardInCart`, `onSelectCard`, `onZoomCard`, `searchQuery`, `priceFilter`, `hideSold`, `currency`
- Produces:
  - `InteractiveBinder3D: React.FC<InteractiveBinder3DProps>`

- [ ] **Step 1: Definisikan Props dan Helper Perhitungan Saku**
  Tentukan interface props, perhitungan slot berdasarkan `binder.layoutType`, dan helper penentu apakah suatu kartu cocok dengan filter pencarian / harga (`isCardMatch`).

- [ ] **Step 2: Implementasi Visual Kulit Binder & Spine Rings**
  Buat container 3D dengan `perspective: 1400px` dan visual cincin besi binder (`binder-ring` metallic silver / dark chrome) serta pinggiran sampul kulit bertekstur.

- [ ] **Step 3: Implementasi Lembaran Mika 3D & State Flip**
  Tambahkan state `flipState: { active: boolean; direction: 'next' | 'prev'; progress: number }` dengan class CSS rotasi 3D `rotate-y-[-180deg]` / `rotate-y-[180deg]` dan dynamic shadow overlay.

- [ ] **Step 4: Verifikasi Komponen Terkompilasi Bersih**
  Jalankan typecheck: `npx tsc --noEmit`
  Ekspektasi: Lolos tanpa error.

- [ ] **Step 5: Commit**
  ```bash
  git add src/components/InteractiveBinder3D.tsx
  git commit -m "feat(binder): create InteractiveBinder3D core component with 3D perspective"
  ```

---

### Task 2: Implementasi Gesture Touch-Swipe & Disambiguasi Scroll Vertikal

**Files:**
- Modify: `src/components/InteractiveBinder3D.tsx`

**Interfaces:**
- Consumes: Native React Pointer/Touch handlers (`onTouchStart`, `onTouchMove`, `onTouchEnd`)
- Produces: State flip terpicu saat swipe horizontal > 50px dan delta X > 1.5 * delta Y

- [ ] **Step 1: Tambahkan Event Listener Touch Handlers**
  Rekam koordinat sentuhan awal `startX`, `startY`. Saat `touchMove`, hitung selisih `deltaX` dan `deltaY`. Jika `Math.abs(deltaY) > Math.abs(deltaX)`, abaikan swipe horizontal agar browser bebas scroll vertikal.

- [ ] **Step 2: Trigger Transisi Page-Flip on Release**
  Pada `onTouchEnd`, jika `deltaX < -50` (geser ke kiri), panggil `onPageChange(currentPage + 1)` jika belum di halaman akhir. Jika `deltaX > 50` (geser ke kanan), panggil `onPageChange(currentPage - 1)` jika belum di halaman pertama.

- [ ] **Step 3: Tambahkan Indikator Visual Swipe Ramah HP**
  Tambahkan baris mikro visual di bawah lembaran: *"Geser layar untuk membalik halaman"* dengan ikon tangan geser halus.

- [ ] **Step 4: Verifikasi Gesture Touch Logic**
  Jalankan `npx tsc --noEmit` untuk memastikan tidak ada type mismatch pada touch event.

- [ ] **Step 5: Commit**
  ```bash
  git add src/components/InteractiveBinder3D.tsx
  git commit -m "feat(binder): add touch-swipe gestures with vertical scroll disambiguation"
  ```

---

### Task 3: Implementasi Adaptive Layout (1 Halaman di Mobile vs 2-Page Spread di Desktop)

**Files:**
- Modify: `src/components/InteractiveBinder3D.tsx`

**Interfaces:**
- Consumes: Tailwind responsive classes (`hidden md:flex`, `grid md:grid-cols-2`) & deteksi lebar viewport
- Produces: Layout otomatis menyesuaikan resolusi layar

- [ ] **Step 1: Pisahkan Render Single-Sheet (Mobile) & Dual-Spread (Desktop)**
  Di layar `< 768px` (mobile), render 1 lembaran penuh dengan ring di samping kiri. Di layar `≥ 768px`, render buku binder terbuka: Halaman Kiri (halaman saat ini) dan Halaman Kanan (halaman berikutnya), dengan 3 ring binder melingkar di tengah pemisah.

- [ ] **Step 2: Penanganan Edge Case Halaman Terakhir pada Dual-Spread**
  Jika total halaman ganjil dan pembeli membuka halaman terakhir, lembar kanan menampilkan cover belakang bermotif beludru/logo PokéVend dengan rapi.

- [ ] **Step 3: Verifikasi Typecheck**
  Jalankan `npx tsc --noEmit`.

- [ ] **Step 4: Commit**
  ```bash
  git add src/components/InteractiveBinder3D.tsx
  git commit -m "feat(binder): implement adaptive dual-page spread on desktop and single-page on mobile"
  ```

---

### Task 4: Integrasi In-Place Dimming dengan Search & Filter di Halaman `/b/[id]`

**Files:**
- Modify: `src/app/b/[id]/page.tsx`
- Modify: `src/components/InteractiveBinder3D.tsx`

**Interfaces:**
- Consumes: `searchQuery`, `priceFilter`, `hideSold` dari `page.tsx`
- Produces: Kartu yang cocok diberi highlight ring halus, kartu yang tidak cocok diberi opacity 35% dan grayscale.

- [ ] **Step 1: Pasang Logika Dimming pada Setiap Saku Kartu**
  Jika query pencarian atau filter harga aktif, kartu yang lolos kriteria tetap 100% terang dengan badge "Cocok". Kartu yang tidak lolos filter dibuat redup (`opacity-35 grayscale`), posisi slot fisik tetap tidak bergeser.

- [ ] **Step 2: Gantikan Render Flip Lama di `src/app/b/[id]/page.tsx` dengan `InteractiveBinder3D`**
  Sambungkan komponen baru ke dalam view mode `viewMode === 'flip'` di `src/app/b/[id]/page.tsx`.

- [ ] **Step 3: Hubungkan Interaksi Keranjang & Modal Zoom**
  Pastikan klik kartu tetap membuka `selectedCardDetail` dan tombol zoom tetap memicu `lightboxCard`.

- [ ] **Step 4: Verifikasi Typecheck**
  Jalankan `npx tsc --noEmit`.

- [ ] **Step 5: Commit**
  ```bash
  git add src/app/b/[id]/page.tsx src/components/InteractiveBinder3D.tsx
  git commit -m "feat(binder): integrate InteractiveBinder3D with in-place dimming and page handlers"
  ```

---

### Task 5: Pengujian Menyeluruh (Verification & Polish)

**Files:**
- Modify: `src/components/InteractiveBinder3D.tsx` (jika ada perbaikan styling)
- Modify: `src/app/b/[id]/page.tsx`

- [ ] **Step 1: Jalankan Full Build Validation**
  Jalankan `npm run build` untuk memverifikasi seluruh rute Next.js, bundle tree, dan Tailwind CSS berhasil dikompilasi tanpa error.

- [ ] **Step 2: Uji Alur Pengguna di Dev Server**
  Verifikasi di `http://localhost:3000/b/binder-grail-hits`:
  - Navigasi tombol panah "Hal. Berikutnya" dan "Hal. Sebelumnya".
  - Uji swipe gesture pada resolusi layar mobile.
  - Uji tampilan 2-page spread di layar desktop.
  - Uji penambahan kartu ke keranjang dari saku binder 3D.
  - Uji peralihan ke tab "Semua" (Grid mode).

- [ ] **Step 3: Final Commit & Push**
  ```bash
  git add -A
  git commit -m "feat(binder): finalize living 3D binder with adaptive flip and touch gesture"
  git push origin main
  ```
