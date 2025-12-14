// En pantallas pequeñas, los menús pueden plegarse/desplegarse
(function () {
  const leftMenu = document.getElementById("left-menu");
  const rightMenu = document.getElementById("right-menu");
  const leftToggleIcon = document.querySelector(".left-menu-toggle");
  const rightToggleIcon = document.querySelector(".right-menu-toggle");

  // Expandir el menú si se detecta la clase "is-open"
  function setExpanded(menuEl, expanded) {
    menuEl.classList.toggle("is-open", expanded);
    menuEl.setAttribute("aria-expanded", String(expanded));
  }

  // Mantener plegado si no se detecta la clase "is-open"
  function toggleMenu(menuEl) {
    const expanded = !menuEl.classList.contains("is-open");
    setExpanded(menuEl, expanded);
  }

  // Estado inicial del menú: si la pantalla tiene "max-width: 768px", los menús inician plegados
  function applyInitialMobileState() {
    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    setExpanded(leftMenu, !isMobile);
    setExpanded(rightMenu, !isMobile);
  }

  applyInitialMobileState();
  window.addEventListener("resize", applyInitialMobileState);

  // Activar evento de pliegue/despliegue al detectar el click en el ícono de cada menú
  leftToggleIcon?.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleMenu(leftMenu);
  });
  rightToggleIcon?.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleMenu(rightMenu);
  });
})();
