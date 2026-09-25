# Sistem Manajemen Tamu (Visitor Management System)

Aplikasi ini terdiri dari file terpisah:
1. `schema.sql` - Skrip database untuk Supabase (tabel web_settings, approved_companies, approved_id_types, users, guests).
2. `index.html` - Antarmuka halaman utama web (multibahasa, registrasi, cek status, login admin & super admin).
3. `style.css` - Desain dan styling tampilan web responsif.
4. `script.js` - Logika interaktif, koneksi Supabase & fallback LocalStorage, fitur upload lokal logo/wallpaper, manajemen whitelist PT, jenis ID, dan hapus data tamu.

## Cara Penggunaan:
1. Jalankan `schema.sql` di SQL Editor Supabase Anda.
2. Masukkan URL dan Anon Key Supabase ke dalam `script.js` pada variabel `SUPABASE_URL` dan `SUPABASE_KEY`.
3. Buka `index.html` di browser Anda (atau gunakan live server).
