// Funcion de geocodificación inversa para obtener nombre de ubicación a partir de coordenadas
function reverseGeocode(latlng) {
  return new Promise((resolve) => {
    // servicio Nominatim de Geocoder.org para geocodificación inversa
    const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latlng.lat}&lon=${latlng.lng}&zoom=18&addressdetails=1`;

    // Realizar la solicitud fetch
    fetch(nominatimUrl)
      .then((response) => response.json())
      .then((data) => {
        // Extraer un nombre legible de la respuesta
        let name = data.display_name || "Ubicación desconocida";

        // Intentar obtener un nombre más específico si está disponible
        if (data.address && data.address.road) {
          name = data.address.road;
        }

        resolve(name);
      })
      // Manejo de errores
      .catch((error) => {
        console.error("Error en geocodificación inversa:", error);
        resolve("Ubicación (Geocodificación fallida)");
      });
  });
}

function VehiclePointAB() {
  clearActiveMode();
  // Usar lista de waypoints y marcadores para permitir 2 o más puntos
  if (!window._routeWaypoints) window._routeWaypoints = [];
  if (!window._routeMarkers) window._routeMarkers = [];

  mapClickListener = async function (e) {
    // Añadir nuevo waypoint
    const latlng = e.latlng;
    // crear marcador y almacenar
    try {
      const m = L.marker(latlng).addTo(map);
      window._routeMarkers.push(m);
    } catch (err) {}
    window._routeWaypoints.push(latlng);
    // intentar obtener nombre del punto (opcional)
    try { latlng.name = await reverseGeocode(latlng); } catch (err) {}

    // Mantener compatibilidad: punto A = primer waypoint, punto B = último
    _pointA = window._routeWaypoints[0] || null;
    _pointB = window._routeWaypoints[window._routeWaypoints.length - 1] || null;

    // Si hay al menos 2 waypoints, calcular ruta
    if (window._routeWaypoints.length >= 2) {
      showNotification("Determinando la ruta...", 1200, "info");

      // remover control anterior si existe
      if (routingControl) { map.removeControl(routingControl); routingControl = null; }
  // Crear el control de ruteo con los waypoints actuales
      const wpObjs = window._routeWaypoints.map(wp => L.latLng(wp));
      // Crear el control de ruteo con opciones especificas como idioma y estilo
      routingControl = L.Routing.control({
        waypoints: wpObjs,
        language: "es",
        formatter: new L.Routing.Formatter({ language: "es" }),
        createMarker: function () { return null; },
        lineOptions: {
          styles: [{ color: "blue", opacity: 0.6, weight: 6 }],
        },
        show: false,
      }).addTo(map);

      // Manejo de errores y rutas encontradas
      routingControl.on("routingerror", function (e) {
        showNotification(
          "Error: No se encontró una ruta vehicular posible entre los puntos seleccionados.",
          5000,
          "error"
        );

        if (routingControl) { map.removeControl(routingControl); routingControl = null; }
        // quitar marcadores de la ruta
        try { window._routeMarkers.forEach(m => map.removeLayer(m)); } catch (err) {}
        window._routeMarkers = [];
        window._routeWaypoints = [];
        _pointA = null; _pointB = null;
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

          // Retornar objeto de alternativa
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
          const tzLabel = timezoneSelect?.value || "GMT-4";
          const start_hour = formatTimeWithOffset(startTS, offset);
          // calcular duración en segundos usando summary si existe, o por aproximación (velocidad 70 km/h)
          let durationSec = 0;
          if (route.summary && (route.summary.totalTime || route.summary.total_time || route.summary.duration)) {
            durationSec = route.summary.totalTime || route.summary.total_time || route.summary.duration;
          } else {
            durationSec = Math.round((distance / 70) * 3600);
          }
          // calcular endTS a partir de durationSec para que end_hour y dist_hour sean consistentes
          const endTS = startTS + (durationSec * 1000);
          const end_hour = formatTimeWithOffset(endTS, offset);
          // Calcular la diferencia horaria de la distancia
          const dist_hour = (function(sec){
            try {
              const s = Number(sec) || 0;
              if (s <= 0) return '—';
              const mins = Math.round(s / 60);
              if (mins < 60) return `${mins} min`;
              const hours = Math.floor(mins / 60);
              const remMins = mins % 60;
              return remMins ? `${hours} h ${remMins} min` : `${hours} h`;
            } catch (e) { return '—'; }
          })(durationSec);

          // Extraer instrucciones de la ruta principal
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
            durationSec: durationSec,
            dist_hour: dist_hour,
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
            dist_hour,
            // startTS numérico para poder recalcular horas al cambiar alternativa
            startTS,
            createdAt: new Date().toISOString(),
            instructions,
            // Guardar alternativas (puede incluir la ruta principal como alternativa 0)
            alternatives,
            selectedAlternativeIndex: 0,
            primaryRoute,
            // Guardar los waypoints utilizados para crear la ruta (normalizados)
            waypoints: Array.isArray(window._routeWaypoints)
              ? window._routeWaypoints.map(wp => ({ lat: wp.lat, lng: wp.lng, name: wp.name || null }))
              : [],
            // Información de puntos A y B para compatibilidad
            pointA_info: {
              name: _pointA.name,
              lat: _pointA.lat,
              lng: _pointA.lng,
            },
            pointB_info: {
              name: _pointB.name,
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

  // Resetea la ruta actual pero mantiene el modo activo para crear una nueva
  function resetVehicleRouteKeepMode() {
    // Borra ruta/controles
    try {
      if (routingControl) {
        map.removeControl(routingControl);
        routingControl = null;
      }
    } catch (e) {}
    // Eliminar los marcadores anteriores
    try {
      if (window._routeMarkers && window._routeMarkers.length) {
        window._routeMarkers.forEach(m => { try { map.removeLayer(m); } catch (e) {} });
        window._routeMarkers = [];
      }
    } catch (e) {}
    // Reinicio de variables de punto y waypoints
    try { window._routeWaypoints = []; } catch (e) {}

    _pointA = null;
    _pointB = null;
    markerA = null;
    markerB = null;

    try { if (typeof removeDrawnRoutes === 'function') removeDrawnRoutes(); } catch (e) {}

    try { showNotification('Nueva ruta: listo para seleccionar puntos', 2000, 'success'); } catch (e) { console.log('Nueva ruta iniciada'); }
  }
