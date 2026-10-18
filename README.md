# Expense Tracker AI

Aplikasi pencatat pengeluaran yang bisa **membaca foto struk belanja**. Foto dibaca oleh Gemini menjadi daftar barang, tanggal, dan total. Hasilnya muncul di form untuk diperiksa dan dikoreksi sebelum disimpan, atau pengeluaran bisa diisi manual.

## Fitur

- Masuk dengan akun Google
- **Scan struk**: unggah atau ambil foto, hasil bacaan mengisi form
- Input manual: barang, jumlah, harga satuan, dan penyesuaian (pajak, service, atau diskon)
- Edit dan hapus transaksi
- Dashboard: total per bulan, grafik per hari atau per bulan, dan transaksi terbaru
- Daftar semua transaksi dengan pagination dan filter tanggal
- Ekspor ke Excel 


## Tech stack

**Backend**: Python, FastAPI, asyncpg, PostgreSQL, Google Gen AI SDK (Gemini), PyJWT
**Frontend**: Next.js (App Router), TypeScript, Tailwind CSS, Auth.js v5

## Menjalankan secara lokal

### Prasyarat

- Python 3.10+ dan Node.js 20.9+
- Docker
- OAuth client Google ([Google Cloud Console](https://console.cloud.google.com/)) dan API key Gemini

### 1. Clone

```bash
git clone https://github.com/LouisJonathan88/expense-tracker-ai.git
cd expense-tracker-ai
```

### 2. Konfigurasi

```bash
cp .env.example .env
cp frontend/.env.example frontend/.env
```

Isi kedua file. Pada OAuth client Google, daftarkan Authorized redirect URI `http://localhost:3000/api/auth/callback/google`. Backend membaca `.env` di root repo.

### 3. Database

```bash
docker compose up -d
cd backend
migrate -path migrations -database "postgres://<DB_USER>:<DB_PASSWORD>@localhost:<DB_PORT>/<DB_NAME>?sslmode=disable" up
```

### 4. Backend (http://localhost:8000)

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Dokumentasi API tersedia di `http://localhost:8000/docs`.

### 5. Frontend (http://localhost:3000)

```bash
cd frontend
npm install
npm run dev
```