# 🚀 Panduan Deployment AstaKraf Tanpa Docker (Khusus Server Minim Resource)

Panduan ini dirancang khusus untuk VPS dengan spesifikasi rendah (**RAM 512MB - 1GB, 1 vCPU**) tanpa Docker.

---

## 📊 Estimasi Konsumsi RAM (Tanpa Docker)

| Komponen | Konsumsi RAM | Keterangan |
| :--- | :--- | :--- |
| **Go Backend** | **~15 - 25 MB** | Sangat ringan, binary native Linux |
| **SQLite DB** | **0 MB (in-process)** | Berupa file lokal `asta.db`, tanpa daemon service DB |
| **Next.js (Node.js)**| **~60 - 90 MB** | Server runtime Next.js |
| **Nginx** | **~5 - 10 MB** | Reverse proxy & static assets |
| **Linux OS (Ubuntu)**| **~120 - 180 MB** | Background OS |
| **TOTAL** | **~200 - 300 MB** | **Sangat aman & stabil di VPS 512MB / 1GB** |

---

## ⚠️ Langkah 0: Aktifkan Swap Memory (Wajib untuk RAM < 2GB)

Agar server **tidak hang / Out Of Memory (OOM)** saat melakukan `npm run build`, aktifkan Swap 2GB terlebih dahulu:

```bash
# Buat file swap 2GB
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Pastikan swap permanen setelah restart
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Verifikasi
free -h
```

---

## 📦 Langkah 1: Install Kebutuhan di VPS

Jalankan perintah berikut di terminal VPS (Ubuntu / Debian):

```bash
# 1. Update paket sistem
sudo apt update && sudo apt upgrade -y

# 2. Install Git, Curl, dan Nginx
sudo apt install -y git curl nginx

# 3. Install Golang (untuk build backend)
sudo apt install -y golang-go

# 4. Install Node.js 20 LTS (untuk frontend)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

---

## 📥 Langkah 2: Clone Repositori

```bash
# Buat folder aplikasi di /var/www
sudo mkdir -p /var/www
cd /var/www

# Clone repositori
sudo git clone https://github.com/astacodemanagement/astaKraf.git
cd /var/www/astaKraf

# Berikan hak akses ke user saat ini
sudo chown -R $USER:$USER /var/www/astaKraf
```

---

## ⚙️ Langkah 3: Setup Backend Go (SQLite)

1. **Build binary backend**:
   ```bash
   cd /var/www/astaKraf
   go build -ldflags="-w -s" -o bin/api ./cmd/api
   ```

2. **Buat Systemd Service Backend**:
   Systemd akan menjaga backend otomatis berjalan di background dan otomatis restart jika server reboot.
   ```bash
   sudo nano /etc/systemd/system/astakraf-backend.service
   ```
   Tempelkan konfigurasi berikut:
   ```ini
   [Unit]
   Description=AstaKraf Go Backend (SQLite)
   After=network.target

   [Service]
   Type=simple
   User=www-data
   WorkingDirectory=/var/www/astaKraf
   ExecStart=/var/www/astaKraf/bin/api
   Restart=always
   RestartSec=5
   Environment=APP_PORT=8080
   Environment=APP_ENV=production
   Environment=DATABASE_DRIVER=sqlite
   Environment=DATABASE_URL=/var/www/astaKraf/asta.db
   Environment=JWT_SECRET=ganti-kunci-jwt-rahasia-anda-2026

   [Install]
   WantedBy=multi-user.target
   ```

3. **Atur permission & jalankan service backend**:
   ```bash
   # Buat folder uploads jika belum ada
   mkdir -p /var/www/astaKraf/uploads
   sudo chown -R www-data:www-data /var/www/astaKraf

   # Aktifkan dan jalankan
   sudo systemctl daemon-reload
   sudo systemctl enable --now astakraf-backend

   # Cek status
   sudo systemctl status astakraf-backend
   ```
   *Tes backend:*
   ```bash
   curl http://localhost:8080/health
   # Respon: {"success":true,"message":"SaaS 3D Packaging AI API is running healthy",...}
   ```

---

## 🖥️ Langkah 4: Setup Frontend (Next.js)

1. **Masuk ke folder frontend dan install dependencies**:
   ```bash
   cd /var/www/astaKraf/frontend
   npm ci
   ```

2. **Buat file environment frontend**:
   Ganti `api.domainanda.com` dengan domain backend Anda (atau `http://IP_VPS:8080` jika belum ada domain):
   ```bash
   nano .env.production
   ```
   Isi:
   ```env
   NEXT_PUBLIC_API_URL=https://api.domainanda.com
   ```

3. **Build Frontend**:
   ```bash
   npm run build
   ```

4. **Buat Systemd Service Frontend**:
   Menjalankan Next.js langsung via Systemd lebih hemat RAM dibanding PM2 (~30MB lebih hemat):
   ```bash
   sudo nano /etc/systemd/system/astakraf-frontend.service
   ```
   Tempelkan konfigurasi berikut:
   ```ini
   [Unit]
   Description=AstaKraf Next.js Frontend
   After=network.target

   [Service]
   Type=simple
   User=www-data
   WorkingDirectory=/var/www/astaKraf/frontend
   ExecStart=/usr/bin/npm start
   Restart=always
   RestartSec=5
   Environment=NODE_ENV=production
   Environment=PORT=3000

   [Install]
   WantedBy=multi-user.target
   ```

5. **Aktifkan dan jalankan service frontend**:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable --now astakraf-frontend
   sudo systemctl status astakraf-frontend
   ```

---

## 🌐 Langkah 5: Konfigurasi Nginx & SSL HTTPS

1. **Buat file konfigurasi Nginx**:
   ```bash
   sudo nano /etc/nginx/sites-available/astakraf.conf
   ```

2. **Isi konfigurasi (sesuaikan `server_name` dengan domain Anda)**:
   ```nginx
   # 1. Frontend Next.js (Port 3000)
   server {
       listen 80;
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

   # 2. Backend Go API (Port 8080)
   server {
       listen 80;
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

3. **Aktifkan konfigurasi Nginx**:
   ```bash
   sudo ln -s /etc/nginx/sites-available/astakraf.conf /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

4. **Pasang SSL Gratis (HTTPS Certbot)**:
   ```bash
   sudo apt install -y certbot python3-certbot-nginx
   sudo certbot --nginx -d domainanda.com -d www.domainanda.com -d api.domainanda.com
   ```

---

## 🔄 Cara Update Code Setelah Ada Perubahan (CI/CD Manual Cepat)

Jika ada update di GitHub, cukup jalankan ini di VPS:

```bash
cd /var/www/astaKraf
git pull

# Rebuild backend & restart
go build -ldflags="-w -s" -o bin/api ./cmd/api
sudo systemctl restart astakraf-backend

# Rebuild frontend & restart
cd frontend
npm ci
npm run build
sudo systemctl restart astakraf-frontend
```
Selesai! Aplikasi Anda berjalan sangat ringan, stabil, dan hemat resource.
