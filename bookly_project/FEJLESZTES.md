# 📚 Bookly - Fejlesztői Dokumentáció

Részletes műszaki dokumentáció a Bookly projekt fejlesztéséhez.

## 🎯 Funkciók

### Ügyfelek számára
- 🔍 **Keresés és szűrés**: Szalonok keresése név, cím, szolgáltatás alapján
- 📅 **Időpont foglalás**: Választható szolgáltatások, dátum és időpont kiválasztása
- ⭐ **Értékelés és véleményezés**: 1-5 csillagos értékelés + szöveges vélemény
- 💾 **Kedvencek**: Gyakran látogatott szalonok mentése
- 👤 **Profil kezelés**: Név, email, telefonszám, cím, profilkép
- 📱 **Foglalások áttekintése**: Ütemezett, teljesült és lemondott foglalások

### Szolgáltatók számára
- 🏢 **Szalon profil**: Név, leírás, cím, nyitvatartás, szalonkép
- ✂️ **Szolgáltatások**: Szolgáltatás név, leírás, ár, időtartam (perc)
- 🗓️ **Naptár nézet**: Havi/napi foglalások vizualizációja
- ⏰ **Nyitvatartás**: Napi nyitvatartási idő beállítása
- 🚫 **Time blocks**: Ebédszünet, egyéb kiesések rögzítése
- 📊 **Statisztikák**: 
  - Mai bevétel és foglalások
  - Közelgő foglalások listája
  - Értékelések áttekintése
- 💬 **Értékelés kezelés**: Válaszadás ügyfél értékelésekre

### Admin Panel
- 👥 **Felhasználó kezelés**:
  - Felhasználók listázása, keresése, szűrése
  - Státusz változtatás (aktív, tiltott, törölt)
  - GDPR-kompatibilis törlés (email → NULL, személyes adatok nullázása)
  - Felhasználói részletek (foglalások, értékelések)
- 🏪 **Szolgáltató kezelés**:
  - Szolgáltatók és szalonjaik áttekintése
  - Nem engedélyezett szalonok moderálása
  - Szolgáltató részletek (szalonok, szolgáltatások)
- 🏢 **Szalon kezelés**:
  - Összes szalon listázása és keresése
  - Szalon részletek (szolgáltatások, foglalások, értékelések)
- 📋 **Foglalás kezelés**:
  - Összes foglalás áttekintése státusz szerint
  - Statisztikák: ütemezett, teljesült, lemondott, meg nem jelent
  - Szűrés ügyfél, szolgáltató, státusz alapján
- ⭐ **Értékelés moderálás**:
  - Összes értékelés listázása
  - Átlagértékelések statisztikája
  - Értékelés törlése (visszavonhatatlan)
- 📈 **Rendszer statisztikák**:
  - Felhasználók, szolgáltatók, szalonok, foglalások száma
  - Havi bevétel trend (utolsó 6 hónap)
  - Top értékelt szalonok
  - Új regisztrációk (7 nap)
  - Foglalás státusz megoszlás
- 📜 **Audit naplók**:
  - Rendszer események időrendben
  - Szűrés esemény típus és dátum szerint
  - Események: LOGIN, REGISTER, CREATE, UPDATE, DELETE, BAN, GDPR_DELETE

## 🔑 Autentikáció

### JWT Token Kezelés

Az alkalmazás **dual-token stratégiát** használ:

#### Access Token
- **Élettartam:** 15 perc
- **Tárolás:** `localStorage` (kulcs: `accessToken`)
- **Tartalom:** userId, email, role, name
- **Használat:** Minden API híváshoz (`Authorization: Bearer <token>`)

#### Refresh Token
- **Élettartam:** 7 nap
- **Tárolás:** HttpOnly cookie (`refreshToken`)
- **Tartalom:** userId
- **Használat:** Access token automatikus megújításához

### Token Heartbeat

A `auth.js` modul automatikusan frissíti a tokent:
- **Időzítés:** 13 percenként (15 perc lejárat előtt 2 perccel)
- **Mechanizmus:** `setInterval` a `startTokenHeartbeat()` függvényben
- **Művelet:** `POST /auth/refresh` → új access token
- **Hibakezelés:** 
  - Sikertelen refresh → logout és átirányítás
  - 403 (ban) → alert és átirányítás főoldalra

### Szerepkör-alapú Hozzáférés

**Backend middleware-ek:**
- `AuthMiddleware.js`: JWT token validálás, `req.user` beállítása
- `RoleMiddleware.js`: `requireRole(['admin', 'provider'])` - szerepkör ellenőrzés

**Szerepkörök:**
- `customer` - Alapértelmezett felhasználó
- `provider` - Szalon tulajdonos
- `admin` - Admin felhasználó

### Tiltott Felhasználók

A `status = 'banned'` felhasználók:
- 403 választ kapnak minden védett endpoint-on
- `isBanRedirecting` flag biztosítja, hogy csak egy alert jelenjen meg párhuzamos hívások esetén
- Automatikus kijelentkezés és átirányítás a főoldalra

## 🎨 Dizájn Rendszer

### Színséma

**Primary színek:**
- `amber-400` / `amber-500` / `amber-600`: Főszín (gombok, aktív állapot)
- `amber-50` / `amber-100`: Háttér kiemelések

**Szürke skála:**
- `gray-50`: Oldal háttér
- `gray-100-200`: Határok, kártyák
- `gray-500-600`: Szöveg (másodlagos)
- `gray-900`: Szöveg (elsődleges)

**Státusz színek:**
- `blue-500/600`: Ütemezett (scheduled)
- `green-500/600`: Teljesült (completed)
- `red-500/600`: Lemondva (canceled)
- `gray-500/600`: Meg nem jelent (no_show)

### Ikonok

**Helye:** `frontend/src/icons/`

**48 SVG ikon komponens:**
- AlertCircleIcon, BackArrowIcon, BanknoteIcon, BoardIcon, BriefcaseIcon
- BuildingIcon, CalendarIcon, CalendarSimpleIcon, ChatBubbleIcon
- CheckCircleIcon, ChevronDownIcon, ClipboardCheckIcon, CloseIcon
- CurrencyIcon, DiaryIcon, DocumentIcon, EarthIcon, ExitIcon
- HourIcon, LeftArrowIcon, LightningIcon, LocationIcon, LockIcon
- LogoutIcon, MapPinIcon, OverviewIcon, PencilIcon, PlusIcon
- ProfileIcon, RefreshIcon, RightArrowIcon, SalonIcon, SaveIcon
- SearchIcon, ServicesIcon, ServicesLoadingIcon, SettingsIcon
- ShieldCheckIcon, StarFilledIcon, StarOutlineIcon, StarSmallIcon
- StorefrontIcon, TickIcon, TrashIcon, UserIcon, UserPlusIcon
- UsersIcon, WarningIcon

**Használat:**
```jsx
import UsersIcon from '../../icons/UsersIcon';

<UsersIcon className="w-5 h-5 text-gray-600" />
```

**Előnyök:**
- Újrafelhasználható komponensek
- Tailwind osztályokkal testreszabható (méret, szín)
- Könnyű karbantartás (egy helyen módosítható)
- Optimalizált teljesítmény (SVG inline)

### Reszponzivitás

**Breakpoint-ok (Tailwind):**
- `sm`: 640px - Mobil landscape, kis tabletek
- `md`: 768px - Tabletek
- `lg`: 1024px - Desktop
- `xl`: 1280px - Nagy desktop

**Stratégia:**
- **Mobile-first**: Alapértelmezetten mobil nézet
- **Flexbox/Grid**: Rugalmas layout-ok
- **Tailwind responsive prefixek**: `sm:`, `md:`, `lg:`

**Példák:**
- `grid-cols-1 md:grid-cols-2 lg:grid-cols-4` - Kártyák
- `hidden sm:block` - Mobil rejtés
- `flex-col md:flex-row` - Mobil oszlop, desktop sor

## 🛠️ Fejlesztési Útmutató

### Backend Struktúra

**API Fájlok (`backend/api/`):**
- `api.js` - Customer endpoint-ok (szalonok, foglalások)
- `userApi.js` - Felhasználói profil, képfeltöltés
- `salonApi.js` - Provider szalon/szolgáltatás kezelés
- `calendarApi.js` - Provider naptár és foglalások
- `timeBlocksApi.js` - Provider kiesések kezelése
- `searchApi.js` - Keresési funkciók
- `adminApi.js` - Admin panel összes funkció
- `auth/LoginApi.js` - Customer/provider login/register
- `auth/ProvLoginApi.js` - Provider-specific login
- `auth/AuthMiddleware.js` - JWT token validálás
- `auth/RoleMiddleware.js` - Szerepkör ellenőrzés

**Szolgáltatások (`backend/services/`):**
- `locationService.js` - Geokódolás (cím → koordináták)
- `logService.js` - Audit napló írása

**Middleware (`backend/middleware/`):**
- `uploadMiddleware.js` - Multer konfig (profilképek, szalonképek)

**Környezeti változók:**
- A backend a `Secret.env` fájlt használja (nem `.env`!)
- A docker-compose a `bookly_project/.env` fájlt olvassa (`DB_PASSWORD`, `DB_NAME`)

### Frontend Struktúra

**Modulok (`frontend/src/modules/`):**

**Admin/**
- `AdminDashboard.jsx` - Főoldal, sidebar, routing
- `AdminLogin.jsx` - Admin bejelentkezés
- `UserManagement.jsx` - Felhasználók kezelése
- `ProviderManagement.jsx` - Szolgáltatók kezelése
- `SalonManagement.jsx` - Szalonok moderálása
- `AppointmentManagement.jsx` - Foglalások áttekintése
- `RatingManagement.jsx` - Értékelések moderálása
- `SystemLogs.jsx` - Audit naplók

**Provider/**
- `ProvDash.jsx` - Szolgáltató dashboard (naptár, foglalások, statisztikák)
- `ProvLogin.jsx` / `ProvRegister.jsx` - Bejelentkezés/regisztráció
- `AvailabilityManagement.jsx` - Nyitvatartás beállítása
- `TimeBlockModal.jsx` - Kiesések hozzáadása/szerkesztése
- `AddressInput.jsx` - Cím bevitel geokódolással

**customer/**
- `Dashboard/Dashboard.jsx` - Ügyfél főoldal
- `Dashboard/SalonModal.jsx` - Szalon részletek + foglalás
- `Dashboard/RatingModal.jsx` - Értékelés írása
- `Dashboard/tabs/OverviewTab.jsx` - Keresés, javaslatok
- `Dashboard/tabs/AppointmentsTab.jsx` - Saját foglalások
- `Dashboard/tabs/SavedSalonsTab.jsx` - Kedvenc szalonok

**auth/**
- `auth.js` - Auth context, token kezelés, API wrapper
- `AuthContext.jsx` - Authentication provider

**Landing/**
- `Landing.jsx` - Főoldal
- `Login.jsx` / `Register.jsx` - Bejelentkezés/regisztráció

### Kódolási Konvenciók

**JavaScript/JSX:**
- **Fájlnév:** PascalCase komponenseknek (`Dashboard.jsx`), camelCase utility-knek (`auth.js`)
- **Komponens:** Function komponensek (nem class)
- **Import sorrend:** React → külső library-k → saját modulok → ikonok
- **Destructuring:** Props preferred `({ name, value })`
- **Tailwind:** Osztályok sorrendje: layout → spacing → color → effects

**API Endpoint-ok:**
- **Névkonvenció:** `/api/resource` vagy `/api/resource/:id`
- **Middleware:** AuthMiddleware minden védett endpoint-on
- **Hibakezelés:** `try-catch` blokk, `res.json({ success, message, data })`
- **Validáció:** Input ellenőrzés minden POST/PUT-nál

**Adatbázis:**
- **Snake_case:** Tábla és oszlop nevek (`user_id`, `created_at`)
- **Timestamps:** `created_at`, `updated_at` minden táblán
- **Foreign key:** `resource_id` formátum

### Fejlesztési Workflow

1. **Feature branch**: `git checkout -b feature/new-feature`
2. **Kód írása**: Backend API → Frontend szolgáltatás → UI komponens
3. **Tesztelés**: Manuális tesztelés böngészőben
4. **Commit**: Értelmes commit üzenet (`git commit -m "Add user profile edit"`)
5. **Push**: `git push origin feature/new-feature`
6. **Pull Request**: Review és merge

### Hasznos parancsok

**Backend log-ok:**
```bash
# Backend console log (nodemon kimenet)
cd backend
npm run dev

# Docker MySQL log
docker logs bookly-db
```

**Adatbázis műveletek:**
```bash
# MySQL shell belépés
docker exec -it bookly-db mysql -u root -p

# SQL lekérdezés futtatása
docker exec -i bookly-db mysql -u root -ppassword bookly < sql/query.sql
```

**Port ellenőrzése:**
```bash
# Windows
netstat -ano | findstr :3000

# Linux/Mac
lsof -i :3000
```

## 📚 API Dokumentáció

### Autentikáció

#### POST `/auth/register`
Új felhasználó regisztrálása.

**Request body:**
```json
{
  "name": "string (required)",
  "email": "string (required, email)",
  "phone": "string (optional)",
  "password": "string (required, min 6 char)",
  "address": "string (optional)"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Sikeres regisztráció!",
  "accessToken": "jwt_token",
  "user": { "id": 1, "name": "...", "email": "...", "role": "customer" }
}
```

#### POST `/auth/login`
Bejelentkezés.

**Request body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Sikeres bejelentkezés!",
  "accessToken": "jwt_token",
  "user": { ... }
}
```

#### POST `/auth/refresh`
Access token megújítása refresh token alapján.

**Headers:** `Cookie: refreshToken=...`

**Response:**
```json
{
  "success": true,
  "accessToken": "new_jwt_token"
}
```

#### POST `/auth/logout`
Kijelentkezés (refresh token törlése).

**Response:**
```json
{
  "success": true,
  "message": "Sikeres kijelentkezés!"
}
```

### Felhasználói API

#### GET `/api/users/profile`
🔒 Auth required

Saját profil adatok lekérése.

**Response:**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "name": "Teszt User",
    "email": "user@example.com",
    "phone": "+36301234567",
    "address": "Budapest, Kossuth u. 1.",
    "profile_picture_url": "http://...",
    "role": "customer",
    "created_at": "2024-01-15T10:30:00.000Z"
  }
}
```

#### PUT `/api/users/profile`
🔒 Auth required

Profil adatok frissítése.

**Request body:**
```json
{
  "name": "string (optional)",
  "phone": "string (optional)",
  "address": "string (optional)"
}
```

#### POST `/api/users/upload-profile-pic`
🔒 Auth required

Profilkép feltöltése (multipart/form-data).

**Form data:**
- `profilePic`: File (image/jpeg, image/png, max 5MB)

### Szalon API

#### GET `/api/salons`
🔓 Public

Szalonok listázása keresési/szűrési feltételekkel.

**Query params:**
- `search`: keresés név/cím-ben (optional)
- `service`: szolgáltatás név szűrő (optional)

**Response:**
```json
{
  "success": true,
  "salons": [
    {
      "id": 1,
      "name": "Beauty Salon",
      "address": "Budapest, Kossuth u. 1.",
      "description": "...",
      "photo_url": "http://...",
      "average_rating": 4.5,
      "rating_count": 12,
      "owner_name": "Provider Name",
      "services": ["Hajvágás", "Festés"]
    }
  ]
}
```

#### GET `/api/salons/:id`
🔓 Public

Szalon részletes adatai.

**Response:**
```json
{
  "success": true,
  "salon": { /* salon details */ },
  "services": [ /* services array */ ],
  "ratings": [ /* ratings array */ ],
  "availableMonths": ["2024-02", "2024-03"]
}
```

#### POST `/api/salons`
🔒 Auth required (provider)

Új szalon létrehozása.

**Request body:**
```json
{
  "name": "string",
  "address": "string",
  "description": "string (optional)",
  "opening_hours": "H-P: 9-17"
}
```

#### POST `/api/salons/:id/upload-photo`
🔒 Auth required (owner)

Szalon fotó feltöltése.

### Foglalás API

#### GET `/api/appointments`
🔒 Auth required

Saját foglalások lekérése.

**Response:**
```json
{
  "success": true,
  "appointments": [
    {
      "id": 1,
      "salon_name": "Beauty Salon",
      "service_name": "Hajvágás",
      "appointment_start": "2024-02-20T10:00:00.000Z",
      "appointment_end": "2024-02-20T11:00:00.000Z",
      "status": "scheduled",
      "total_price": 5000
    }
  ]
}
```

#### POST `/api/appointments`
🔒 Auth required (customer)

Új foglalás létrehozása.

**Request body:**
```json
{
  "salonId": 1,
  "serviceIds": [1, 2],
  "appointmentStart": "2024-02-20T10:00:00.000Z"
}
```

#### PUT `/api/appointments/:id/cancel`
🔒 Auth required (owner)

Foglalás lemondása.

### Admin API

#### GET `/api/admin/statistics`
🔒 Auth required (admin)

Rendszer statisztikák.

**Response:** Összes felhasználó, szalon, foglalás, bevétel, trendek.

#### PUT `/api/admin/users/:id/ban`
🔒 Auth required (admin)

Felhasználó tiltása/engedélyezése.

**Request body:**
```json
{
  "banned": true
}
```

#### DELETE `/api/admin/users/:id/gdpr-delete`
🔒 Auth required (admin)

GDPR-kompatibilis felhasználó törlés.

**Művelet:**
- `name` → "Törölt Felhasználó"
- `email` → NULL
- `phone` → NULL
- `address` → NULL
- `profile_picture_url` → NULL
- `password_hash` → NULL
- `status` → 'deleted'

---

**Utolsó frissítés:** 2026-02-16