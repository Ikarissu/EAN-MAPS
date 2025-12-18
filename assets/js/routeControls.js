// Control para las acciones de ruta en modo terrestre (nueva ruta sin salir del modo)
(function(){
  // Inicializa el botón de nueva ruta
  function init(){
    const btn = document.getElementById('new-route-btn');
    // Verificar existencia del botón
    if (!btn) return;
    // Manejo de clic en el botón
    btn.addEventListener('click', function(){
      if (typeof resetVehicleRouteKeepMode === 'function') {
        // Restablecer la ruta pero mantener el modo activo
        resetVehicleRouteKeepMode();
      } else {
        try { showNotification('Función no disponible', 2000, 'error'); } catch(e){ alert('Función no disponible'); }
      }
    });
  }
  // Inicializar al cargar el DOM
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
