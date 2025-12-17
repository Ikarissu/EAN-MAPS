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

        const modeIcon =
            r.type === "plane"
                ? '<i class="bx bx-plane-alt distance-icon"></i>'
                : r.type === "vehicle"
                ? '<i class="bx bx-car distance-icon"></i>'
                : '<i class="bx bx-map distance-icon"></i>';

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
                    <div class="distance-record-options">
                        <button class="save-button">
                            <i class="bx bx-save save-btn"></i>
                        </button>
                        <button class="show-route-button">
                            <i class="bx bx-route"></i>
                        </button>
                    <button class="alt-route-button">
                      <i class="bx bx-route"></i>
                    </button>
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
    window.openBottomMenu?.();
}

  // Mantener referencia a la polilínea alternativa mostrada actualmente
  window._currentAltPolyline = window._currentAltPolyline || null;

  function attachAltRouteListeners() {
    const altBtns = document.querySelectorAll('.alt-route-button');
    altBtns.forEach(btn => {
      btn.addEventListener('click', function () {
        const recordEl = this.closest('.distance-info');
        const idx = parseInt(recordEl?.getAttribute('data-record-index') || '-1', 10);
        const record = distanceRecords[idx];

        if (!record || !record.alternatives || !record.alternatives.length) {
          showNotification('No hay rutas alternativas guardadas para este registro.', 2500, 'info');
          return;
        }

        // Toggle panel
        let panel = recordEl.querySelector('.alt-route-panel');
        if (panel) {
          try {
            if (window._currentAltPolyline) {
              map.removeLayer(window._currentAltPolyline);
              window._currentAltPolyline = null;
            }
          } catch (err) {}
          panel.remove();
          return;
        }

        panel = document.createElement('div');
        panel.className = 'alt-route-panel';
        panel.innerHTML = record.alternatives.map((alt, i) => {
          const d = Number(alt.distance || 0).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
          const secs = alt?.summary?.totalTime || alt?.summary?.total_time || alt?.summary?.duration || alt?.durationSeconds || 0;
          const durLabel = formatDuration(secs);
            // Determinar si esta alternativa está seleccionada actualmente
            const isSelected = (record.selectedAlternativeIndex || 0) === (i + 1);
            const selectLabel = isSelected ? 'Quitar' : 'Seleccionar';
            return `
            <div class="alt-route-item" data-alt-index="${i}">
              <div class="alt-route-meta">Alternativa ${i+1}: ${d} km — ${durLabel}</div>
              <div class="alt-route-actions">
                <button class="show-alt-route-button">Mostrar</button>
                <button class="select-alt-route-button">${selectLabel}</button>
              </div>
            </div>`;
        }).join('') + '<div class="alt-actions"><button class="close-alt-panel">Cerrar</button></div>';

        recordEl.appendChild(panel);

        panel.querySelector('.close-alt-panel').addEventListener('click', () => {
          try {
            if (window._currentAltPolyline) {
              map.removeLayer(window._currentAltPolyline);
              window._currentAltPolyline = null;
            }
          } catch (err) {}
          panel.remove();
        });

        panel.querySelectorAll('.show-alt-route-button').forEach(b => {
          b.addEventListener('click', function () {
            const altIdx = parseInt(this.closest('.alt-route-item').getAttribute('data-alt-index'), 10);
            showAlternativeOnMap(record, altIdx);
          });
        });

            panel.querySelectorAll('.select-alt-route-button').forEach(b => {
              b.addEventListener('click', function () {
                const altIdx = parseInt(this.closest('.alt-route-item').getAttribute('data-alt-index'), 10);
                const recordIndex = parseInt(recordEl.getAttribute('data-record-index'), 10);
                toggleAlternativeSelection(recordIndex, altIdx, panel);
              });
            });
      });
    });
  }

  function showAlternativeOnMap(record, altIdx) {
    const alt = record?.alternatives?.[altIdx];
    if (!alt || !alt.coords || !alt.coords.length) {
      showNotification('Ruta alternativa inválida.', 2000, 'error');
      return;
    }

    // Remover polilínea previa
    try {
      if (window._currentAltPolyline) {
        map.removeLayer(window._currentAltPolyline);
        window._currentAltPolyline = null;
      }
    } catch (err) {
      // noop
    }

    const latlngs = alt.coords.map(c => [c.lat, c.lng]);
    window._currentAltPolyline = L.polyline(latlngs, { color: 'orange', weight: 5, opacity: 0.85 }).addTo(map);
    map.fitBounds(window._currentAltPolyline.getBounds());
  }

  function zoomAlternative(record, altIdx) {
    const alt = record?.alternatives?.[altIdx];
    if (!alt || !alt.coords || !alt.coords.length) {
      showNotification('Ruta alternativa inválida.', 2000, 'error');
      return;
    }
    const latlngs = alt.coords.map(c => [c.lat, c.lng]);
    const bounds = L.latLngBounds(latlngs);
    map.fitBounds(bounds);
  }

function attachPointClickListeners() {
    const pointLinks = document.querySelectorAll('.point-link');
    
    pointLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault(); // Evita que la página salte al hacer clic en el <a>

            const lat = parseFloat(this.getAttribute('data-lat'));
            const lng = parseFloat(this.getAttribute('data-lng'));

            if (!isNaN(lat) && !isNaN(lng)) {
                // Mueve el mapa a las coordenadas y aplica un zoom apropiado
                map.flyTo([lat, lng], 10, {
                    duration: 1.5 // Duración de la animación en segundos
                });
                
            }
        });
    });
}

function formatDuration(sec) {
  sec = Number(sec) || 0;
  if (sec <= 0) return '—';
  const mins = Math.round(sec / 60);
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  const remMins = mins % 60;
  return remMins ? `${hours} h ${remMins} min` : `${hours} h`;
}

function toggleAlternativeSelection(recordIndex, altIdx, panel) {
  const record = distanceRecords[recordIndex];
  if (!record) return;

  const currentlySelected = record.selectedAlternativeIndex || 0; // 0 = primary
  const targetIndex = altIdx + 1; // alternatives are stored starting at 1

  if (currentlySelected === targetIndex) {
    // Deseleccionar -> restaurar ruta principal
    record.selectedAlternativeIndex = 0;
    if (record.primaryRoute) {
      record.distance = Number(record.primaryRoute.distanceKm || 0).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      record.instructions = record.primaryRoute.instructions || [];
      const offset = getSelectedTimezoneOffset();
      record.end_hour = formatTimeWithOffset(record.primaryRoute.endTS || (record.startTS || Date.now()), offset);
      record.start_hour = formatTimeWithOffset(record.startTS || Date.now(), offset);
    }
  } else {
    // Seleccionar alternativa -> actualizar distancia, instrucciones y hora
    const alt = record.alternatives?.[altIdx];
    if (!alt) return;
    record.selectedAlternativeIndex = targetIndex;
    record.distance = Number(alt.distance || 0).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    record.instructions = alt.instructions || [];
    const offset = getSelectedTimezoneOffset();
    const startTS = record.startTS || Date.now();
    record.end_hour = formatTimeWithOffset(startTS + (Number(alt.distance || 0) / 70) * 3600000, offset);
    record.start_hour = formatTimeWithOffset(startTS, offset);
  }

  // Persistir y actualizar DOM del registro
  saveDistanceRecords(distanceRecords);

  const recordEl = document.querySelector(`.distance-info[data-record-index="${recordIndex}"]`);
  if (recordEl) {
    const modeText = recordEl.querySelector('.mode-text');
    if (modeText) modeText.textContent = `${record.typeLabel || record.type}: ${record.distance} Kilómetros`;
    const endHourEl = recordEl.querySelector('.end-hour');
    if (endHourEl) endHourEl.textContent = `Hora de llegada aproximada (${record.tzLabel}): ${record.end_hour}`;
    const startHourEl = recordEl.querySelector('.start-hour');
    if (startHourEl) startHourEl.textContent = `Hora de salida (${record.tzLabel}): ${record.start_hour}`;

    // Actualizar texto de botones dentro el panel
    if (panel) {
      panel.querySelectorAll('.alt-route-item').forEach(item => {
        const i = parseInt(item.getAttribute('data-alt-index'), 10);
        const btn = item.querySelector('.select-alt-route-button');
        if (btn) btn.textContent = ((record.selectedAlternativeIndex || 0) === (i + 1)) ? 'Quitar' : 'Seleccionar';
      });
    }
  }
}