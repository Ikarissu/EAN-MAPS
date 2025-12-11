$(function () {
  $("#timezone").select2({
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
