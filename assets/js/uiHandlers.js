// Llamar a la función
renderDistanceList();

// Obtener el botón que limpia la selección
const clearBtn = document.getElementById("clear-mode");

//Manejadores de los botones en la interfaz
if (planeBtn) {
  planeBtn.addEventListener("click", function () {
    PlanePointAB();
    this.classList.add("selected-mode");
    this.disabled = true;
    if (vehicleBtn) {
      vehicleBtn.classList.remove("selected-mode");
      vehicleBtn.disabled = false;
    }
  });
}

if (vehicleBtn) {
  vehicleBtn.addEventListener("click", function () {
    VehiclePointAB();
    this.classList.add("selected-mode");
    this.disabled = true;
    if (planeBtn) {
      planeBtn.classList.remove("selected-mode");
      planeBtn.disabled = false;
    }
  });
}

// Limpiar la opción seleccionada si se presionó el botón
if (clearBtn) {
  clearBtn.addEventListener("click", function () {
    clearRouteOnly();
    planeBtn?.classList.remove("selected-mode");
    vehicleBtn?.classList.remove("selected-mode");
    if (planeBtn) planeBtn.disabled = false;
    if (vehicleBtn) vehicleBtn.disabled = false;
  });
}

// Actualizar la hora actual si cambia la selección
timezoneSelect?.addEventListener("change", updateSelectedTimezoneClock);
updateSelectedTimezoneClock();
setInterval(updateSelectedTimezoneClock, 1000);