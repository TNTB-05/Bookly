# Bookly - Szalon Foglalási Rendszer

Modern foglalási rendszer szolgáltatók és vendégeik számára.

## Technológiai Stack

**Frontend:** React 19 + Vite + Tailwind CSS v4 + React Router  
**Backend:** Node.js + Express 5 + MySQL  
**Egyéb:** Docker, JWT autentikáció, nodemon

## Projekt Struktúra

```
bookly_project/
├── backend/              # Node.js/Express API
│   ├── api/             # Endpoint-ok (auth/, adminApi.js, userApi.js, ...)
│   ├── sql/             # Adatbázis fájlok
│   ├── middleware/      # Middleware-ek
│   └── server.js        # Backend belépési pont
│
├── frontend/            # React/Vite frontend
│   ├── src/
│   │   ├── modules/     # Admin/, Provider/, customer/, auth/, Landing/
│   │   ├── icons/       # 48 SVG ikon komponens
│   │   └── components/  # Megosztott komponensek
│   └── vite.config.js
│
└── docker-compose.yml   # MySQL + phpMyAdmin konténere
```

## Telepítés es Indítás

### Előfeltételek
- Node.js (v18+)
- Docker + Docker Compose
- npm

### 1. Adatbázis indítás

Hozd létre a `bookly_project/.env` fájlt (docker-compose használja):
```env
DB_PASSWORD=majom123
DB_NAME=bookly_db
```

Majd indítsd el:
```bash
cd bookly_project
docker-compose up -d db
```

### 2. Backend indítás

```bash
cd backend
npm install
```

**`Secret.env` fajl létrehozása** a `backend/` mappában:
```env
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key
PORT=3000
IP_ADDRESS=127.0.0.1
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=majom123
DB_NAME=bookly_db
SESSION_SECRET=some-secret
FRONTEND_URL=http://127.0.0.1:5173
```

**Inditas:**
```bash
npm run dev    # Fejlesztési mód (automatikusan inditja a DB-t + nodemon)
npm start      # Éles mód (csak a szerver)
```

Backend: **http://localhost:3000**

### 3. Frontend indítás

Új terminálban:

```bash
cd frontend
npm install
npm run dev
```

Frontend: **http://localhost:5173**

> A frontend alapértelmezetten a `http://localhost:3000` backend-hez csatlakozik. Ha más portra van szükség, hozz létre egy `.env` fájlt a `frontend/` mappában:
> ```env
> VITE_API_URL=http://localhost:3000
> ```

## Szerepkorok

- **Ügyfelek:** Keresés, foglalás, értékelés
- **Szolgáltatók:** Szalon kezelés, naptár, statisztikák
- **Admin:** Moderálás, felhasználó kezelés, rendszer naplók

**Admin panel:** `http://localhost:5173/admin/login`

## phpMyAdmin

Ha szükséged van az adatbázis közvetlen elérésére:
```bash
docker-compose up -d phpmyadmin
```
Elérhető: **http://localhost:8080**

## Hibaelhárítás

**Port foglalt:**
```bash
npx kill-port 3000
npx kill-port 5173
```

**Adatbázis reset:**
```bash
bash reset-db.sh
```
Vagy Windows-on:
```bash
npm run db:reset-win    # a backend/ mappaban
```

**PowerShell script hiba (Windows):**
```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

**Frontend nem indul:** Ellenőrizd, hogy a backend fut-e  
**Backend nem indul:** Ellenőrizd, hogy a Docker MySQL fut-e: `docker ps`

## További dokumentáció

Részletes fejlesztői útmutató: [FEJLESZTES.md](FEJLESZTES.md)
