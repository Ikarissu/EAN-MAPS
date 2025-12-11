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
const PAGE_SIZE = 2;
// Obtener las distancias buscadas
let distanceRecords = loadDistanceRecords();
// Página actual de la páginación
let currentPage = 1;