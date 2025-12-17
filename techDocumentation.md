Este manual técnico describe la arquitectura y los requisitos del sistema.

---

## 1. Stack Tecnológico

El sistema está construido sobre una base de **JavaScript Vanilla**. Adicional a eso, se utilizó:

* **HTML5:** Estructura semántica del visor de mapas y formularios de control.
* **CSS3:** Estilo visual, diseño responsivo y personalización de contenedores de Leaflet.
* **JavaScript (ES6+):** Lógica de interacción y manejo de eventos.

---

## 2. Librerías y Servicios Externos

Para el funcionamiento de la geolocalización y el trazado de rutas, se integran las siguientes herramientas:

### Mapeo y Visualización

* **Leaflet:** Biblioteca principal para renderizar el mapa interactivo.
* **OpenStreetMap (OSM):** Proveedor de las teselas (tiles) de mapas base.
* **Boxicons:** Librería de iconos vectoriales para la interfaz de usuario.

### Enrutamiento y Geocodificación

* **Leaflet Routing Machine:** Plugin para integrar servicios de enrutamiento en el mapa.
* **OSRM (Open Source Routing Machine):** Motor de cálculo para determinar la ruta más corta por carretera.
* **Nominatim:** Servicio de búsqueda (geocodificación inversa y directa) para convertir coordenadas en direcciones y viceversa.

### Interfaz de Usuario

* **Select2:** Reemplazo para cuadros de selección estándar.

---

## 3. Requisitos de Hardware y Software

Para garantizar una experiencia de usuario, se deben cumplir los siguientes parámetros:

### Especificaciones de Hardware

**Memoria RAM** : 2 GB
**Dispositivo** : Móvil o de escritorio
**Conectividad** : 5 Mbps (Descarga)

### Especificaciones de Software

* **Navegador:** Versiones actualizadas de Google Chrome, Opera GX, Mozilla Firefox, Microsoft Edge o Brave.
---

## 4. Flujo de Operación

1. **Carga del DOM:** Se inicializa el contenedor del mapa mediante Leaflet.
2. **Solicitud de Coordenadas:** Nominatim procesa los inputs de texto del usuario.
3. **Cálculo de Ruta:** OSRM genera el trazado geométrico entre puntos.
4. **Renderizado:** Leaflet Routing Machine dibuja la polilínea sobre la capa de OpenStreetMap.