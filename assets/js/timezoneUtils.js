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
    tzClock.textContent = `Hora actual (${tzLabel}): ${current}`;
  }
}