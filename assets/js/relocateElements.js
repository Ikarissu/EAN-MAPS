(function () {
  const btnPdf = document.getElementById('export-all-pdf');
  const btnExportJson = document.getElementById('export-history-btn');
  const btnImportJson = document.getElementById('import-history-btn');
  const historyRow = document.querySelector('.history-io-row');
  const rightMenuOpts = document.querySelector('.right-menu-options');
  const historyBox = document.querySelector('.history-io');

  function place() {
    if (!btnPdf || !btnExportJson || !btnImportJson || !historyRow || !rightMenuOpts) return;
    const optionsBox = document.querySelector('.distance-record-options');

    if (window.innerWidth <= 425 && optionsBox) {
      optionsBox.classList.add('responsive-actions');
      optionsBox.append(btnExportJson, btnImportJson, btnPdf);
    } else {
      // Volverlos a su lugar original
      historyRow.append(btnExportJson, btnImportJson);
      if (historyBox && !historyBox.contains(historyRow)) historyBox.append(historyRow);
      rightMenuOpts.insertBefore(btnPdf, rightMenuOpts.firstChild || null);
    }
  }

  window.relocateActionButtons = place;

  window.addEventListener('resize', place);
  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', place)
    : place();
})();