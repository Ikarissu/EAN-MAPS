(() => {
    // Obtener dónde se almacenarán los registros obtenidos y los elementos de la modal para interactual
  const STORAGE_KEY = "ean-maps:distanceRecords";
  const openBtn = document.getElementById("export-all-pdf");
  const modal = document.getElementById("export-modal");
  const closeBtn = document.getElementById("close-export-modal");
  const cancelBtn = document.getElementById("cancel-export-modal");
  const form = document.getElementById("export-filters-form");

  // Abortar evento si no se encuentra alguno de los elementos
  if (!openBtn || !modal || !form) return;

  // Mostrar/ocultar modal
  const openModal = () => modal.removeAttribute("hidden");
  const closeModal = () => {
    modal.setAttribute("hidden", "hidden");
    form.reset(); // Limpiar todos los campos
  };

  // Delegación de eventos de modal
  openBtn.addEventListener("click", openModal);
  closeBtn?.addEventListener("click", closeModal);
  cancelBtn?.addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  // Hacer submit el formulario para recibir los filtros aplicados
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const filters = getFilters();
    const records = loadRecords();
    const filtered = applyFilters(records, filters);

    // Mensaje de error si no existen registros que coincidan
    if (!filtered.length) {
      showNotification(
        "No existen registros que coincidan con los filtros.",
        2000,
        "error"
      );
      return;
    }

    generateCombinedPdf(filtered);
    closeModal();
  });

  // Cargar y normalizar los registros existentes
  function loadRecords() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed.map(normalizeType) : [];
    } catch {
      return [];
    }
  }

  // Leer los filtros aplicados en el formulario de generación de PDF
  function getFilters() {
    const dateFrom = form.dateFrom?.value || "";
    const dateTo = form.dateTo?.value || "";
    const mode = form.mode?.value || "all";
    return { dateFrom, dateTo, mode };
  }

  // Manejar la fecha que se recibe para evitar desfase en la generación del PDF
  const toLocalDayStart = (dateStr) => {
    if (!dateStr) return null;
    const [y, m, d] = dateStr.split("-").map(Number);
    return new Date(y, m - 1, d, 0, 0, 0, 0).getTime();
  };
  const toLocalDayEnd = (dateStr) => {
    if (!dateStr) return null;
    const [y, m, d] = dateStr.split("-").map(Number);
    return new Date(y, m - 1, d, 23, 59, 59, 999).getTime();
  };
  const recordDayTs = (createdAt) => {
    const dt = new Date(createdAt);
    return isNaN(dt)
      ? null
      : new Date(dt.getFullYear(), dt.getMonth(), dt.getDate()).getTime();
  };

  // Permitir compatibilidad con registros previos
  function normalizeType(r) {
    if (r.type === "Distancia Aérea") r.type = "plane";
    if (r.type === "Distancia Terrestre") r.type = "vehicle";
    return r;
  }

  // Manejar la impresión de PDF conforme a los filtros aplicados
  function applyFilters(records, { dateFrom, dateTo, mode }) {
    const fromTs = toLocalDayStart(dateFrom);
    const toTs = toLocalDayEnd(dateTo);

    return records.filter((r) => {
      if (mode !== "all" && r.type !== mode) return false;

      if (fromTs || toTs) {
        const recDate = recordDayTs(r.createdAt);
        if (recDate === null) return false;
        if (fromTs && recDate < fromTs) return false;
        if (toTs && recDate > toTs) return false;
      }

      return true;
    });
  }

  // Dar formato a la distancia en kilómetros
  const fmtKm = (n) => new Intl.NumberFormat("es-ES", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(n));

  // Generar cada registro del PDF en una hoja individual
  function generateCombinedPdf(records) {
    if (typeof pdfMake === "undefined") {
      console.error("pdfMake no está disponible");
      return;
    }
    
    // Mostrar alerta de que el PDF se está generando
    showNotification("Generando PDF...", 1200, "info");

    const content = [];

    records.forEach((record, idx) => {
      // Dependiendo del modo en que se calculó la distancia, imprimir el nombre
      const modeLabel =
        record.typeLabel ||
        (record.type === "plane"
          ? "Distancia Aérea"
          : record.type === "vehicle"
          ? "Distancia Terrestre"
          : record.type || "Distancia");
      // Estructura y propiedades del PDF a generar
      content.push(
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
            body: buildRecordBody(record),
          },
          layout: "noBorders",
          margin: [0, 6, 0, 6],
        }
      );

      // Separador entre registros, menos en el último
      if (idx < records.length - 1) {
        content.push({ text: "", margin: [0, 0, 0, 10], pageBreak: "after" });
      }
    });

    const docDefinition = {
      content,
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
      pdfMake.createPdf(docDefinition).download("Reporte_Distancias.pdf");
    }, 800);
  }

  // Construir los detalles de cada registro generado
  function buildRecordBody(record) {
    const body = [
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
    ];

    // Fecha de creación (si existe)
    if (record.createdAt) {
      const readableDate = new Date(record.createdAt).toLocaleString();
      body.push([
        {
          text: "Fecha de creación",
          style: "label",
          color: "#fff",
          fillColor: "#396974",
          margin: [8, 6, 8, 6],
        },
      ]);
      body.push([
        {
          text: readableDate,
          style: "value",
          color: "#000",
          fillColor: "#f8f8f8",
          margin: [8, 6, 8, 10],
        },
      ]);
    }

    // Lista de instrucciones para las distancias terrestres
    if (record.instructions?.length) {
      body.push([
        {
          text: "Instrucciones De Ruta",
          style: "label",
          color: "#fff",
          fillColor: "#396974",
          margin: [8, 6, 8, 6],
        },
      ]);
      body.push([
        {
          ul: record.instructions,
          style: "value",
          color: "#000",
          fillColor: "#f8f8f8",
          margin: [12, 6, 8, 10],
        },
      ]);
    }

    return body;
  }
})();
