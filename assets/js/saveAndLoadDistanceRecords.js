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
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}