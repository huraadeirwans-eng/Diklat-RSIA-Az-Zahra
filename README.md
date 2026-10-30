# Calender Training - Nursing Preceptor Academy Corporate (RSIA AZ)

Aero-Dynamic Ultra Web Application untuk Manajemen Pelatihan Klinis, Kalender Interaktif, Presensi Digital Tenaga Medis, dan Analisis Kehadiran Terintegrasi dengan **Firebase Cloud Firestore** dan siap di-deploy ke **Vercel** melalui **GitHub**.

---

## 🎯 Alur Siap Pakai: GitHub ➡️ Firebase ➡️ Vercel

Aplikasi ini telah dirancang dan dikonfigurasi penuh agar:
1. **Repository Bersih & Terstandarisasi** untuk GitHub (lengkap dengan `.gitignore`, `.env.example`, `tsconfig.json`).
2. **Database Cloud Firebase Firestore Terintegrasi** dengan failover offline cache otomatis serta berkas `firestore.rules` dan `firebase.json` siap deploy.
3. **Konfigurasi Vercel SPA Ready** melalui `vercel.json` (auto-rewrite URL, headers caching aset statis immutable).

---

## 🛠️ Kredensial Bawaan Rumah Sakit (Default Accounts)

| Username | Password | Nama Lengkap | Peran / Otoritas | Email Pemulihan / OTP |
|---|---|---|---|---|
| `admin` | `admin123` | Ns. Ade Irwan H., S.Kep, M.Kes | Administrator Diklat (*Otoritas Penuh*) | `adeirwanh4@gmail.com` |
| `preceptor` | `diklat2026` | Ns. Siti Nurhaliza | Koordinator Preceptor (*Edit*) | `ci.palembang@bunda.co.id` |
| `instruktur` | `diklat123` | Ns. Budi Santoso, S.Kep, Ners | Instruktur Klinis (*Edit*) | `budi.santoso@hospital.corp.id` |
| `peserta` | `diklat2026` | Ns. Ratna Sari, S.Kep | Peserta Diklat (*Melihat*) | `peserta.diklat@hospital.corp.id` |

---

## 🚀 1. Persiapan & Push ke GitHub

Jalankan perintah berikut pada terminal di folder proyek Anda:

```bash
# 1. Inisialisasi Git (jika belum diinisialisasi)
git init

# 2. Tambahkan seluruh berkas ke staging
git add .

# 3. Buat commit pertama
git commit -m "feat: complete calender training corporate with Firebase & Vercel deployment support"

# 4. Hubungkan ke repository GitHub Anda (ganti USERNAME dan REPO_NAME)
git remote add origin https://github.com/USERNAME/REPO_NAME.git

# 5. Ubah branch utama menjadi main dan lakukan push
git branch -M main
git push -u origin main
```

---

## 🔥 2. Konfigurasi & Deployment Firebase

Aplikasi menggunakan Firebase Firestore untuk sinkronisasi real-time. Proyek bawaan yang telah aktif adalah:
- **Project ID**: `calender-training-rsia-az`
- **Auth Domain**: `calender-training-rsia-az.firebaseapp.com`

### Opsi A: Menggunakan Firebase Proyek yang Sudah Ada
Aplikasi otomatis terkoneksi ke proyek `calender-training-rsia-az`. Tidak perlu setup tambahan.

### Opsi B: Deploy Security Rules Menggunakan Firebase CLI
Jika Anda ingin menerapkan aturan keamanan `firestore.rules` ke proyek Firebase Anda:

```bash
# 1. Install Firebase CLI (jika belum)
npm install -g firebase-tools

# 2. Login ke Google Account Anda
firebase login

# 3. Terapkan aturan firestore
firebase deploy --only firestore:rules
```

---

## 🌐 3. Deployment ke Vercel (1-Klik Langsung Aktif)

Proyek telah dilengkapi `vercel.json` dengan konfigurasi Single Page Application (SPA) dan optimasi cache.

### Langkah Deploy di Vercel:
1. Kunjungi dashboard [Vercel](https://vercel.com/) dan login.
2. Klik tombol **"Add New..."** ➡️ **"Project"**.
3. Hubungkan akun GitHub Anda dan pilih repository proyek ini.
4. Pengaturan build akan otomatis terdeteksi:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
5. *(Opsional)* Jika Anda ingin menggunakan kredensial Firebase kustom Anda sendiri, tambahkan variabel lingkungan berikut pada menu **Environment Variables**:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
   *(Jika tidak diisi, aplikasi otomatis menggunakan proyek bawaan yang sudah berjalan lancar).*
6. Klik **"Deploy"**. Dalam hitungan detik website telah tayang di internet dengan domain HTTPS gratis (contoh: `https://calender-training-rsia-az.vercel.app`).

---

## ⌨️ Daftar Shortcut Keyboard (Hotkeys SIMRS)

| Tombol | Fungsi |
|---|---|
| `1` - `5` | Pindah Menu: 1=Kalender, 2=Daftar Pelatihan, 3=Unit Kerja, 4=Tren Kehadiran, 5=Pengaturan |
| `?` / `Shift + /` | Menampilkan Cheatsheet Shortcut Lengkap |
| `↑`, `↓`, `←`, `→` | Navigasi Tanggal Kalender (7 hari / 1 hari) & Gulir Agenda |
| `T` | Kembali Langsung ke Tanggal Hari Ini (*Today*) |
| `Enter` | Membuka Rincian Sesi & Presensi Peserta |
| `N` / `Alt + N` | Menjadwalkan Pelatihan Baru |
| `Delete` / `Backspace` | Hapus Pelatihan Terpilih (*Multi-Select Batch Delete*) |
| `Ctrl + P` / `⌘ + P` | Cetak Lembar Presensi Resmi Rumah Sakit |
| `Ctrl + E` / `⌘ + E` | Ekspor Rekap Lengkap Seluruh Agenda ke Excel (`.xlsx`) |
| `F` | Layar Penuh (*Fullscreen ON / OFF*) |
| `Esc` | Menutup Modal/Drawer atau Membatalkan Seleksi |
| `Ctrl + W` / `⌘ + W` / `Ctrl + Q` | Log Out dari Sistem dengan Aman |

---

## 💻 Pengujian Lokal

```bash
# Install dependensi
npm install

# Jalankan server pengembangan
npm run dev

# Validasi build produksi lokal
npm run build
```
Website siap dibuka di `http://localhost:3000`.
