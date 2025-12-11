// Botones de modo
const planeBtn = document.getElementById("plane");
const vehicleBtn = document.getElementById("vehicle");

// Zona horaria seleccionada
const timezoneSelect = document.getElementById("timezone");
// Reloj que muestra la hora actual según la zona seleccionada
const tzClock = document.getElementById("tz-clock");

// Lista de distancias buscadas
const distanceList = document.getElementById("distance-list");
// Indicador de página
const pageIndicator = document.getElementById("distance-page-indicator");
// Botón de "Anterior"
const prevBtn = document.getElementById("prev-distance");
// Botón de "Siguiente"
const nextBtn = document.getElementById("next-distance");
// Mostrar dos registros por página
let PAGE_SIZE = getPageSizeByWidth();
// Obtener las distancias buscadas
let distanceRecords = loadDistanceRecords();
// Página actual de la páginación
let currentPage = 1;

// Calcular PAGE_SIZE según resolución
function getPageSizeByWidth() {
  const w = window.innerWidth;
  if (w < 1400) return 1;
}

// Recalcula al redimensionar y re-renderiza si cambia
window.addEventListener('resize', () => {
  const newSize = getPageSizeByWidth();
  if (newSize !== PAGE_SIZE) {
    PAGE_SIZE = newSize;
    renderDistanceList();
  }
});