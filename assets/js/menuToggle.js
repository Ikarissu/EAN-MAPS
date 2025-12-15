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

  // Abrir un menú a la vez: si se expande uno, se pliega el otro
  function toggleExclusive(target, other) {
    const willExpand = !target.classList.contains("is-open");
    if (willExpand) setExpanded(other, false);
    setExpanded(target, willExpand);
  }

  // Abrir el menú derecho (inferior en móviles) cuando se calcule una distancia
  window.openBottomMenu = () => {
    if (!rightMenu) return;
    setExpanded(rightMenu, true);
    setExpanded(leftMenu, false);
  };

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
    toggleExclusive(leftMenu, rightMenu);
  });
  rightToggleIcon?.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleExclusive(rightMenu, leftMenu);
  });

  // Permitir click en todo el menú cuando está plegado (barra clickeable)
  leftMenu?.addEventListener("click", (e) => {
    if (!leftMenu.classList.contains("is-open")) {
      e.stopPropagation();
      toggleExclusive(leftMenu, rightMenu);
    }
  });
  rightMenu?.addEventListener("click", (e) => {
    if (!rightMenu.classList.contains("is-open")) {
      e.stopPropagation();
      toggleExclusive(rightMenu, leftMenu);
    }
  });
})();
