//!Module-ok importálása
const express = require('express'); //?npm install express
const session = require('express-session'); //?npm install express-session
const cors = require('cors'); //?npm install cors
const cookieParser = require('cookie-parser'); //?npm install cookie-parser
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'Secret.env') }); //?npm install dotenv
const jwt = require('jsonwebtoken'); //?npm install jsonwebtoken
const { pool } = require('./sql/database.js'); //?Adatbázis kapcsolat importálása

//!Beállítások
const app = express();
const router = express.Router();
const ip = process.env.IP_ADDRESS || '127.0.0.1';
const port = process.env.PORT || 3000;

app.use(express.json()); //?Middleware JSON
app.use(cookieParser()); //?Cookie parser middleware

// CORS configuration - Allow all for development
app.use(cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:5174', 'http://127.0.0.1:5174'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
})); //?CORS middleware

app.set('trust proxy', 1); //?Middleware Proxy

//!Session beállítása:
app.use(
    session({
        secret: process.env.SESSION_SECRET || 'default-secret-key',
        resave: false,
        saveUninitialized: true
    })
);

//!Routing
//?Főoldal:
app.get('/', (request, response) => {
    response.sendFile(path.join(__dirname, '../frontend/index.html'));
});
//!API endpoints
app.use('/', router);
const endpoints = require('./api/api.js');
app.use('/api', endpoints);
const loginApi = require('./api/auth/LoginApi.js');
app.use('/auth', loginApi);
const userApi = require('./api/userApi.js');
app.use('/api', userApi);
const searchApi = require('./api/searchApi.js');
app.use('/api/search', searchApi);
const provLoginApi = require('./api/auth/provLoginApi.js');
app.use('/auth/provider', provLoginApi);


//!Szerver futtatása
app.use(express.static(path.join(__dirname, '../frontend'))); //?frontend mappa tartalmának betöltése az oldal működéséhez
app.listen(port, ip, () => {
    console.log(`Szerver elérhetősége: http://${ip}:${port}`);
});

//!Adatbázis kapcsolat ellenőrzése
pool.query('SELECT 1').then(() => {
    console.log('✓ Database connected');
}).catch(err => {
    console.error('✗ Database connection failed:', err.message);
    process.exit(1);
});

//?Szerver futtatása terminalból: npm run dev
//?Szerver leállítása (MacBook és Windows): Control + C
//?Terminal ablak tartalmának törlése (MacBook): Command + K
