var http = require('http');
const https = require('https');
var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var fs = require("fs");

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
    fs.readFile("./out/mesures.json", (err, data) => {
        const json = JSON.parse(data);
        const toInsert = req.body;
        toInsert.timestamp = new Date();
        json.data.push(toInsert);
        const str = JSON.stringify(json);
        fs.writeFile("./out/mesures.json", str, () => {
        });
        io.emit('newValue', toInsert);
        res.send("");
    })
})

app.get('/data', function (req, res) {
    fs.readFile("./out/mesures.json", (err, data) => {
        const json = JSON.parse(data);
        res.json(json);
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