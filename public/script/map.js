const map = L.map('map').setView([51.505, -0.09], 13);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
}).addTo(map);




window.onload = () => {
    resizeMap()
    window.addEventListener("resize", resizeMap);
}

function resizeMap() {
    const navHeight = document.getElementById("menuTop").offsetHeight;
    document.getElementById("map").style.height = `${window.innerHeight - navHeight}px`;
    document.getElementById("map").style.top = `${navHeight}px`;
}