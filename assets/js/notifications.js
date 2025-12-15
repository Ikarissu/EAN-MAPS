function showNotification(message, duration = 3000, type = "error") {
  const bg =
    {
      error: "#ff4d4d",
      info: "#39993eff",
    }[type] || "#333";

  const notification = document.createElement("div");
  notification.className = "error-notification";
  notification.textContent = message;

  notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        left: 20px;
        background-color: ${bg};
        color: white;
        padding: 15px;
        border-radius: 5px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        z-index: 10000;
        opacity: 0;
        transition: opacity 0.5s ease-in-out;
        font-family: "ProjectFont", sans-serif;
    `;
  document.body.appendChild(notification);
  setTimeout(() => {
    notification.style.opacity = 1;
  }, 10);
  setTimeout(() => {
    notification.style.opacity = 0;
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 500);
  }, duration);
}