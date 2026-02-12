/* helpers: norm(), toggleMenu(), etc. */

/* Normaliza string removendo acentos e deixando em minúsculas */
function norm(s) {
  return String(s)
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

/* Toggle menu mobile */
function toggleMenu() {
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.querySelector('.sidebar-overlay');
  const toggle = document.querySelector('.menu-toggle');
  if (!sidebar || !overlay || !toggle) return;
  sidebar.classList.toggle('active');
  overlay.classList.toggle('active');
  toggle.classList.toggle('active');
}
