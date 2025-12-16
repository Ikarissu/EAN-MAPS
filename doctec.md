# Documentación Técnica — EAN-MAPS

Fecha: 2025-12-16

Resumen
-------
EAN-MAPS es una aplicación frontend ligera que usa Leaflet + OpenStreetMap para mostrar mapas interactivos y Leaflet Routing Machine (OSRM) para cálculo de rutas vehiculares. Soporta:

- Modo `plane`: distancia en línea recta entre dos puntos.
- Modo `vehicle`: cálculo de ruta vehicular entre dos puntos, con almacenamiento del historial y soporte para rutas alternativas.

Objetivo de este documento
--------------------------
Proporcionar una referencia técnica para desarrolladores que deban entender, mantener o ampliar la funcionalidad de rutas (incluidas las alternativas), la persistencia de resultados y la UI asociada.

Estructura del proyecto (relevante)
----------------------------------
- `index.html` — página principal y carga de scripts.
- `assets/js/vehicleMode.js` — lógica de selección de puntos A/B, llamada a L.Routing.control y construcción del registro de rutas.
- `assets/js/renderDistanceList.js` — renderizado del historial (`distanceRecords`), panel de alternativas y lógica de selección/dibujo.
- `assets/js/saveAndLoadDistanceRecords.js` — persistencia en `localStorage` (clave: `ean-maps:distanceRecords`).
- `assets/js/*` — otros módulos auxiliares (ej. utilidades de timezone, exportar PDF, etc.)

Modelo de datos (registro de distancia)
--------------------------------------
Cada entrada de `distanceRecords` (un array persistido) contiene, entre otros campos:

- `type`: "vehicle" | "plane" | ...
- `typeLabel`: cadena legible (ej. "Distancia terrestre")
- `distance`: cadena (formateada para presentación, ej. "12.34")
- `tzLabel`: etiqueta de zona horaria usada
- `start_hour`: cadena legible para hora de salida
- `end_hour`: cadena legible para hora estimada de llegada
- `startTS`: timestamp numérico (ms) usado para recalcular horas cuando se cambia la alternativa
- `createdAt`: ISO timestamp del registro
- `instructions`: array de strings con pasos de la ruta
- `alternatives`: array de objetos con la forma:
  - `distance`: número (km)
  - `instructions`: array de pasos (strings)
  - `coords`: array de `{ lat, lng }` normalizados
  - `summary`: objeto original devuelto por el motor de rutas (puede contener `totalTime` en segundos)
- `selectedAlternativeIndex`: 0 indica la ruta principal; n>0 referencia la alternativa n (indexado desde 1)
- `primaryRoute`: copia de la ruta principal con estructura: `{ distanceKm, instructions, coords, endTS, summary }` — se guarda para restauración posterior
- `pointA_info` / `pointB_info`: `{ name, lat, lng }`
- `pointA` / `pointB`: coordenadas originales (objetos Leaflet)

Flujo de cálculo y persistencia
-------------------------------
1. El usuario selecciona Punto A y Punto B en modo `vehicle`.
2. `vehicleMode.js` crea `L.Routing.control` y espera `routesfound`.
3. En `routesfound`:
   - Se extrae `route = e.routes[0]` como ruta principal.
   - Se calcula `primaryRoute` (distancia numérica, instrucciones, coords normalizadas, `endTS`).
   - Se obtienen alternativas con `e.routes.slice(1)` y se normalizan (`alternatives`).
   - Se construye el objeto de registro (incluyendo `startTS`) y se persiste mediante `saveDistanceRecords()`.
4. `renderDistanceList.js` renderiza el historial y añade controles para mostrar/seleccionar alternativas.

Manejo de rutas alternativas (UI y comportamiento)
-------------------------------------------------
- Botón `alt-route-button` abre un panel con las alternativas detectadas para ese registro.
- Cada alternativa muestra:
  - Distancia (km)
  - Duración estimada (si está disponible en `summary.totalTime` o campos equivalentes)
  - Botones: `Mostrar` y `Seleccionar` / `Quitar` (según estado)

Acciones:
- Mostrar: dibuja en el mapa la polilínea de la alternativa (variable global `window._currentAltPolyline`).
- Seleccionar: guarda la alternativa seleccionada en `selectedAlternativeIndex` (n), actualiza los campos visibles del registro (`distance`, `instructions`, `end_hour`) y persiste en `localStorage`. El botón cambia a `Quitar`.
- Quitar: restaura desde `primaryRoute` la información original (distancia, instrucciones y `end_hour` usando `primaryRoute.endTS`), establece `selectedAlternativeIndex` a 0 y persiste.
- Cerrar panel: elimina la polilínea alternativa dibujada y cierra el panel.

Cálculo de hora estimada de llegada
-----------------------------------
- Si la alternativa contiene `summary.totalTime` (segundos) se puede usar directamente para calcular `end_hour`.
- Actualmente, cuando `totalTime` no está disponible, se estima el tiempo usando una velocidad media de 70 km/h:
  - endTS ≈ startTS + (distance_km / 70) * 3600000 ms
- `startTS` se almacena por registro al crearlo, para permitir recalcular horas cuando cambie la alternativa.

Funciones y puntos clave del código
-----------------------------------
- `VehiclePointAB()` (en `vehicleMode.js`): controla el modo `vehicle`, crea `L.Routing.control` y escucha `routesfound`.
- `saveDistanceRecords(records)` / `loadDistanceRecords()` (en `saveAndLoadDistanceRecords.js`): persistencia JSON en `localStorage`.
- `renderDistanceList(opts)` (en `renderDistanceList.js`): renderiza el DOM del historial, incluye `attachAltRouteListeners()`.
- `attachAltRouteListeners()`: añade listeners para abrir panel de alternativas.
- `showAlternativeOnMap(record, altIdx)`: dibuja la alternativa en el mapa y guarda la referencia en `window._currentAltPolyline`.
- `toggleAlternativeSelection(recordIndex, altIdx, panel)`: selecciona/deselecciona una alternativa; actualiza `distanceRecords`, recalcula `end_hour` y persiste.

Buenas prácticas y recomendaciones para mantenimiento
---------------------------------------------------
- Validaciones: comprobar la presencia de `summary` y `coordinates` antes de usar. Normalizar coordenadas (lat/lng) al guardarlas.
- Separar responsabilidades: considerar mover la normalización de rutas a una utilidad (p. ej. `routeUtils.normalizeRoute(route)`), y la lógica de selección a un servicio (p. ej. `selectionService.toggle(...)`) para facilitar pruebas.
- Pruebas:
  - Unit tests para `toggleAlternativeSelection()` (asegurar actualización de campos y persistencia esperada).
  - Tests para normalización de coords.
- UX:
  - Añadir estilos CSS para `.alt-route-panel`, `.alt-route-item` y botones para mejorar legibilidad.
  - Considerar confirmar al usuario antes de sobrescribir el registro si se integra con exportadores (PDF, CSV).

Posibles mejoras futuras
-----------------------
- Usar `summary.totalTime` cuando esté disponible para estimaciones precisas y mostrar duración en el panel y en la tarjeta principal.
- Permitir fijar una alternativa como "predeterminada" que se mantenga incluso tras recargar la app.
- Añadir exportación que respete `selectedAlternativeIndex` al generar reportes (PDF/CSV).
- Añadir undo/redo o historial de cambios para cada registro.
- Integración con un backend para almacenar registros en servidor y permitir sincronización multi-dispositivo.

Desarrollo y pruebas locales
---------------------------
1. Servir el directorio del proyecto (ej. con Python):

```bash
cd path/to/EAN-MAPS
python -m http.server 8000
```

2. Abrir `http://localhost:8000/` en el navegador.
3. Activar modo `vehicle`, seleccionar Punto A/B, abrir menú inferior y probar selección/quitado de alternativas.

Contacto y mantenimiento
------------------------
- Autor: (añadir responsable o equipo)
- Repositorio: (añadir URL si aplica)

---

Archivo generado: `doctec.md` — sirve como referencia técnica para desarrolladores y QA.
