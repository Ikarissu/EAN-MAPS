// Control para las acciones de ruta en modo terrestre (nueva ruta sin salir del modo)
(function(){
  function init(){
    const btn = document.getElementById('new-route-btn');
    if (!btn) return;
    btn.addEventListener('click', function(){
      if (typeof resetVehicleRouteKeepMode === 'function') {
        resetVehicleRouteKeepMode();
      } else {
        try { showNotification('Función no disponible', 2000, 'error'); } catch(e){ alert('Función no disponible'); }
      }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
