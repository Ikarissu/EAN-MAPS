function showRecordOnMap(record) {
  clearActiveMode();

  const isPlane = record.type === "plane" || record.typeLabel === "Distancia aérea";
  const isVehicle = record.type === "vehicle" || record.typeLabel === "Distancia terrestre";

  // Limpia marcadores previos por si existieran
  if (markerA) { map.removeLayer(markerA); markerA = null; }
  if (markerB) { map.removeLayer(markerB); markerB = null; }
  if (routingControl) { map.removeControl(routingControl); routingControl = null; }
  if (_polyline) { map.removeLayer(_polyline); _polyline = null; }

  _pointA = record.pointA;
  _pointB = record.pointB;

  if (isPlane && _pointA && _pointB) {
    markerA = L.marker(_pointA).addTo(map);
    markerB = L.marker(_pointB).addTo(map);
    _polyline = L.polyline([_pointA, _pointB], { color: "red" }).addTo(map);
    map.fitBounds(_polyline.getBounds(), { padding: [50, 50] });
  } else if (isVehicle && _pointA && _pointB) {
    markerA = L.marker(_pointA).addTo(map);
    markerB = L.marker(_pointB).addTo(map);
    routingControl = L.Routing.control({
      waypoints: [L.latLng(_pointA.lat, _pointA.lng), L.latLng(_pointB.lat, _pointB.lng)],
      language: "es",
      formatter: new L.Routing.Formatter({ language: "es" }),
      routeWhileDragging: false,
      draggableWaypoints: false,
      createMarker: () => null,
      lineOptions: { styles: [{ color: "blue", opacity: 0.6, weight: 6 }] },
      show: false,
    }).addTo(map);
    map.fitBounds(L.latLngBounds([_pointA, _pointB]), { padding: [50, 50] });
  }
}