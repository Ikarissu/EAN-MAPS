// Manejo de búsqueda de coordenadas y búsqueda por nombre con Nominatim
(function () {
  const notify = (msg, ms = 2000, type = 'info') => {
    if (typeof showNotification === 'function') return showNotification(msg, ms, type);
    try { console.log(type.toUpperCase(), msg); } catch (e) {}
  };

  //  Parsear entrada de usuario para extraer coordenadas del lugar
  function parseCoords(input) {
    if (!input) return null;
    const cleaned = input.trim().replace(/;/g, ' ').replace(/,/g, ' ');
    // Divide la cadena por espacios múltiples y filtra para eliminar entradas vacías.
    const parts = cleaned.split(/\s+/).filter(Boolean);
    // Se esperan al menos dos partes (lat y lng)
    if (parts.length < 2) return null;
    const a = Number(parts[0]);
    const b = Number(parts[1]);
    //Valida que sean números finitos ambas partes
    if (Number.isFinite(a) && Number.isFinite(b)) return { lat: a, lng: b };
    return null;
  }

  // Validar rango de latitud y longitud asegurandose que sean coordenadas válidas
  function validLatLng(lat, lng) {
    return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  }

  // Debounce helper
  function debounce(fn, wait) {
    let t;
    return function (...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), wait);
    };
  }

  // Llamada a Nominatim para geocodificación
  async function geocodePlace(q) {
    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.search = new URLSearchParams({
      //Se establecen los parámetros de búsqueda 
      q: q,
      format: 'json',
      addressdetails: 1,
      //Maximo 5 resultados
      limit: 5,
      'accept-language': 'es',
      email: 'noreply@example.com'
    }).toString();

    const res = await fetch(url.toString());
    //Manejo de errores en la respuesta
    if (!res.ok) throw new Error('Geocoding error');

    return res.json();
  }

  //Crea un elemento html para cada sugerencia de busqueda. 
  function makeSuggestionItem(item) {
    const el = document.createElement('div');
    el.className = 'coord-suggestion';
    // Almacena latitud y longitud como atributos data
    el.setAttribute('data-lat', item.lat);
    el.setAttribute('data-lon', item.lon);
    // Muestra el nombre completo del lugar
    el.textContent = item.display_name;
    return el;
  }

  function init() {
    // Obtener referencias a los elementos del DOM
    const input = document.getElementById('coord-search-input');
    const btn = document.getElementById('coord-search-btn');
    const suggestions = document.getElementById('coord-suggestions');
    if (!input || !btn || !suggestions || typeof map === 'undefined') return;

    let lastResults = [];

    // Función de búsqueda principal
    const doSearch = async () => {
      const raw = input.value || '';
      const parsed = parseCoords(raw);
      if (parsed) {
        let { lat, lng } = parsed;
        if (!validLatLng(lat, lng) && validLatLng(lng, lat)) [lat, lng] = [lng, lat];
        if (!validLatLng(lat, lng)) { notify('Coordenadas fuera de rango.', 3000, 'error'); return; }
        flyToAndMark(lat, lng, `Ubicación: ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
        suggestions.innerHTML = '';
        suggestions.setAttribute('aria-hidden', 'true');
        return;
      }

      // Texto: usar Nominatim
      if (!raw.trim()) { suggestions.innerHTML = ''; suggestions.setAttribute('aria-hidden', 'true'); return; }
      // Realizar geocodificación
      try {
        const res = await geocodePlace(raw);
        lastResults = res || [];
        suggestions.innerHTML = '';
        if (!lastResults.length) {
          suggestions.setAttribute('aria-hidden', 'true');
          notify('No se encontraron resultados.', 2000, 'info');
          return;
        }
        lastResults.forEach(r => {
          const item = makeSuggestionItem(r);
          item.addEventListener('click', async () => {
            const lat = Number(item.getAttribute('data-lat'));
            const lon = Number(item.getAttribute('data-lon'));
            // Volar al lugar y marcarlo
            flyToAndMark(lat, lon, r.display_name);
            suggestions.innerHTML = '';
            suggestions.setAttribute('aria-hidden', 'true');

            // Reusa la función de geocodificación inversa si está disponible para obtener un nombre más consistente
            try {
              
              if (typeof reverseGeocode === 'function') {
                const name = await reverseGeocode({ lat, lng: lon });
                notify(name, 2500, 'info');
              } else {
                notify(r.display_name, 2500, 'info');
              }
            } catch (err) {
              notify(r.display_name, 2500, 'info');
            }
          });
          // Agregar el elemento a la lista de sugerencias
          suggestions.appendChild(item);
        });
        // Mostrar la lista de sugerencias
        suggestions.setAttribute('aria-hidden', 'false');
      } catch (err) {
        console.error(err);
        notify('Error de geocodificación.', 3000, 'error');
      }
    };

    // Versión debounceada para el input
    const debouncedSearch = debounce(doSearch, 300);
  // Adjuntar eventos
    btn.addEventListener('click', doSearch);
    input.addEventListener('input', debouncedSearch);
    input.addEventListener('keydown', function (e) {
      // Manejo de teclas Enter y Escape
      if (e.key === 'Enter') { e.preventDefault(); doSearch(); }
      if (e.key === 'Escape') { suggestions.innerHTML = ''; suggestions.setAttribute('aria-hidden', 'true'); }
    });

    // Función para volar al lugar y marcarlo en el mapa
    function flyToAndMark(lat, lng, label) {
      try { map.flyTo([lat, lng], 13, { duration: 1.2 }); } catch (err) { console.error(err); }
      // Añadir marcador
      try {
        if (!window._coordSearchMarker) window._coordSearchMarker = null;
        if (window._coordSearchMarker) { map.removeLayer(window._coordSearchMarker); window._coordSearchMarker = null; }
        window._coordSearchMarker = L.marker([lat, lng]).addTo(map).bindPopup(label).openPopup();
        //manejo de errores
      } catch (err) { console.error(err); }
    }
  }
// Inicializar al cargar el DOM
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
