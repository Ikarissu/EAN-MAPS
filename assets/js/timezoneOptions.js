function GMT() {
  // Generar opciones de zona horaria GMT-12 a GMT+12
  const select = document.getElementById("timezone");
  select.innerHTML = '<option></option>';
  // Rellenar opciones
  for (let i = -12; i <= 12; i++) {
    const option = document.createElement("option");
    option.value = `GMT${i >= 0 ? "+" : ""}${i}`;
    option.text = `GMT${i >= 0 ? "+" : ""}${i}`;
    select.appendChild(option);
  }
}
GMT();
// Establecer valor predeterminado en GMT-4
document.getElementById("timezone").value = "GMT-4";