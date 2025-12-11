function showRecordOnMap(record) {
  clearActiveMode();

  if (record.type === "Distancia Aérea") {
    _pointA = record.pointA;
    _pointB = record.pointB;
    if (_pointA && _pointB) {
      markerA = L.marker(_pointA).addTo(map);
      markerB = L.marker(_pointB).addTo(map);
      _polyline = L.polyline([_pointA, _pointB], { color: "red" }).addTo(map);
      map.fitBounds(_polyline.getBounds(), { padding: [50, 50] });
    }
  } else if (record.type === "Distancia Terrestre") {
    _pointA = record.pointA;
    _pointB = record.pointB;
    if (_pointA && _pointB) {
      markerA = L.marker(_pointA).addTo(map);
      markerB = L.marker(_pointB).addTo(map);
      routingControl = L.Routing.control({
        waypoints: [
          L.latLng(_pointA.lat, _pointA.lng),
          L.latLng(_pointB.lat, _pointB.lng),
        ],
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
}