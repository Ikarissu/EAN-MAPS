// Delegación de clic para botones de mostrar ruta y guardar
distanceList?.addEventListener("click", (e) => {
  const showBtn = e.target.closest(".show-route-button");
  if (showBtn) {
    const card = showBtn.closest(".distance-info");
    const idx = Number(card?.dataset.recordIndex);
    const record = distanceRecords[idx];
    if (record) showRecordOnMap(record);
    return;
  }
  const btn = e.target.closest(".save-button");
  if (!btn) return;
  const card = btn.closest(".distance-info");
  const idx = Number(card?.dataset.recordIndex);
  const record = distanceRecords[idx];
  if (!record) return;
  generatePdf(record);
});