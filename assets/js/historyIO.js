// Exportar / Importar historial en JSON
(function(){
  const notify = (msg, ms = 2000, type = 'info') => {
    if (typeof showNotification === 'function') return showNotification(msg, ms, type);
    try { console.log(type.toUpperCase(), msg); } catch (e) {}
  };

  function isValidHistory(obj) {
    // Validación mínima: debe ser un array. Se puede ampliar con checks más estrictos.
    return Array.isArray(obj);
  }

  function init() {
    const exportBtn = document.getElementById('export-history-btn');
    const importBtn = document.getElementById('import-history-btn');
    const fileInput = document.getElementById('import-history-file');
    if (!exportBtn || !importBtn || !fileInput) return;

    exportBtn.addEventListener('click', () => {
      try {
        const data = (typeof loadDistanceRecords === 'function') ? loadDistanceRecords() : (window.distanceRecords || []);
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'ean-maps-history.json';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        notify('Historial exportado', 2000, 'success');
      } catch (err) {
        console.error(err);
        notify('Error exportando historial', 3000, 'error');
      }
    });

    importBtn.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', async (e) => {
      const f = e.target.files && e.target.files[0];
      if (!f) return;
      try {
        const text = await f.text();
        let parsed;
        try { parsed = JSON.parse(text); } catch (err) {
          alert('Archivo inválido: no se pudo parsear JSON.');
          return;
        }
        if (!isValidHistory(parsed)) {
          alert('Archivo inválido: se esperaba un array JSON con el historial.');
          return;
        }

        const ok = confirm('Importar este archivo reemplazará el historial actual. ¿Deseas continuar?');
        if (!ok) return;

        // 1) Limpiar historial anterior en memoria y en almacenamiento
        try {
          if (typeof clearActiveMode === 'function') clearActiveMode({ keepPoints: false });
        } catch (err) {}
        try {
          if (typeof removeDrawnRoutes === 'function') removeDrawnRoutes();
        } catch (err) {}

        try {
          if (typeof saveDistanceRecords === 'function') {
            // Primero limpiar
            saveDistanceRecords([]);
          } else {
            localStorage.removeItem('ean-maps:distanceRecords');
          }
        } catch (err) { console.error(err); }

        // 2) Guardar nuevo historial importado
        try {
          if (typeof saveDistanceRecords === 'function') {
            saveDistanceRecords(parsed);
          } else {
            localStorage.setItem('ean-maps:distanceRecords', JSON.stringify(parsed));
          }
        } catch (err) { console.error(err); }

        // actualizar variable en memoria si existe
        try { window.distanceRecords = (typeof loadDistanceRecords === 'function') ? loadDistanceRecords() : parsed; } catch (err) { window.distanceRecords = parsed; }

        // refrescar UI
        if (typeof renderDistanceList === 'function') renderDistanceList({ jumpToLast: true });
        window.location.reload();
      } catch (err) {
        console.error(err);
        alert('Error al leer el archivo. Asegúrate de seleccionar un JSON válido.');
      } finally {
        fileInput.value = '';
      }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
