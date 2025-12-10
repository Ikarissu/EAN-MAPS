
// Inicialización del mapa Leaflet
let map= L.map('main-map').setView([10.261, -67.588], 7);

// Capa base del mapa (OpenStreetMap)
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);


// Variables globales para el estado del modo
let routingControl = null;
let _pointA = null;
let _pointB = null;
let _polyline = null;
let markerA = null;
let markerB = null;
let mapClickListener = null; 


// Botones de modo
const planeBtn = document.getElementById('plane');
const vehicleBtn = document.getElementById('vehicle');

function clearActiveMode() {
    // A. Eliminar el evento listener del mapa si existe
    if (mapClickListener) {
        map.off('click', mapClickListener);
        mapClickListener = null;
    }
        if (routingControl) {
        map.removeControl(routingControl);
        routingControl = null;
    }
    
    // B. Limpiar los dibujos del mapa (Layers)
    if (_polyline && map.hasLayer(_polyline)) {
        map.removeLayer(_polyline);
    }
    if (markerA && map.hasLayer(markerA)) {
        map.removeLayer(markerA);
    }
    if (markerB && map.hasLayer(markerB)) {
        map.removeLayer(markerB);
    }
    // D. Reiniciar variables de estado del modo
    _pointA = null;
    _pointB = null;
    _polyline = null;
    markerA = null;
    markerB = null;
}

//Siempre se limpia el modo activo antes de iniciar uno nuevo
function PlanePointAB() {
    clearActiveMode(); 
    mapClickListener = function(e) {
        if (!_pointA) {
            // Primer clic: Punto A
            markerA = L.marker(e.latlng).addTo(map);
            _pointA = e.latlng;
        } else if (!_pointB) {
            // Segundo clic: Punto B
            markerB = L.marker(e.latlng).addTo(map);
            _pointB = e.latlng;

            _polyline = L.polyline([_pointA, _pointB], {color: 'red'}).addTo(map);

            let distance = map.distance(_pointA, _pointB);
            distance = distance / 1000; 
            let start_hour = new Date().toLocaleTimeString()
            let end_hour = new Date(new Date().getTime() + (distance / 800) * 3600000).toLocaleTimeString();
            document.body.insertAdjacentHTML('beforeend', `<div class="distance-info" style="text-align: center; bottom: 10px; left: 10px; background: white; padding: 5px; border: 1px solid black;">Distancia aerea: ${distance.toFixed(2)} kilometros <div>
            <p>Hora de salida: ${start_hour}</p>
            <p>Hora de llegada (Aproximada) ${end_hour} </p></div></div>`);
        }else { 
            // Tercer clic: Reinicio de la ruta + eliminación de capas previas
            if (_polyline) {
                map.removeLayer(_polyline);
            }
            if (markerA) { 
                map.removeLayer(markerA);
            }
            if (markerB) {
                map.removeLayer(markerB);
            }
            
            _polyline = null;
            _pointB = null;
            markerB = null; 
            
            // Nuevo punto A
            _pointA = e.latlng;
            markerA = L.marker(e.latlng).addTo(map);
        }
    };
    
    // 3. Adjuntar el listener guardado al mapa
    map.on('click', mapClickListener); 
};

function VehiclePointAB() { 
    clearActiveMode(); 
    mapClickListener = function(e) {
        if (!_pointA) {
            // Primer clic: Punto A
            markerA = L.marker(e.latlng).addTo(map);
            _pointA = e.latlng;
            
        } else if (!_pointB) {
            // Segundo clic: Punto B
            markerB = L.marker(e.latlng).addTo(map);
            _pointB = e.latlng;
            routingControl = L.Routing.control({ 
                // OPCIONES DE RUTA Y WAYPOINTS AÑADIDAS
                waypoints: [
                    L.latLng(_pointA.lat, _pointA.lng), 
                    L.latLng(_pointB.lat, _pointB.lng)
                ],
                routeWhileDragging: false,
                draggableWaypoints: false,
                createMarker: function() { return null; }, // Evita que LRM añada sus propios marcadores
                lineOptions: {
                    styles: [{color: 'blue', opacity: 0.6, weight: 6}] 
                }
            }).addTo(map); 
            
            routingControl.on('routesfound', function(e) {
                // Asegurarse de que haya rutas encontradas
                let route = e.routes[0];
                if (route) {
                    let distance = route.summary.totalDistance / 1000; 
                    let start_hour = new Date().toLocaleTimeString()
                    let end_hour = new Date(new Date().getTime() + (distance / 70) * 3600000).toLocaleTimeString();
                    // Insertar el modal de distancia
                    document.body.insertAdjacentHTML('beforeend', `<div class="distance-info" style="text-align: center; bottom: 10px; left: 10px; background: white; padding: 5px; border: 1px solid black;">Distancia vehicular: ${distance.toFixed(2)} kilometros <div>
            <p>Hora de salida: ${start_hour}</p>
            <p>Hora de llegada (Aproximada) ${end_hour} </p></div></div></div>`);
                }
            }); 
            
        } else {
            // Tercer clic: Reinicio de la ruta
            // 1. LIMPIEZA DEL MODO VEHICULAR ANTERIOR
            if (routingControl) {
                map.removeControl(routingControl); // Elimina el controlador de la vista (Ruta Azul)
                routingControl = null;
            }
            

            // 2. Limpieza de marcadores
            if (markerA) { map.removeLayer(markerA); }
            if (markerB) { map.removeLayer(markerB); }
            
            // 3. Reinicio de variables de punto
            _pointB = null;
            markerB = null;
            
            // 4. Nuevo punto A
            _pointA = e.latlng;
            markerA = L.marker(e.latlng).addTo(map);
        }
    };
    
    map.on('click', mapClickListener); 
};


//Manejadores de los botones en la interfaz
if (planeBtn) {
    planeBtn.addEventListener('click', function() {
        PlanePointAB(); 
        this.classList.add('selected-mode');
        this.disabled = true;
        if (vehicleBtn) {
            vehicleBtn.classList.remove('selected-mode');
            vehicleBtn.disabled = false;
        }
    });
}

if (vehicleBtn) {
    vehicleBtn.addEventListener('click', function() {
        VehiclePointAB(); 
        this.classList.add('selected-mode');
        this.disabled = true;
        if (planeBtn) {
            planeBtn.classList.remove('selected-mode');
            planeBtn.disabled = false; 
        }
    });
}