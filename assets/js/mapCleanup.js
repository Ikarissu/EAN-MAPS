// Función para limpiar la opción activa
function clearActiveMode() {
    // 1. Limpiar el listener de clic del mapa (Notificación y VehiclePointAB)
    if (typeof mapClickListener !== 'undefined' && mapClickListener !== null) {
        map.off("click", mapClickListener);
        mapClickListener = null;
    }
    
    // 2. Limpiar los listeners de clic de CADA marcador (Selección de Avión)
    if (airportMarkers && airportMarkers.length > 0 && activeMarkerClickHandler) {
        airportMarkers.forEach(marker => {
            marker.off('click', activeMarkerClickHandler); 
        });
        activeMarkerClickHandler = null;
    }
    // 3. Limpieza de capas DE AMBOS MODOS
    // Modo Avión: Limpieza de la polilínea
    if (_polyline) {
        map.removeLayer(_polyline);
    }
    // Modo Vehículo: Limpieza del control de ruta
    if (routingControl) {
        map.removeControl(routingControl); // Elimina el control de ruta del mapa
        routingControl = null;             // Reinicia la variable
    }
    map.closePopup();
    // 4. Limpieza de marcadores A y B (solo son temporales en VehiclePointAB)
    if (markerA) {
        map.removeLayer(markerA);
    }
    if (markerB) {
        map.removeLayer(markerB);
    }
    // 5. Reinicio de variables de estado
    _pointA = null;
    _pointB = null;
    markerA = null;
    markerB = null;
    _polyline = null;
}