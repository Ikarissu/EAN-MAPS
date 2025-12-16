## EAN-MAPS

Proyecto que muestra un mapa interactivo con Leaflet y OpenStreetMap y usa Leaflet Routing Machine (OSRM) para calcular rutas.

Principales modos de uso
- `plane`: medir distancia en línea recta entre dos puntos.
- `vehicle`: calcular ruta vehicular entre dos puntos y guardar el resultado en el historial.

Nuevas funcionalidades (rutas alternativas)
- Cuando se solicita una ruta en modo `vehicle`, el sistema guarda la ruta principal y las rutas alternativas (si el servicio las devuelve).
- En la lista de búsquedas existen botones "Alternativas" (clase `alt-route-button`) que abren un panel con las alternativas disponibles.
- Cada alternativa muestra: distancia (km) y duración estimada (p. ej. "1 h 12 min").
- Botón `Seleccionar`: marca la alternativa como seleccionada para ese registro. Al seleccionar:
	- La tarjeta del registro actualiza la distancia y la hora estimada de llegada.
	- El registro guarda `selectedAlternativeIndex` y se persiste en `localStorage`.
- Botón `Quitar`: restaura la ruta principal (se guarda `primaryRoute` al calcular la ruta) y vuelve a calcular la hora de llegada.

Comportamiento de mapa
- Mostrar: dibuja la polilínea de la alternativa en el mapa.
- Cerrar panel: elimina la polilínea alternativa dibujada.

Archivos modificados relevantes
- `assets/js/vehicleMode.js`: guarda la ruta principal (`primaryRoute`) y las `alternatives` cuando se obtienen las rutas.
- `assets/js/renderDistanceList.js`: añade UI y lógica para listar alternativas, seleccionar/deseleccionar y persistir la selección.

Cómo probar rápidamente
1. Abrir `index.html` (por ejemplo con un servidor local).
2. Activar modo `vehicle` y seleccionar Punto A y Punto B en el mapa.
3. Abrir el menú inferior y localizar el registro creado.
4. Pulsar el botón de alternativas (`alt-route-button`) para ver las opciones.
5. Usar "Mostrar" para dibujar una alternativa y "Seleccionar" para que esa alternativa sea la que aparezca en el reporte y en la tarjeta (botón pasará a "Quitar").

Notas
- La información de rutas se guarda en `localStorage` bajo la clave `ean-maps:distanceRecords`.
- Si necesitas que al seleccionar una alternativa se dibuje automáticamente en el mapa (o que se restaure la vista de la ruta principal al quitar), puedo activarlo en el comportamiento.

