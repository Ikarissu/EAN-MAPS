
function reverseGeocode(latlng) {
  return new Promise((resolve) => {
    // servicio Nominatim de Geocoder.org para geocodificación inversa
    const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latlng.lat}&lon=${latlng.lng}&zoom=18&addressdetails=1`;

    fetch(nominatimUrl)
      .then((response) => response.json())
      .then((data) => {
        let name = data.display_name || "Ubicación desconocida";

        if (data.address && data.address.road) {
          name = data.address.road;
        }

        resolve(name);
      })
      .catch((error) => {
        console.error("Error en geocodificación inversa:", error);
        resolve("Ubicación (Geocodificación fallida)");
      });
  });
}

function VehiclePointAB() {
  clearActiveMode();
  mapClickListener = async function (e) {
    if (!_pointA) {
      // Primer clic: Punto A
      markerA = L.marker(e.latlng).addTo(map);
      _pointA = e.latlng;
      _pointA.name = await reverseGeocode(_pointA);
    } else if (!_pointB) {
      // Segundo clic: Punto B
      markerB = L.marker(e.latlng).addTo(map);
      _pointB = e.latlng;
      showNotification("Determinando la ruta...", 2500, "info");

      _pointB.name = await reverseGeocode(_pointB);
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
        // se usa un objeto latlng en lugar de datos separados
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
        // Guardar las rutas alternativas (excluir la ruta principal en index 0)
        const alternatives = (e.routes || []).slice(1).map((r) => {
          const distKm = r.summary?.totalDistance
            ? r.summary.totalDistance / 1000
            : 0;
          const instr = r.instructions
            ? r.instructions.map((instr, idx) => `${idx + 1}. ${instr.text}`)
            : [];

          // Normalizar coordenadas a {lat,lng}
          const coords = (r.coordinates || []).map((c) => {
            if (c && typeof c.lat === "number" && typeof c.lng === "number") {
              return { lat: c.lat, lng: c.lng };
            }
            if (Array.isArray(c) && c.length >= 2) {
              //Se asegura que siempre las coordenadas mantengan el formato {lat,lng}
              const maybeLat = Number(c[1]);
              const maybeLng = Number(c[0]);
              return { lat: maybeLat, lng: maybeLng };
            }
            return null;
          }).filter(Boolean);

          return {
            distance: distKm,
            instructions: instr,
            coords,
            summary: r.summary || {},
          };
        });

        // Selección principal (primera ruta)
        let route = e.routes && e.routes[0] ? e.routes[0] : null;
        if (route) {
          let distance = route.summary.totalDistance / 1000;
          const offset = getSelectedTimezoneOffset();
          const startTS = Date.now();
          const endTS = startTS + (distance / 70) * 3600000;
          const tzLabel = timezoneSelect?.value || "GMT-4";
          const start_hour = formatTimeWithOffset(startTS, offset);
          const end_hour = formatTimeWithOffset(endTS, offset);

          const instructions =
            route.instructions?.map((instr, idx) => `${idx + 1}. ${instr.text}`) ||
            [];

          // Preparar la información de la ruta principal (raw) para poder restaurarla luego
          const primaryRoute = {
            distanceKm: distance,
            instructions: instructions,
            // coordenadas si están disponibles en route.coordinates
            coords: (route.coordinates || []).map(c => {
              if (c && typeof c.lat === 'number' && typeof c.lng === 'number') return {lat: c.lat, lng: c.lng};
              if (Array.isArray(c) && c.length >= 2) return { lat: Number(c[1]), lng: Number(c[0]) };
              return null;
            }).filter(Boolean),
            endTS: endTS,
            summary: route.summary || {}
          };

          // Despliegue de informacion y guardado de registro
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
            // startTS numérico para poder recalcular horas al cambiar alternativa
            startTS,
            createdAt: new Date().toISOString(),
            instructions,
            // Guardar alternativas (puede incluir la ruta principal como alternativa 0)
            alternatives,
            selectedAlternativeIndex: 0,
            primaryRoute,
            pointA_info: {
              name: _pointA.name || "Origen (Mapa)",
              lat: _pointA.lat,
              lng: _pointA.lng,
            },
            pointB_info: {
              name: _pointB.name || "Destino (Mapa)",
              lat: _pointB.lat,
              lng: _pointB.lng,
            },
            pointA: _pointA,
            pointB: _pointB,
          });
          saveDistanceRecords(distanceRecords);
          renderDistanceList({ jumpToLast: true });
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
      _pointA.name = await reverseGeocode(_pointA);
    }
  };

  map.on("click", mapClickListener);
}
