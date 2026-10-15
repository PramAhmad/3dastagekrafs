# 🚀 Panduan Deployment Fullstack AstaKraf (Frontend & Backend)

Panduan ini menjelaskan cara mendeploy aplikasi **AstaKraf (Next.js Frontend + Go Backend + SQLite Database)**.

---

## 📋 Ringkasan Arsitektur

- **Backend**: Go (Gin Framework + GORM)
- **Database**: SQLite (Pure Go via `github.com/glebarez/sqlite`, tidak membutuhkan PostgreSQL eksternal dan tidak perlu CGO)
  - Lokasi default file database: `asta.db` (atau `/app/data/asta.db` pada Docker)
  - Otomatis membuat tabel (`AutoMigrate`) saat server pertama kali dijalankan.
- **Frontend**: Next.js 16 (React 19, Three.js / React Three Fiber, Tailwind CSS)
  - Port default: `3000`
  - Konfigurasi URL backend melalui env `NEXT_PUBLIC_API_URL`.

---

## 🛠 Opsi 1: Deploy Praktis Menggunakan Docker Compose (Sangat Direkomendasikan)

Jika Anda memiliki server VPS (Ubuntu / Debian / AlmaLinux / CentOS), ini cara termudah karena hanya butuh 1 perintah.

### Langkah-langkah:

1. **Clone repositori di VPS**:
   ```bash
   git clone https://github.com/astacodemanagement/astaKraf.git
   cd astaKraf
   ```

2. **Sesuaikan URL API di `docker-compose.yml`**:
   Buka file `docker-compose.yml`, pastikan `NEXT_PUBLIC_API_URL` mengarah ke domain atau IP public server Anda:
   ```yaml
   frontend:
     build:
       context: .
       dockerfile: Dockerfile.frontend
       args:
         - NEXT_PUBLIC_API_URL=http://IP_VPS_ANDA:8080 # Atau https://api.domainanda.com
   ```

3. **Jalankan aplikasi**:
   ```bash
   docker compose up -d --build
   ```

4. **Cek status container**:
   ```bash
   docker compose ps
   docker compose logs -f
   ```

Data SQLite dan file upload akan tersimpan aman di volume Docker (`backend_data` dan `backend_uploads`).

---

## 💻 Opsi 2: Deploy Mandiri di VPS (Systemd + PM2 + Nginx)

Cocok untuk VPS dengan spesifikasi hemat (1 GB - 2 GB RAM).

### 1. Persiapan VPS
```bash
sudo apt update && sudo apt install -y nginx git curl
# Install Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
```

---

### 2. Setup Backend (Go Binary)

1. **Build binary di server** (atau build lokal lalu upload ke server):
   ```bash
   cd /var/www/astakraf
   go build -o bin/api ./cmd/api
   ```

2. **Buat Systemd Service**:
   ```bash
   sudo nano /etc/systemd/system/astakraf-backend.service
   ```
   Isi dengan:
   ```ini
   [Unit]
   Description=AstaKraf Go Backend API
   After=network.target

   [Service]
   Type=simple
   User=www-data
   WorkingDirectory=/var/www/astakraf
   ExecStart=/var/www/astakraf/bin/api
   Restart=always
   RestartSec=5
   Environment=APP_PORT=8080
   Environment=APP_ENV=production
   Environment=DATABASE_DRIVER=sqlite
   Environment=DATABASE_URL=/var/www/astakraf/asta.db
   Environment=JWT_SECRET=rahasia-kunci-jwt-anda-2026

   [Install]
   WantedBy=multi-user.target
   ```

3. **Jalankan service Backend**:
   ```bash
   sudo chown -R www-data:www-data /var/www/astakraf
   sudo systemctl daemon-reload
   sudo systemctl enable --now astakraf-backend
   sudo systemctl status astakraf-backend
   ```

---

### 3. Setup Frontend (Next.js)

1. **Masuk ke folder frontend dan install dependencies**:
   ```bash
   cd /var/www/astakraf/frontend
   npm ci
   ```

2. **Buat file `.env.production` di folder `frontend`**:
   ```bash
   nano .env.production
   ```
   Isi dengan domain/URL backend:
   ```env
   NEXT_PUBLIC_API_URL=https://api.domainanda.com
   ```

3. **Build dan jalankan via PM2**:
   ```bash
   npm run build
   pm2 start npm --name "astakraf-frontend" -- start
   pm2 save
   pm2 startup
   ```

---

### 4. Konfigurasi Nginx Reverse Proxy & SSL

Buat konfigurasi Nginx:
```bash
sudo nano /etc/nginx/sites-available/astakraf.conf
```

Isi konfigurasi (bisa single domain dengan path `/api` atau subdomain):

```nginx
# 1. Frontend (Next.js)
server {
    server_name domainanda.com www.domainanda.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# 2. Backend API
server {
    server_name api.domainanda.com;

    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Aktifkan konfigurasi dan install SSL gratis (Let's Encrypt Certbot):
```bash
sudo ln -s /etc/nginx/sites-available/astakraf.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Pasang SSL HTTPS
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d domainanda.com -d www.domainanda.com -d api.domainanda.com
```

---

## ☁️ Opsi 3: Deploy Cloud / PaaS (Vercel + Railway/VPS)

- **Frontend (Vercel)**:
  1. Buka [vercel.com](https://vercel.com) -> *Add New Project* -> pilih repositori GitHub `astaKraf`.
  2. Pada pengaturan **Root Directory**, klik Edit dan pilih `frontend`.
  3. Pada **Environment Variables**, tambahkan:
     - `NEXT_PUBLIC_API_URL`: URL Backend publik Anda (contoh: `https://api.domainanda.com`).
  4. Klik **Deploy**.

- **Backend**:
  - Deploy Go binary ke VPS atau container platform (Railway / Render / Fly.io).
  - *Catatan untuk SQLite di cloud platform*: Pastikan menggunakan **Persistent Volume** agar file `asta.db` tidak hilang saat container restart.

---

## 🔍 Verifikasi Setelah Deploy

1. Buka `https://api.domainanda.com/health` di browser:
   Respon yang diharapkan:
   ```json
   {"success":true,"message":"SaaS 3D Packaging AI API is running healthy","data":{"env":"production"}}
   ```
2. Buka `https://domainanda.com` di browser dan pastikan 3D Canvas, katalog template, dan editor dapat dibuka normal.
