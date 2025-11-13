(() => {
  const sel = '.export-btn, .export-btn-mobile';
  const buttons = Array.from(document.querySelectorAll(sel));
  if (!buttons.length) return;

  buttons.forEach((button) => {
    button.addEventListener('click', function (e) {
      e.preventDefault();

      // remove estados antigos
      button.classList.remove('loading', 'complete');

      try {
        if (typeof window.exportData === 'function') {
            // mostrar um estado rápido enquanto o modal abre
            button.classList.add('loading');
            const maybePromise = window.exportData();
            Promise.resolve(maybePromise)
              .catch((err) => console.error('exportData error:', err))
              .finally(() => {
                button.classList.remove('loading');
                button.classList.add('complete');
                setTimeout(() => button.classList.remove('complete'), 1200);
              });
        }
      } catch (err) {
        console.error('exportData error:', err);
        button.classList.remove('loading');
      }
    });
  });
})();
