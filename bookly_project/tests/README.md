# Bookly – Frontend End-to-End tesztek

Ez a mappa a Bookly alkalmazás **Playwright** alapú end-to-end (E2E) frontend tesztjeit
tartalmazza. A tesztek valódi böngészőben (Chromium) futtatják az alkalmazást, és úgy
kattintgatnak / gépelnek, mintha egy felhasználó tenné.

> A tesztek átfogják a két legfontosabb felhasználói folyamatot:
>
> 1. **Vendég oldal** (customer): regisztráció, bejelentkezés, profil szerkesztés, foglalás, foglalás lemondás, fiók törlés.
> 2. **Szolgáltató oldal** (provider): regisztráció, bejelentkezés, naptár megnyitás, szolgáltatás CRUD.

---

## Tartalom

- [Előfeltételek](#előfeltételek)
- [Tesztek futtatása](#tesztek-futtatása)
- [Mit tesztelünk?](#mit-tesztelünk)
- [Screenshotok](#screenshotok)
- [Mappa felépítés](#mappa-felépítés)
- [Gyakori problémák](#gyakori-problémák)

---

## Előfeltételek

A tesztek **nem indítják el automatikusan** a backendet és a frontendet, ezeket
külön kell futtatni:

```powershell
# 1. Backend (port 3000)
cd ..\backend
npm run dev

# 2. Frontend (port 5173)
cd ..\frontend
npm run dev

# 3. Tesztek (új terminál)
cd ..\tests
npm install            # csak első alkalommal
npx playwright install # csak első alkalommal (Chromium letöltése)
```

Az adatbázisnak elérhetőnek kell lennie (`docker-compose up -d` a projekt gyökérben),
és tartalmaznia kell legalább a következő demo adatokat:
- `test@test.com` / `asdasdasd` – customer (id 6, kitöltött profillal)
- `provider@test.com` / `asdasdasd` – provider (Test Salon)
- `Premium Hair Salon` (salon id 1) – aktív szolgáltatókkal és szolgáltatásokkal

---

## Tesztek futtatása

### Headless (alapértelmezett – gyors)

```powershell
npx playwright test
```

### Headed (láthatóan, böngészőben kinyílva – jó bemutatóhoz)

```powershell
npx playwright test --headed
```

> **Fontos:** a `playwright.config.js` 2 párhuzamos workert használ. Ne add hozzá a
> `--workers=10`-et headed módban, mert a Windows asztal nem tud 10 böngészőt egyszerre
> kezelni, és összeomlik a tesztelés.

### Egyetlen fájl futtatása

```powershell
npx playwright test Booking.spec.js --headed
```

### HTML riport megnyitása futás után

```powershell
npx playwright show-report
```

---

## Mit tesztelünk?

| Spec fájl | Tesztek | Lefedett funkció |
|---|---|---|
| `Register.spec.js` | 4 | Vendég regisztráció oldal + sikeres regisztráció |
| `Login.spec.js` | 4 | Vendég bejelentkezés (üres mezők, rossz jelszó, siker) |
| `CustomerProfile.spec.js` | 4 | Profil tab, szerkesztő modal, mentés, jelszó validáció |
| `CustomerAccountDeletion.spec.js` | 2 | Fiók törlés modal megnyitása + üres jelszó validáció |
| `Booking.spec.js` | 2 | Sikeres foglalás folyamat + múltbeli dátum nem foglalható |
| `CancelAppointment.spec.js` | 2 | Foglalás lemondás modal + sikeres lemondás |
| `ProviderRegister.spec.js` | 5 | Provider regisztráció lépései (új szalon / csatlakozás) |
| `ProviderLogin.spec.js` | 4 | Provider bejelentkezés (üres, rossz, jó adatok) |
| `ProviderServiceCRUD.spec.js` | 4 | Szolgáltatás létrehozás, validáció, sikeres mentés |
| `ProviderAppointmentCancel.spec.js` | 2 | Naptár betöltés + nap kattintás |

**Összesen: 33 teszt, ~1.2 perc futási idő headless módban.**

---

## Screenshotok

Minden teszt készít screenshot-okat a kulcs lépésekről, amelyek a `screenshots/`
mappába kerülnek. Ezeket **commitba is beletettük**, hogy a tanárok / reviewerek a kódot
megnyitva azonnal lássák, mit csinál egy-egy teszt anélkül, hogy le kéne futtatniuk.

A failure-ökhöz Playwright automatikusan készít további screenshot-ot és videót a
`test-results/` mappába (ez gitignore-olva van).

---

## Mappa felépítés

```
tests/
├── *.spec.js                  # Tesztek (10 fájl, 33 teszt)
├── fixtures/                  # Bejelentkezést automatizáló fixture-ök
│   ├── authFixture.js         # Customer auto-login
│   └── providerAuthFixture.js # Provider auto-login + Test Salon
├── helpers/                   # Újrahasznosítható helper függvények
│   ├── auth.js                # Regisztrációs / bejelentkezési helperek
│   ├── booking.js             # Foglalási folyamat lépései
│   └── providerAuth.js        # Provider helperek
├── screenshots/               # Sikeres tesztek képei (lépésről lépésre)
├── playwright.config.js       # Playwright beállítások
└── package.json
```

---

## Gyakori problémák

### `browserType.launch: Target page, context or browser has been closed`

Ez akkor jön elő, ha túl sok böngészőablak nyílik egyszerre headed módban. A
`playwright.config.js` mostantól `workers: 2`-re korlátozza, de ha CLI-ből felülbírálod
(pl. `--workers=10 --headed`), akkor megint előjöhet.

### `connect ECONNREFUSED 127.0.0.1:5173` vagy `:3000`

Nem fut a frontend (5173) vagy a backend (3000). Lásd az [Előfeltételek](#előfeltételek)
szakaszt.

### `Element is not visible` / `Timeout exceeded`

Általában az adatbázis kezdeti állapota tér el. Futtasd a `reset-db.sh`-t a projekt
gyökérben, aztán próbáld újra.
