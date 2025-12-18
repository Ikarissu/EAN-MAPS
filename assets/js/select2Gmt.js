$(function () {
  // Inicializar Select2 para el selector de zona horaria
  $("#timezone").select2({
    // Opciones de Select2
    allowClear: true,
    width: "100%",
    dropdownParent: $(".left-menu"),
    language: {
      noResults: function () {
        return "Sin resultados.";
      }
    }
  });
});
