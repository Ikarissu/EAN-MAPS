// Exportar / Importar historial en JSON
(function(){
    // ...existing code...
    function showModal({ title = 'Aviso', message = '', confirmText = 'Aceptar', cancelText = null }) {
      return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = 'app-modal-overlay';
        overlay.addEventListener('click', (e) => { if (e.target === overlay && cancelText) resolve(false), document.body.removeChild(overlay); });
  
        const modal = document.createElement('div');
        modal.className = 'app-modal';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
  
        const header = document.createElement('div');
        header.className = 'app-modal-header';
        header.textContent = title;
  
        const body = document.createElement('div');
        body.className = 'app-modal-body';
        body.textContent = message;
  
        const actions = document.createElement('div');
        actions.className = 'app-modal-actions';
  
        if (cancelText) {
          const cancelBtn = document.createElement('button');
          cancelBtn.className = 'modal-btn secondary';
          cancelBtn.textContent = cancelText;
          cancelBtn.addEventListener('click', () => { resolve(false); document.body.removeChild(overlay); });
          actions.appendChild(cancelBtn);
        }
  
        const okBtn = document.createElement('button');
        okBtn.className = 'modal-btn';
        okBtn.textContent = confirmText;
        okBtn.addEventListener('click', () => { resolve(true); document.body.removeChild(overlay); });
  
        overlay.addEventListener('keydown', (e) => {
          if (e.key === 'Escape' && cancelText) { resolve(false); document.body.removeChild(overlay); }
          if (e.key === 'Enter') { resolve(true); document.body.removeChild(overlay); }
        });
  
        actions.appendChild(okBtn);
        modal.appendChild(header);
        modal.appendChild(body);
        modal.appendChild(actions);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        okBtn.focus();
      });
    }
  
    const showAlertModal = (msg) => showModal({ title: 'Error', message: msg, confirmText: 'Aceptar' });
    const showConfirmModal = (msg) => showModal({ title: 'Confirmación', message: msg, confirmText: 'Importar', cancelText: 'Cancelar' });











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
          await showAlertModal('Archivo inválido: no se pudo parsear JSON.');
          return;
        }
        if (!isValidHistory(parsed)) {
          await showAlertModal('Archivo inválido: se esperaba un array JSON con el historial.');
          return;
        }

        const ok = await showConfirmModal('Importar este archivo reemplazará el historial actual. ¿Deseas continuar?');
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
        await showAlertModal('Error al leer el archivo. Asegúrate de seleccionar un JSON válido.');
      } finally {
        fileInput.value = '';
      }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
