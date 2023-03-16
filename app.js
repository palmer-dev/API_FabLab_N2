var http = require('http');
const https = require('https');
var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var fs = require("fs");

// DB
const { saveNewMesure, getMesuresForStationId, startConnection } = require("./database/config");

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

startConnection();

// parse application/json
app.use(bodyParser.json())


app.use(function (req, res, next) {
    res.append('Access-Control-Allow-Origin', ['*']);
    res.append('Access-Control-Allow-Methods', 'GET,POST');
    res.append('Access-Control-Allow-Headers', 'Content-Type');
    console.log("/" + req.method);
    next();
});

app.use("/public", express.static('public'));

app.post('/add-mesures', function (req, res) {
    const toInsert = req.body;
    toInsert.timestamp = new Date();
    saveNewMesure(toInsert);
    io.emit('newValue', toInsert);
    res.status(200).end();
})

app.get('/data/:dateDebut?', function (req, res) {
    const dateDebut = req.params.dateDebut;
    console.log(dateDebut);
    getMesuresForStationId().then(mesures => {
        let returned = { data: dateDebut != undefined ? mesures.filter((donnee) => new Date(donnee.timestamp) >= new Date(new Date(dateDebut).toISOString())) : mesures };
        console.log(mesures);
        res.json(returned);
    });
})

app.get('/last-infos', function (req, res) {
    getMesuresForStationId().then(mesures => {
        const ret = mesures[mesures.length - 1] ?? {}
        res.json(ret);
    })
})

app.get('/dashboard', (req, res) => {
    res.sendFile(__dirname + '/pages/index.html');
});

io.on('connection', (socket) => {
    console.log('a user connected');
});

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