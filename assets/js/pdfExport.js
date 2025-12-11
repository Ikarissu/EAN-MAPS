// Función para generar PDF de las distancias buscadas
function generatePdf(record) {
  if (typeof pdfMake === "undefined") {
    console.error("pdfMake no está disponible");
    return;
  }

  showNotification("Generando PDF...", 1200, "info");

  const docDefinition = {
    content: [
      { text: "EAN-MAPS", style: "header" },
      {
        text: `REPORTE DE ${(record.type || "").toUpperCase()}`,
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
                text: "Distancia Recorrida",
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
            // Instrucciones dentro del body
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

  setTimeout(() => {
    pdfMake.createPdf(docDefinition).download(`Reporte De ${record.type}.pdf`);
  }, 1000);
}