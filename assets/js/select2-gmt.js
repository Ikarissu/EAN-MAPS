$(function () {
  $("#timezone").select2({
    placeholder: "Seleccione...",
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
