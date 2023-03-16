var socket = io();

// VARIABLES
const URL_API = "https://lab-rey.fr";
const GPS = {};
const weatherInfos = {};

// SOCKET TEMPS REEL
socket.on('newValue', function (valeurs) {
    GPS[valeurs.id] = valeurs.GPS;
    setWeatherInfos(valeurs.Weather, valeurs.timestamp);
    refreshGPS();
});

function refreshGPS() {
    for (const [idStation, gpsPoint] of Object.entries(GPS)) {
        updateOrCreatePoint(gpsPoint, weatherInfos);
    }
    updateFocusMap();
}

function updateOrCreatePoint(gpsPoint, dataToDislay) {
    var marker = L.marker([gpsPoint.lat, gpsPoint.lng]).addTo(map);
    marker.bindPopup("<p class='popupMap'><b>Station: " + dataToDislay.station.nom + "</b><br/><b>" + dataToDislay.date + "</b></p>Température: <b>" + dataToDislay.temperature + "°C</b><br>Humidité: <b>" + dataToDislay.humidity + "%</b><br>Pression Atmos.: <b>" + dataToDislay.pression + " hPa</b>")
    updateFocusMap();
}

function updateFocusMap() {
    const moyLat = [...Object.values(GPS)].map(gp => gp.lat).filter(val => val != '').reduce((sm, a) => sm + a, 0) / [...Object.values(GPS)].map(gp => gp.lat).filter(val => val != '').length;
    const moyLng = [...Object.values(GPS)].map(gp => gp.lng).filter(val => val != '').reduce((sm, a) => sm + a, 0) / [...Object.values(GPS)].map(gp => gp.lng).filter(val => val != '').length;
    map.setView([moyLat, moyLng], 13);
}

const setWeatherInfos = (data) => {
    weatherInfos.temperature = data.Weather.temperature;
    weatherInfos.humidity = data.Weather.humidity;
    weatherInfos.pression = data.Weather.pressure;
    weatherInfos.date = new Date(data.timestamp).toLocaleString();
    weatherInfos.station = data.station
}

function getDataFromAPI() {
    fetch(`${URL_API}/last-infos`)
        .then((data) => data.json())
        .then((data) => {
            GPS[data.id] = data.GPS;
            setWeatherInfos(data);
            console.log(weatherInfos);
            refreshGPS();
        });
}

getDataFromAPI();