var socket = io();

socket.on('newValue', function (valeurs) {
    updateCharts(valeurs);
    updateLastInfos(valeurs);
});

socket.on('satUpdated', function (valeurs) {
    affichageSat(valeurs.GPS.nbSat);
});

const range = document.getElementById("range");
const timestamp = [];
const tempdata = [];
const humdata = [];
const pressdata = [];
const altdata = [];
const GPS = [];

range.addEventListener("change", (ev) => {
    const value = ev.target.value;
    clearCharts();
    getDataFromAPI(value);
})

var temperature = document.getElementById("chartTemp").getContext("2d");
var humidity = document.getElementById("chartHum").getContext("2d");
var pressure = document.getElementById("chartPress").getContext("2d");
var altitude = document.getElementById("chartAlt").getContext("2d");
var chartTemp = new Chart(temperature, {
    type: "line",
    data: {
        labels: timestamp,
        datasets: [
            {
                data: tempdata,
                label: "Température",
                borderColor: "#3e95cd",
                backgroundColor: "#7bb6dd",
                fill: false,
            },
        ],
    },
    options: {
        animation: false,
    }
});

var chartHum = new Chart(humidity, {
    type: "line",
    data: {
        labels: timestamp,
        datasets: [
            {
                data: humdata,
                label: "Humitdité",
                borderColor: "#3cba9f",
                backgroundColor: "#71d1bd",
                fill: false,
            },
        ],
    },
    options: {
        animation: false,
    }
});

var chartPress = new Chart(pressure, {
    type: "line",
    data: {
        labels: timestamp,
        datasets: [
            {
                data: pressdata,
                label: "Pression Atmos.",
                borderColor: "#ffa500",
                backgroundColor: "#ffc04d",
                fill: false,
            },
        ],
    },
    options: {
        animation: false,
    }
});

var chartAlt = new Chart(altitude, {
    type: "line",
    data: {
        labels: timestamp,
        datasets: [
            {
                data: altdata,
                label: "Altitude",
                borderColor: "#c45850",
                backgroundColor: "#d78f89",
                fill: false,
            },
        ],
    },
    options: {
        animation: false,
    }
});

function updateCharts(newValeurs) {
    timestamp.push(new Date(newValeurs.timestamp).toLocaleString());
    humdata.push(newValeurs.Weather.humidity);
    tempdata.push(newValeurs.Weather.temperature);
    pressdata.push(newValeurs.Weather.pressure);
    altdata.push(newValeurs.GPS.alt);
    GPS.push(newValeurs.GPS);
    refreshCharts();
    refreshGPS();
}

function clearCharts() {
    timestamp.splice(0, timestamp.length);
    tempdata.splice(0, tempdata.length);
    humdata.splice(0, humdata.length);
    pressdata.splice(0, pressdata.length);
    altdata.splice(0, altdata.length);
    refreshCharts();
}

function refreshCharts() {
    chartTemp.update();
    chartHum.update();
    chartPress.update();
    chartAlt.update();
}

function refreshGPS() {
    GPS.forEach((gpsPoint, index) => {
        updateOrCreatePoint(gpsPoint, { temperature: tempdata[index], humidity: humdata[index], pression: pressdata[index] });
    });
    updateFocusMap();
}

function updateOrCreatePoint(gpsPoint, dataToDislay) {
    var marker = L.marker([gpsPoint.lat, gpsPoint.lng]).addTo(map);
    marker.bindPopup("<b>Mesures</b><br>Température: " + dataToDislay.temperature + "°C<br>Humidité: " + dataToDislay.humidity + "%<br>Pression Atmos.: " + dataToDislay.pression + " hPa")
    updateFocusMap();
}

function updateFocusMap() {
    const moyLat = GPS.map(gp => gp.lat).filter(val => val != '').reduce((sm, a) => sm + a, 0) / GPS.map(gp => gp.lat).filter(val => val != '').length;
    const moyLng = GPS.map(gp => gp.lng).filter(val => val != '').reduce((sm, a) => sm + a, 0) / GPS.map(gp => gp.lng).filter(val => val != '').length;
    map.setView([moyLat, moyLng], 13);
}

function getDataFromAPI(range = 'day') {
    var d = new Date();
    var start = '';
    switch (range) {
        case 'hour':
            d.setHours(d.getHours() - 1);
            start = d.toISOString();
            break;
        case 'month':
            d.setUTCHours(0, 0, 0, 0);
            d.setDate(1);
            start = d.toISOString();
            break;
        case 'week':
            d.setUTCHours(0, 0, 0, 0);
            start = getPreviousMonday(d).toISOString();
            break;
        case 'day':
            d.setUTCHours(0, 0, 0, 0);
            start = d.toISOString();
            break;
        default:
            break;
    }
    fetch(`https://lab-rey.fr/data/${start}`)
        .then((data) => data.json())
        .then((data) => {
            console.log(data);
            timestamp.push(...data.data.map(value => new Date(value.timestamp).toLocaleString()));
            humdata.push(...data.data.map(value => value.Weather.humidity))
            tempdata.push(...data.data.map(value => value.Weather.temperature))
            pressdata.push(...data.data.map(value => value.Weather.pressure))
            altdata.push(...data.data.map(value => value.GPS.alt))
            GPS.push(...data.data.map(value => value.GPS));
            // Update de tous les graphs
            refreshCharts();
            refreshGPS();
        });
}

function getPreviousMonday(fromDate) {
    var dayMillisecs = 24 * 60 * 60 * 1000;

    // Get Date object truncated to date.
    var d = new Date(fromDate || Date());

    // If today is Sunday (day 0) subtract an extra 7 days.
    var dayDiff = d.getDay() === 0 ? 7 : 0;

    // Get date diff in millisecs to avoid setDate() bugs with month boundaries.
    var mondayMillisecs = d.getTime() - (d.getDay() + dayDiff - 1) * dayMillisecs;

    // Return date as YYYY-MM-DD string.
    return new Date(mondayMillisecs);
}

function affichageSat(nbSat) {
    const pToDisplay = document.getElementById("nbSatConnected");
    pToDisplay.innerText = nbSat != "" ? nbSat : 0;
    referenceTimeUpdated.nbSat = new Date();
}

function affichageMeteo(weather) {
    const tempValue = document.getElementById("tempValue");
    const humidityValue = document.getElementById("humidityValue");
    const patmosValue = document.getElementById("patmosValue");
    tempValue.innerText = (weather.temperature ?? "N/A") + "°C";
    humidityValue.innerText = (weather.humidity ?? "N/A") + "%";
    patmosValue.innerText = (weather.pressure ?? "N/A") + "hPa";
}

const referenceTimeUpdated = {
    nbSat: null,
    temp: null,
    humidity: null,
    patmos: null
}

function updateAllMajTimer() {
    const diffSat = getDiffDates(referenceTimeUpdated.nbSat);
    const diffTemp = getDiffDates(referenceTimeUpdated.temp);
    const diffHumidity = getDiffDates(referenceTimeUpdated.humidity);
    const diffPatmos = getDiffDates(referenceTimeUpdated.patmos);
    const nbSatUpd = document.getElementById("nbSatUpd");
    const tempUpd = document.getElementById("tempUpd");
    const humidityUpd = document.getElementById("humidityUpd");
    const patmosUpd = document.getElementById("patmosUpd");
    nbSatUpd.innerText = diffSat.minutes + ":" + String(diffSat.seconds).padStart(2, '0') + "min";
    tempUpd.innerText = diffTemp.minutes + ":" + String(diffTemp.seconds).padStart(2, '0') + "min";
    humidityUpd.innerText = diffHumidity.minutes + ":" + String(diffHumidity.seconds).padStart(2, '0') + "min";
    patmosUpd.innerText = diffPatmos.minutes + ":" + String(diffPatmos.seconds).padStart(2, '0') + "min";
}

function getDiffDates(dateNow, dateFuture = new Date()) {
    var seconds = Math.floor((dateFuture - (dateNow)) / 1000);
    var minutes = Math.floor(seconds / 60);
    var hours = Math.floor(minutes / 60);
    var days = Math.floor(hours / 24);

    hours = hours - (days * 24);
    minutes = minutes - (days * 24 * 60) - (hours * 60);
    seconds = seconds - (days * 24 * 60 * 60) - (hours * 60 * 60) - (minutes * 60);
    return { days, hours, minutes, seconds }
}


function updateLastInfos(data) {
    affichageMeteo(data.Weather);
    affichageSat(data.GPS.nbSat);
    referenceTimeUpdated.nbSat = data?.timestamp ? new Date(data.timestamp) : new Date();
    referenceTimeUpdated.humidity = data?.timestamp ? new Date(data.timestamp) : new Date();
    referenceTimeUpdated.temp = data?.timestamp ? new Date(data.timestamp) : new Date();
    referenceTimeUpdated.patmos = data?.timestamp ? new Date(data.timestamp) : new Date();
    setInterval(updateAllMajTimer, 1000);
}

fetch(`https://lab-rey.fr/last-infos`)
    .then((data) => data.json())
    .then((data) => {
        updateLastInfos(data);
    });

getDataFromAPI();