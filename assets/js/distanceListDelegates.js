// Delegación de clic para botones de mostrar ruta y guardar
distanceList?.addEventListener("click", (e) => {
  // Mostrar ruta en el mapa
  const showBtn = e.target.closest(".show-route-button");
  // Si se hizo clic en el botón de mostrar ruta
  if (showBtn) {
    // Obtener el registro correspondiente
    const card = showBtn.closest(".distance-info");
    const idx = Number(card?.dataset.recordIndex);
    const record = distanceRecords[idx];
    // Mostrar la ruta en el mapa
    if (record) showRecordOnMap(record);
    return;
  }
  // Guardar como PDF
  const btn = e.target.closest(".save-button");
  // Si se hizo clic en el botón de guardar
  if (!btn) return;
  // Obtener el registro correspondiente
  const card = btn.closest(".distance-info");
  const idx = Number(card?.dataset.recordIndex);
  const record = distanceRecords[idx];
  // Generar el PDF
  if (!record) return;
  generatePdf(record);
});