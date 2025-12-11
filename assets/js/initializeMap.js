// Inicialización del mapa Leaflet
let map = L.map("main-map").setView([10.261, -67.588], 7);

// Capa base del mapa (OpenStreetMap)
L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map);