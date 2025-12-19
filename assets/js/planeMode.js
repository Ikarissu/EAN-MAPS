//Siempre se limpia el modo activo antes de iniciar uno nuevo
function PlanePointAB() {
  clearActiveMode();
  window.isModeActive = true;
  // Cerrar menús usando setExpanded para activar la bandera correctamente
  try {
    const leftMenuEl = document.getElementById("left-menu");
    const rightMenuEl = document.getElementById("right-menu");
    if (window.setExpanded) {
      if (leftMenuEl) window.setExpanded(leftMenuEl, false);
      if (rightMenuEl) window.setExpanded(rightMenuEl, false);
    } else {
      if (leftMenuEl) {
        leftMenuEl.classList.remove("is-open");
        leftMenuEl.setAttribute("aria-expanded", "false");
      }
      if (rightMenuEl) {
        rightMenuEl.classList.remove("is-open");
        rightMenuEl.setAttribute("aria-expanded", "false");
      }
    }
  } catch (err) {
    console.error("PlanePointAB: Error cerrando menús", err);
  }

  // 1. Definimos la función de selección (Punto A/B/Reinicio) y la almacenamos.
  activeMarkerClickHandler = function (e) {
    const clickedMarker = e.target;
    const clickedLatLng = e.latlng;

    // Cerrar ambos menús al seleccionar un punto en el mapa
  try {
    const leftMenuEl = document.getElementById("left-menu");
    const rightMenuEl = document.getElementById("right-menu");
    if (window.setExpanded) {
      if (leftMenuEl) window.setExpanded(leftMenuEl, false);
      if (rightMenuEl) window.setExpanded(rightMenuEl, false);
    } else {
      if (leftMenuEl) {
        leftMenuEl.classList.remove("is-open");
        leftMenuEl.setAttribute("aria-expanded", "false");
      }
      if (rightMenuEl) {
        rightMenuEl.classList.remove("is-open");
        rightMenuEl.setAttribute("aria-expanded", "false");
      }
    }
    if (window.updateDesktopTabPositions) window.updateDesktopTabPositions();
  } catch (err) {}

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
      // Para modo avión se estima duración por velocidad de crucero aproximada (800 km/h)
      const durationSec = Math.round((distance / 800) * 3600);
      //Calcula la diferencia horaria de la distancia
      const dist_hour = (function (sec) {
        try {
          const s = Number(sec) || 0;
          if (s <= 0) return "—";
          const mins = Math.round(s / 60);
          if (mins < 60) return `${mins} min`;
          const hours = Math.floor(mins / 60);
          const remMins = mins % 60;
          return remMins ? `${hours} h ${remMins} min` : `${hours} h`;
        } catch (e) {
          return "—";
        }
      })(durationSec);

      // Guardar registro en el historial
      distanceRecords.push({
        type: "plane",
        typeLabel: "Distancia aérea",
        distance: distance.toLocaleString("es-VE", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
        tzLabel,
        start_hour,
        end_hour,
        dist_hour,
        // guardar startTS y durationSec para cálculos y restauración
        startTS,
        durationSec,
        createdAt: new Date().toISOString(),
        // Información de puntos A y B
        pointA_info: {
          name:
            markerA
              .getPopup()
              .getContent()
              .match(/<b>(.*?) \((.*?)\)<\/b>/)?.[1] || "Origen", // Extraer nombre del popup
          lat: _pointA.lat,
          lng: _pointA.lng,
        },
        pointB_info: {
          name:
            markerB
              .getPopup()
              .getContent()
              .match(/<b>(.*?) \((.*?)\)<\/b>/)?.[1] || "Destino",
          lat: _pointB.lat,
          lng: _pointB.lng,
        },
        pointA: _pointA,
        pointB: _pointB,
      });
      // Guardar en almacenamiento y refrescar lista
      saveDistanceRecords(distanceRecords);
      renderDistanceList({ jumpToLast: true });
      window.openBottomMenu?.();
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
      className: "selection-warning-popup",
      maxWidth: 300,
      autoPan: false,
    })
      .setLatLng(e.latlng)
      .setContent(
        "⚠️ Error de Selección:<br>Por favor, selecciona un marcador de aeropuerto."
      )
      .openOn(map);
  };

  // 3. Adjuntar listeners

  // Adjuntar la función ESPECÍFICA a los marcadores
  if (airportMarkers && airportMarkers.length > 0) {
    airportMarkers.forEach((marker) => {
      marker.on("click", activeMarkerClickHandler);
    });
  }

  // Adjuntar listener de advertencia al mapa
  map.on("click", mapClickListener);
}
