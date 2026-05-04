# Bookly – Szalon Foglalási Rendszer

Modern, teljes körű foglalási rendszer szépségszalonok és vendégeik számára.
Három felhasználói szerepkört támogat (ügyfél, szolgáltató, admin), valós idejű
értesítéseket és üzeneteket biztosít.

> **Repó:** [TNTB-05/Bookly](https://github.com/TNTB-05/Bookly)

---

## Tartalomjegyzék

1. [Funkciók](#funkciók)
2. [Technológiai stack](#technológiai-stack)
3. [Projekt struktúra](#projekt-struktúra)
4. [Telepítés és indítás](#telepítés-és-indítás)
5. [Demo fiókok](#demo-fiókok)
6. [Szerepkörök és belépő URL-ek](#szerepkörök-és-belépő-url-ek)
7. [Autentikáció](#autentikáció)
8. [Tesztelés](#tesztelés)
9. [Hibaelhárítás](#hibaelhárítás)

---

## Funkciók

### Ügyfeleknek

- **Keresés és szűrés** – szalonok keresése név, cím vagy szolgáltatás alapján
- **Időpontfoglalás** – wizard-szerű folyamat (munkatárs → szolgáltatás → dátum/idő → megerősítés)
- **Várólista** – ha nincs szabad időpont, fel lehet iratkozni
- **Értékelés** – 1–5 csillag szöveges véleménnyel
- **Kedvencek** – gyakran látogatott szalonok mentése
- **Profil kezelés** – név, email, telefon, cím, profilkép
- **Foglalások áttekintése** – ütemezett, teljesült és lemondott foglalások
- **Üzenetek** – valós idejű chat (Socket.IO) a szolgáltatóval
- **Email értesítések** – foglalás visszaigazolás, emlékeztetők
- **GDPR-fiók törlés** – saját fiók önállóan törölhető

### Szolgáltatóknak

- **Szalon profil** – név, leírás, geokódolt cím, nyitvatartás, banner
- **Szolgáltatás kezelés** (CRUD) – név, leírás, ár, időtartam
- **Naptár nézet** – havi és napi foglalás-vizualizáció
- **Nyitvatartás és time blocks** – heti nyitvatartás + ebédszünet/szabadság
- **Csapat (staff)** – munkatársak meghívása, szerepkör, törlés
- **Statisztikák** – mai bevétel, közelgő foglalások, értékelések
- **Értékelés-válasz** – nyilvános válasz vendég értékelésekre
- **Üzenetek** – valós idejű kommunikáció ügyféllel

### Adminnak

- **Felhasználó kezelés** – listázás, keresés, státusz (aktív/tiltott/törölt), GDPR-törlés
- **Szolgáltató és szalon kezelés** – moderálás, részletek
- **Foglalás és értékelés moderálás**
- **Rendszer statisztikák** – havi bevétel-trend, top szalonok, új regisztrációk
- **Audit naplók** – események időrendben (`LOGIN`, `REGISTER`, `BAN`, `GDPR_DELETE` …)

---

## Technológiai stack

| Réteg | Technológiák |
| --- | --- |
| **Frontend** | React 19, Vite 7, Tailwind CSS v4, React Router 7, Leaflet, Socket.IO client |
| **Backend** | Node.js (≥18), Express 5, MySQL 8, JWT, bcryptjs, Multer + Sharp, Nodemailer, Socket.IO |
| **Adatbázis** | MySQL 8 (Docker, fix `Europe/Budapest` időzóna) |
| **Tesztelés** | Jest + Supertest (backend), Playwright (Chromium, frontend E2E) |

---

## Projekt struktúra

```
Bookly/
└── bookly_project/
    ├── docker-compose.yml          # MySQL + (opcionális) phpMyAdmin
    ├── reset-db.sh                 # DB reset script
    ├── .env.example                # docker-compose env minta
    │
    ├── backend/                    # Node.js / Express API
    │   ├── server.js               # Belépési pont (Express + Socket.IO)
    │   ├── Secret.env.example      # Backend env minta
    │   ├── api/                    # REST endpoint-ok (customer, auth, admin, salon, …)
    │   ├── middleware/             # auth, upload (Multer), provider
    │   ├── services/               # email, geokódolás, várólista, expirálás, log
    │   ├── sql/                    # MySQL pool + query-modulok + init.sql
    │   ├── tests/                  # Jest unit + integration
    │   ├── uploads/                # Feltöltött képek (gitignore)
    │   └── utils/
    │
    ├── frontend/                   # React / Vite
    │   ├── vite.config.js
    │   └── src/
    │       ├── App.jsx             # Routing
    │       ├── components/         # Megosztott komponensek
    │       ├── hooks/
    │       ├── icons/              # SVG ikon-komponensek
    │       ├── modules/            # Admin, Provider, customer, auth, Landing, messaging
    │       └── services/
    │
    ├── tests/                      # Playwright E2E (10 spec, 35 teszt)
    │   ├── *.spec.js
    │   ├── globalSetup.js          # Demo fiókok seedelése
    │   ├── fixtures/               # auto-login fixture-ök
    │   └── helpers/                # foglalás / auth lépés-helperek
    │
    └── docs/
        └── plans/                  # Tervezési dokumentumok
```

---

## Telepítés és indítás

### Előfeltételek

- **Node.js ≥ 18** (Vite 7 + React 19 igényli)
- **Docker + Docker Compose**
- **npm**

### 1. Repó klónozása

```bash
git clone https://github.com/TNTB-05/Bookly.git
cd Bookly/bookly_project
```

### 2. Környezeti változók

Egy env-fájlra van szükség (gitignore-olt):

```bash

# bookly_project/backend/Secret.env  – a backend ezt olvassa (NEM .env!)
cp backend/Secret.env.example backend/Secret.env
```

Szerkeszd meg a fájlt és töltsd ki a placeholdereket. A JWT és session
kulcsokat érdemes hosszú, véletlenszerű stringre cserélni.

### 3. Backend indítása

```bash
cd backend
npm install
npm run dev      # MySQL konténert is elindítja, majd nodemon-nal a backendet
```

Az `npm run dev` parancs először elindítja a MySQL Docker konténert (`db:up`),
majd utána `nodemon`-nal a backendet. Az `init.sql` az első indításkor lefut,
létrehozza a sémát és feltölti példaadatokkal (14 szalon, 6 szolgáltató, 6
szolgáltatás, néhány demo foglalás és értékelés, valamint egy alapértelmezett
admin fiók: `admin@bookly.com` / `admin123`).

> Az `init.sql`-ben szereplő admin csak fejlesztői célra használható —
> publikus deployment előtt mindenképp cseréld le a jelszavát.

Elérhető: **http://localhost:3000**

### 4. Frontend indítása

Új terminálban:

```bash
cd frontend
npm install
npm run dev
```

Elérhető: **http://localhost:5173**

### 5. (Opcionális) phpMyAdmin

A `backend/` mappából:

```bash
npm run myadmin:up
```

Elérhető: **http://localhost:8080** (felhasználó: `root`, jelszó: a `DB_PASSWORD`).

---

## Demo fiókok

A Playwright `globalSetup.js` minden tesztfutás előtt – **idempotensen** –
létrehozza az alábbi demo fiókokat. Fejlesztés közben is használhatod őket:

| Email | Jelszó | Szerepkör |
| --- | --- | --- |
| `test@test.com` | `asdasdasd` | customer |
| `provider@test.com` | `asdasdasd` | provider + saját **Test Salon** |

DB reset után a következő tesztfutás újra létrehozza őket.

---

## Szerepkörök és belépő URL-ek

| Szerepkör | Belépő URL | Cél |
| --- | --- | --- |
| `customer` | `/login` → `/dashboard` | foglalás, értékelés |
| `provider` | `/provider/login` → `/ProvDash` | szalon és csapat kezelés |
| `admin` | `/admin/login` → `/admin/dashboard` | rendszer adminisztráció |

A szerepkör a JWT payload-ban (`role`) van eltárolva; a backend szerepkör-alapú
middleware-ekkel ellenőrzi a hozzáférést.

---

## Autentikáció

Dual-token stratégia:

| Token | Élettartam | Tárolás |
| --- | --- | --- |
| **Access token** | 15 perc | `localStorage` |
| **Refresh token** | 7 nap | HttpOnly cookie |

A frontend 13 percenként (a 15-perces lejárat előtt 2 perccel) hívja a
`POST /auth/refresh` végpontot új access tokenért. Tiltott (`status = 'banned'`)
felhasználók 403-mal kapnak választ, és a frontend automatikusan kijelentkezteti
őket.

---

## Tesztelés

### Backend (Jest + Supertest)

```bash
cd bookly_project/backend
npm test                # egyszeri futtatás coverage-zsel
npm run test:watch      # watch mód
```

Coverage report: `backend/coverage/lcov-report/index.html`.

### Frontend E2E (Playwright)

A tesztek **nem indítják** automatikusan a backendet és a frontendet —
külön kell futtatni őket (lásd a [Telepítés](#telepítés-és-indítás) szakaszt).

Első alkalommal:

```bash
cd bookly_project/tests
npm install
npx playwright install     # Chromium letöltés
```

Futtatás:

```bash
npm test                                      # headless
npm run test:headed                           # böngészőben láthatóan
npx playwright test Booking.spec.js           # egyetlen fájl
npx playwright show-report                    # HTML riport megnyitása
```

#### Lefedettség

| Spec fájl | Tesztek | Lefedett funkció |
| --- | ---: | --- |
| `Login.spec.js` | 4 | Vendég bejelentkezés (validáció + siker) |
| `Register.spec.js` | 4 | Vendég regisztráció |
| `CustomerProfile.spec.js` | 4 | Profil tab + szerkesztés + jelszó |
| `CustomerAccountDeletion.spec.js` | 2 | Fiók-törlés modal |
| `Booking.spec.js` | 4 | Foglalási wizard + múltbeli dátum tiltás |
| `CancelAppointment.spec.js` | 2 | Foglalás lemondás |
| `ProviderRegister.spec.js` | 5 | Provider regisztráció (új vs. csatlakozás) |
| `ProviderLogin.spec.js` | 4 | Provider bejelentkezés |
| `ProviderServiceCRUD.spec.js` | 4 | Szolgáltatás létrehozás |
| `ProviderAppointmentCancel.spec.js` | 2 | Naptár betöltés + napra kattintás |
| **Összesen** | **35** | |

Tipikus futási idő headless `workers=2` mellett: **~2 perc**.

A sikeres futás screenshotjai a `tests/screenshots/` alá kerülnek
(gitignore-olva, gépenként regenerálódnak); bukáskor `screenshot + video + trace`
artifaktok a `tests/test-results/` alá.

---

## Hibaelhárítás

| Tünet | Megoldás |
| --- | --- |
| `EADDRINUSE :::3000` vagy `:::5173` | `npx kill-port 3000` / `npx kill-port 5173` |
| Backend nem indul | `docker ps`-szel ellenőrizd, hogy a `bookly-db` konténer fut-e |
| `connect ECONNREFUSED` tesztkor | Nem fut a backend / frontend |
| Tesztek `Element not visible` / `Timeout` | DB állapot eltér – futtass DB resetet |
| 401 az API-tól | Lejárt access token – jelentkezz ki/be |
| Geokódolás hiba | Külső szolgáltató – ellenőrizd a hálózatot |
| PowerShell script-tiltás | `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` |

### Adatbázis reset

```bash
# Linux / macOS / Git Bash:
bash bookly_project/reset-db.sh

# Windows (a backend mappából):
npm run db:reset-win

# macOS:
npm run db:reset-mac
```

### Hasznos parancsok

```bash
docker logs bookly-db                                       # MySQL log
docker exec -it bookly-db mysql -u root -p                  # MySQL shell
```
