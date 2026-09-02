# RaceBox 🏁

**RaceBox** adalah aplikasi performance measurement untuk motor dan mobil berbasis **Web/PWA** yang menggunakan **GPS perangkat** untuk mengukur kecepatan, jarak, waktu tempuh, dan performa drag race.

Aplikasi berjalan **local-first**: data rekaman tersimpan di perangkat (IndexedDB). Akses masuk dapat dikunci belakang **autentikasi + persetujuan admin** opsional berbasis **Supabase** (aktif bila `VITE_SUPABASE_URL` & `VITE_SUPABASE_ANON_KEY` diisi).

> Pengukuran berbasis GPS smartphone. Akurasi tergantung kualitas sinyal GPS perangkat, lingkungan, dan jenis perangkat.

---

## Fitur Utama

- **Drag Timer** — 7 preset jarak (20/50/100/150/201/300/402 m) + custom, deteksi start otomatis/manual, interpolasi finish, split times, live screen.
- **Ride Recorder** — rekam perjalanan dengan jarak, durasi, kecepatan rata-rata & maksimum, elevasi gain.
- **Riwayat** — filtering (All/Drag/Ride) & sorting (Newest/Oldest/Fastest/Longest), halaman detail dengan grafik speed-vs-distance & speed-vs-time, perbandingan 2 balapan.
- **Garage** — kelola kendaraan (motor/mobil, brand, model, engine, berat).
- **Share Card** — render kartu hasil menjadi gambar (portrait) dengan 3 gaya (Dark Sport, Corsa Red, Apex Neon); pakai Web Share API, fallback unduh.
- **PWA** — installable, offline-first, service worker caching.
- **GPS Engine** — high-accuracy `watchPosition`, filter anti-jump, perhitungan Haversine, fallback speed, kualitas sinyal (Excellent/Good/Fair/Poor).
- **Pengaturan** — unit (km/h ↔ mph, meter ↔ feet), deteksi start, start threshold, tema, ekspor/impor data (JSON) & ringkasan (CSV).

---

## Tech Stack

| Komponen | Teknologi |
|----------|-----------|
| Build tool | [Vite](https://vitejs.dev) |
| Framework | [React 19](https://react.dev) + TypeScript |
| Styling | [Tailwind CSS v4](https://tailwindcss.com) |
| Routing | [React Router v7](https://reactrouter.com) |
| Database lokal | [Dexie.js](https://dexie.org) (IndexedDB) |
| PWA | [vite-plugin-pwa](https://vite-pwa-org.netlify.app) + Workbox |
| Share card | [html-to-image](https://github.com/bubkoo/html-to-image) |
| Test | [Vitest](https://vitest.dev) + Testing Library |

---

## Cara Menjalankan

```bash
npm install
npm run dev        # development (http://localhost:5173)
```

### Production build

```bash
npm run build      # typecheck + build produksi ke /dist
npm run preview    # preview build produksi
```

### Testing & linting

```bash
npm run test       # unit test calculation engine
npm run test:watch # watch mode
npm run lint       # oxlint
```

---

## Cara Test GPS

### Perangkat nyata (mobile)
1. Buka aplikasi di perangkat (atau `npm run dev` + buka di handphone pada LAN).
2. Izinkan izin lokasi saat diminta.
3. Indikator GPS akan menampilkan status **CONNECTED** + kualitas sinyal + akurasi (± meter).

### Mode simulasi GPS (development/testing, TANPA kendaraan)
1. Buat file `.env` (salin dari `.env.example`):
   ```bash
   cp .env.example .env
   ```
2. Pastikan `VITE_DEV_GPS_SIMULATION=true` dan jalankan `npm run dev`.
3. Mode simulasi akan menghasilkan jalur kecepatan dari 0 → 5 → 20 → 50 → 80 → 100 → 120 km/h secara otomatis, sehingga kamu bisa menguji drag timer & ride recorder tanpa bergerak.

> Mode simulasi **hanya aktif di `import.meta.env.DEV`** dan tidak berpengaruh pada build produksi.

---

## Cara Test Drag Timer

1. Buka menu **RACE**.
2. Pilih jarak (misal 100 M atau 402 M), atau **CUSTOM** + masukkan jarak.
3. Tekan **START DRAG**.
4. **WAITING FOR MOVEMENT** → begitu kecepatan melewati threshold start (default 3 km/h), timer langsung berjalan (mode automatic). Pada mode manual tinggal tekan **START NOW**.
5. Layar live menampilkan waktu, kecepatan, jarak, dan progress.
6. **FINISH** otomatis saat jarak mencapai target — hasil, splits, dan metrik muncul.
7. **SAVE RESULT** → **SHARE** (kartu gambar).

---

## Architecture

```
src/
├── app/                 # App shell, router, layout, PWA install, error boundary, theme
├── components/          # Komponen UI bersama (Button, Card, GPSStatusChip)
├── features/
│   ├── gps/             # RaceEngine (drag state machine)
│   ├── ride/            # RideRecorder
│   ├── race/            # Halaman drag, live screen, result
│   ├── history/         # Riwayat, detail + grafik, perbandingan
│   ├── garage/          # CRUD kendaraan
│   ├── settings/        # Pengaturan + About
│   └── share/           # Share card + Web Share API
├── hooks/               # useGPS, useSettings, useTheme
├── lib/
│   ├── gps/             # GPSService, GPSProvider (Browser + Simulated), filter
│   ├── db/              # Dexie database, ekspor/impor
│   ├── calculations/    # Haversine, speed, interpolasi, split, quality, filter (pure)
│   └── utils/           # Konstanta, formatter
├── types/               # Interface TypeScript
└── test/                # Vitest setup
```

**Prinsip utama:**
- Unit internal selalu **meter, detik, m/s**; konversi ke km/h / mph / feet hanya pada lapisan presentasi.
- GPS di-abstraksi via `interface GPSProvider` → `BrowserGPSProvider` (nyata) & `SimulatedGPSProvider` (dev). Siap untuk external GNSS di V2.
- Satu GPS watcher dibagikan antar fitur via React context.
- Semua fungsi matematika adalah **pure function** yang dites.

---

## GPS Requirements & Browser Compatibility

- Perlu **HTTP/HTTPS** (GPS hanya tersedia di konteks secure) — `localhost` dianggap secure.
- **Android Chrome**: geolocation + instal PWA didukung penuh.
- **iOS Safari**: geolocation (wajib izin) + PWA via "Add to Home Screen".
- **Desktop**: bisa untuk development; akurasi GPS desktop bervariasi tergantung perangkat.

### Kualitas sinyal
| Kualitas | Akurasi |
|----------|---------|
| Excellent | ≤ 5 m |
| Good | > 5 m & ≤ 10 m |
| Fair | > 10 m & ≤ 20 m |
| Poor | > 20 m |

Jarak finish yang dihitung adalah **jarak arah lintasan (accumulated)** dari sampel GPS yang tervalidasi (bukan jarak lurus awal–akhir), dengan hasil waktu finish diinterpolasi secara linear antar dua sampel yang melintasi garis finish.

---

## Known Limitations (GPS Browser)

- Akurasi GPS smartphone bervariasi dan bukan alat ukur timing profesional.
- Sinyal buruk / gedung / cuaca dapat menyebabkan lonjakan atau kecepatan tidak stabil.
- iOS membatasi frekuensi/akurasi tinggi pada kondisi tertentu.
- Background GPS dibatasi sistem operasi saat layar terkunci (normal untuk PWA).

---

## Testing

Unit test dijalankan pada modul kalkulasi:
- Haversine distance (titik yang diketahui)
- Kecepatan (10 m / 1 s = 36 km/h)
- Interpolasi waktu finish
- Deteksi split
- Filter GPS jump
- Kualitas sinyal

```bash
npm run test
```

---

## Autentikasi & Persetujuan Admin (Supabase)

RaceBox dapat dikunci sehingga pengguna **harus daftar → disetujui admin → login** sebelum memakai aplikasi. Fitur ini **opsional** dan aktif hanya saat kedua env berikut diisi.

### Setup sekali

1. Buat project di [Supabase](https://supabase.com) (free tier cukup).
2. Di **SQL Editor**, jalankan seluruh isi [`supabase/schema.sql`](supabase/schema.sql).
   Skema ini membuat tabel `profiles` (status `pending`/`approved`/`banned`, role `user`/`admin`), trigger otomatis saat user daftar, dan aturan RLS.
3. Salin `SUPABASE_URL` dan `SUPABASE_ANON_KEY` dari **Settings → API** ke `.env`:

   ```bash
   VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
   ```

4. Jadikan user pertama sebagai admin (setelah mendaftar via aplikasi):

   ```sql
   update public.profiles
   set role = 'admin', status = 'approved', approved_at = now()
   where email = 'admin@example.com';
   ```

### Alur

- **Daftar** → status `pending`, muncul layar "Menunggu Persetujuan Admin".
- **Admin** → buka `/admin` atau link "Admin Panel" di Pengaturan → setujui/ban user.
- **Login** → hanya berhasil bila status `approved`.

> Tanpa env Supabase terisi, aplikasi berjalan dalam mode **tanpa login** (terbuka) seperti sebelumnya.

---

## Fitur V2 (Roadmap)

- Cloud sync & akun
- Leaderboard & open compare
- Track database
- External GNSS / Bluetooth GPS / high-rate GNSS
- Multiple riders & timing gates
- Telemetry sensors
