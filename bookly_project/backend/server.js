//!Module-ok importálása
const express = require('express'); //?npm install express
const session = require('express-session'); //?npm install express-session
const cors = require('cors'); //?npm install cors
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'Secret.env') }); //?npm install dotenv
const jwt = require('jsonwebtoken'); //?npm install jsonwebtoken

//!Beállítások
const app = express();
const router = express.Router();

const ip = process.env.IP_ADDRESS || '127.0.0.1';
const port = process.env.PORT || 3000;

app.use(express.json()); //?Middleware JSON
app.use(cors()); //?CORS middleware
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
const loginApi = require('./api/LoginApi.js');
app.use('/auth', loginApi);

//!Szerver futtatása
app.use(express.static(path.join(__dirname, '../frontend'))); //?frontend mappa tartalmának betöltése az oldal működéséhez
app.listen(port, ip, () => {
    console.log(`Szerver elérhetősége: http://${ip}:${port}`);
});

//?Szerver futtatása terminalból: npm run dev
//?Szerver leállítása (MacBook és Windows): Control + C
//?Terminal ablak tartalmának törlése (MacBook): Command + K
