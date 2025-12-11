// Manejo del botón "Anterior" en la paginación
prevBtn?.addEventListener("click", () => {
  if (currentPage > 1) {
    currentPage--;
    renderDistanceList();
  }
});

// Manejo del botón "Siguiente" en la paginación
nextBtn?.addEventListener("click", () => {
  const totalPages = Math.max(1, Math.ceil(distanceRecords.length / PAGE_SIZE));
  if (currentPage < totalPages) {
    currentPage++;
    renderDistanceList();
  }
});