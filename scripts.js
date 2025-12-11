// Inicialización del mapa Leaflet
let map = L.map("main-map").setView([10.261, -67.588], 7);

// Capa base del mapa (OpenStreetMap)
L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map);

let airportMarkers = [];

// Función para cargar y mostrar aeropuertos en el mapa
fetch("json/yeison.json")
  .then((response) => response.json())
  .then((data) => {
    data.forEach((airport) => {
        // accede a las coordenadas correctamente desde el json
        const lat = airport.geo_point_2d.lat;
        const lon = airport.geo_point_2d.lon;

        // Nombre IATA del aeropuerto
        const iataCode = airport.iata; 
        
        // El resto de los datos (city, country, name)
        if (lat && lon) { // Verificación para evitar errores si faltan datos
          const marker = L.marker([lat, lon])
            .addTo(map)
            .bindPopup(
              `<b>${airport.name} (${iataCode})</b><br>País: ${airport.country}`
            );
          airportMarkers.push(marker);
        } else {
            console.warn("Faltan coordenadas para el aeropuerto:", airport.name);
        }
    });
  })
  // Manejo de errores en el yeison
  .catch((error) => {
    console.error("Error al cargar los datos de aeropuertos:", error);
  });



// Variables globales para el estado del modo
let routingControl = null;
let _pointA = null;
let _pointB = null;
let _polyline = null;
let markerA = null;
let markerB = null;
let mapClickListener = null;
let activeMarkerClickHandler = null;

// Botones de modo
const planeBtn = document.getElementById("plane");
const vehicleBtn = document.getElementById("vehicle");

// Zona Horaria Seleccionada
const timezoneSelect = document.getElementById("timezone");
// Reloj Que Muestra La Hora Actual Según La Zona Seleccionada
const tzClock = document.getElementById("tz-clock");

// Lista De Distancias Buscadas
const distanceList = document.getElementById("distance-list");
// Indicador De Página
const pageIndicator = document.getElementById("distance-page-indicator");
// Botón De Anterior
const prevBtn = document.getElementById("prev-distance");
// Botón De Siguiente
const nextBtn = document.getElementById("next-distance");
// Sólo Se Muestran Dos Registros Por Página
const PAGE_SIZE = 2;
// Arreglo Con Las Distancias
let distanceRecords = [];
// Página Actual De La Páginación
let currentPage = 1;

// Renderizar Lista De Distancias Buscadas
function renderDistanceList() {
      // Calcular Las Páginas Total En Base A Los Registros Existentes
      // Y La Cantidad De Registros Por Página
  const totalPages = Math.max(1, Math.ceil(distanceRecords.length / PAGE_SIZE));
  currentPage = Math.max(1, Math.min(currentPage, totalPages));
  // Actualizar Indicador De Páginas Y Habilitar/Deshabilitar Botones
  if (pageIndicator) {
    const current = distanceRecords.length ? currentPage : 0;
    pageIndicator.textContent = `Página ${current}/${totalPages}`;
  }
  if (prevBtn) prevBtn.disabled = currentPage <= 1 || !distanceRecords.length;
  if (nextBtn)
    nextBtn.disabled = currentPage >= totalPages || !distanceRecords.length;
  // Limpiar Contenedor De Distancias Si No Hay Ninguna
  if (!distanceList) return;
  distanceList.innerHTML = "";
  // Mostrar Mensaje Si No Hay Registros
  if (!distanceRecords.length) {
    distanceList.innerHTML =
      '<div class="distance-info empty-distance">Sin búsquedas registradas.</div>';
    return;
  }

    // Manejar Que Sólo Se Muestren Dos Registros Por Página
    const start = (currentPage - 1) * PAGE_SIZE;
    const items = distanceRecords.slice(start, start + PAGE_SIZE);

    // Función auxiliar para formatear la información y crear el enlace
    const createPointHTML = (pointInfo) => {
        // Formatear las coordenadas a 6 decimales para precisión y legibilidad
        const formattedCoords = `${pointInfo.lat.toFixed(6)}, ${pointInfo.lng.toFixed(6)}`;
        
        // Usamos un <a> con un atributo data-coords para el JS
        // y mostramos el nombre del aeropuerto y las coordenadas limpias.
        return `<a href="#" 
                   class="point-link" 
                   data-lat="${pointInfo.lat}" 
                   data-lng="${pointInfo.lng}">
                   ${pointInfo.name || 'Punto Desconocido'} (${formattedCoords})
                </a>`;
    };

    // Insertar Las Tarjetas Con La Información De Las Distancias Buscadas
    items.forEach((r, idx) => {
        const globalIndex = start + idx; // índice real en distanceRecords
        
        const pointA_html = createPointHTML(r.pointA_info);
        const pointB_html = createPointHTML(r.pointB_info);

        distanceList.insertAdjacentHTML(
            "beforeend",
            `<div class="distance-info" data-record-index="${globalIndex}">
                ${r.type}: ${r.distance} Kilómetros
                <div>
                    <p>Punto de salida: ${pointA_html}</p>
                    <p>Punto de llegada: ${pointB_html}</p>
                    <p>Hora de Salida (${r.tzLabel}): ${r.start_hour}</p>
                    <p>Hora de Llegada Aproximada (${r.tzLabel}): ${r.end_hour}</p>
                    <div class="save-text-and-button">
                        <p>Presione Para Guardar:</p>
                        <button class="save-button">
                            <i class="bx bx-save save-btn"></i>
                        </button>
                    </div>
                </div>
            </div>`
        );
    });
    
    // 3. Evento para realizar el zoom al punto
    attachPointClickListeners();
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

// Si Existe El Botón "Anterior", Cuando Se Presiona Decrementa Las Páginas
// Siempre Que Sean Mayor a 1, Y Actualiza El Número De La Página Actual
prevBtn?.addEventListener("click", () => {
  if (currentPage > 1) {
    currentPage--;
    renderDistanceList();
  }
});

// Si Existe El Botón "Siguiente", Cuando Se Presiona Verifica Que Sea
// La Última. Si No Lo Es, Incremente En 1 Y Actualiza El Número De La
// Página Actual
nextBtn?.addEventListener("click", () => {
  const totalPages = Math.max(1, Math.ceil(distanceRecords.length / PAGE_SIZE));
  if (currentPage < totalPages) {
    currentPage++;
    renderDistanceList();
  }
});

// Obtener La Diferencia Horaria Estándar De La Zona Seleccionada.
// Por Defecto Retorna -4 (Venezuela)
function getSelectedTimezoneOffset() {
  const tz = timezoneSelect?.value || "GMT-4";
  const match = tz.match(/GMT([+-]?)(\d+)/);
  if (!match) return -4;
  const sign = match[1] === "-" ? -1 : 1;
  return sign * parseInt(match[2], 10);
}

// Formatear La Hora Obtenida
function formatTimeWithOffset(timestampMs, offsetHours) {
  const date = new Date(timestampMs + offsetHours * 3600000);
  return date.toLocaleTimeString("es-VE", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "UTC",
    
  });
}

// Actualizar La Hora Actual Según La Zona Seleccionada
function updateSelectedTimezoneClock() {
  const offset = getSelectedTimezoneOffset();
  const tzLabel = timezoneSelect?.value || "GMT-4";
  const now = Date.now();
  const current = formatTimeWithOffset(now, offset);
  if (tzClock) {
    tzClock.textContent = `Hora Actual (${tzLabel}): ${current}`;
  }
}

// Función Para Limpiar La Opción Activa
function clearActiveMode() {
    // 1. Limpiar el listener de clic del mapa (Notificación)
    if (typeof mapClickListener !== 'undefined' && mapClickListener !== null) {
        map.off("click", mapClickListener);
        mapClickListener = null;
    }
    
    // 2. Limpiar los listeners de clic de CADA marcador (Selección)
    // 🚨 CAMBIO CLAVE: Pasamos la referencia de la función para removerla específicamente.
    if (airportMarkers && airportMarkers.length > 0 && activeMarkerClickHandler) {
        airportMarkers.forEach(marker => {
            // ¡SÓLO remueve el handler de selección! El handler del popup permanece.
            marker.off('click', activeMarkerClickHandler); 
        });
        activeMarkerClickHandler = null; // Limpiar la referencia de la función
    }

    // 3. Limpieza de capas y estado
    if (_polyline) {
        map.removeLayer(_polyline);
    }
    
    map.closePopup();
    
    _pointA = null;
    _pointB = null;
    markerA = null;
    markerB = null;
    _polyline = null;
}

//Siempre se limpia el modo activo antes de iniciar uno nuevo
function PlanePointAB() {
    clearActiveMode();

    // 1. Definimos la función de selección (Punto A/B/Reinicio) y la almacenamos.
    activeMarkerClickHandler = function (e) {
        const clickedMarker = e.target;
        const clickedLatLng = e.latlng;
        
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

            distanceRecords.push({
                type: "Distancia Aérea",
                distance: distance.toFixed(2),
                tzLabel,
                start_hour,
                end_hour,
                pointA_info: {
                name: markerA.getPopup().getContent().match(/<b>(.*?) \((.*?)\)<\/b>/)?.[1] || "Origen", // Extraer nombre del popup
                lat: _pointA.lat,
                lng: _pointA.lng,
                },
                pointB_info: {
                    name: markerB.getPopup().getContent().match(/<b>(.*?) \((.*?)\)<\/b>/)?.[1] || "Destino",
                    lat: _pointB.lat,
                    lng: _pointB.lng,
                },
              });
            renderDistanceList();
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
            className: 'selection-warning-popup',
            maxWidth: 300,
            autoPan: false
        })
        .setLatLng(e.latlng)
        .setContent("⚠️ Error de Selección:<br>Por favor, selecciona un marcador de aeropuerto.")
        .openOn(map);
    };

    // 3. Adjuntar listeners

    // Adjuntar la función ESPECÍFICA a los marcadores
    if (airportMarkers && airportMarkers.length > 0) {
        airportMarkers.forEach(marker => {
            marker.on("click", activeMarkerClickHandler);
        });
    }

    // Adjuntar listener de advertencia al mapa
    map.on("click", mapClickListener);
}

// Función para mostrar una notificación sencilla
// function showNotification(message, duration = 3000) {
//   // 1. Crear el elemento de notificación
//   const notification = document.createElement("div");
//   notification.className = "error-notification";
//   notification.textContent = message;

//   // 2. Aplicar estilos básicos
//   notification.style.cssText = `
//         position: fixed;
//         top: 20px;
//         right: 20px;
//         background-color: #ff4d4d; /* Rojo para error */
//         color: white;
//         padding: 15px;
//         border-radius: 5px;
//         box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
//         z-index: 10000;
//         opacity: 0;
//         transition: opacity 0.5s ease-in-out;
//         font-family: "ProjectFont", sans-serif;
//     `;

//   // 3. Añadir al cuerpo del documento y mostrar
//   document.body.appendChild(notification);

//   // Forzar un repaint para asegurar la transición de opacidad
//   setTimeout(() => {
//     notification.style.opacity = 1;
//   }, 10);

//   // 4. Desaparecer y remover después de la duración
//   setTimeout(() => {
//     notification.style.opacity = 0;
//     // Esperar a que la transición termine antes de remover
//     setTimeout(() => {
//       document.body.removeChild(notification);
//     }, 500);
//   }, duration);
// }

function showNotification(message, duration = 3000, type = "error") {
  const bg =
    {
      error: "#ff4d4d",
      info: "#22a4c5ff",
      success: "#2e7d32",
    }[type] || "#333";

  const notification = document.createElement("div");
  notification.className = "error-notification";
  notification.textContent = message;

  notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: ${bg};
        color: white;
        padding: 15px;
        border-radius: 5px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        z-index: 10000;
        opacity: 0;
        transition: opacity 0.5s ease-in-out;
        font-family: "ProjectFont", sans-serif;
    `;
  document.body.appendChild(notification);
  setTimeout(() => {
    notification.style.opacity = 1;
  }, 10);
  setTimeout(() => {
    notification.style.opacity = 0;
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 500);
  }, duration);
}

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
                showNotification("Error de estado: Intente la selección de nuevo.", 3000, "error");
                clearActiveMode(); // Limpieza forzada
                return;
            }

            routingControl = L.Routing.control({
                // CAMBIO CLAVE: Usamos L.latLng(objeto) en lugar de propiedades separadas.
                waypoints: [
                    L.latLng(_pointA), 
                    L.latLng(_pointB),
                ],
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
                showNotification("Error: No se encontró una ruta vehicular posible entre los puntos seleccionados. Por favor, intente con otras ubicaciones.", 5000, "error");

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
                        type: "Distancia Terrestre",
                        distance: distance.toFixed(2),
                        tzLabel,
                        start_hour,
                        end_hour,
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
                    });
                    renderDistanceList();
                }
            });
        } else {
            // Tercer clic: Reinicio de la ruta
            // ... (Lógica de limpieza existente del else, se mantiene igual) ...

            // 1. LIMPIEZA DEL MODO VEHICULAR ANTERIOR
            if (routingControl) {
                map.removeControl(routingControl);
                routingControl = null;
            }
            // Limpieza de la lista, ya que se regenerará en el próximo routesfound
            document.querySelectorAll(".distance-info").forEach((el) => el.remove());

            // 2. Limpieza de marcadores
            if (markerA) {
                map.removeLayer(markerA);
            }
            if (markerB) {
                map.removeLayer(markerB);
            }

            // 3. Reinicio de variables de punto
            _pointB = null;
            markerB = null;

            // 4. Nuevo punto A
            _pointA = e.latlng;
            markerA = L.marker(e.latlng).addTo(map);
        }
    };

    map.on("click", mapClickListener);
}

// Llamar A La Función
renderDistanceList();

// Obtener El Botón Que Limpia La Selección
const clearBtn = document.getElementById("clear-mode");

//Manejadores de los botones en la interfaz
if (planeBtn) {
  planeBtn.addEventListener("click", function () {
    PlanePointAB();
    this.classList.add("selected-mode");
    this.disabled = true;
    if (vehicleBtn) {
      vehicleBtn.classList.remove("selected-mode");
      vehicleBtn.disabled = false;
    }
  });
}

if (vehicleBtn) {
  vehicleBtn.addEventListener("click", function () {
    VehiclePointAB();
    this.classList.add("selected-mode");
    this.disabled = true;
    if (planeBtn) {
      planeBtn.classList.remove("selected-mode");
      planeBtn.disabled = false;
    }
  });
}

// Limpiar La Opción Seleccionada Si Se Presionó El Botón
if (clearBtn) {
  clearBtn.addEventListener("click", function () {
    clearActiveMode();
    planeBtn?.classList.remove("selected-mode");
    vehicleBtn?.classList.remove("selected-mode");
    if (planeBtn) planeBtn.disabled = false;
    if (vehicleBtn) vehicleBtn.disabled = false;
  });
}

// Actualizar La Hora Actual Si Cambia La Selección
timezoneSelect?.addEventListener("change", updateSelectedTimezoneClock);
updateSelectedTimezoneClock();
setInterval(updateSelectedTimezoneClock, 1000);

// Función Para Generar PDF De Las Distancias Buscadas
function generatePdf(record) {
  if (typeof pdfMake === "undefined") {
    console.error("pdfMake no está disponible");
    return;
  }

  showNotification("Generando PDF...", 1200, "info");

  const docDefinition = {
    content: [
      { text: "EAN-MAPS", style: "header" },
      {
        text: `REPORTE DE ${(record.type || "").toUpperCase()}`,
        style: "header",
      },
      {
        canvas: [
          {
            type: "line",
            x1: 0,
            y1: 0,
            x2: 515,
            y2: 0,
            lineWidth: 1,
            lineColor: "#000",
          },
        ],
        margin: [0, 4, 0, 8],
      },
      {
        table: {
          widths: ["*"],
          body: [
            [
              {
                text: "Distancia Recorrida",
                style: "label",
                color: "#fff",
                fillColor: "#396974",
                margin: [8, 6, 8, 6],
              },
            ],
            [
              {
                text: `${record.distance} Kilómetros`,
                style: "value",
                color: "#000",
                fillColor: "#f8f8f8",
                margin: [8, 6, 8, 10],
              },
            ],
            [
              {
                text: `Hora De Salida (${record.tzLabel})`,
                style: "label",
                color: "#fff",
                fillColor: "#396974",
                margin: [8, 6, 8, 6],
              },
            ],
            [
              {
                text: record.start_hour,
                style: "value",
                color: "#000",
                fillColor: "#f8f8f8",
                margin: [8, 6, 8, 10],
              },
            ],
            [
              {
                text: `Hora De Llegada Estimada (${record.tzLabel})`,
                style: "label",
                color: "#fff",
                fillColor: "#396974",
                margin: [8, 6, 8, 6],
              },
            ],
            [
              {
                text: record.end_hour,
                style: "value",
                color: "#000",
                fillColor: "#f8f8f8",
                margin: [8, 6, 8, 10],
              },
            ],
            // Instrucciones dentro del body
            ...(record.instructions?.length
              ? [
                  [
                    {
                      text: "Instrucciones De Ruta",
                      style: "label",
                      color: "#fff",
                      fillColor: "#396974",
                      margin: [8, 6, 8, 6],
                    },
                  ],
                  [
                    {
                      ul: record.instructions,
                      style: "value",
                      color: "#000",
                      fillColor: "#f8f8f8",
                      margin: [12, 6, 8, 10],
                    },
                  ],
                ]
              : []),
          ],
        },
        layout: "noBorders",
        margin: [0, 6, 0, 6],
      },
    ],
    styles: {
      header: { fontSize: 18, bold: true },
      label: { fontSize: 12, bold: true },
      value: { fontSize: 12 },
      small: { fontSize: 10, color: "#555" },
    },
    defaultStyle: { fontSize: 12 },
  };

  setTimeout(() => {
    pdfMake.createPdf(docDefinition).download(`Reporte De ${record.type}.pdf`);
  }, 1000);
}

// Delegación de clic para el botón de guardar
distanceList?.addEventListener("click", (e) => {
  const btn = e.target.closest(".save-button");
  if (!btn) return;
  const card = btn.closest(".distance-info");
  const idx = Number(card?.dataset.recordIndex);
  const record = distanceRecords[idx];
  if (!record) return;
  generatePdf(record);
});
