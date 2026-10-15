# TerraSmart Frontend

Antarmuka React untuk autentikasi, dashboard petani, pengelolaan lahan, logbook, keuangan, prakiraan cuaca, kalender tanam, harga referensi, notifikasi, dan dashboard admin.

## Menjalankan aplikasi

```sh
npm install
npm run dev
```

Secara default, request `/api` diteruskan oleh proxy Vite ke backend pada `http://localhost:5000`. Pastikan backend berjalan di port tersebut (default `PORT=5000`).

Konfigurasi key cuaca disimpan di `Backend/.env`, bukan di frontend:

```env
WEATHER_API_KEY=your_weatherapi_key_here
```

Backend membaca key dan memanggil WeatherAPI atas nama frontend melalui endpoint `/api/weather/forecast`; API key tidak dikirim ke browser. Jika alamat backend development berbeda, atur `API_PROXY_TARGET` pada `Frontend/.env`.

Untuk deployment tanpa proxy Vite, atur `VITE_API_URL` ke URL API yang dapat diakses browser, misalnya `https://api.example.com/api`. Jika tidak diatur, Axios menggunakan path relatif `/api`.

## Integrasi

- Token sesi disimpan di `localStorage` dan divalidasi melalui `GET /users/me`; route admin dan petani dibatasi menurut role dari API.
- Data lahan, aktivitas, dan transaksi memakai endpoint CRUD backend yang tersedia.
- Prakiraan WeatherAPI.com menggunakan latitude dan longitude dari lahan terpilih dan mengambil tiga hari forecast. Data kebutuhan pupuk, air, musim, dan ambang hujan berada di `src/data/crops.json`.
- Harga pasar petani dimuat dari proxy `/api/market-prices`. Atur `MARKET_PRICE_SOURCE_URL` di `Backend/.env` ke endpoint open-data JSON dengan daftar row di root atau properti `prices`, `data`, `results`, atau `items`. Setiap row perlu nama komoditas (`commodity`, `komoditas`, `nama`, atau `name`) dan harga (`price`, `harga`, atau `harga_rata_rata`). Backend memakai fallback lokal dari `Backend/data/marketPricesFallback.json` jika URL tidak diatur, sumber timeout, gagal, atau respons tidak lengkap.
- Form lahan memakai React Leaflet dengan peta OpenStreetMap; pencarian dan reverse geocoding memakai Nominatim publik tanpa API key. Request Nominatim dibatasi minimal satu detik per permintaan; untuk penggunaan produksi dengan trafik tinggi, gunakan instance geocoding yang dikelola sendiri dan ikuti kebijakan penggunaan OpenStreetMap.
- Dashboard admin menyediakan ringkasan statistik serta daftar pengguna, lahan, dan aktivitas melalui endpoint `/api/admin`.
