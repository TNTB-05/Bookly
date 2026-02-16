#  Bookly - Szalon Foglalási Rendszer

Modern foglalási rendszer szépségszalonok és vendégeik számára.

##  Technológiai Stack

**Frontend:** React 18 + Vite + Tailwind CSS + React Router  
**Backend:** Node.js + Express + MySQL  
**Egyéb:** Docker, JWT autentikáció, nodemon

##  Projekt Struktúra

``
bookly_project/
 backend/              # Node.js/Express API
    api/             # Endpoint-ok (auth/, adminApi.js, userApi.js, ...)
    sql/             # Adatbázis fájlok
    middleware/      # Middleware-ek
    server.js        # Backend belépési pont

 frontend/            # React/Vite frontend
    src/
       modules/     # Admin/, Provider/, customer/, auth/, Landing/
       icons/       # SVG ikon komponensek
       components/  # Megosztott komponensek
    vite.config.js

 docker-compose.yml   # MySQL konténer
``

##  Telepítés és Indítás

### Előfeltételek
- Node.js (v16+)
- Docker + Docker Compose
- npm

### 1. Adatbázis indítása

``bash
cd bookly_project
docker-compose up -d db
``

### 2. Backend indítása

``bash
cd backend
npm install
``

**`.env` fájl létrehozása** (backend mappában):
``env
JWT_SECRET=your-secret-key
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=bookly
``

**Indítás:**
``bash
npm run dev    # Fejlesztési mód (auto-reload)
npm start      # Éles mód
``

Backend: **http://localhost:3000**

### 3. Frontend indítása

Új terminálban:

``bash
cd frontend
npm install
``

**`.env` fájl létrehozása** (frontend mappában):
``env
VITE_API_URL=http://localhost:3000
``

**Indítás:**
``bash
npm run dev
``

Frontend: **http://localhost:5173**

##  Szerepkörök

- **Ügyfelek:** Keresés, foglalás, értékelés
- **Szolgáltatók:** Szalon kezelés, naptár, statisztikák
- **Admin:** Moderálás, felhasználó kezelés, rendszer naplók

**Admin panel:** `http://localhost:5173/admin/login`

##  Hibaelhárítás

**Port foglalt:**
``bash
npx kill-port 3000
npx kill-port 5173
``

**Adatbázis reset:**
``bash
bash reset-db.sh
``

**PowerShell script hiba (Windows):**
``powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
``

**Frontend nem indul:** Ellenőrizd a `VITE_API_URL` beállítást  
**Backend nem indul:** Ellenőrizd, hogy a Docker MySQL fut-e: `docker ps`

##  További dokumentáció

Részletes fejlesztői útmutató: [FEJLESZTES.md](FEJLESZTES.md)