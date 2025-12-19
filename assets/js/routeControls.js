// Control para las acciones de ruta en modo terrestre (nueva ruta sin salir del modo)
(function(){
  // Inicializa el botón de nueva ruta y lo transforma en "Terrestre - varios destinos"
  function init(){
    const btn = document.getElementById('new-route-btn');
    if (!btn) return;

    // Ajustar texto inicial
    btn.textContent = 'Varios destinos';
    btn.classList.remove('stop-route');

    // Estado de activación (multi-destinos)
    let multiActive = false;

    btn.addEventListener('click', function(){
      // Activar modo multi-destinos
      if (!multiActive) {
        multiActive = true;
        btn.textContent = 'Detener';
        btn.classList.add('stop-route');
        try {
          // Limpiar cualquier ruta anterior y preparar modo multi
          if (typeof resetVehicleRouteKeepMode === 'function') resetVehicleRouteKeepMode();
          if (typeof VehiclePointMulti === 'function') VehiclePointMulti();
          try { showNotification('Modo: Terrestre - varios destinos activado', 2000, 'success'); } catch(e){}
        } catch (e) { console.error(e); }
      } else {
        // Detener modo multi por completo (no volver a A->B)
        multiActive = false;
        btn.textContent = 'Terrestre - varios destinos';
        btn.classList.remove('stop-route');
        try {
          // Limpiar listeners, rutas y marcadores
          if (typeof clearActiveMode === 'function') clearActiveMode();
          else if (typeof resetVehicleRouteKeepMode === 'function') resetVehicleRouteKeepMode();
          // Asegurar que el botón de 'Terrestre' pueda reactivarse manualmente
          try { if (vehicleBtn) { vehicleBtn.classList.remove('selected-mode'); vehicleBtn.disabled = false; } } catch(e){}
          try { showNotification('Modo multi-destinos detenido', 1500, 'info'); } catch(e){}
        } catch (e) { console.error(e); }
      }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
