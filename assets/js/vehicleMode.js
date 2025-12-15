function VehiclePointAB() {
  clearActiveMode();
  mapClickListener = function (e) {
    if (!_pointA) {
      // Primer clic: Punto A
      markerA = L.marker(e.latlng).addTo(map);
      _pointA = e.latlng;
    } else if (!_pointB) {
      // Segundo clic: Punto B
      markerB = L.marker(e.latlng).addTo(map);
      _pointB = e.latlng;
      showNotification("Determinando la ruta...", 2500, "info");

      // VERIFICACIÓN ADICIONAL PARA EVITAR EL ERROR
      if (!_pointA || !_pointB) {
        showNotification(
          "Error de estado: Intente la selección de nuevo.",
          3000,
          "error"
        );
        clearActiveMode(); // Limpieza forzada
        return;
      }

      routingControl = L.Routing.control({
        // CAMBIO CLAVE: Usamos L.latLng(objeto) en lugar de propiedades separadas.
        waypoints: [L.latLng(_pointA), L.latLng(_pointB)],
        language: "es",
        formatter: new L.Routing.Formatter({ language: "es" }),
        routeWhileDragging: false,
        draggableWaypoints: false,
        createMarker: function () {
          return null;
        },
        lineOptions: {
          styles: [{ color: "blue", opacity: 0.6, weight: 6 }],
        },
        show: false,
      }).addTo(map);

      routingControl.on("routingerror", function (e) {
        // ... (Lógica de error existente) ...
        showNotification(
          "Error: No se encontró una ruta vehicular posible entre los puntos seleccionados.",
          5000,
          "error"
        );

        if (routingControl) {
          map.removeControl(routingControl);
          routingControl = null;
        }
        if (markerA) {
          map.removeLayer(markerA);
        }
        if (markerB) {
          map.removeLayer(markerB);
        }
        _pointA = null;
        _pointB = null;
        markerA = null;
        markerB = null;
      });

      routingControl.on("routesfound", function (e) {
        let route = e.routes[0];
        if (route) {
          let distance = route.summary.totalDistance / 1000;
          const offset = getSelectedTimezoneOffset();
          const startTS = Date.now();
          const endTS = startTS + (distance / 70) * 3600000;
          const tzLabel = timezoneSelect?.value || "GMT-4";
          const start_hour = formatTimeWithOffset(startTS, offset);
          const end_hour = formatTimeWithOffset(endTS, offset);

          const instructions =
            route.instructions?.map(
              (instr, idx) => `${idx + 1}. ${instr.text}`
            ) || [];

          // CAMBIO CLAVE: INCLUIR LA ESTRUCTURA DE PUNTOS PARA renderDistanceList
          distanceRecords.push({
            type: "vehicle",
            typeLabel: "Distancia terrestre",
            distance: distance.toLocaleString("es-VE", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }),
            tzLabel,
            start_hour,
            end_hour,
            createdAt: new Date().toISOString(),
            instructions,
            pointA_info: {
              name: "Origen (Mapa)",
              lat: _pointA.lat,
              lng: _pointA.lng,
            },
            pointB_info: {
              name: "Destino (Mapa)",
              lat: _pointB.lat,
              lng: _pointB.lng,
            },
            pointA: _pointA,
            pointB: _pointB,
          });
          saveDistanceRecords(distanceRecords);
          renderDistanceList();
          window.openBottomMenu?.();
        }
      });
    } else {
      // Tercer clic: Reinicio de la ruta
      // 1. LIMPIEZA DEL MODO VEHICULAR ANTERIOR
      if (routingControl) {
        map.removeControl(routingControl);
        routingControl = null;
      }
      // Eliminar los marcadores anteriores
      if (markerA) {
        map.removeLayer(markerA);
      }
      if (markerB) {
        map.removeLayer(markerB);
      }
      // 2. Reinicio de variables de punto
      _pointB = null;
      markerB = null;
      // 3. Nuevo punto A
      _pointA = e.latlng;
      markerA = L.marker(e.latlng).addTo(map);
    }
  };

  map.on("click", mapClickListener);
}
