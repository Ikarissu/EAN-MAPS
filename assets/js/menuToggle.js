(function () {
  // Referencias a los menús y elementos interactivos (iconos y títulos)
  const leftMenu = document.getElementById("left-menu");
  const rightMenu = document.getElementById("right-menu");
  const leftToggleIcon = document.querySelector(".left-menu-toggle");
  const rightToggleIcon = document.querySelector(".right-menu-toggle");
  const leftTitle = document.querySelector(".left-menu-title");
  const rightTitle = document.querySelector(".right-menu-title");

  // Calcular y fijar la posición vertical de la pestaña plegada en escritorio
  function updateDesktopTabPositions() {
    const isDesktop = window.matchMedia("(min-width: 768px)").matches;
    if (!isDesktop || !leftMenu || !rightMenu) return;

    const remPx =
      parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    const gapPx = 0.4 * remPx; // igual a --tab-gap

    const leftOpen = leftMenu.classList.contains("is-open");
    const rightOpen = rightMenu.classList.contains("is-open");

    // Altura real de la pestaña del menú izquierdo (su título)
    const leftTitleEl = leftMenu.querySelector(".left-menu-title");
    const titleRect = leftTitleEl?.getBoundingClientRect();
    const menuRect = leftMenu.getBoundingClientRect();

    // Bottom de la pestaña izquierda (cuando está plegada) + separación
    const leftTabBottomWithGap =
      (titleRect
        ? titleRect.top + titleRect.height
        : menuRect.top + 3.6 * remPx) + gapPx;

    if (leftOpen && !rightOpen) {
      // Right plegado justo debajo del panel abierto de Left
      const rightTabTop = menuRect.top + menuRect.height + gapPx;
      document.body.style.setProperty("--right-tab-top", `${rightTabTop}px`);
      document.body.style.setProperty("--left-tab-top", `0.5rem`);
      document.body.style.removeProperty("--right-panel-top");
    } else if (rightOpen && !leftOpen) {
      // Right abierto empieza justo debajo de la pestaña cerrada de Left
      document.body.style.setProperty(
        "--right-panel-top",
        `${leftTabBottomWithGap}px`
      );
      document.body.style.setProperty("--left-tab-top", `0.5rem`);
      document.body.style.removeProperty("--right-tab-top"); // no se usa porque right está abierto
    } else {
      // Ambos plegados: Right (pestaña) debajo de la pestaña de Left
      document.body.style.setProperty("--left-tab-top", `0.5rem`);
      document.body.style.setProperty(
        "--right-tab-top",
        `${leftTabBottomWithGap}px`
      );
      document.body.style.removeProperty("--right-panel-top");
    }
  }
  // ...existing code...

  // Abrir o cerrar un menú y actualizar el atributo aria para accesibilidad
  function setExpanded(menuEl, expanded) {
    menuEl.classList.toggle("is-open", expanded);
    menuEl.setAttribute("aria-expanded", String(expanded));
  }

  // Asegurar que solo un menú esté abierto a la vez
  function toggleExclusive(target, other) {
    const willExpand = !target.classList.contains("is-open");
    if (willExpand) setExpanded(other, false);
    setExpanded(target, willExpand);
  }

  // Atajo para abrir el menú derecho y cerrar el izquierdo
  window.openBottomMenu = () => {
    if (!rightMenu || !leftMenu) return;
    setExpanded(rightMenu, true);
    setExpanded(leftMenu, false);
  };

  // Estado inicial: ambos menús empiezan cerrados para que el usuario elija cuál abrir
  function applyInitialState() {
    if (!leftMenu || !rightMenu) return;
    setExpanded(leftMenu, false);
    setExpanded(rightMenu, false);
    updateDesktopTabPositions();
  }

  // Inicializar el estado al cargar y no cambiarlo al redimensionar la ventana
  applyInitialState();
  window.addEventListener("resize", () => {
    updateDesktopTabPositions();
  });

  // Envoltorio simple para aplicar la regla de exclusividad siempre
  function toggleResponsive(target, other) {
    toggleExclusive(target, other);
    updateDesktopTabPositions();
  }

  // Al hacer clic en el ícono del menú izquierdo, se abre/cierra y cierra el otro si corresponde
  leftToggleIcon?.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleResponsive(leftMenu, rightMenu);
  });

  // Al hacer clic en el ícono del menú derecho, se abre/cierra y cierra el otro si corresponde
  rightToggleIcon?.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleResponsive(rightMenu, leftMenu);
  });

  // Al hacer clic en el título del menú izquierdo, funciona igual que el ícono de toggle
  leftTitle?.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleResponsive(leftMenu, rightMenu);
  });

  // Al hacer clic en el título del menú derecho, funciona igual que el ícono de toggle
  rightTitle?.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleResponsive(rightMenu, leftMenu);
  });

  // Si el menú izquierdo está cerrado y se hace clic en su contenedor, se abre y cierra el otro
  leftMenu?.addEventListener("click", (e) => {
    if (!leftMenu.classList.contains("is-open")) {
      e.stopPropagation();
      toggleResponsive(leftMenu, rightMenu);
    }
  });

  // Si el menú derecho está cerrado y se hace clic en su contenedor, se abre y cierra el otro
  rightMenu?.addEventListener("click", (e) => {
    if (!rightMenu.classList.contains("is-open")) {
      e.stopPropagation();
      toggleResponsive(rightMenu, leftMenu);
    }
  });

  // Observar cambios de tamaño en el menú izquierdo
  const leftMenuResizeObserver = new ResizeObserver(() => {
    updateDesktopTabPositions();
  });
  leftMenu && leftMenuResizeObserver.observe(leftMenu);

})();
