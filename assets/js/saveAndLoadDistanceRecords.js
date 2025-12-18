
// Guardar y Cargar Registros de Distancia en el Almacenamiento Local (Cookie Local)
const STORAGE_KEY = "ean-maps:distanceRecords";

// Cargar Las Distancias Almacenadas}
function loadDistanceRecords() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

// Recibir Las Distancias Buscadas Y Convertir A JSON
function saveDistanceRecords(records) {
  try {
    // Limpiar propiedades no serializables (por ejemplo campos internos que empiezan por '_')
    const sanitized = records.map((r) => {
      const copy = {};
      for (const key in r) {
        if (!Object.prototype.hasOwnProperty.call(r, key)) continue;
        // Omitir propiedades internas/transitorias que comienzan con '_'
        if (key.startsWith('_')) continue;
        const val = r[key];
        // Omitir referencias a funciones
        if (typeof val === 'function') continue;
        copy[key] = val;
      }
      return copy;
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
  } catch (err) {
    // Fallback: intentar stringify directo y capturar error
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(records)); } catch (e) { console.error('Error saving distanceRecords', e); }
  }
}