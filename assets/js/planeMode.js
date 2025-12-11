//Siempre se limpia el modo activo antes de iniciar uno nuevo
function PlanePointAB() {
    clearActiveMode();

    // 1. Definimos la función de selección (Punto A/B/Reinicio) y la almacenamos.
    activeMarkerClickHandler = function (e) {
        const clickedMarker = e.target;
        const clickedLatLng = e.latlng;
        
        clickedMarker.closePopup();
        map.closePopup(); // Eliminar popup de advertencia

        if (!_pointA) {
            // Primer clic: Establecer Punto A
            markerA = clickedMarker;
            _pointA = clickedLatLng;
        } else if (!_pointB && clickedMarker !== markerA) {
            // Segundo clic: Establecer Punto B
            markerB = clickedMarker;
            _pointB = clickedLatLng;

            // --- LÓGICA DE CÁLCULO Y DIBUJO ---
            _polyline = L.polyline([_pointA, _pointB], { color: "red" }).addTo(map);

            let distance = map.distance(_pointA, _pointB);
            distance = distance / 1000;

            const offset = getSelectedTimezoneOffset();
            const startTS = Date.now();
            const endTS = startTS + (distance / 800) * 3600000;
            const tzLabel = timezoneSelect?.value || "GMT-4";
            const start_hour = formatTimeWithOffset(startTS, offset);
            const end_hour = formatTimeWithOffset(endTS, offset);

            distanceRecords.push({
                type: "Distancia Aérea",
                distance: distance.toFixed(2),
                tzLabel,
                start_hour,
                end_hour,
                pointA_info: {
                name: markerA.getPopup().getContent().match(/<b>(.*?) \((.*?)\)<\/b>/)?.[1] || "Origen", // Extraer nombre del popup
                lat: _pointA.lat,
                lng: _pointA.lng,
                },
                pointB_info: {
                    name: markerB.getPopup().getContent().match(/<b>(.*?) \((.*?)\)<\/b>/)?.[1] || "Destino",
                    lat: _pointB.lat,
                    lng: _pointB.lng,
                },
                pointA: _pointA,
                pointB: _pointB,
              });
            saveDistanceRecords(distanceRecords);
            renderDistanceList();
            // --- FIN LÓGICA DE CÁLCULO Y DIBUJO ---

        } else {
            // Tercer clic: Reinicio de la ruta + Nuevo punto A
            if (_polyline) {
                map.removeLayer(_polyline);
            }
            _polyline = null;
            _pointB = null;
            markerB = null;

            // Nuevo punto A
            _pointA = clickedLatLng;
            markerA = clickedMarker;
        }
    };

    // 2. Definimos el listener del mapa para la notificación
    mapClickListener = function (e) {
        L.popup({
            closeButton: false, 
            autoClose: true,    
            className: 'selection-warning-popup',
            maxWidth: 300,
            autoPan: false
        })
        .setLatLng(e.latlng)
        .setContent("⚠️ Error de Selección:<br>Por favor, selecciona un marcador de aeropuerto.")
        .openOn(map);
    };

    // 3. Adjuntar listeners

    // Adjuntar la función ESPECÍFICA a los marcadores
    if (airportMarkers && airportMarkers.length > 0) {
        airportMarkers.forEach(marker => {
            marker.on("click", activeMarkerClickHandler);
        });
    }

    // Adjuntar listener de advertencia al mapa
    map.on("click", mapClickListener);
}