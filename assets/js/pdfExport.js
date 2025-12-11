// Función para generar PDF de las distancias buscadas
function generatePdf(record) {
  if (typeof pdfMake === "undefined") {
    console.error("pdfMake no está disponible");
    return;
  }

  // Dependiendo del modo en que se calculó la distancia, imprimir el nombre
  const modeLabel =
    record.typeLabel ||
    (record.type === "plane" ? "Distancia Aérea" :
     record.type === "vehicle" ? "Distancia Terrestre" :
     (record.type || "Distancia"));

  // Mostrar alerta de que el PDF se está generando
  showNotification("Generando PDF...", 1200, "info");

  // Dar formato a la distancia en kilómetros
  const fmtKm = (n) => new Intl.NumberFormat("es-ES", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(n));

  // Estructura y propiedades del PDF a generar
  const docDefinition = {
    content: [
      { text: "EAN-MAPS", style: "header" },
      {
        text: `REPORTE DE ${modeLabel.toUpperCase()}`,
        style: "header",
      },
      {
        canvas: [
          {
            type: "line",
            x1: 0,
            y1: 0,
            x2: 515,
            y2: 0,
            lineWidth: 1,
            lineColor: "#000",
          },
        ],
        margin: [0, 4, 0, 8],
      },
      {
        table: {
          widths: ["*"],
          body: [
            [
              {
                text: `Distancia recorrida desde "${record.pointA_info?.name || "Origen"}" hasta "${record.pointB_info?.name || "Destino"}"`,
                style: "label",
                color: "#fff",
                fillColor: "#396974",
                margin: [8, 6, 8, 6],
              },
            ],
            [
              {
                text: `${record.distance} Kilómetros`,
                style: "value",
                color: "#000",
                fillColor: "#f8f8f8",
                margin: [8, 6, 8, 10],
              },
            ],
            [
              {
                text: `Hora De Salida (${record.tzLabel})`,
                style: "label",
                color: "#fff",
                fillColor: "#396974",
                margin: [8, 6, 8, 6],
              },
            ],
            [
              {
                text: record.start_hour,
                style: "value",
                color: "#000",
                fillColor: "#f8f8f8",
                margin: [8, 6, 8, 10],
              },
            ],
            [
              {
                text: `Hora De Llegada Estimada (${record.tzLabel})`,
                style: "label",
                color: "#fff",
                fillColor: "#396974",
                margin: [8, 6, 8, 6],
              },
            ],
            [
              {
                text: record.end_hour,
                style: "value",
                color: "#000",
                fillColor: "#f8f8f8",
                margin: [8, 6, 8, 10],
              },
            ],
            ...(record.instructions?.length
              ? [
                  [
                    {
                      text: "Instrucciones De Ruta",
                      style: "label",
                      color: "#fff",
                      fillColor: "#396974",
                      margin: [8, 6, 8, 6],
                    },
                  ],
                  [
                    {
                      ul: record.instructions,
                      style: "value",
                      color: "#000",
                      fillColor: "#f8f8f8",
                      margin: [12, 6, 8, 10],
                    },
                  ],
                ]
              : []),
          ],
        },
        layout: "noBorders",
        margin: [0, 6, 0, 6],
      },
    ],
    styles: {
      header: { fontSize: 18, bold: true },
      label: { fontSize: 12, bold: true },
      value: { fontSize: 12 },
      small: { fontSize: 10, color: "#555" },
    },
    defaultStyle: { fontSize: 12 },
  };

  // Esperar unos segundos antes de comenzar la descarga
  setTimeout(() => {
    pdfMake.createPdf(docDefinition).download(`Reporte De ${modeLabel}.pdf`);
  }, 1000);
}