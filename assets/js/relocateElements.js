(function () {
  const btn = document.getElementById('export-all-pdf');
  const historyRow = document.querySelector('.history-io-row');
  const rightMenuOpts = document.querySelector('.right-menu-options');

  function place() {
    if (!btn || !historyRow || !rightMenuOpts) return;
    if (window.innerWidth <= 425) {
      if (!historyRow.contains(btn)) historyRow.prepend(btn);
    } else {
      if (!rightMenuOpts.contains(btn)) rightMenuOpts.insertBefore(btn, rightMenuOpts.firstChild);
    }
  }

  window.addEventListener('resize', place);
  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', place)
    : place();
})();