let airportMarkers = [];

// Función para cargar y mostrar aeropuertos en el mapa
fetch("json/airports.json")
  .then((response) => response.json())
  .then((data) => {
    data.forEach((airport) => {
        // accede a las coordenadas correctamente desde el json
        const lat = airport.geo_point_2d.lat;
        const lon = airport.geo_point_2d.lon;

        // Nombre IATA del aeropuerto
        const iataCode = airport.iata; 
        
        // El resto de los datos (city, country, name)
        if (lat && lon) { // Verificación para evitar errores si faltan datos
          const marker = L.marker([lat, lon])
            .addTo(map)
            .bindPopup(
              `<b>${airport.name} (${iataCode})</b><br>País: ${airport.country}`
            );
          airportMarkers.push(marker);
        } else {
            console.warn("Faltan coordenadas para el aeropuerto:", airport.name);
        }
    });
  })
  // Manejo de errores en el JSON
  .catch((error) => {
    console.error("Error al cargar los datos de aeropuertos:", error);
  });