function GMT() {
  const select = document.getElementById("timezone");
  select.innerHTML = '<option></option>';
  for (let i = -12; i <= 12; i++) {
    const option = document.createElement("option");
    option.value = `GMT${i >= 0 ? "+" : ""}${i}`;
    option.text = `GMT${i >= 0 ? "+" : ""}${i}`;
    select.appendChild(option);
  }
}
GMT();