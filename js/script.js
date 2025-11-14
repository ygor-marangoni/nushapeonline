/* Lógica de app / estado / UI */

const supportsPointerEvents = 'PointerEvent' in window;

let mode = 'sequential';
let selectedExercises = [];
const sorted = [...exercises].sort((a, b) =>
  a.name.localeCompare(b.name, 'pt-BR'),
);
const ACTIVE_PAGE_STORAGE_KEY = 'nushape_active_page';
const VALID_PAGES = ['exercicios', 'treinos', 'grafo', 'progresso', 'dados'];

/* PERFIL & AVALIAÇÕES - ESTADO */
const PROFILE_STORAGE_KEY = 'nushape_profile';
const EVALUATION_STORAGE_KEY = 'nushape_evaluations';
const WORKOUT_STORAGE_KEY = 'nushape_workouts';

let profileData = loadProfileFromStorage();
let evaluations = loadEvaluationsFromStorage();
let workouts = loadWorkoutsFromStorage();

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
const deleteWorkoutModal = document.getElementById('deleteWorkoutModal');
const deleteWorkoutName = document.getElementById('deleteWorkoutName');
const confirmDeleteWorkoutBtn = document.getElementById(
  'confirmDeleteWorkoutBtn',
);
const workoutModal = document.getElementById('workoutModal');
const workoutForm = document.getElementById('workoutForm');
const workoutList = document.getElementById('workoutList');
const workoutEmptyState = document.getElementById('workoutEmptyState');
const workoutCountEl = document.getElementById('workoutCount');
const workoutDetailsCard = document.getElementById('workoutDetails');
const workoutDetailsTitle = document.getElementById('workoutDetailsTitle');
const workoutDetailsMeta = document.getElementById('workoutDetailsMeta');
const workoutDetailsBody = document.getElementById('workoutDetailsBody');
const closeDetailsBtn = document.getElementById('closeDetailsBtn');
const daysOptions = document.getElementById('daysOptions');
const divisionOptions = document.getElementById('divisionOptions');
const volumeOptions = document.getElementById('volumeOptions');
const requirementsContainer = document.getElementById('exerciseRequirements');
const requirementsHint = document.getElementById('requirementsHint');
const generateWorkoutBtn = document.getElementById('generateWorkoutBtn');
const generationProgress = document.getElementById('generationProgress');
const generationResult = document.getElementById('generationResult');
const stepDots = document.querySelectorAll('.step-dot');
const workoutStepElements = document.querySelectorAll('.workout-step');
const openWorkoutButtons = document.querySelectorAll(
  '[data-open-workout-modal]',
);
const closeWorkoutButtons = document.querySelectorAll('[data-close-workout]');

const MIN_EXERCISES = {
  Peitoral: 2,
  Costas: 2,
  Pernas: 3,
  Braços: 2,
  Ombros: 1,
};

const workoutState = {
  currentStep: 1,
  furthestStep: 1,
  generationFinished: false,
  config: {
    daysPerWeek: 4,
    division: 'Sem Preferência',
    volume: 'medium',
    exerciseSource: 'ai',
  },
};

let lastExportBlob = null;
let lastExportFilename = '';
let activeWorkoutId = null;
let workoutPendingDeletion = null;
const workoutDragState = {
  dayIndex: null,
  sourceIndex: null,
  targetIndex: null,
  pointerId: null,
  hoveredRow: null,
};

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
  if (deleteWorkoutModal?.classList.contains('is-active'))
    closeDeleteWorkoutModal();
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

document
  .querySelectorAll('[data-close-delete-workout]')
  .forEach((button) =>
    button.addEventListener('click', closeDeleteWorkoutModal),
  );

if (deleteWorkoutModal) {
  deleteWorkoutModal.addEventListener('click', (event) => {
    if (event.target === deleteWorkoutModal) closeDeleteWorkoutModal();
  });
}

if (confirmDeleteWorkoutBtn) {
  confirmDeleteWorkoutBtn.addEventListener('click', confirmWorkoutDeletion);
}

if (importTrigger && importInput) {
  importTrigger.addEventListener('click', () => importInput.click());
  importInput.addEventListener('change', handleImportFile);
}

window.exportData = exportData;
window.__navigateHandler = navigateTo;
window.navigateTo = navigateTo;
if (
  Array.isArray(window.__pendingNavigateQueue) &&
  window.__pendingNavigateQueue.length
) {
  const queued = [...window.__pendingNavigateQueue];
  window.__pendingNavigateQueue.length = 0;
  queued.forEach((page) => navigateTo(page));
}

openWorkoutButtons.forEach((btn) =>
  btn.addEventListener('click', openWorkoutModal),
);
closeWorkoutButtons.forEach((btn) =>
  btn.addEventListener('click', closeWorkoutModal),
);
workoutModal?.addEventListener('click', (event) => {
  if (event.target === workoutModal) closeWorkoutModal();
});
if (closeDetailsBtn) {
  closeDetailsBtn.addEventListener('click', () => {
    workoutDetailsCard.style.display = 'none';
  });
}

  if (workoutDetailsCard) {
    workoutDetailsCard.addEventListener('click', (event) => {
    const editWorkoutBtn = event.target.closest('[data-edit-workout]');
    if (editWorkoutBtn) {
      handleWorkoutRename();
      return;
    }
    const deleteWorkoutBtn = event.target.closest('[data-delete-workout]');
    if (deleteWorkoutBtn) {
      if (activeWorkoutId) openDeleteWorkoutModal(activeWorkoutId);
      return;
    }
    const editDayBtn = event.target.closest('[data-edit-day]');
    if (editDayBtn) {
      const { dayIndex } = editDayBtn.dataset;
      if (typeof dayIndex !== 'undefined') {
        handleWorkoutDayRename(Number(dayIndex));
      }
      return;
    }
    const swapBtn = event.target.closest('[data-swap-up]');
    if (swapBtn) {
      const dayIndex = Number(swapBtn.dataset.dayIndex);
      const exerciseIndex = Number(swapBtn.dataset.exerciseIndex);
      handleExerciseSwapUp(dayIndex, exerciseIndex, swapBtn);
      return;
    }
  });
}

if (workoutDetailsBody) {
  workoutDetailsBody.addEventListener('input', handleExerciseFieldInput);
  workoutDetailsBody.addEventListener('change', handleExerciseFieldInput);
  if (supportsPointerEvents) {
    workoutDetailsBody.addEventListener(
      'pointerdown',
      handleExercisePointerDown,
    );
    workoutDetailsBody.addEventListener(
      'pointermove',
      handleExercisePointerMove,
    );
    workoutDetailsBody.addEventListener('pointerup', handleExercisePointerUp);
    workoutDetailsBody.addEventListener(
      'pointercancel',
      handleExercisePointerCancel,
    );
    workoutDetailsBody.addEventListener(
      'pointerleave',
      handleExercisePointerCancel,
    );
  } else {
    workoutDetailsBody.addEventListener(
      'touchstart',
      handleExerciseTouchStart,
      { passive: false },
    );
    workoutDetailsBody.addEventListener('touchmove', handleExerciseTouchMove, {
      passive: false,
    });
    workoutDetailsBody.addEventListener('touchend', handleExerciseTouchEnd);
    workoutDetailsBody.addEventListener(
      'touchcancel',
      handleExerciseTouchCancel,
    );
    workoutDetailsBody.addEventListener('mousedown', handleExerciseMouseDown);
    document.addEventListener('mousemove', handleExerciseMouseMove);
    document.addEventListener('mouseup', handleExerciseMouseUp);
  }
}

if (daysOptions) {
  daysOptions.querySelectorAll('button').forEach((button) => {
    if (Number(button.dataset.value) === workoutState.config.daysPerWeek) {
      button.classList.add('is-selected');
    }
    button.addEventListener('click', () => {
      daysOptions
        .querySelectorAll('button')
        .forEach((b) => b.classList.remove('is-selected'));
      button.classList.add('is-selected');
      workoutState.config.daysPerWeek = Number(button.dataset.value);
    });
  });
}

['division', 'volume', 'exerciseSource'].forEach((group) => {
  const inputs = workoutForm?.querySelectorAll(`[name="${group}"]`);
  inputs?.forEach((input) => {
    if (input.value === workoutState.config[group]) {
      input.checked = true;
    }
    input.addEventListener('change', () => {
      workoutState.config[group] = input.value;
      if (group === 'exerciseSource') {
        updateRequirementSummary();
      }
    });
  });
});

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

  renderWorkoutCards();
  updateRequirementSummary();
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
  updateGraphRepresentations();
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

function loadWorkoutsFromStorage() {
  try {
    const raw = localStorage.getItem(WORKOUT_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? normalizeWorkoutCollection(parsed) : [];
  } catch (error) {
    console.warn('Não foi possível carregar os treinos.', error);
    return [];
  }
}

function normalizeWorkoutCollection(list = []) {
  return list
    .filter((workout) => workout && Array.isArray(workout.days))
    .map((workout) => normalizeWorkout(workout));
}

function normalizeWorkout(workout) {
  const normalized = {
    ...workout,
    metrics: workout.metrics || {},
    days: (workout.days || []).map((day) => ({
      ...day,
      exercises: (day.exercises || []).map(normalizeWorkoutExercise),
    })),
  };
  updateWorkoutMetrics(normalized);
  return normalized;
}

function normalizeWorkoutExercise(exercise = {}) {
  const parsed = parsePrescription(exercise.prescription);
  const sets = Number.isFinite(exercise.sets)
    ? exercise.sets
    : parsed.sets || 3;
  const reps = exercise.reps || parsed.reps || '10-12';
  return {
    ...exercise,
    sets,
    reps,
    prescription: formatExercisePrescription({ sets, reps }),
  };
}

function parsePrescription(prescription = '') {
  const match = prescription.match(/(\d+)\s*x\s*([\d-]+)/i);
  if (!match) return { sets: null, reps: null };
  return {
    sets: Number(match[1]),
    reps: match[2],
  };
}

function saveWorkoutsToStorage(data) {
  try {
    localStorage.setItem(WORKOUT_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.warn('Não foi possível salvar os treinos.', error);
  }
}

function saveActivePage(page) {
  const normalized = typeof page === 'string' ? page.trim() : '';
  if (!normalized) return;
  try {
    localStorage.setItem(ACTIVE_PAGE_STORAGE_KEY, normalized);
  } catch (error) {
    console.warn('Não foi possível salvar a página ativa.', error);
  }
}

function loadActivePage() {
  try {
    const saved = (localStorage.getItem(ACTIVE_PAGE_STORAGE_KEY) || '').trim();
    if (saved && document.getElementById(`page-${saved}`)) return saved;
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
    version: 2,
    generatedAt: new Date().toISOString(),
    selectedExercises,
    profile: profileData,
    evaluations,
    workouts,
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
  workouts = Array.isArray(data.workouts)
    ? normalizeWorkoutCollection(data.workouts)
    : [];

  saveSelectedExercises();
  saveProfileToStorage(profileData);
  saveEvaluationsToStorage(evaluations);
  saveWorkoutsToStorage(workouts);

  updateSelectedCount();
  render(exercises, null);
  updateTreinosPage();
  populateProfileForm(profileData);
  renderEvaluationsUI();
  updateGraphRepresentations();
  renderWorkoutCards();
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

/* ===================== WORKOUTS ===================== */

function renderWorkoutCards() {
  if (!workoutList) return;
  if (workoutCountEl) workoutCountEl.textContent = workouts.length;

  if (!workouts.length) {
    workoutEmptyState?.style?.setProperty('display', 'flex');
    workoutList.innerHTML = '';
    workoutDetailsCard?.style?.setProperty('display', 'none');
    return;
  }

  workoutEmptyState?.style?.setProperty('display', 'none');
  workoutList.innerHTML = workouts
    .map(
      (workout) => `
      <article class="workout-card" data-workout-id="${
        workout.id
      }" role="button" tabindex="0" aria-label="Abrir detalhes do ${
        workout.name
      }">
        <small>${new Date(workout.createdAt).toLocaleDateString(
          'pt-BR',
        )}</small>
        <h4>${workout.name}</h4>
        <p style="color: var(--muted); margin: 6px 0;">${
          workout.days.length
        } dia(s) • ${workout.config.division}</p>
        <p style="font-size: 13px;">Volume semanal: ${
          workout.metrics.volumeTotal
        } séries</p>
      </article>`,
    )
    .join('');
}

workoutList?.addEventListener('click', (event) => {
  const card = event.target.closest('[data-workout-id]');
  if (!card) return;
  showWorkoutDetails(card.dataset.workoutId);
});

workoutList?.addEventListener('keydown', (event) => {
  const card = event.target.closest('[data-workout-id]');
  if (!card) return;
  const actionableKeys = ['Enter', ' '];
  if (!actionableKeys.includes(event.key)) return;
  event.preventDefault();
  showWorkoutDetails(card.dataset.workoutId);
});

function openWorkoutModal() {
  if (!workoutModal) return;
  workoutState.furthestStep = 1;
  workoutState.generationFinished = false;
  workoutModal.classList.add('is-active');
  workoutModal.setAttribute('aria-hidden', 'false');
  document.body?.classList.add('modal-open');
  goToWorkoutStep(1);
  if (generationResult) generationResult.style.display = 'none';
  generationProgress
    ?.querySelectorAll('li')
    .forEach((li) => li.classList.remove('is-complete'));
  const bar = generationProgress?.querySelector('.progress-bar span');
  if (bar) bar.style.width = '0%';
  resetGenerationButton();
  updateRequirementSummary();
}

function closeWorkoutModal() {
  if (!workoutModal) return;
  workoutModal.classList.remove('is-active');
  workoutModal.setAttribute('aria-hidden', 'true');
  document.body?.classList.remove('modal-open');
}

function goToWorkoutStep(step) {
  if (step > workoutState.furthestStep) return;
  workoutState.currentStep = Math.min(Math.max(step, 1), 3);
  workoutStepElements.forEach((element) => {
    element.classList.toggle(
      'is-active',
      Number(element.dataset.step) === workoutState.currentStep,
    );
  });
  stepDots.forEach((dot) => {
    const target = Number(dot.dataset.stepTarget);
    dot.classList.toggle('is-active', target === workoutState.currentStep);
    dot.classList.toggle('is-complete', target < workoutState.currentStep);
    dot.disabled = target > workoutState.furthestStep;
  });
}

workoutForm?.addEventListener('click', (event) => {
  const action = event.target.dataset.action;
  if (!action) return;
  event.preventDefault();

  if (action === 'back') {
    goToWorkoutStep(workoutState.currentStep - 1);
    return;
  }

  if (action === 'next') {
    if (
      workoutState.currentStep === 2 &&
      workoutState.config.exerciseSource === 'selected' &&
      !requirementsMet()
    ) {
      requirementsHint.textContent =
        'Selecione exercícios suficientes ou escolha a opção “Deixar o programa escolher”.';
      return;
    }
    const nextStep = workoutState.currentStep + 1;
    workoutState.furthestStep = Math.max(workoutState.furthestStep, nextStep);
    goToWorkoutStep(nextStep);
  }
});

stepDots.forEach((dot) => {
  dot.addEventListener('click', () => {
    if (dot.disabled) return;
    goToWorkoutStep(Number(dot.dataset.stepTarget));
  });
});

function updateRequirementSummary() {
  if (!requirementsContainer) return;
  const counts = countExercisesByCategory(selectedExercises);
  const items = Object.keys(MIN_EXERCISES)
    .map((category) => {
      const current = counts[category] || 0;
      const min = MIN_EXERCISES[category];
      const status = current >= min ? 'ok' : current === 0 ? 'bad' : 'warn';
      return `<div class="requirement-item ${status}"><span>${category}</span><span>${current}/${min}</span></div>`;
    })
    .join('');
  requirementsContainer.innerHTML = items;

  if (requirementsHint) {
    requirementsHint.textContent = requirementsMet()
      ? 'Todos os requisitos mínimos foram atendidos.'
      : buildRequirementHint();
  }
}

function buildRequirementHint() {
  const details = Object.entries(MIN_EXERCISES)
    .map(([category, min]) => `${category}: ${min}`)
    .join(' • ');
  return `Mantenha pelo menos ${details} ou permita que o Nushape complete para você.`;
}

function requirementsMet() {
  const counts = countExercisesByCategory(selectedExercises);
  return Object.entries(MIN_EXERCISES).every(
    ([category, min]) => (counts[category] || 0) >= min,
  );
}

function countExercisesByCategory(ids = []) {
  const counts = {};
  ids.forEach((exerciseId) => {
    const exercise = exercises.find((ex) => ex.id === exerciseId);
    if (!exercise) return;
    const category = getMuscleCategory(exercise.muscle);
    counts[category] = (counts[category] || 0) + 1;
  });
  return counts;
}

function getMuscleCategory(muscle = '') {
  const norm = muscle
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  if (norm.includes('peito') || norm.includes('peitoral')) return 'Peitoral';
  if (norm.includes('costa') || norm.includes('dorso')) return 'Costas';
  if (
    norm.includes('perna') ||
    norm.includes('posterior') ||
    norm.includes('glute')
  )
    return 'Pernas';
  if (norm.includes('ombro') || norm.includes('delto')) return 'Ombros';
  if (
    norm.includes('bicep') ||
    norm.includes('tricep') ||
    norm.includes('antebraco') ||
    norm.includes('braco')
  ) {
    return 'Braços';
  }
  return 'Outros';
}

function getExercisesByIds(ids = []) {
  return exercises.filter((ex) => ids.includes(ex.id));
}

function ensureMinimumPool(pool = []) {
  const counts = countExercisesByCategory(pool.map((ex) => ex.id));
  const result = [...pool];
  Object.entries(MIN_EXERCISES).forEach(([category, min]) => {
    const current = counts[category] || 0;
    if (current >= min) return;
    const needed = min - current;
    const candidates = exercises.filter(
      (ex) =>
        getMuscleCategory(ex.muscle) === category &&
        !result.some((existing) => existing.id === ex.id),
    );
    result.push(...candidates.slice(0, needed));
  });
  return result;
}

function getDivisionTemplate(division, days) {
  const templates = {
    'Bro Split': [
      { label: 'Dia A - Peitoral', muscles: ['Peitoral', 'Ombros'] },
      { label: 'Dia B - Costas', muscles: ['Costas', 'Braços'] },
      { label: 'Dia C - Pernas', muscles: ['Pernas'] },
      { label: 'Dia D - Ombros', muscles: ['Ombros', 'Braços'] },
      { label: 'Dia E - Braços', muscles: ['Braços'] },
    ],
    PPL: [
      { label: 'Dia Push', muscles: ['Peitoral', 'Ombros', 'Braços'] },
      { label: 'Dia Pull', muscles: ['Costas', 'Braços'] },
      { label: 'Dia Legs', muscles: ['Pernas'] },
    ],
    'Upper Lower': [
      {
        label: 'Dia Upper',
        muscles: ['Peitoral', 'Costas', 'Braços', 'Ombros'],
      },
      { label: 'Dia Lower', muscles: ['Pernas'] },
    ],
    'PPL + UL': [
      { label: 'Push', muscles: ['Peitoral', 'Ombros'] },
      { label: 'Pull', muscles: ['Costas', 'Braços'] },
      { label: 'Legs', muscles: ['Pernas'] },
      { label: 'Upper', muscles: ['Peitoral', 'Ombros', 'Braços'] },
      { label: 'Lower', muscles: ['Pernas'] },
    ],
    'Full Body': [
      {
        label: 'Full Body',
        muscles: ['Peitoral', 'Costas', 'Pernas', 'Ombros', 'Braços'],
      },
    ],
    'Sem Preferência': [
      { label: 'Peito + Ombro', muscles: ['Peitoral', 'Ombros'] },
      { label: 'Costas + Braços', muscles: ['Costas', 'Braços'] },
      { label: 'Pernas', muscles: ['Pernas'] },
    ],
  };

  const base = templates[division] || templates['Sem Preferência'];
  const output = [];
  for (let i = 0; i < days; i += 1) {
    output.push(base[i % base.length]);
  }
  return output.map((entry, index) => ({
    label: entry.label || `Dia ${String.fromCharCode(65 + index)}`,
    muscles: entry.muscles,
  }));
}

const volumePresets = {
  low: { exercisesPerMuscle: 1, sets: 3, reps: '8-10' },
  medium: { exercisesPerMuscle: 2, sets: 4, reps: '10-12' },
  high: { exercisesPerMuscle: 3, sets: 5, reps: '12-15' },
  deload: { exercisesPerMuscle: 1, sets: 2, reps: '8-10' },
};

function pickExerciseFromPool(
  pool,
  targetMuscle,
  usageTracker,
  usedInDay,
  lastExerciseId,
  allowedCategories = [],
) {
  const category = getMuscleCategory(targetMuscle);
  const byCategory = pool.filter(
    (ex) => getMuscleCategory(ex.muscle) === category,
  );
  const allowedPool =
    allowedCategories.length > 0
      ? pool.filter((ex) =>
          allowedCategories.includes(getMuscleCategory(ex.muscle)),
        )
      : pool;

  const candidate =
    findBestCandidate(byCategory, usageTracker, usedInDay, lastExerciseId) ||
    findBestCandidate(allowedPool, usageTracker, usedInDay, lastExerciseId);

  if (!candidate) return null;

  usedInDay.add(candidate.id);
  usageTracker.set(candidate.id, (usageTracker.get(candidate.id) || 0) + 1);
  return candidate;
}

function findBestCandidate(dataset, usageTracker, usedInDay, lastExerciseId) {
  if (!dataset.length) return null;
  const sorted = [...dataset].sort(
    (a, b) => (usageTracker.get(a.id) || 0) - (usageTracker.get(b.id) || 0),
  );
  for (const exercise of sorted) {
    if (usedInDay.has(exercise.id)) continue;
    if (exercise.id === lastExerciseId) continue;
    return exercise;
  }
  for (const exercise of sorted) {
    if (!usedInDay.has(exercise.id)) return exercise;
  }
  return null;
}

function formatExercisePrescription(exercise = {}) {
  const sets = Number.isFinite(exercise.sets) ? exercise.sets : '';
  const reps = exercise.reps || '';
  if (!sets && !reps) return '--';
  if (!sets) return reps;
  if (!reps) return `${sets}x`;
  return `${sets}x${reps}`;
}

function updateWorkoutMetrics(workout) {
  if (!workout || !Array.isArray(workout.days)) return;
  const totalSets = workout.days.reduce((acc, day) => {
    const daySets = (day.exercises || []).reduce(
      (sum, exercise) => sum + (Number(exercise.sets) || 0),
      0,
    );
    return acc + daySets;
  }, 0);
  workout.metrics = workout.metrics || {};
  workout.metrics.volumeTotal = totalSets;
}

function generateWorkoutPlan(execTime = 0) {
  const config = workoutState.config;
  let pool =
    config.exerciseSource === 'selected'
      ? getExercisesByIds(selectedExercises)
      : [];

  if (config.exerciseSource === 'ai' || !pool.length) {
    pool = [];
  }

  pool = ensureMinimumPool(pool);
  if (!pool.length) {
    pool = ensureMinimumPool(exercises.slice(0, 20));
  }

  const templates = getDivisionTemplate(config.division, config.daysPerWeek);
  const volumePreset = volumePresets[config.volume] || volumePresets.medium;
  const defaultPrescription = formatExercisePrescription({
    sets: volumePreset.sets,
    reps: volumePreset.reps,
  });
  const usageTracker = new Map();

  const days = templates.map((template, index) => {
    const usedInDay = new Set();
    let lastExerciseId = null;
    const allowedCategories = Array.from(
      new Set(template.muscles.map((muscle) => getMuscleCategory(muscle))),
    );
    const exercisesForDay = [];
    template.muscles.forEach((muscle) => {
      for (let i = 0; i < volumePreset.exercisesPerMuscle; i += 1) {
        const picked = pickExerciseFromPool(
          pool,
          muscle,
          usageTracker,
          usedInDay,
          lastExerciseId,
          allowedCategories,
        );
        if (picked) {
          exercisesForDay.push({
            id: picked.id,
            name: picked.name,
            muscle: picked.muscle,
            equipment: picked.equipment,
            sets: volumePreset.sets,
            reps: volumePreset.reps,
            prescription: defaultPrescription,
          });
          lastExerciseId = picked.id;
        }
      }
    });

    if (!exercisesForDay.length) {
      const fallbackMuscles = allowedCategories.length
        ? allowedCategories
        : ['Peitoral', 'Costas', 'Braços', 'Ombros', 'Pernas'];
      for (let i = 0; i < Math.min(2, fallbackMuscles.length); i += 1) {
        const fallback = pickExerciseFromPool(
          pool,
          fallbackMuscles[i],
          usageTracker,
          usedInDay,
          lastExerciseId,
          allowedCategories,
        );
        if (fallback) {
          exercisesForDay.push({
            id: fallback.id,
            name: fallback.name,
            muscle: fallback.muscle,
            equipment: fallback.equipment,
            sets: volumePreset.sets,
            reps: volumePreset.reps,
            prescription: defaultPrescription,
          });
          lastExerciseId = fallback.id;
        }
      }
    }

    return {
      label: template.label || `Dia ${String.fromCharCode(65 + index)}`,
      focus: template.muscles.join(' / '),
      exercises: exercisesForDay,
    };
  });

  if (days.length > 1) {
    for (let i = 1; i < days.length; i += 1) {
      if (days[i].label === days[i - 1].label) {
        days[i].label = `${days[i].label} • Variação`;
      }
    }
    if (days[0].label === days[days.length - 1].label) {
      days[days.length - 1].label = `${days[days.length - 1].label} • Extra`;
    }
  }

  const equipmentSwitches = days.reduce(
    (acc, day) => acc + calculateEquipmentSwitches(day.exercises),
    0,
  );
  const volumeTotal = days.reduce(
    (acc, day) =>
      acc +
      day.exercises.reduce(
        (sum, exercise) => sum + (Number(exercise.sets) || volumePreset.sets),
        0,
      ),
    0,
  );

  const plan = {
    id: `${Date.now()}`,
    name: `Treino ${workouts.length + 1}`,
    createdAt: new Date().toISOString(),
    config: { ...config },
    days,
    metrics: {
      algorithm: 'Graph Planner v1',
      timeMs: execTime,
      equipmentSwitches,
      volumeTotal,
    },
  };
  return normalizeWorkout(plan);
}

function calculateEquipmentSwitches(exercisesList = []) {
  if (!exercisesList.length) return 0;
  let switches = 0;
  for (let i = 1; i < exercisesList.length; i += 1) {
    if (exercisesList[i].equipment !== exercisesList[i - 1].equipment)
      switches += 1;
  }
  return switches;
}

function showWorkoutDetails(id, options = {}) {
  const { scrollIntoView: shouldScroll = true } = options;
  if (!workoutDetailsCard) return;
  const workout = workouts.find((w) => w.id === id);
  if (!workout) return;
  activeWorkoutId = workout.id;
  workoutDetailsCard.dataset.currentWorkoutId = workout.id;
  workoutDetailsCard.style.display = 'block';
  workoutDetailsTitle.textContent = workout.name;
  workoutDetailsMeta.textContent = `${workout.days.length} dia(s) • ${workout.config.division} • Volume total: ${workout.metrics.volumeTotal} séries`;
  const workoutDaysMarkup = workout.days
    .map(
      (day, index) => `
        <div class="workout-day" data-day-index="${index}">
          <div class="workout-day-header">
            <h4>${day.label}</h4>
            <button type="button" class="icon-square-button" data-edit-day data-day-index="${index}" aria-label="Renomear ${
        day.label
      }">
              <img src="assets/icons/botao-editar.png" alt="" width="18" height="18">
            </button>
          </div>
          ${day.exercises
            .map((exercise, exerciseIndex) => {
              const prescription = formatExercisePrescription(exercise);
              return `
                <div
                  class="workout-exercise-row"
                  data-day-index="${index}"
                  data-exercise-index="${exerciseIndex}"
                >
                  <div class="exercise-reorder">
                    <span class="exercise-order-badge">${
                      exerciseIndex + 1
                    }°</span>
                    <button
                      type="button"
                      class="reorder-btn"
                      data-swap-up
                      data-day-index="${index}"
                      data-exercise-index="${exerciseIndex}"
                      aria-label="Mover ${exercise.name} para cima"
                      ${exerciseIndex === 0 ? 'disabled' : ''}
                    >
                      <span aria-hidden="true">⮂</span>
                    </button>
                  </div>
                  <div class="exercise-info">
                    <strong>${exercise.name}</strong>
                    <p style="font-size: 12px; color: var(--muted); margin: 2px 0 0;">${
                      exercise.muscle
                    } • ${exercise.equipment}</p>
                  </div>
                  <div class="exercise-controls">
                    <label class="exercise-field">
                      <span>Séries</span>
                      <input
                        type="number"
                        min="0"
                        max="50"
                        step="1"
                        value="${Number(exercise.sets) || ''}"
                        data-exercise-set
                        data-day-index="${index}"
                        data-exercise-index="${exerciseIndex}"
                        aria-label="Editar séries de ${exercise.name}"
                      />
                    </label>
                    <label class="exercise-field">
                      <span>Reps</span>
                      <input
                        type="text"
                        inputmode="numeric"
                        maxlength="7"
                        value="${exercise.reps || ''}"
                        data-exercise-reps
                        data-day-index="${index}"
                        data-exercise-index="${exerciseIndex}"
                        aria-label="Editar repetições de ${exercise.name}"
                      />
                    </label>
                    <span class="exercise-prescription" data-prescription-label>${prescription}</span>
                  </div>
                </div>
              `;
            })
            .join('')}
        </div>
      `,
    )
    .join('');
  workoutDetailsBody.innerHTML = `
    <p class="workout-drag-hint">Arraste os cards (desktop) ou toque em ⮂ (mobile) para reorganizar. Ajuste séries e reps diretamente nos campos.</p>
    ${workoutDaysMarkup}
  `;
  if (shouldScroll) {
    workoutDetailsCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function updateWorkoutDetailsMeta(workout) {
  if (!workoutDetailsMeta || !workout) return;
  workoutDetailsMeta.textContent = `${workout.days.length} dia(s) • ${workout.config.division} • Volume total: ${workout.metrics.volumeTotal} séries`;
}

function handleExerciseFieldInput(event) {
  const target = event.target;
  if (!target.matches('[data-exercise-set], [data-exercise-reps]')) return;
  if (!activeWorkoutId) return;
  const dayIndex = Number(target.dataset.dayIndex);
  const exerciseIndex = Number(target.dataset.exerciseIndex);
  const workout = workouts.find((w) => w.id === activeWorkoutId);
  if (!workout || !workout.days?.[dayIndex]?.exercises?.[exerciseIndex]) return;
  const exercise = workout.days[dayIndex].exercises[exerciseIndex];

  if (target.matches('[data-exercise-set]')) {
    let value = Number(target.value);
    if (!Number.isFinite(value) || value < 0) value = 0;
    if (value > 50) value = 50;
    exercise.sets = value;
    target.value = value;
  } else {
    let repsValue = target.value.replace(/[^0-9-]/g, '');
    repsValue = repsValue.replace(/^-+/, '');
    repsValue = repsValue.replace(/-{2,}/g, '-');
    if (event.type === 'change') {
      repsValue = repsValue.replace(/-$/, '');
      if (!repsValue) {
        repsValue = exercise.reps || '10-12';
      }
    }
    repsValue = repsValue.slice(0, 7);
    exercise.reps = repsValue;
    target.value = repsValue;
  }

  exercise.prescription = formatExercisePrescription(exercise);
  const label = target
    .closest('.exercise-controls')
    ?.querySelector('[data-prescription-label]');
  if (label) label.textContent = exercise.prescription;

  updateWorkoutMetrics(workout);
  saveWorkoutsToStorage(workouts);
  renderWorkoutCards();
  updateWorkoutDetailsMeta(workout);
}

function handleExercisePointerDown(event) {
  if (!event.isPrimary || event.button === 2) return;
  if (event.target.closest('input, textarea, select, button, label')) return;
  const row = event.target.closest('.workout-exercise-row');
  if (!row) return;
  event.preventDefault();
  workoutDragState.dayIndex = Number(row.dataset.dayIndex);
  workoutDragState.sourceIndex = Number(row.dataset.exerciseIndex);
  workoutDragState.targetIndex = null;
  workoutDragState.pointerId = event.pointerId;
  workoutDragState.hoveredRow = null;
  row.classList.add('is-dragging');
  row.setPointerCapture?.(event.pointerId);
}

function handleExercisePointerMove(event) {
  if (
    !workoutDragState.pointerId ||
    event.pointerId !== workoutDragState.pointerId
  )
    return;
  event.preventDefault();
  const hovered = document
    .elementFromPoint(event.clientX, event.clientY)
    ?.closest('.workout-exercise-row');
  if (!hovered) {
    if (workoutDragState.hoveredRow) {
      workoutDragState.hoveredRow.classList.remove('is-drop-target');
      workoutDragState.hoveredRow = null;
      workoutDragState.targetIndex = null;
    }
    return;
  }
  const dayIndex = Number(hovered.dataset.dayIndex);
  if (dayIndex !== workoutDragState.dayIndex) return;
  if (workoutDragState.hoveredRow !== hovered) {
    workoutDragState.hoveredRow?.classList.remove('is-drop-target');
    hovered.classList.add('is-drop-target');
    workoutDragState.hoveredRow = hovered;
  }
  workoutDragState.targetIndex = Number(hovered.dataset.exerciseIndex);
}

function handleExercisePointerUp(event) {
  if (
    !workoutDragState.pointerId ||
    event.pointerId !== workoutDragState.pointerId
  )
    return;
  event.preventDefault();
  finalizeWorkoutDrag(true);
}

function handleExercisePointerCancel(event) {
  if (
    !workoutDragState.pointerId ||
    event.pointerId !== workoutDragState.pointerId
  )
    return;
  finalizeWorkoutDrag(false);
}

function handleExerciseTouchStart(event) {
  if (supportsPointerEvents) return;
  if (event.touches.length !== 1) return;
  const touch = event.touches[0];
  handleExercisePointerDown(
    createPointerEventShim({
      target: event.target,
      pointerId: touch.identifier ?? 0,
      clientX: touch.clientX,
      clientY: touch.clientY,
      preventDefault: () => event.preventDefault(),
    }),
  );
}

function handleExerciseTouchMove(event) {
  if (supportsPointerEvents || workoutDragState.pointerId === null) return;
  const touch = findTouchByIdentifier(
    event.touches,
    workoutDragState.pointerId,
  );
  if (!touch) return;
  handleExercisePointerMove(
    createPointerEventShim({
      target:
        document.elementFromPoint(touch.clientX, touch.clientY) || event.target,
      pointerId: workoutDragState.pointerId,
      clientX: touch.clientX,
      clientY: touch.clientY,
      preventDefault: () => event.preventDefault(),
    }),
  );
}

function handleExerciseTouchEnd(event) {
  if (supportsPointerEvents || workoutDragState.pointerId === null) return;
  const touch = findTouchByIdentifier(
    event.changedTouches,
    workoutDragState.pointerId,
  );
  if (!touch) return;
  handleExercisePointerUp(
    createPointerEventShim({
      target: event.target,
      pointerId: workoutDragState.pointerId,
      clientX: touch.clientX,
      clientY: touch.clientY,
      preventDefault: () => event.preventDefault(),
    }),
  );
}

function handleExerciseTouchCancel(event) {
  if (supportsPointerEvents || workoutDragState.pointerId === null) return;
  handleExercisePointerCancel(
    createPointerEventShim({
      target: event.target,
      pointerId: workoutDragState.pointerId,
      clientX: 0,
      clientY: 0,
      preventDefault: () => event.preventDefault(),
    }),
  );
}

function handleExerciseMouseDown(event) {
  if (supportsPointerEvents || event.button !== 0) return;
  if (event.target.closest('input, textarea, select, button, label')) return;
  handleExercisePointerDown(
    createPointerEventShim({
      target: event.target,
      pointerId: 'mouse',
      clientX: event.clientX,
      clientY: event.clientY,
      preventDefault: () => event.preventDefault(),
    }),
  );
}

function handleExerciseMouseMove(event) {
  if (supportsPointerEvents || workoutDragState.pointerId !== 'mouse') return;
  handleExercisePointerMove(
    createPointerEventShim({
      target:
        document.elementFromPoint(event.clientX, event.clientY) || event.target,
      pointerId: 'mouse',
      clientX: event.clientX,
      clientY: event.clientY,
      preventDefault: () => event.preventDefault(),
    }),
  );
}

function handleExerciseMouseUp(event) {
  if (supportsPointerEvents || workoutDragState.pointerId !== 'mouse') return;
  handleExercisePointerUp(
    createPointerEventShim({
      target: event.target,
      pointerId: 'mouse',
      clientX: event.clientX,
      clientY: event.clientY,
      preventDefault: () => event.preventDefault(),
    }),
  );
}

function createPointerEventShim({
  target,
  pointerId,
  clientX,
  clientY,
  preventDefault = () => {},
}) {
  return {
    target,
    pointerId,
    clientX,
    clientY,
    preventDefault,
    isPrimary: true,
    button: 0,
  };
}

function findTouchByIdentifier(touchList, identifier) {
  if (!touchList) return null;
  for (let i = 0; i < touchList.length; i += 1) {
    if (touchList[i].identifier === identifier) return touchList[i];
  }
  return null;
}

function finalizeWorkoutDrag(apply) {
  workoutDetailsBody
    ?.querySelectorAll(
      '.workout-exercise-row.is-dragging, .workout-exercise-row.is-drop-target',
    )
    .forEach((row) => row.classList.remove('is-dragging', 'is-drop-target'));
  if (
    apply &&
    workoutDragState.dayIndex !== null &&
    workoutDragState.sourceIndex !== null &&
    workoutDragState.targetIndex !== null &&
    workoutDragState.sourceIndex !== workoutDragState.targetIndex
  ) {
    reorderWorkoutExercises(
      workoutDragState.dayIndex,
      workoutDragState.sourceIndex,
      workoutDragState.targetIndex,
    );
  }
  resetWorkoutDragState();
}

function resetWorkoutDragState() {
  workoutDragState.dayIndex = null;
  workoutDragState.sourceIndex = null;
  workoutDragState.targetIndex = null;
  workoutDragState.pointerId = null;
  workoutDragState.hoveredRow = null;
}

function reorderWorkoutExercises(dayIndex, fromIndex, toIndex, options = {}) {
  if (!activeWorkoutId) return;
  const workout = workouts.find((w) => w.id === activeWorkoutId);
  if (!workout) return;
  const exercises = workout.days?.[dayIndex]?.exercises;
  if (!Array.isArray(exercises)) return;
  if (
    fromIndex < 0 ||
    fromIndex >= exercises.length ||
    toIndex < 0 ||
    toIndex >= exercises.length
  ) {
    return;
  }
  const { preserveScroll = false, anchorOffset } = options;
  let initialOffset = null;
  if (preserveScroll) {
    if (typeof anchorOffset === 'number') {
      initialOffset = anchorOffset;
    } else {
      const anchorRow = document.querySelector(
        `.workout-exercise-row[data-day-index="${dayIndex}"][data-exercise-index="${fromIndex}"]`,
      );
      initialOffset = anchorRow?.getBoundingClientRect().top ?? null;
    }
  }

  const [moved] = exercises.splice(fromIndex, 1);
  exercises.splice(toIndex, 0, moved);
  updateWorkoutMetrics(workout);
  saveWorkoutsToStorage(workouts);
  renderWorkoutCards();
  showWorkoutDetails(workout.id, { scrollIntoView: false });
  if (preserveScroll && initialOffset !== null) {
    const targetRow = document.querySelector(
      `.workout-exercise-row[data-day-index="${dayIndex}"][data-exercise-index="${toIndex}"]`,
    );
    const newTop = targetRow?.getBoundingClientRect().top;
    if (typeof newTop === 'number') {
      window.scrollBy({ top: newTop - initialOffset, behavior: 'auto' });
    }
  }
}

function handleExerciseSwapUp(dayIndex, exerciseIndex, trigger) {
  if (exerciseIndex <= 0) return;
  const anchorRow = trigger?.closest('.workout-exercise-row');
  const anchorOffset = anchorRow?.getBoundingClientRect().top ?? null;
  reorderWorkoutExercises(dayIndex, exerciseIndex, exerciseIndex - 1, {
    preserveScroll: true,
    anchorOffset,
  });
}

function handleWorkoutRename() {
  if (!activeWorkoutId) return;
  const workout = workouts.find((w) => w.id === activeWorkoutId);
  if (!workout) return;
  const newName = window.prompt('Digite o novo nome do treino:', workout.name);
  if (newName === null) return;
  const trimmed = newName.trim();
  if (!trimmed || trimmed === workout.name) return;
  workout.name = trimmed;
  saveWorkoutsToStorage(workouts);
  renderWorkoutCards();
  showWorkoutDetails(workout.id);
}

function handleWorkoutDayRename(dayIndex) {
  if (!activeWorkoutId || Number.isNaN(dayIndex)) return;
  const workout = workouts.find((w) => w.id === activeWorkoutId);
  if (!workout || !Array.isArray(workout.days) || !workout.days[dayIndex])
    return;
  const currentLabel = workout.days[dayIndex].label || `Dia ${dayIndex + 1}`;
  const newLabel = window.prompt('Digite o novo nome do dia:', currentLabel);
  if (newLabel === null) return;
  const trimmed = newLabel.trim();
  if (!trimmed || trimmed === currentLabel) return;
  workout.days[dayIndex].label = trimmed;
  saveWorkoutsToStorage(workouts);
  renderWorkoutCards();
  showWorkoutDetails(workout.id);
}

function openDeleteWorkoutModal(workoutId) {
  if (!deleteWorkoutModal || !workoutId) return;
  workoutPendingDeletion = workoutId;
  const workout = workouts.find((w) => w.id === workoutId);
  if (deleteWorkoutName) {
    deleteWorkoutName.textContent = workout ? workout.name : '';
  }
  deleteWorkoutModal.classList.add('is-active');
  deleteWorkoutModal.setAttribute('aria-hidden', 'false');
  document.body?.classList.add('modal-open');
}

function closeDeleteWorkoutModal() {
  if (!deleteWorkoutModal) return;
  workoutPendingDeletion = null;
  deleteWorkoutModal.classList.remove('is-active');
  deleteWorkoutModal.setAttribute('aria-hidden', 'true');
  document.body?.classList.remove('modal-open');
}

function confirmWorkoutDeletion() {
  if (!workoutPendingDeletion) return;
  const targetId = workoutPendingDeletion;
  const wasActive = activeWorkoutId === targetId;
  workouts = workouts.filter((w) => w.id !== targetId);
  saveWorkoutsToStorage(workouts);
  renderWorkoutCards();

  if (wasActive) {
    activeWorkoutId = null;
    if (workouts.length) {
      showWorkoutDetails(workouts[0].id);
    } else if (workoutDetailsCard) {
      workoutDetailsCard.style.display = 'none';
    }
  } else if (activeWorkoutId) {
    const stillExists = workouts.some((w) => w.id === activeWorkoutId);
    if (stillExists) {
      showWorkoutDetails(activeWorkoutId);
    } else if (workouts.length) {
      activeWorkoutId = null;
      showWorkoutDetails(workouts[0].id);
    } else if (workoutDetailsCard) {
      workoutDetailsCard.style.display = 'none';
    }
  }

  closeDeleteWorkoutModal();
}

generateWorkoutBtn?.addEventListener('click', () => {
  if (workoutState.generationFinished) {
    closeWorkoutModal();
    return;
  }
  runWorkoutGeneration();
});

function runWorkoutGeneration() {
  if (!generationProgress) return;
  if (generationResult) generationResult.style.display = 'none';
  const tasks = [...generationProgress.querySelectorAll('li')];
  tasks.forEach((task) => task.classList.remove('is-complete'));
  const bar = generationProgress.querySelector('.progress-bar span');
  if (bar) bar.style.width = '0%';
  if (generateWorkoutBtn) {
    generateWorkoutBtn.disabled = true;
    generateWorkoutBtn.textContent = 'Gerando...';
    generateWorkoutBtn.classList.add('is-loading');
  }

  const start = performance.now();
  tasks.forEach((task, index) => {
    setTimeout(() => {
      task.classList.add('is-complete');
      if (bar) bar.style.width = `${((index + 1) / tasks.length) * 100}%`;
    }, 400 * (index + 1));
  });

  setTimeout(() => {
    const plan = generateWorkoutPlan(performance.now() - start);
    workouts.push(plan);
    saveWorkoutsToStorage(workouts);
    renderWorkoutCards();
    showWorkoutDetails(plan.id);
    generationResult.innerHTML = `<strong>Treino gerado!</strong> Tempo: ${plan.metrics.timeMs.toFixed(
      2,
    )} ms • Volume total: ${
      plan.metrics.volumeTotal
    } séries • Trocas de equipamento: ${plan.metrics.equipmentSwitches}`;
    generationResult.style.display = 'block';
    markGenerationFinished();
    if (generateWorkoutBtn) {
      generateWorkoutBtn.disabled = false;
      generateWorkoutBtn.classList.remove('is-loading');
    }
  }, 400 * tasks.length + 300);
}

function resetGenerationButton() {
  if (!generateWorkoutBtn) return;
  workoutState.generationFinished = false;
  generateWorkoutBtn.disabled = false;
  generateWorkoutBtn.textContent = 'Gerar treino';
  generateWorkoutBtn.classList.remove('is-loading', 'is-finished');
}

function markGenerationFinished() {
  if (!generateWorkoutBtn) return;
  workoutState.generationFinished = true;
  generateWorkoutBtn.textContent = 'Concluído';
  generateWorkoutBtn.classList.add('is-finished');
}

/* ===================== GRAFOS ===================== */

const recoveryDependencies = {
  Costas: ['Bíceps', 'Antebraços'],
  Peitoral: ['Tríceps', 'Ombros'],
  Pernas: ['Glúteos', 'Panturrilhas'],
  Ombros: ['Tríceps'],
};

function buildWorkoutGraph(selectedIds = []) {
  if (!window.GraphRepresentation?.Graph) return null;
  if (!selectedIds.length) return null;

  const graph = new window.GraphRepresentation.Graph({
    directed: true,
    weighted: true,
  });
  const selectedData = exercises.filter((ex) => selectedIds.includes(ex.id));
  if (!selectedData.length) return null;

  selectedData.forEach((exercise) => {
    graph.addVertex(String(exercise.id), {
      name: exercise.name,
      muscle: exercise.muscle,
      equipment: exercise.equipment,
    });
  });

  for (let i = 0; i < selectedData.length; i += 1) {
    for (let j = 0; j < selectedData.length; j += 1) {
      if (i === j) continue;
      const from = selectedData[i];
      const to = selectedData[j];
      const weight = calculateEdgeWeight(from, to);
      if (Number.isFinite(weight)) {
        graph.addEdge(String(from.id), String(to.id), weight);
      }
    }
  }

  return graph;
}

function calculateEdgeWeight(from, to) {
  let cost = 1;
  cost += from.equipment === to.equipment ? 1 : 4;
  cost += from.muscle === to.muscle ? 1 : 2;

  if (hasRecoveryDependency(from.muscle, to.muscle)) {
    cost += 2;
  }

  return Math.max(1, Math.round(cost));
}

function hasRecoveryDependency(fromMuscle, toMuscle) {
  const deps = recoveryDependencies[fromMuscle];
  if (!deps) return false;
  return deps.includes(toMuscle);
}

function updateGraphRepresentations() {
  if (!document.getElementById('graphPanels')) return;
  const graph = buildWorkoutGraph(selectedExercises);
  renderGraphRepresentations(graph);
}

function renderGraphRepresentations(graph) {
  const emptyState = document.getElementById('graphEmptyState');
  const panels = document.getElementById('graphPanels');
  const matrixTable = document.getElementById('adjacencyMatrixTable');
  const listContainer = document.getElementById('adjacencyListContainer');

  if (!emptyState || !panels || !matrixTable || !listContainer) return;

  if (!graph || graph.vertices.size === 0) {
    emptyState.style.display = 'flex';
    panels.style.display = 'none';
    matrixTable.innerHTML = '';
    listContainer.innerHTML = '';
    return;
  }

  emptyState.style.display = 'none';
  panels.style.display = 'grid';

  const { ids, matrix } = graph.toAdjacencyMatrix();
  const headerCells = ids
    .map((id) => `<th>${graph.vertices.get(id)?.name || id}</th>`)
    .join('');
  const header = `<tr><th>Exercício</th>${headerCells}</tr>`;
  const rows = ids
    .map((id, rowIndex) => {
      const cells = matrix[rowIndex]
        .map((value) => `<td>${value || ''}</td>`)
        .join('');
      return `<tr><th>${graph.vertices.get(id)?.name || id}</th>${cells}</tr>`;
    })
    .join('');
  matrixTable.innerHTML = `<thead>${header}</thead><tbody>${rows}</tbody>`;

  const adjacencyList = graph.toAdjacencyList();
  listContainer.innerHTML = ids
    .map((id) => {
      const vertex = graph.vertices.get(id);
      const neighbors = adjacencyList[id];
      const chips = neighbors.length
        ? neighbors
            .map((neighbor) => {
              const label =
                graph.vertices.get(neighbor.id)?.name || neighbor.id;
              return `<span>${label} • ${neighbor.weight}</span>`;
            })
            .join('')
        : '<span>Sem conexões</span>';
      return `<div class="graph-list-item"><strong>${
        vertex?.name || id
      }</strong>${chips}</div>`;
    })
    .join('');
}

/* FUNÇÕES EXTRAS */

function clearAllData() {
  localStorage.clear();
  selectedExercises = [];
  profileData = {};
  evaluations = [];
  workouts = [];

  updateSelectedCount();
  render(exercises, null);
  updateTreinosPage();
  populateProfileForm({});
  renderEvaluationsUI();
  renderWorkoutCards();
  updateRequirementSummary();
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
updateGraphRepresentations();
