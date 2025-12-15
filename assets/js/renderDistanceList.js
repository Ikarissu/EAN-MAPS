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
                    <p>Hora de salida (${r.tzLabel}): ${r.start_hour}</p>
                    <p>Hora de llegada aproximada (${r.tzLabel}): ${r.end_hour}</p>
                    <div class="distance-record-options">
                        <button class="save-button">
                            <i class="bx bx-save save-btn"></i>
                        </button>
                        <button class="show-route-button">
                            <i class="bx bx-route"></i>
                        </button>
                    </div>
                </div>
            </div>`
        );
    });
    
    // 3. Evento para realizar el zoom al punto
    attachPointClickListeners();

    // Abrir el menú inferior al terminar de renderizar
    window.openBottomMenu?.();
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