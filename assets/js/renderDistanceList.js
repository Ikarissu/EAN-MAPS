// Renderizar lista de distancias buscadas
function renderDistanceList(opts = {}) {
  const { jumpToLast = false } = opts;

  // Calcular el total de páginas en base a los registros existentes
  const totalPages = Math.max(1, Math.ceil(distanceRecords.length / PAGE_SIZE));
  
  // Solo saltar a la última página cuando se solicite explícitamente
  if (jumpToLast || !currentPage) {
    currentPage = totalPages;
  } else {
    currentPage = Math.max(1, Math.min(currentPage, totalPages));
  }

  // Actualizar indicador de páginas y habilitar/deshabilitar botones
  if (pageIndicator) {
    const current = distanceRecords.length ? currentPage : 0;
    pageIndicator.textContent = `Página ${current}/${totalPages}`;
  }
  if (prevBtn) prevBtn.disabled = currentPage <= 1 || !distanceRecords.length;
  if (nextBtn)
    nextBtn.disabled = currentPage >= totalPages || !distanceRecords.length;

  // Limpiar contenedor de distancias si no hay ninguna
  if (!distanceList) return;
  distanceList.innerHTML = "";
  
  // Mostrar mensaje si no hay registros
  if (!distanceRecords.length) {
    distanceList.innerHTML =
      '<div class="distance-info empty-distance">Sin búsquedas registradas.</div>';
    return;
  }

    // Manejar que sólo se muestren dos registros por página
    const start = (currentPage - 1) * PAGE_SIZE;
    const items = distanceRecords.slice(start, start + PAGE_SIZE);

    // Función auxiliar para formatear la información y crear el enlace
    const createPointHTML = (pointInfo) => {
        // Formatear las coordenadas a 6 decimales para precisión y legibilidad
        const formattedCoords = `${pointInfo.lat.toFixed(6)}, ${pointInfo.lng.toFixed(6)}`;
        
        // Usar un <a> con un atributo data-coords para el JS
        // y mostrar el nombre del aeropuerto y las coordenadas limpias.
        return `<a href="#" 
                   class="point-link" 
                   data-lat="${pointInfo.lat}" 
                   data-lng="${pointInfo.lng}">
                   ${pointInfo.name || 'Punto Desconocido'} (${formattedCoords})
                </a>`;
    };

    // Insertar las tarjetas con la información de las distancias buscadas
    items.forEach((r, idx) => {
        const globalIndex = start + idx; // índice real en distanceRecords
        
        const pointA_html = createPointHTML(r.pointA_info);
        const pointB_html = createPointHTML(r.pointB_info);

        // Botón de ruta alternativa solo si es distancia terrestre
        const altRouteButtonHTML = (r.type === "vehicle")
            ? `
                <button class="alt-route-button" data-alt-index="0" title="Mostrar ruta alternativa">
                    <i class='bx bx-path'></i>
                </button>
              `
            : '';

        // Icono según el tipo de distancia
        const modeIcon =
            r.type === "plane"
                ? '<i class="bx bx-plane-alt distance-icon"></i>'
                : r.type === "vehicle"
                ? '<i class="bx bx-car distance-icon"></i>'
                : '<i class="bx bx-map distance-icon"></i>';

        // Insertar el HTML de la tarjeta
        distanceList.insertAdjacentHTML(
            "beforeend",
            `<div class="distance-info" data-record-index="${globalIndex}">
                <div class="mode-header">
                  <span class="mode-icon">${modeIcon}</span>
                  <span class="mode-text">${r.typeLabel || r.type}: ${r.distance} Kilómetros</span>
                </div>
                <div>
                  <p>Punto de salida: ${pointA_html}</p>
                  <p>Punto de llegada: ${pointB_html}</p>
                  <p class="start-hour">Hora de salida (${r.tzLabel}): ${r.start_hour}</p>
                  <p class="end-hour">Hora de llegada aproximada (${r.tzLabel}): ${r.end_hour}</p>
                  <p class="dist-hour">Duración estimada: ${r.dist_hour}</p>
                    <div class="distance-record-options">
                        <button class="save-button">
                            <i class="bx bx-save save-btn"></i>
                        </button>
                        <button class="show-route-button">
                            <i class="bx bx-route"></i>
                        </button>
                        ${altRouteButtonHTML}
                    </div>
                </div>
            </div>`
        );
    });
    
    // 3. Evento para realizar el zoom al punto
    attachPointClickListeners();

    // 4. Eventos para mostrar rutas alternativas
    attachAltRouteListeners();

    // Abrir el menú inferior al terminar de renderizar
  // Mostrar ruta principal
  attachPrimaryRouteListeners();

  // Abrir el menú derecho (inferior en móviles) al terminar de renderizar
  window.openBottomMenu?.();
}

// Mantener referencia a la polilínea alternativa mostrada actualmente
window._currentAltPolyline = window._currentAltPolyline || null;
// Mantener referencia a la polilínea principal mostrada actualmente
window._currentPrimaryPolyline = window._currentPrimaryPolyline || null;

// Limpiar polilíneas dibujadas
function clearPolylines() {
  try {
    // Eliminar la polilínea alternativa si existe
    if (window._currentAltPolyline) {
      map.removeLayer(window._currentAltPolyline);
      window._currentAltPolyline = null;
    }
    // Eliminar la polilínea principal si existe
    if (window._currentPrimaryPolyline) {
      map.removeLayer(window._currentPrimaryPolyline);
      window._currentPrimaryPolyline = null;
    }
  } catch (err) {}
}

// Actualizar el DOM de la información de las distancias
function updateRecordDOM(recordIndex) {
  const record = distanceRecords[recordIndex];
  const recordEl = document.querySelector(
    `.distance-info[data-record-index="${recordIndex}"]`
  );
  if (!record || !recordEl) return;
  // Actualizar los campos relevantes
  const modeText = recordEl.querySelector(".mode-text");

  if (modeText)
    modeText.textContent = `${record.typeLabel || record.type}: ${
      record.distance
    } Kilómetros`;
  const endHourEl = recordEl.querySelector(".end-hour");
  if (endHourEl)
    endHourEl.textContent = `Hora de llegada aproximada (${record.tzLabel}): ${record.end_hour}`;
  const startHourEl = recordEl.querySelector(".start-hour");
  if (startHourEl)
    startHourEl.textContent = `Hora de salida (${record.tzLabel}): ${record.start_hour}`;
}

// Dibujar la ruta principal al detectar click
function attachPrimaryRouteListeners() {
  const mainBtns = document.querySelectorAll(".show-route-button");
  mainBtns.forEach((btn) => {
    btn.addEventListener("click", function () {
      const recordEl = this.closest(".distance-info");
      const recordIndex = parseInt(
        recordEl?.getAttribute("data-record-index") || "-1",
        10
      );
      setRecordToPrimary(recordIndex);
      const record = distanceRecords[recordIndex];
      drawPrimaryRouteOnMap(record);
    });
  });
}

// Dibujar la ruta alternativa al detectar click
function attachAltRouteListeners() {
  const altBtns = document.querySelectorAll(".alt-route-button");
  altBtns.forEach((btn) => {
    btn.addEventListener("click", function () {
      const recordEl = this.closest(".distance-info");
      const recordIndex = parseInt(
        recordEl?.getAttribute("data-record-index") || "-1",
        10
      );
      const altIdx = parseInt(this.getAttribute("data-alt-index") || "0", 10);
      const record = distanceRecords[recordIndex];

      if (!record || !record.alternatives || !record.alternatives.length) {
        showNotification(
          "No hay rutas alternativas guardadas para este registro.",
          2500,
          "info"
        );
        return;
      }

      setRecordToAlternative(recordIndex, altIdx);
      showAlternativeOnMap(record, altIdx);
    });
  });
}

// Mostrar el registro principal
function setRecordToPrimary(recordIndex) {
  const record = distanceRecords[recordIndex];
  if (!record) return;

  record.selectedAlternativeIndex = 0;
  if (record.primaryRoute) {
    record.distance = Number(
      record.primaryRoute.distanceKm || 0
    ).toLocaleString("es-VE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    record.instructions = record.primaryRoute.instructions || [];
    const offset = getSelectedTimezoneOffset();
    const startTS = record.startTS || Date.now();
    const endTS = record.primaryRoute.endTS || startTS;
    record.end_hour = formatTimeWithOffset(endTS, offset);
    record.start_hour = formatTimeWithOffset(startTS, offset);
    // Restaurar duración si está disponible en primaryRoute, o calcularla
    if (record.primaryRoute && (record.primaryRoute.dist_hour || record.primaryRoute.durationSec)) {
      record.dist_hour = record.primaryRoute.dist_hour || formatDuration(record.primaryRoute.durationSec || 0);
    } else {
      // fallback: aproximar por distancia
      const approxSec = Math.round((Number(record.primaryRoute?.distanceKm || 0) / 70) * 3600);
      record.dist_hour = formatDuration(approxSec);
    }
  }

  saveDistanceRecords(distanceRecords);
  updateRecordDOM(recordIndex);
}

// Mostrar el registro alternativo
function setRecordToAlternative(recordIndex, altIdx) {
  const record = distanceRecords[recordIndex];
  const alt = record?.alternatives?.[altIdx];
  if (!record || !alt) {
    showNotification("Ruta alternativa inválida.", 2000, "error");
    return;
  }

  record.selectedAlternativeIndex = altIdx + 1;
  record.distance = Number(alt.distance || 0).toLocaleString("es-VE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  record.instructions = alt.instructions || [];
  const offset = getSelectedTimezoneOffset();
  const startTS = record.startTS || Date.now();
  // Preferir duración real de la alternativa (summary) si está disponible
  const altDurationSec = Number(
    alt?.summary?.totalTime || alt?.summary?.total_time || alt?.summary?.duration || alt?.durationSeconds || 0
  ) || Math.round((Number(alt.distance || 0) / 70) * 3600);
  record.end_hour = formatTimeWithOffset(startTS + altDurationSec * 1000, offset);
  record.start_hour = formatTimeWithOffset(startTS, offset);
  record.dist_hour = formatDuration(altDurationSec);

  saveDistanceRecords(distanceRecords);
  updateRecordDOM(recordIndex);
}

// Mostrar en el mapa la ruta principal obtenida
function drawPrimaryRouteOnMap(record) {
  const coords = record?.primaryRoute?.coords;
  if (!coords || !coords.length) {
    showNotification(
      "No hay coordenadas almacenadas de la ruta principal.",
      2500,
      "info"
    );
    return;
  }

  clearPolylines();
  // Obtiene lat,long y dibuja la linea en el mapa
  const latlngs = coords.map((c) => [c.lat, c.lng]);
  window._currentPrimaryPolyline = L.polyline(latlngs, {
    color: "blue",
    weight: 5,
    opacity: 0.8,
  }).addTo(map);
  map.fitBounds(window._currentPrimaryPolyline.getBounds());
}

// Mostrar en el mapa la ruta alternativa obtenida
function showAlternativeOnMap(record, altIdx) {
  const alt = record?.alternatives?.[altIdx];
  if (!alt || !alt.coords || !alt.coords.length) {
    showNotification("Ruta alternativa inválida.", 2000, "error");
    return;
  }

  clearPolylines();

  try {
    if (routingControl) {
      map.removeControl(routingControl);
      routingControl = null;
    }
    if (typeof _polyline !== "undefined" && _polyline) {
      map.removeLayer(_polyline);
      _polyline = null;
    }
  } catch (_) {}

  const latlngs = alt.coords.map((c) => [c.lat, c.lng]);
  window._currentAltPolyline = L.polyline(latlngs, {
    color: "orange",
    weight: 5,
    opacity: 0.85,
  }).addTo(map);
  map.fitBounds(window._currentAltPolyline.getBounds());
}

// Añadir eventos a los enlaces de puntos para centrar y hacer zoom en el mapa al hacer click
function attachPointClickListeners() {
  const pointLinks = document.querySelectorAll(".point-link");

  pointLinks.forEach((link) => {
    link.addEventListener("click", function (e) {
      e.preventDefault(); // Evita que la página salte al hacer clic en el <a>

      const lat = parseFloat(this.getAttribute("data-lat"));
      const lng = parseFloat(this.getAttribute("data-lng"));

      if (!isNaN(lat) && !isNaN(lng)) {
        // Mueve el mapa a las coordenadas y aplica un zoom apropiado
        map.flyTo([lat, lng], 10, {
          duration: 1.5, // Duración de la animación en segundos
        });
      }
    });
  });
}

// Formatear el tiempo recibido para mostrar la hora actual
function formatDuration(sec) {
  sec = Number(sec) || 0;
  if (sec <= 0) return "—";
  const mins = Math.round(sec / 60);
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  const remMins = mins % 60;
  return remMins ? `${hours} h ${remMins} min` : `${hours} h`;
}