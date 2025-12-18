
//Mostrar un registro de distancia en el mapa
function showRecordOnMap(record) {
  // Limpiar cualquier modo activo
  clearActiveMode();

  // Determinar tipo de registro
  const isPlane = record.type === "plane" || record.typeLabel === "Distancia aérea";
  const isVehicle = record.type === "vehicle" || record.typeLabel === "Distancia terrestre";

  // Limpia marcadores previos por si existieran
  if (markerA) { map.removeLayer(markerA); markerA = null; }
  if (markerB) { map.removeLayer(markerB); markerB = null; }
  if (routingControl) { map.removeControl(routingControl); routingControl = null; }
  if (_polyline) { map.removeLayer(_polyline); _polyline = null; }

  // Preparar puntos a partir de los waypoints guardados o los puntos A y B
  const wps = Array.isArray(record.waypoints) && record.waypoints.length ? record.waypoints : (record.pointA && record.pointB ? [record.pointA, record.pointB] : []);
  _pointA = wps[0] || null;
  _pointB = wps[wps.length - 1] || null;

  if (isPlane && wps.length >= 2) {
    // crear marcadores para los endpoints
    markerA = L.marker(_pointA).addTo(map);
    markerB = L.marker(_pointB).addTo(map);
    // crear polilínea directa entre los puntos A y B
    _polyline = L.polyline([_pointA, _pointB], { color: "red" }).addTo(map);
    map.fitBounds(_polyline.getBounds(), { padding: [50, 50] });
  } else if (isVehicle && wps.length >= 2) {
    // crear marcadores para todos los waypoints y registrarlos para poder limpiarlos
    try { if (!window._routeMarkers) window._routeMarkers = []; } catch (e) { window._routeMarkers = []; }
    try { if (!window._routeWaypoints) window._routeWaypoints = []; } catch (e) { window._routeWaypoints = []; }
    // Crear marcadores y guardar waypoints
    wps.forEach((wp) => {
      try {
        const m = L.marker(wp).addTo(map);
        window._routeMarkers.push(m);
      } catch (e) {}
      try { window._routeWaypoints.push({ lat: wp.lat, lng: wp.lng, name: wp.name || null }); } catch (e) {}
    });

    // Crear control de ruteo con los waypoints
    const latlngs = wps.map(w => L.latLng(w.lat, w.lng));
    // Crear el control de ruteo con opciones
    routingControl = L.Routing.control({
      waypoints: latlngs,
      language: "es",
      formatter: new L.Routing.Formatter({ language: "es" }),
      routeWhileDragging: false,
      draggableWaypoints: false,
      createMarker: () => null,
      lineOptions: { styles: [{ color: "blue", opacity: 0.6, weight: 6 }] },
      show: false,
    }).addTo(map);

    // ajustar vista al bounds de los waypoints
    try { map.fitBounds(L.latLngBounds(latlngs), { padding: [50, 50] }); } catch (e) {}
  }
}