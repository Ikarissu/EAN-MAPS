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

function VehiclePointMulti() {
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
      createRoutingForWaypoints(window._routeWaypoints);
    } else {
      // Tercer clic o más (no usado aquí) - mantener comportamiento previo: reiniciar A si toca
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
      _pointB = null;
      markerB = null;
      _pointA = e.latlng;
      markerA = L.marker(e.latlng).addTo(map);
      _pointA.name = await reverseGeocode(_pointA);
    }
  };

  map.on("click", mapClickListener);
}

// Crea el control de ruteo para un arreglo de waypoints y maneja eventos
function createRoutingForWaypoints(waypointsArray) {
  try { showNotification("Determinando la ruta...", 1200, "info"); } catch(e){}

  if (routingControl) { map.removeControl(routingControl); routingControl = null; }
  const wpObjs = waypointsArray.map(wp => L.latLng(wp));
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

  routingControl.on("routingerror", function (e) {
    try { showNotification(
      "Error: No se encontró una ruta vehicular posible entre los puntos seleccionados.",
      5000,
      "error"
    ); } catch(e){}

    if (routingControl) { map.removeControl(routingControl); routingControl = null; }
    try { window._routeMarkers.forEach(m => map.removeLayer(m)); } catch (err) {}
    window._routeMarkers = [];
    window._routeWaypoints = [];
    _pointA = null; _pointB = null;
  });

  routingControl.on("routesfound", function (e) {
    const alternatives = (e.routes || []).slice(1).map((r) => {
      const distKm = r.summary?.totalDistance
        ? r.summary.totalDistance / 1000
        : 0;
      const instr = r.instructions
        ? r.instructions.map((instr, idx) => `${idx + 1}. ${instr.text}`)
        : [];

      const coords = (r.coordinates || []).map((c) => {
        if (c && typeof c.lat === "number" && typeof c.lng === "number") {
          return { lat: c.lat, lng: c.lng };
        }
        if (Array.isArray(c) && c.length >= 2) {
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

    let route = e.routes && e.routes[0] ? e.routes[0] : null;
    if (route) {
      let distance = route.summary.totalDistance / 1000;
      const offset = getSelectedTimezoneOffset();
      const startTS = Date.now();
      const tzLabel = timezoneSelect?.value || "GMT-4";
      const start_hour = formatTimeWithOffset(startTS, offset);
      let durationSec = 0;
      if (route.summary && (route.summary.totalTime || route.summary.total_time || route.summary.duration)) {
        durationSec = route.summary.totalTime || route.summary.total_time || route.summary.duration;
      } else {
        durationSec = Math.round((distance / 70) * 3600);
      }
      const endTS = startTS + (durationSec * 1000);
      const end_hour = formatTimeWithOffset(endTS, offset);
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

      const instructions =
        route.instructions?.map((instr, idx) => `${idx + 1}. ${instr.text}`) ||
        [];

      const primaryRoute = {
        distanceKm: distance,
        instructions: instructions,
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
        startTS,
        createdAt: new Date().toISOString(),
        instructions,
        alternatives,
        selectedAlternativeIndex: 0,
        primaryRoute,
        waypoints: Array.isArray(waypointsArray)
          ? waypointsArray.map(wp => ({ lat: wp.lat, lng: wp.lng, name: wp.name || null }))
          : [],
        pointA_info: {
          name: _pointA?.name,
          lat: _pointA?.lat,
          lng: _pointA?.lng,
        },
        pointB_info: {
          name: _pointB?.name,
          lat: _pointB?.lat,
          lng: _pointB?.lng,
        },
        pointA: _pointA,
        pointB: _pointB,
      });
      saveDistanceRecords(distanceRecords);
      renderDistanceList({ jumpToLast: true });
      window.openBottomMenu?.();
    }
  });
}

// Modo sencillo A->B: solo dos puntos
function VehiclePointAB() {
  clearActiveMode();
  if (!window._routeWaypoints) window._routeWaypoints = [];
  if (!window._routeMarkers) window._routeMarkers = [];

  mapClickListener = async function (e) {
    const latlng = e.latlng;
    // Si no hay punto A
    if (!_pointA) {
      _pointA = latlng;
      markerA = L.marker(latlng).addTo(map);
      try { _pointA.name = await reverseGeocode(_pointA); } catch (e) {}
      try { showNotification('Punto A seleccionado', 1200, 'info'); } catch(e){}
      return;
    }
    // Si hay A pero no B
    if (!_pointB) {
      _pointB = latlng;
      markerB = L.marker(latlng).addTo(map);
      try { _pointB.name = await reverseGeocode(_pointB); } catch (e) {}
      // Crear ruta entre A y B
      createRoutingForWaypoints([_pointA, _pointB]);
      return;
    }
    // Si ambos existen, reiniciar para nueva A
    try {
      if (routingControl) { map.removeControl(routingControl); routingControl = null; }
    } catch (e) {}
    try { if (markerA) map.removeLayer(markerA); } catch(e){}
    try { if (markerB) map.removeLayer(markerB); } catch(e){}
    _pointA = latlng;
    _pointB = null;
    markerA = L.marker(latlng).addTo(map);
    try { _pointA.name = await reverseGeocode(_pointA); } catch (e) {}
    try { showNotification('Nuevo Punto A seleccionado', 1200, 'info'); } catch(e){}
  };

  map.on('click', mapClickListener);
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
