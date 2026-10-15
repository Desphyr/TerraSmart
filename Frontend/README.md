# TerraSmart Frontend

Antarmuka React untuk autentikasi, dashboard petani, pengelolaan lahan, logbook, keuangan, prakiraan cuaca, kalender tanam, harga referensi, notifikasi, dan dashboard admin.

## Menjalankan aplikasi

```sh
npm install
npm run dev
```

Secara default frontend menggunakan API di `http://localhost:5000/api`. Untuk alamat backend lain, buat file `.env` di direktori `Frontend`:

```env
VITE_API_URL=http://localhost:5000/api
```

## Integrasi

- Token sesi disimpan di `localStorage` dan divalidasi melalui `GET /users/me`; route admin dan petani dibatasi menurut role dari API.
- Data lahan, aktivitas, dan transaksi memakai endpoint CRUD backend yang tersedia.
- Prakiraan Open-Meteo menggunakan latitude dan longitude dari lahan terpilih. Data kebutuhan pupuk, air, musim, dan ambang hujan berada di `src/data/crops.json`.
- Harga pasar ditampilkan sebagai data ilustrasi karena backend belum menyediakan endpoint harga; halaman juga memberi label yang jelas.
- Dashboard admin hanya memvalidasi endpoint `GET /admin/ping`. Statistik admin belum tersedia dari backend.
