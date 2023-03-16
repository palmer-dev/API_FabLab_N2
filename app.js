var http = require('http');
const https = require('https');
var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var fs = require("fs");
var session = require('express-session')

// DB
const { saveNewMesure, getMesuresForStationId, startConnection, authUser, generateUserCollection, getLastesMesuresForStationId, getUserStations } = require("./database/config");

// CERTIFICATE
const privateKey = fs.readFileSync('./certs/privkey.pem', 'utf8');
const certificate = fs.readFileSync('./certs/cert.pem', 'utf8');
const ca = fs.readFileSync('./certs/chain.pem', 'utf8');

const credentials = {
    key: privateKey,
    cert: certificate,
    ca: ca
};

const httpsServer = https.createServer(credentials, app);
const io = require("socket.io")(httpsServer);

// Démarrage de la connection à la BdD
startConnection().then(generateUserCollection);

// Démarrage des sessions
app.set('trust proxy', 1) // trust first proxy
app.use(session({
    secret: 'JeSuisLaCléDeSécuritéCookie',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: true, maxAge: 7200000 },
}))

// parse application/json
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json())

app.use(function (req, res, next) {
    res.append('Access-Control-Allow-Origin', ['*']);
    res.append('Access-Control-Allow-Methods', 'GET,POST');
    res.append('Access-Control-Allow-Headers', 'Content-Type');
    console.log("/" + req.method);
    next();
});

// ======== DOSSIER PUBLIC ========= //
app.use("/public", express.static('public'));

// == MIDDLEWARE AUTHENTIFICATION == //
const authMid = (req, res, next) => {
    next()
    // if (req.session.isLoggedIn == true)
    //     next()
    // else
    //     res.redirect("/auth/login");
}

// ======== LIENS API ======== //
app.post('/add-mesures', function (req, res) {
    const toInsert = req.body;
    toInsert.timestamp = new Date();
    saveNewMesure(toInsert);
    io.emit('newValue', toInsert);
    res.status(200).end();
})

app.get('/data/:dateDebut?', function (req, res) {
    const dateDebut = req.params.dateDebut;
    getMesuresForStationId().then(mesures => {
        let returned = { data: dateDebut != undefined ? mesures.filter((donnee) => new Date(donnee.timestamp) >= new Date(new Date(dateDebut).toISOString())) : mesures };
        res.json(returned);
    });
})

app.get('/last-infos', function (req, res) {
    getLastesMesuresForStationId().then(lastMesure => {
        res.json(lastMesure ?? {});
    })
})

app.get('/user-stations', authMid, function (req, res) {
    console.log(req.session.user);
    getUserStations(req.session.user._id);
    res.send("OK").end();
})

// ======== PARTIE WEB ACCESS ======== //
// MAP MONDE
app.get("/", (req, res) => {
    res.sendFile(__dirname + '/pages/mapmonde.html');
})

// DASHBOARD
app.get('/dashboard', authMid, (req, res) => {
    res.sendFile(__dirname + '/pages/dashboard.html');
});

// LOGIN
app.get('/auth/login', (req, res) => {
    res.sendFile(__dirname + '/pages/login.html');
});
app.post('/auth/login', (req, res) => {
    const { username, password } = req.body;
    authUser(username, password).then((user) => {
        if (user != null) {
            req.session.user = user;
            req.session.isLoggedIn = true;
            res.redirect("/dashboard");
        } else {
            res.send(403).end();
        }
    })
});

// LOGOUT
app.get('/auth/logout', (req, res) => {
    res.sendFile(__dirname + '/pages/index.html');
});

// ======== SOCKET TEMPS REEL ======== //
io.on('connection', (socket) => {
    console.log('a user connected');
});

// ======== ACTIAVTION DES SERVEURS ======== //
http.createServer(app).listen(8013, () => {
    console.log('HTTPS Server running on port 8013');
    console.log(`
                Addresses :
                    https://localhost:8013
                    http://lab-rey.fr
            `);
});

httpsServer.listen(8012, () => {
    console.log('HTTPS Server running on port 8012');
    console.log(`
    Addresses :
    https://localhost:8012
    https://lab-rey.fr
    `);
});