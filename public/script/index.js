var socket = io();

socket.on('newValue', function (msg) {
    console.log(msg);
});

const timestamp = [];
const tempdata = [];
const humdata = [];
const pressdata = [];
const altdata = [];

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
});

function updateCharts(newValeurs) {
    timestamp.push(newValeurs.timestamp);
    humdata.push(newValeurs.Weather.humidity);
    tempdata.push(newValeurs.Weather.temperature);
    pressdata.push(newValeurs.Weather.pressure);
    altdata.push(newValeurs.Weather.altitude);
    chartTemp.update();
    chartHum.update();
    chartPress.update();
    chartAlt.update();
}

fetch("https://lab-rey.fr/data")
    .then((data) => data.json())
    .then((data) => {
        timestamp.push(...data.data.map(value => new Date(value.timestamp).toLocaleString()));
        humdata.push(...data.data.map(value => value.Weather.humidity))
        tempdata.push(...data.data.map(value => value.Weather.temperature))
        pressdata.push(...data.data.map(value => value.Weather.pressure))
        altdata.push(...data.data.map(value => value.Weather.altitude))
        // Update de tous les graphs
        chartTemp.update();
        chartHum.update();
        chartPress.update();
        chartAlt.update();
    });
