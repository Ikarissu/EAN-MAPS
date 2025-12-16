function removeDrawnRoutes() {
  try {
    if (window._currentAltPolyline) {
      map.removeLayer(window._currentAltPolyline);
      window._currentAltPolyline = null;
    }
    if (window._currentPrimaryPolyline) {
      map.removeLayer(window._currentPrimaryPolyline);
      window._currentPrimaryPolyline = null;
    }
  } catch (e) {}
}


function clearActiveMode({ keepPoints = false } = {}) {
  // Borra ruta/controles
  if (routingControl) { map.removeControl(routingControl); routingControl = null; }
  if (_polyline) { map.removeLayer(_polyline); _polyline = null; }

  // Quita listeners
  map.off("click", mapClickListener);
  if (airportMarkers && activeMarkerClickHandler) {
    airportMarkers.forEach(m => m.off("click", activeMarkerClickHandler));
  }

  // Limpiar rutas dibujadas (principal y alternativa)
  removeDrawnRoutes();

  // Si se pidió conservar puntos, salir aquí
  if (keepPoints) return;

  // Borra marcadores y puntos
  if (markerA) { map.removeLayer(markerA); markerA = null; }
  if (markerB) { map.removeLayer(markerB); markerB = null; }
  _pointA = null;
  _pointB = null;
 
}

// Limpiar solo la ruta, dejando marcadores/puntos
function clearRouteOnly() {
  clearActiveMode({ keepPoints: true });
}