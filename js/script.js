/* Lógica de app / estado / UI */

let mode = 'sequential';
let selectedExercises = [];
const sorted = [...exercises].sort((a, b) =>
  a.name.localeCompare(b.name, 'pt-BR'),
);
const ACTIVE_PAGE_STORAGE_KEY = 'nushape_active_page';
const VALID_PAGES = ['exercicios', 'treinos', 'progresso', 'dados'];

/* PERFIL & AVALIAÇÕES - ESTADO */
const PROFILE_STORAGE_KEY = 'nushape_profile';
const EVALUATION_STORAGE_KEY = 'nushape_evaluations';

let profileData = loadProfileFromStorage();
let evaluations = loadEvaluationsFromStorage();

const profileForm = document.getElementById('profileForm');
const profileFeedback = document.getElementById('profileFeedback');
const lastEvaluationCard = document.getElementById('lastEvaluationCard');
const evaluationModal = document.getElementById('evaluationModal');
const evaluationForm = document.getElementById('evaluationForm');
const evaluationList = document.getElementById('shapeRecords');
const evaluationEmptyState = document.getElementById('shapeEmptyState');
const clearDataModal = document.getElementById('clearDataModal');
const exportModal = document.getElementById('exportModal');
const downloadExportBtn = document.getElementById('downloadExportBtn');
const compressionBarFill = document.getElementById('compressionBarFill');
const exportOriginalSizeEl = document.getElementById('exportOriginalSize');
const exportCompressedSizeEl = document.getElementById('exportCompressedSize');
const exportSavingsEl = document.getElementById('exportSavings');
const exportTimeEl = document.getElementById('exportTime');
const exportUniqueCharsEl = document.getElementById('exportUniqueChars');
const exportAvgDepthEl = document.getElementById('exportAvgDepth');
const exportTreeHeightEl = document.getElementById('exportTreeHeight');
const importInput = document.getElementById('importInput');
const importTrigger = document.querySelector('[data-import-button]');

let lastExportBlob = null;
let lastExportFilename = '';

/* EVENT BINDINGS PERFIL & AVALIAÇÃO */
document
  .querySelectorAll('[data-open-evaluation]')
  .forEach((button) => button.addEventListener('click', openEvaluationModal));

document
  .querySelectorAll('[data-close-modal]')
  .forEach((button) => button.addEventListener('click', closeEvaluationModal));

if (evaluationModal) {
  evaluationModal.addEventListener('click', (event) => {
    if (event.target === evaluationModal) closeEvaluationModal();
  });
}

if (evaluationList) {
  evaluationList.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-delete-evaluation]');
    if (trigger)
      handleDeleteEvaluation(Number(trigger.dataset.deleteEvaluation));
  });
}

if (profileForm) {
  profileForm.addEventListener('submit', handleProfileSubmit);
  populateProfileForm(profileData);
}

document
  .querySelectorAll('.radio-inline input[type="radio"]')
  .forEach((input) => input.addEventListener('change', refreshRadioChips));

if (evaluationForm) {
  const dateInput = evaluationForm.querySelector('input[name="date"]');
  if (dateInput) {
    const today = getTodayInSaoPaulo();
    dateInput.max = today;
  }
  evaluationForm.addEventListener('submit', handleEvaluationSubmit);
}

document
  .querySelectorAll('[data-open-clear]')
  .forEach((button) => button.addEventListener('click', openClearModal));

document
  .querySelectorAll('[data-close-clear]')
  .forEach((button) => button.addEventListener('click', closeClearModal));

const confirmClearButton = document.querySelector('[data-confirm-clear]');
if (confirmClearButton) {
  confirmClearButton.addEventListener('click', () => {
    clearAllData();
    closeClearModal();
  });
}

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  if (evaluationModal?.classList.contains('is-active')) closeEvaluationModal();
  if (clearDataModal?.classList.contains('is-active')) closeClearModal();
  if (exportModal?.classList.contains('is-active')) closeExportModal();
});

document
  .querySelectorAll('[data-close-export]')
  .forEach((button) => button.addEventListener('click', closeExportModal));

if (exportModal) {
  exportModal.addEventListener('click', (event) => {
    if (event.target === exportModal) closeExportModal();
  });
}

if (downloadExportBtn) {
  downloadExportBtn.addEventListener('click', handleExportDownload);
}

if (importTrigger && importInput) {
  importTrigger.addEventListener('click', () => importInput.click());
  importInput.addEventListener('change', handleImportFile);
}

window.exportData = exportData;

renderEvaluationsUI();

/* LOCALSTORAGE */
function saveSelectedExercises() {
  localStorage.setItem(
    'nushape_selected_exercises',
    JSON.stringify(selectedExercises),
  );
}

function loadSelectedExercises() {
  const saved = localStorage.getItem('nushape_selected_exercises');
  if (saved) {
    try {
      selectedExercises = JSON.parse(saved);
    } catch (e) {
      selectedExercises = [];
    }
  }
}

/* NAVEGAÇÃO */
function navigateTo(page) {
  document
    .querySelectorAll('.page')
    .forEach((p) => p.classList.remove('active'));
  const target = document.getElementById(`page-${page}`);
  if (target) target.classList.add('active');

  document.querySelectorAll('.sidebar-item[data-page]').forEach((item) => {
    item.classList.remove('active');
    if (item.dataset.page === page) item.classList.add('active');
  });

  if (page === 'treinos') updateTreinosPage();
  if (page === 'progresso') renderEvaluationsUI();
  if (page === 'dados') refreshRadioChips();

  const sidebar = document.querySelector('.sidebar');
  const overlay = document.querySelector('.sidebar-overlay');
  const toggle = document.querySelector('.menu-toggle');
  sidebar && sidebar.classList.remove('active');
  overlay && overlay.classList.remove('active');
  toggle && toggle.classList.remove('active');

  saveActivePage(page);
}

function updateTreinosPage() {
  const count = document.getElementById('selectedCountTreinos');
  if (count) count.textContent = selectedExercises.length;

  const listContainer = document.getElementById('selectedExercisesList');
  if (!listContainer) return;

  if (selectedExercises.length === 0) {
    listContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🏋️</div>
        <p style="font-size: 16px; font-weight: 500;">Nenhum exercício selecionado</p>
        <p style="font-size: 14px; margin-top: 8px;">Vá para Exercícios e selecione alguns para montar seu treino</p>
      </div>`;
  } else {
    const selectedData = exercises.filter((ex) =>
      selectedExercises.includes(ex.id),
    );
    listContainer.innerHTML = `
      <h3 style="font-size: 18px; font-weight: 600; margin-bottom: 16px;">Exercícios Selecionados</h3>
      <div class="exercise-grid">
        ${selectedData
          .map((ex) => {
            const diffClass = ex.difficulty
              .toLowerCase()
              .replace('á', 'a')
              .replace('í', 'i');
            return `
            <div class="exercise-card">
              <div class="exercise-header">
                <div><h3 class="exercise-name">${ex.name}</h3></div>
                <span class="exercise-badge badge-${diffClass}">${ex.difficulty}</span>
              </div>
              <p class="exercise-desc">${ex.desc}</p>
              <div class="exercise-tags">
                <span class="tag muscle">${ex.muscle}</span>
                <span class="tag equipment">${ex.equipment}</span>
              </div>
            </div>`;
          })
          .join('')}
      </div>`;
  }
}

/* SELEÇÃO */
function toggleExercise(exerciseId) {
  const index = selectedExercises.indexOf(exerciseId);
  if (index > -1) selectedExercises.splice(index, 1);
  else selectedExercises.push(exerciseId);

  const card = document.querySelector(`[data-exercise-id="${exerciseId}"]`);
  if (card) card.classList.toggle('selected');

  updateSelectedCount();
  saveSelectedExercises();
}

function updateSelectedCount() {
  const count = document.getElementById('resultsCount');
  if (!count) return;
  count.textContent = `${selectedExercises.length} exercício${
    selectedExercises.length !== 1 ? 's' : ''
  } selecionado${selectedExercises.length !== 1 ? 's' : ''}`;
}

/* FILTROS / CONTROLE */
function getFilteredExercises() {
  const muscleEl = document.getElementById('muscleSelect');
  if (!muscleEl) return exercises;
  const muscle = muscleEl.value;
  if (muscle === 'Todos') return exercises;
  return exercises.filter((ex) => ex.muscle === muscle);
}

function switchMode(m) {
  mode = m;
  document
    .querySelectorAll('.tab')
    .forEach((t) => t.classList.remove('active'));
  try {
    // inline onclick sets global event in some browsers; fallback se não existir
    const el =
      typeof event !== 'undefined' && event && event.target
        ? event.target
        : document.querySelector(`.tab`);
    el && el.classList.add('active');
  } catch (e) {}
  const input = document.getElementById('searchInput');
  if (input) input.value = '';
  search();
}

function search() {
  const inputEl = document.getElementById('searchInput');
  const term = inputEl ? inputEl.value.trim() : '';
  const filtered = getFilteredExercises();

  if (!term || term.length < 2) {
    render(filtered, null);
    return;
  }

  let result;
  const muscle = document.getElementById('muscleSelect')
    ? document.getElementById('muscleSelect').value
    : 'Todos';
  const sortedFiltered = sorted.filter(
    (ex) => muscle === 'Todos' || ex.muscle === muscle,
  );

  if (mode === 'sequential') result = sequentialSearch(filtered, term);
  else if (mode === 'binary') result = binarySearch(sortedFiltered, term);
  else result = rabinKarp(filtered, term);

  render(result.results, result.metrics);
}

/* RENDER */
function render(list, metrics) {
  const container = document.getElementById('results');
  if (!container) return;

  if (!list || list.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1/-1;">
        <div class="empty-icon">😔</div>
        <p style="font-size: 16px; font-weight: 500;">Nenhum exercício encontrado</p>
        <p style="font-size: 14px; margin-top: 8px;">Tente ajustar os filtros ou buscar por outro termo</p>
      </div>`;
  } else {
    container.innerHTML = list
      .map((ex) => {
        const diffClass = ex.difficulty
          .toLowerCase()
          .replace('á', 'a')
          .replace('í', 'i');
        const isSelected = selectedExercises.includes(ex.id);
        return `
        <div class="exercise-card ${
          isSelected ? 'selected' : ''
        }" data-exercise-id="${ex.id}" onclick="toggleExercise(${ex.id})">
          <div class="exercise-header">
            <div><h3 class="exercise-name">${ex.name}</h3></div>
            <span class="exercise-badge badge-${diffClass}">${
          ex.difficulty
        }</span>
          </div>
          <p class="exercise-desc">${ex.desc}</p>
          <div class="exercise-tags">
            <span class="tag muscle">${ex.muscle}</span>
            <span class="tag equipment">${ex.equipment}</span>
          </div>
        </div>`;
      })
      .join('');
  }

  if (metrics) {
    const mC = document.getElementById('metricsContainer');
    const mG = document.getElementById('metricsGrid');
    if (mC && mG) {
      mC.style.display = 'block';
      mG.innerHTML = `
        <div class="metric-card">
          <div class="metric-label">Algoritmo</div>
          <div class="metric-value" style="font-size:16px">${metrics.algo}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Tempo</div>
          <div class="metric-value">${metrics.time.toFixed(
            2,
          )}<span class="metric-unit">ms</span></div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Comparações</div>
          <div class="metric-value">${metrics.comps}</div>
        </div>
        ${
          metrics.confirms !== undefined
            ? `
        <div class="metric-card">
          <div class="metric-label">Confirmações</div>
          <div class="metric-value">${metrics.confirms}</div>
        </div>`
            : ''
        }`;
    }
  } else {
    const mC = document.getElementById('metricsContainer');
    if (mC) mC.style.display = 'none';
  }
}

/* PERFIL & AVALIAÇÕES - UI / LÓGICA */
function openEvaluationModal() {
  if (!evaluationModal) return;
  evaluationModal.classList.add('is-active');
  evaluationModal.setAttribute('aria-hidden', 'false');
  document.body?.classList.add('modal-open');

  if (!evaluationForm) return;
  evaluationForm.reset();

  const today = getTodayInSaoPaulo();
  const dateInput = evaluationForm.querySelector('input[name="date"]');
  if (dateInput) {
    dateInput.max = today;
    if (!dateInput.value) dateInput.value = today;
  }

  const firstField = evaluationForm.querySelector('input[name="height"]');
  if (firstField) setTimeout(() => firstField.focus(), 60);
}

function closeEvaluationModal() {
  if (!evaluationModal) return;
  evaluationModal.classList.remove('is-active');
  evaluationModal.setAttribute('aria-hidden', 'true');
  document.body?.classList.remove('modal-open');
}

function openClearModal() {
  if (!clearDataModal) return;
  clearDataModal.classList.add('is-active');
  clearDataModal.setAttribute('aria-hidden', 'false');
  document.body?.classList.add('modal-open');
}

function closeClearModal() {
  if (!clearDataModal) return;
  clearDataModal.classList.remove('is-active');
  clearDataModal.setAttribute('aria-hidden', 'true');
  document.body?.classList.remove('modal-open');
}

function handleProfileSubmit(event) {
  event.preventDefault();
  if (!profileForm) return;

  const formData = new FormData(profileForm);
  profileData = {
    name: (formData.get('name') || '').trim(),
    phone: (formData.get('phone') || '').trim(),
    birthdate: formData.get('birthdate') || '',
    email: (formData.get('email') || '').trim(),
    gender: formData.get('gender') || '',
    biotype: formData.get('biotype') || '',
  };

  saveProfileToStorage(profileData);
  populateProfileForm(profileData);
  showSuccessFeedback('Informações atualizadas com sucesso!');
}

function handleEvaluationSubmit(event) {
  event.preventDefault();
  if (!evaluationForm) return;

  const formData = new FormData(evaluationForm);
  const today = getTodayInSaoPaulo();

  const entry = {
    id: Date.now(),
    height: toNumber(formData.get('height')),
    waist: toNumber(formData.get('waist')),
    neck: toNumber(formData.get('neck')),
    weight: toNumber(formData.get('weight')),
    bodyFat: toNumber(formData.get('bodyFat')),
    date: formData.get('date') || today,
  };

  evaluations = sortEvaluations([entry, ...evaluations]);
  saveEvaluationsToStorage(evaluations);
  renderEvaluationsUI();
  closeEvaluationModal();
  showSuccessFeedback('Avaliação registrada com sucesso!');
}

function handleDeleteEvaluation(id) {
  if (!Number.isFinite(id)) return;
  if (
    !confirm(
      'Deseja remover este registro de avaliação? Essa ação não pode ser desfeita.',
    )
  )
    return;

  evaluations = evaluations.filter((entry) => entry.id !== id);
  saveEvaluationsToStorage(evaluations);
  renderEvaluationsUI();
  showSuccessFeedback('Avaliação removida.');
}

function populateProfileForm(data = {}) {
  if (!profileForm) return;

  const nameInput = profileForm.querySelector('[name="name"]');
  const phoneInput = profileForm.querySelector('[name="phone"]');
  const birthInput = profileForm.querySelector('[name="birthdate"]');
  const emailInput = profileForm.querySelector('[name="email"]');

  if (nameInput) nameInput.value = data.name || '';
  if (phoneInput) phoneInput.value = data.phone || '';
  if (birthInput) birthInput.value = data.birthdate || '';
  if (emailInput) emailInput.value = data.email || '';

  if (data.gender) {
    const genderRadio = profileForm.querySelector(
      `input[name="gender"][value="${data.gender}"]`,
    );
    if (genderRadio) genderRadio.checked = true;
  }

  if (data.biotype) {
    const biotypeRadio = profileForm.querySelector(
      `input[name="biotype"][value="${data.biotype}"]`,
    );
    if (biotypeRadio) biotypeRadio.checked = true;
  }

  refreshRadioChips();
}

function refreshRadioChips() {
  document.querySelectorAll('.radio-inline').forEach((label) => {
    const input = label.querySelector('input[type="radio"]');
    if (!input) return;
    label.classList.toggle('is-active', input.checked);
  });
}

function renderEvaluationsUI() {
  renderEvaluationRecords();
  renderLastEvaluation();
}

function renderEvaluationRecords() {
  if (!evaluationList || !evaluationEmptyState) return;

  if (!evaluations.length) {
    evaluationList.innerHTML = '';
    evaluationEmptyState.style.display = 'block';
    return;
  }

  evaluationEmptyState.style.display = 'none';
  evaluationList.innerHTML = evaluations.map(createEvaluationMarkup).join('');
}

function createEvaluationMarkup(entry) {
  const leanMass = computeLeanMass(entry);
  const fatMass = computeFatMass(entry);

  return `
    <article class="evaluation-card">
      <header>
        <div>
          <span class="evaluation-date">${formatDate(entry.date)}</span>
          <div class="evaluation-meta">
            ${formatMetaLine(entry)}
          </div>
        </div>
        <button type="button" class="icon-button icon-button--danger" data-delete-evaluation="${
          entry.id
        }">Remover</button>
      </header>
      <dl class="evaluation-grid">
        ${renderMetric('Altura', entry.height, 'cm')}
        ${renderMetric('Cintura', entry.waist, 'cm')}
        ${renderMetric('Pescoço', entry.neck, 'cm')}
        ${renderMetric('Peso', entry.weight, 'kg', 1)}
        ${renderMetric('% Gordura', entry.bodyFat, '%', 1)}
        ${renderMetric('Massa magra', leanMass, 'kg', 1)}
        ${renderMetric('Massa gorda', fatMass, 'kg', 1)}
      </dl>
    </article>
  `;
}

function renderLastEvaluation() {
  if (!lastEvaluationCard) return;

  if (!evaluations.length) {
    lastEvaluationCard.innerHTML =
      '<p class="empty-text">Você ainda não registrou nenhuma avaliação física.</p>';
    return;
  }

  const latest = evaluations[0];
  const leanMass = computeLeanMass(latest);
  const fatMass = computeFatMass(latest);

  lastEvaluationCard.innerHTML = `
    <div class="last-eval-header">
      <div>
        <p class="last-eval-date">${formatDate(latest.date)}</p>
        ${
          isValidNumber(latest.weight)
            ? `<p class="last-eval-sub">Peso atual ${formatNumber(
                latest.weight,
                1,
              )} kg</p>`
            : ''
        }
      </div>
      ${
        isValidNumber(latest.bodyFat)
          ? `<span class="chip chip-positive">BF ${formatNumber(
              latest.bodyFat,
              1,
            )}%</span>`
          : ''
      }
    </div>
    <div class="last-eval-grid">
      ${renderSummaryMetric('Altura', latest.height, 'cm')}
      ${renderSummaryMetric('Cintura', latest.waist, 'cm')}
      ${renderSummaryMetric('Pescoço', latest.neck, 'cm')}
      ${renderSummaryMetric('Massa magra', leanMass, 'kg', 1)}
      ${renderSummaryMetric('Massa gorda', fatMass, 'kg', 1)}
    </div>
  `;
}

function renderMetric(label, value, unit = '', decimals = 0) {
  if (!isValidNumber(value)) return '';
  return `
    <div>
      <dt>${label}</dt>
      <dd>${formatNumber(value, decimals)}${unit ? ` ${unit}` : ''}</dd>
    </div>
  `;
}

function renderSummaryMetric(label, value, unit = '', decimals = 0) {
  if (!isValidNumber(value)) return '';
  return `
    <div>
      <span class="label">${label}</span>
      <strong>${formatNumber(value, decimals)}${unit ? ` ${unit}` : ''}</strong>
    </div>
  `;
}

function formatMetaLine(entry) {
  const parts = [];
  if (isValidNumber(entry.bodyFat))
    parts.push(`BF ${formatNumber(entry.bodyFat, 1)}%`);
  if (isValidNumber(entry.weight))
    parts.push(`${formatNumber(entry.weight, 1)} kg`);
  return parts.map((text) => `<span>${text}</span>`).join('');
}

function getTodayInSaoPaulo() {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(new Date());
  const year = parts.find((p) => p.type === 'year')?.value;
  const month = parts.find((p) => p.type === 'month')?.value;
  const day = parts.find((p) => p.type === 'day')?.value;
  return `${year}-${month}-${day}`;
}

function showSuccessFeedback(message) {
  if (!profileFeedback) return;
  profileFeedback.textContent = message;
  profileFeedback.classList.add('is-visible');
  clearTimeout(profileFeedback._timeout);
  profileFeedback._timeout = setTimeout(
    () => profileFeedback.classList.remove('is-visible'),
    3200,
  );
}

function toNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const normalized = String(value).replace(',', '.');
  const num = Number(normalized);
  return Number.isFinite(num) ? num : null;
}

function isValidNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function computeLeanMass(entry) {
  if (!isValidNumber(entry.weight) || !isValidNumber(entry.bodyFat))
    return null;
  return entry.weight * (1 - entry.bodyFat / 100);
}

function computeFatMass(entry) {
  if (!isValidNumber(entry.weight) || !isValidNumber(entry.bodyFat))
    return null;
  return entry.weight - computeLeanMass(entry);
}

function formatNumber(value, decimals = 0) {
  if (!isValidNumber(value)) return '--';
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function parseDate(input) {
  if (!input) return null;
  const iso =
    typeof input === 'string' && !input.includes('T')
      ? `${input}T00:00:00`
      : input;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(input) {
  const date = parseDate(input);
  if (!date) return 'Data não informada';
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function sortEvaluations(list) {
  return list.slice().sort((a, b) => {
    const dateB = parseDate(b.date);
    const dateA = parseDate(a.date);
    const timeB = dateB ? dateB.getTime() : b.id;
    const timeA = dateA ? dateA.getTime() : a.id;
    return timeB - timeA;
  });
}

function saveProfileToStorage(data) {
  try {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.warn('Não foi possível salvar os dados pessoais.', error);
  }
}

function saveEvaluationsToStorage(data) {
  try {
    localStorage.setItem(EVALUATION_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.warn('Não foi possível salvar as avaliações.', error);
  }
}

function loadProfileFromStorage() {
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (error) {
    console.warn('Não foi possível carregar os dados pessoais salvos.', error);
    return {};
  }
}

function loadEvaluationsFromStorage() {
  try {
    const raw = localStorage.getItem(EVALUATION_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const normalized = parsed.map((entry) => ({
      id: entry.id || Date.now() + Math.random(),
      height: toNumber(entry.height),
      waist: toNumber(entry.waist),
      neck: toNumber(entry.neck),
      weight: toNumber(entry.weight),
      bodyFat: toNumber(entry.bodyFat),
      date: entry.date || entry.createdAt || '',
    }));
    return sortEvaluations(normalized);
  } catch (error) {
    console.warn('Não foi possível carregar as avaliações.', error);
    return [];
  }
}

function saveActivePage(page) {
  if (!VALID_PAGES.includes(page)) return;
  try {
    localStorage.setItem(ACTIVE_PAGE_STORAGE_KEY, page);
  } catch (error) {
    console.warn('Não foi possível salvar a página ativa.', error);
  }
}

function loadActivePage() {
  try {
    const saved = localStorage.getItem(ACTIVE_PAGE_STORAGE_KEY);
    if (saved && VALID_PAGES.includes(saved)) return saved;
  } catch (error) {
    console.warn('Não foi possível carregar a última página ativa.', error);
  }
  return 'exercicios';
}

function exportData() {
  if (!window.Huffman) {
    alert('Algoritmo de Huffman ainda não está disponível.');
    return;
  }

  try {
    const payload = buildExportPayload();
    const jsonData = JSON.stringify(payload);
    const start = performance.now();
    const result = window.Huffman.huffmanCompress(jsonData);
    const execTime = performance.now() - start;

    const exportPackage = {
      version: 1,
      createdAt: new Date().toISOString(),
      compressed: result.compressed,
      padding: result.padding,
      tree: result.tree,
    };

    lastExportBlob = new Blob([JSON.stringify(exportPackage)], {
      type: 'application/json',
    });
    const today = new Date().toISOString().split('T')[0];
    lastExportFilename = `nushape-${today}.nushape`;

    updateExportModal({
      ...result.metrics,
      execTime,
    });
    openExportModal();
  } catch (error) {
    console.error('Erro ao exportar dados:', error);
    alert('Não foi possível exportar os dados. Tente novamente.');
  }
}

function buildExportPayload() {
  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    selectedExercises,
    profile: profileData,
    evaluations,
  };
}

function openExportModal() {
  if (!exportModal) return;
  exportModal.classList.add('is-active');
  exportModal.setAttribute('aria-hidden', 'false');
  document.body?.classList.add('modal-open');
  if (downloadExportBtn) downloadExportBtn.disabled = !lastExportBlob;
}

function closeExportModal() {
  if (!exportModal) return;
  exportModal.classList.remove('is-active');
  exportModal.setAttribute('aria-hidden', 'true');
  document.body?.classList.remove('modal-open');
}

function handleExportDownload() {
  if (!lastExportBlob) return;
  const url = URL.createObjectURL(lastExportBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = lastExportFilename || 'nushape-export.nushape';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function updateExportModal(metrics = {}) {
  if (!exportModal) return;
  const {
    originalBytes = 0,
    compressedBytes = 0,
    compressionRatio = 0,
    execTime = 0,
    uniqueChars = 0,
    averageDepth = 0,
    treeHeight = 0,
  } = metrics;

  if (exportOriginalSizeEl)
    exportOriginalSizeEl.textContent = formatBytes(originalBytes);
  if (exportCompressedSizeEl)
    exportCompressedSizeEl.textContent = formatBytes(compressedBytes);
  if (exportSavingsEl)
    exportSavingsEl.textContent = `${formatPercentage(
      compressionRatio,
    )} economia`;
  if (exportTimeEl) exportTimeEl.textContent = `${execTime.toFixed(2)} ms`;
  if (exportUniqueCharsEl) exportUniqueCharsEl.textContent = uniqueChars;
  if (exportAvgDepthEl) exportAvgDepthEl.textContent = averageDepth.toFixed(2);
  if (exportTreeHeightEl) exportTreeHeightEl.textContent = treeHeight;

  if (compressionBarFill) {
    const savings = Math.max(0, Math.min(100, compressionRatio));
    compressionBarFill.style.width = `${savings}%`;
    compressionBarFill.classList.toggle('is-negative', compressionRatio < 0);
  }

  if (downloadExportBtn) downloadExportBtn.disabled = !lastExportBlob;
}

function handleImportFile(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      if (!window.Huffman) throw new Error('Huffman indisponível');
      const parsed = JSON.parse(e.target.result);
      if (
        !parsed ||
        typeof parsed !== 'object' ||
        !Object.prototype.hasOwnProperty.call(parsed, 'compressed')
      ) {
        throw new Error('Arquivo inválido');
      }
      const jsonString = window.Huffman.huffmanDecompress(parsed);
      const data = JSON.parse(jsonString);
      applyImportedData(data);
      showSuccessFeedback('Dados importados com sucesso!');
    } catch (error) {
      console.error('Importação falhou:', error);
      alert(
        'Não foi possível importar os dados. Verifique o arquivo .nushape.',
      );
    } finally {
      // eslint-disable-next-line no-param-reassign
      event.target.value = '';
    }
  };
  reader.readAsText(file);
}

function applyImportedData(data = {}) {
  selectedExercises = Array.isArray(data.selectedExercises)
    ? data.selectedExercises
    : [];
  profileData = data.profile || {};
  evaluations = Array.isArray(data.evaluations) ? data.evaluations : [];

  saveSelectedExercises();
  saveProfileToStorage(profileData);
  saveEvaluationsToStorage(evaluations);

  updateSelectedCount();
  render(exercises, null);
  updateTreinosPage();
  populateProfileForm(profileData);
  renderEvaluationsUI();
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const value = bytes / 1024 ** exponent;
  return `${value.toFixed(2)} ${units[exponent]}`;
}

function formatPercentage(value) {
  if (!Number.isFinite(value)) return '0%';
  return `${value.toFixed(2)}%`;
}

/* FUNÇÕES EXTRAS */

function clearAllData() {
  localStorage.clear();
  selectedExercises = [];
  profileData = {};
  evaluations = [];

  updateSelectedCount();
  render(exercises, null);
  updateTreinosPage();
  populateProfileForm({});
  renderEvaluationsUI();
  closeEvaluationModal();
  closeClearModal();
  closeExportModal();

  const activePageEl = document.querySelector('.page.active');
  const currentPage = activePageEl?.id?.replace('page-', '') || 'exercicios';
  saveActivePage(currentPage);

  alert('✅ Todos os dados foram limpos com sucesso!');
  showSuccessFeedback('Todos os dados foram limpos com sucesso!');
}

function showStorageInfo() {
  const exercisesRaw = localStorage.getItem('nushape_selected_exercises') || '';
  const profileRaw = localStorage.getItem(PROFILE_STORAGE_KEY) || '';
  const evaluationsRaw = localStorage.getItem(EVALUATION_STORAGE_KEY) || '';
  const size = new Blob([exercisesRaw, profileRaw, evaluationsRaw]).size;
  const hasProfile = Object.values(profileData || {}).some((value) => value);

  alert(
    `ℹ️ Informações de Armazenamento\n\nExercícios salvos: ${
      selectedExercises.length
    }\nDados pessoais salvos: ${
      hasProfile ? 'Sim' : 'Não'
    }\nAvaliações registradas: ${
      evaluations.length
    }\nTamanho estimado: ${size} bytes\n\nOs dados são salvos localmente no seu navegador e persistem entre sessões.`,
  );
}

loadSelectedExercises();
render(exercises, null);
updateSelectedCount();
const initialPage = loadActivePage();
navigateTo(initialPage);
