/* Lógica de app / estado / UI */

const supportsPointerEvents = 'PointerEvent' in window;

let selectedExercises = [];
const ACTIVE_PAGE_STORAGE_KEY = 'nushape_active_page';
const SELECTED_EXERCISES_STORAGE_KEY = 'nushape_selected_exercises';
const VALID_PAGES = [
  'login',
  'dashboard',
  'biblioteca',
  'sessao',
  'exercicios',
  'treinos',
  'progresso',
  'dados',
];

/* PERFIL & AVALIAÇÕES - ESTADO */
const PROFILE_STORAGE_KEY = 'nushape_profile';
const EVALUATION_STORAGE_KEY = 'nushape_evaluations';
const WORKOUT_STORAGE_KEY = 'nushape_workouts';
const SESSION_STORAGE_KEY = 'nushape_session_logs';
const STATE_META_STORAGE_KEY = 'nushape_state_meta';
const STATE_OWNER_STORAGE_KEY = 'nushape_state_owner';
const CLOUD_STATE_TABLE = 'user_state';
const EVALUATIONS_TABLE = 'physical_evaluations';
const EXPORT_PACKAGE_VERSION = 1;
const EXPORT_DATA_VERSION = 3;
const EXPORT_CODEC = 'lz-string';

const storageService = {
  getJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch (error) {
      console.warn(`Não foi possível ler ${key} do storage.`, error);
      return fallback;
    }
  },
  setJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.warn(`Não foi possível salvar ${key} no storage.`, error);
      return false;
    }
  },
  getString(key, fallback = '') {
    try {
      const raw = localStorage.getItem(key);
      return typeof raw === 'string' ? raw : fallback;
    } catch (error) {
      console.warn(`Não foi possível ler ${key} do storage.`, error);
      return fallback;
    }
  },
  setString(key, value) {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.warn(`Não foi possível salvar ${key} no storage.`, error);
      return false;
    }
  },
  clearAll() {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.warn('Não foi possível limpar o storage.', error);
      return false;
    }
  },
};

let stateMeta = loadStateMeta();
let profileData = loadProfileFromStorage();
let evaluations = loadEvaluationsFromStorage();
let workouts = loadWorkoutsFromStorage();
let sessionLogs = loadSessionLogsFromStorage();

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
const exportSelectedCountEl = document.getElementById('exportSelectedCount');
const exportWorkoutCountEl = document.getElementById('exportWorkoutCount');
const exportEvaluationCountEl = document.getElementById(
  'exportEvaluationCount',
);
const importInput = document.getElementById('importInput');
const importTrigger = document.querySelector('[data-import-button]');
const deleteWorkoutModal = document.getElementById('deleteWorkoutModal');
const deleteWorkoutName = document.getElementById('deleteWorkoutName');
const confirmDeleteWorkoutBtn = document.getElementById(
  'confirmDeleteWorkoutBtn',
);
const deleteAccountModal = document.getElementById('deleteAccountModal');
const deleteAccountBtn = document.getElementById('deleteAccountBtn');
const deleteAccountConfirmInput = document.getElementById(
  'deleteAccountConfirmInput',
);
const confirmDeleteAccountBtn = document.getElementById(
  'confirmDeleteAccountBtn',
);
const deleteAccountEmail = document.getElementById('deleteAccountEmail');
const closeDeleteAccountButtons = document.querySelectorAll(
  '[data-close-delete-account]',
);
const authTrigger = document.getElementById('authTrigger');
const loginView = document.getElementById('loginView');
const registerView = document.getElementById('registerView');
const confirmView = document.getElementById('confirmView');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const loginEmailInput = document.getElementById('login-email');
const loginPasswordInput = document.getElementById('login-password');
const registerNameInput = document.getElementById('reg-name');
const registerEmailInput = document.getElementById('reg-email');
const registerPasswordInput = document.getElementById('reg-password');
const registerConfirmInput = document.getElementById('reg-confirm');
const authSwitchButtons = document.querySelectorAll('[data-auth-switch]');
const authResetLink = document.querySelector('[data-auth-reset]');
const authLogoutButtons = document.querySelectorAll('[data-auth-logout]');
const authResendButton = document.querySelector('[data-auth-resend]');
const confirmEmailLabel = document.getElementById('confirmEmail');
const authYear = document.getElementById('authYear');
const authFeedback = document.getElementById('authFeedback');
const profileSyncStatus = document.getElementById('profileSyncStatus');
const profileSyncTime = document.getElementById('profileSyncTime');
const profileSyncEmail = document.getElementById('profileSyncEmail');
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
const searchInput = document.getElementById('searchInput');
const muscleSelect = document.getElementById('muscleSelect');
const resultsContainer = document.getElementById('results');
const generateWorkoutBtn = document.getElementById('generateWorkoutBtn');
const generationProgress = document.getElementById('generationProgress');
const generationResult = document.getElementById('generationResult');
const stepDots = document.querySelectorAll('.step-dot');
const workoutStepElements = document.querySelectorAll('.workout-step');
const openWorkoutButtons = document.querySelectorAll(
  '[data-open-workout-modal]',
);
const closeWorkoutButtons = document.querySelectorAll('[data-close-workout]');

const dashboardGreeting = document.getElementById('dashboardGreeting');
const dashboardSubtext = document.getElementById('dashboardSubtext');
const dashWorkoutsCount = document.getElementById('dashWorkoutsCount');
const dashSelectedCount = document.getElementById('dashSelectedCount');
const dashEvaluationCount = document.getElementById('dashEvaluationCount');
const dashLastVolume = document.getElementById('dashLastVolume');
const dashboardLastWorkout = document.getElementById('dashboardLastWorkout');
const dashboardLastWorkoutEmpty = document.getElementById(
  'dashboardLastWorkoutEmpty',
);
const dashboardNextSteps = document.getElementById('dashboardNextSteps');
const dashboardProfileSummary = document.getElementById(
  'dashboardProfileSummary',
);
const dashboardEvaluationSummary = document.getElementById(
  'dashboardEvaluationSummary',
);
const dashboardEvaluationEmpty = document.getElementById(
  'dashboardEvaluationEmpty',
);
const dashboardChartCanvas = document.getElementById('dashboardChart');
const dashboardChartEmpty = document.getElementById('dashboardChartEmpty');
const dashboardChartArea = document.getElementById('dashboardChartArea');

let dashboardChartInstance = null;

const librarySearchInput = document.getElementById('librarySearch');
const libraryFilters = document.getElementById('libraryFilters');
const libraryGrid = document.getElementById('libraryGrid');
const libraryFeatured = document.getElementById('libraryFeatured');
const libraryEmpty = document.getElementById('libraryEmpty');

const sessionWorkoutSelect = document.getElementById('sessionWorkoutSelect');
const sessionDaySelect = document.getElementById('sessionDaySelect');
const sessionDateInput = document.getElementById('sessionDateInput');
const sessionExercisesContainer = document.getElementById('sessionExercises');
const sessionEmpty = document.getElementById('sessionEmpty');
const sessionContent = document.getElementById('sessionContent');
const sessionSummary = document.getElementById('sessionSummary');
const saveSessionBtn = document.getElementById('saveSessionBtn');
const sessionFeedback = document.getElementById('sessionFeedback');

const strengthExerciseSelect = document.getElementById(
  'strengthExerciseSelect',
);
const strengthChartMode = document.getElementById('strengthChartMode');
const strengthChartCanvas = document.getElementById('strengthChart');
const strengthChartEmpty = document.getElementById('strengthChartEmpty');
const strengthChartArea = document.getElementById('strengthChartArea');
let strengthChartInstance = null;

const strengthChartState = {
  mode: 'weight',
};

let pendingConfirmEmail = '';
let registerCooldownUntil = 0;
let registerCooldownTimer = null;
const REGISTER_COOLDOWN_SECONDS = 15;

const cloudSyncState = {
  client: null,
  user: null,
  ready: false,
  syncing: false,
  syncTimer: null,
  lastSyncAt: null,
};
const workoutCloudSync = {
  syncing: false,
  syncTimer: null,
  lastSyncAt: null,
};
const evaluationCloudSync = {
  syncing: false,
  syncTimer: null,
  lastSyncAt: null,
};
let cloudSyncSuspended = false;

if (librarySearchInput) {
  librarySearchInput.addEventListener('input', (event) => {
    libraryState.query = event.target.value || '';
    renderLibrary();
  });
}

if (libraryFilters) {
  libraryFilters.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-filter]');
    if (!button) return;
    const filter = button.dataset.filter || 'all';
    libraryFilters
      .querySelectorAll('button')
      .forEach((btn) => btn.classList.remove('is-selected'));
    button.classList.add('is-selected');
    libraryState.filter = filter;
    renderLibrary();
  });
}

if (libraryGrid) {
  libraryGrid.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-library-add]');
    if (!trigger) return;
    const targetId = trigger.dataset.libraryAdd;
    const item = WORKOUT_LIBRARY.find((entry) => entry.id === targetId);
    if (!item) return;
    const plan = createLibraryWorkout(item);
    workouts.push(plan);
    saveWorkoutsToStorage(workouts);
    renderWorkoutCards();
    applyLibrarySelection(plan);
    navigateTo('treinos');
    setTimeout(() => showWorkoutDetails(plan.id), 0);
  });
}

if (libraryFeatured) {
  libraryFeatured.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-library-add]');
    if (!trigger) return;
    const targetId = trigger.dataset.libraryAdd;
    const item = WORKOUT_LIBRARY.find((entry) => entry.id === targetId);
    if (!item) return;
    const plan = createLibraryWorkout(item);
    workouts.push(plan);
    saveWorkoutsToStorage(workouts);
    renderWorkoutCards();
    applyLibrarySelection(plan);
    navigateTo('treinos');
    setTimeout(() => showWorkoutDetails(plan.id), 0);
  });
}

if (sessionWorkoutSelect) {
  sessionWorkoutSelect.addEventListener('change', (event) => {
    sessionState.workoutId = event.target.value;
    sessionState.dayIndex = 0;
    renderSessionUI();
  });
}

if (sessionDaySelect) {
  sessionDaySelect.addEventListener('change', (event) => {
    sessionState.dayIndex = Number(event.target.value);
    renderSessionUI();
  });
}

if (sessionDateInput) {
  sessionDateInput.addEventListener('change', (event) => {
    sessionState.date = event.target.value;
  });
}

if (saveSessionBtn) {
  saveSessionBtn.addEventListener('click', handleSessionSave);
}

if (strengthExerciseSelect) {
  strengthExerciseSelect.addEventListener('change', (event) => {
    renderStrengthChart(event.target.value);
  });
}

if (strengthChartMode) {
  strengthChartMode.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-mode]');
    if (!button) return;
    strengthChartMode
      .querySelectorAll('button')
      .forEach((btn) => btn.classList.remove('is-selected'));
    button.classList.add('is-selected');
    strengthChartState.mode = button.dataset.mode || 'both';
    if (strengthExerciseSelect?.value) {
      renderStrengthChart(strengthExerciseSelect.value);
    }
  });
}

const MIN_EXERCISES = {
  Peitoral: 2,
  Costas: 2,
  Pernas: 3,
  Braços: 2,
  Ombros: 1,
};

const DIVISION_DAY_RULES = {
  'Bro Split': [4, 5, 6],
  'Push / Pull / Legs': [3, 4, 5, 6],
  'Upper / Lower': [4],
  'PPL + Upper/Lower': [5],
  'Full Body': [3],
  'Sem Preferência': [3, 4, 5, 6],
};

const WORKOUT_LIBRARY = [
  {
    id: 'arnold-1974',
    name: 'Arnold Schwarzenegger',
    country: 'Áustria/EUA',
    era: 'Golden Era',
    region: 'world',
    focus: 'Peito + costas em supersets, alto volume para o torso.',
    split: [
      'Dia 1, 3 e 5: Peito + Costas (supersets).',
      'Dia 2, 4 e 6: Ombro + Braços.',
      'Dia 7: Pernas (sessão dedicada).',
    ],
    keyMoves: [
      'Supino Reto',
      'Supino Inclinado',
      'Crucifixo com Halteres',
      'Pullover na Máquina',
      'Barra Fixa',
      'Remada Curvada',
      'Puxada na Frente (Pulldown)',
      'Levantamento Terra',
      'Desenvolvimento Militar',
      'Elevação Lateral',
      'Elevação Frontal',
      'Peck-Deck Reverso',
      'Rosca Direta',
      'Rosca Alternada',
      'Rosca Scott',
      'Paralela (Dips)',
      'Tríceps Testa',
      'Tríceps Corda na Polia',
      'Agachamento Livre',
      'Leg Press 45',
      'Cadeira Extensora',
      'Mesa Flexora',
      'Panturrilha em Pé',
    ],
    tags: ['Mundial', 'Peito/Costas', 'Supersets', 'Split 6x'],
    highlight:
      'Peito + costas em supersets três vezes por semana, com ombros/braços intercalados.',
    planDays: [
      {
        label: 'Dia 1 — Peito + Costas',
        exercises: [
          { name: 'Supino Reto', sets: 5, reps: '6-10' },
          { name: 'Supino Inclinado', sets: 5, reps: '8-12' },
          { name: 'Crucifixo com Halteres', sets: 5, reps: '10-15' },
          { name: 'Pullover na Máquina', sets: 5, reps: '10-15' },
          { name: 'Barra Fixa', sets: 5, reps: 'falha' },
          { name: 'Remada Curvada', sets: 5, reps: '8-12' },
          { name: 'Puxada na Frente (Pulldown)', sets: 5, reps: '10' },
          { name: 'Levantamento Terra', sets: 4, reps: '6-10' },
        ],
      },
      {
        label: 'Dia 2 — Ombro + Braços',
        exercises: [
          { name: 'Desenvolvimento Militar', sets: 5, reps: '6-10' },
          { name: 'Elevação Lateral', sets: 5, reps: '10-15' },
          { name: 'Elevação Frontal', sets: 4, reps: '10' },
          { name: 'Peck-Deck Reverso', sets: 5, reps: '12' },
          { name: 'Rosca Direta', sets: 5, reps: '6-10' },
          { name: 'Rosca Alternada', sets: 5, reps: '8-12' },
          { name: 'Rosca Scott', sets: 4, reps: '10' },
          { name: 'Paralela (Dips)', sets: 5, reps: 'falha' },
          { name: 'Tríceps Testa', sets: 5, reps: '8-12' },
          { name: 'Tríceps Corda na Polia', sets: 5, reps: '10-15' },
        ],
      },
      {
        label: 'Dia 3 — Peito + Costas',
        exercises: [
          { name: 'Supino Reto', sets: 5, reps: '6-10' },
          { name: 'Supino Inclinado', sets: 5, reps: '8-12' },
          { name: 'Crucifixo com Halteres', sets: 5, reps: '10-15' },
          { name: 'Pullover na Máquina', sets: 5, reps: '10-15' },
          { name: 'Barra Fixa', sets: 5, reps: 'falha' },
          { name: 'Remada Curvada', sets: 5, reps: '8-12' },
          { name: 'Puxada na Frente (Pulldown)', sets: 5, reps: '10' },
          { name: 'Levantamento Terra', sets: 4, reps: '6-10' },
        ],
      },
      {
        label: 'Dia 4 — Ombro + Braços',
        exercises: [
          { name: 'Desenvolvimento Militar', sets: 5, reps: '6-10' },
          { name: 'Elevação Lateral', sets: 5, reps: '10-15' },
          { name: 'Elevação Frontal', sets: 4, reps: '10' },
          { name: 'Peck-Deck Reverso', sets: 5, reps: '12' },
          { name: 'Rosca Direta', sets: 5, reps: '6-10' },
          { name: 'Rosca Alternada', sets: 5, reps: '8-12' },
          { name: 'Rosca Scott', sets: 4, reps: '10' },
          { name: 'Paralela (Dips)', sets: 5, reps: 'falha' },
          { name: 'Tríceps Testa', sets: 5, reps: '8-12' },
          { name: 'Tríceps Corda na Polia', sets: 5, reps: '10-15' },
        ],
      },
      {
        label: 'Dia 5 — Peito + Costas',
        exercises: [
          { name: 'Supino Reto', sets: 5, reps: '6-10' },
          { name: 'Supino Inclinado', sets: 5, reps: '8-12' },
          { name: 'Crucifixo com Halteres', sets: 5, reps: '10-15' },
          { name: 'Pullover na Máquina', sets: 5, reps: '10-15' },
          { name: 'Barra Fixa', sets: 5, reps: 'falha' },
          { name: 'Remada Curvada', sets: 5, reps: '8-12' },
          { name: 'Puxada na Frente (Pulldown)', sets: 5, reps: '10' },
          { name: 'Levantamento Terra', sets: 4, reps: '6-10' },
        ],
      },
      {
        label: 'Dia 6 — Ombro + Braços',
        exercises: [
          { name: 'Desenvolvimento Militar', sets: 5, reps: '6-10' },
          { name: 'Elevação Lateral', sets: 5, reps: '10-15' },
          { name: 'Elevação Frontal', sets: 4, reps: '10' },
          { name: 'Peck-Deck Reverso', sets: 5, reps: '12' },
          { name: 'Rosca Direta', sets: 5, reps: '6-10' },
          { name: 'Rosca Alternada', sets: 5, reps: '8-12' },
          { name: 'Rosca Scott', sets: 4, reps: '10' },
          { name: 'Paralela (Dips)', sets: 5, reps: 'falha' },
          { name: 'Tríceps Testa', sets: 5, reps: '8-12' },
          { name: 'Tríceps Corda na Polia', sets: 5, reps: '10-15' },
        ],
      },
      {
        label: 'Dia 7 — Pernas (dedicado)',
        exercises: [
          { name: 'Agachamento Livre', sets: 5, reps: '8-12' },
          { name: 'Leg Press 45', sets: 5, reps: '10-15' },
          { name: 'Cadeira Extensora', sets: 5, reps: '12-15' },
          { name: 'Mesa Flexora', sets: 5, reps: '12-15' },
          { name: 'Panturrilha em Pé', sets: 10, reps: '12-20' },
        ],
      },
    ],
  },
  {
    id: 'jay-cutler-classic',
    name: 'Jay Cutler',
    country: 'EUA',
    era: 'Mr. Olympia 2000s',
    region: 'world',
    focus: 'Divisão por grupamentos com alto volume e recuperação planejada.',
    split: [
      'Dia 1: Peito',
      'Dia 2: Costas',
      'Dia 3: Braços',
      'Dia 4: Descanso',
      'Dia 5: Ombros',
      'Dia 6: Pernas',
      'Dia 7: Descanso',
    ],
    keyMoves: [
      'Supino Inclinado',
      'Supino Máquina (Chest Press)',
      'Crucifixo Inclinado',
      'Crossover no Cabo',
      'Puxada na Frente (Pulldown)',
      'Remada Curvada',
      'Remada Baixa',
      'Pullover na Máquina',
      'Desenvolvimento com Halteres',
      'Elevação Lateral',
      'Elevação Lateral na Máquina',
      'Peck-Deck Reverso',
      'Encolhimento com Barra',
      'Leg Press 45',
      'Agachamento Hack',
      'Agachamento no Smith',
      'Cadeira Extensora',
      'Mesa Flexora',
      'Panturrilha em Pé',
      'Rosca Direta',
      'Rosca Alternada',
      'Rosca Concentrada',
      'Tríceps Corda na Polia',
      'Tríceps Testa',
      'Tríceps Francês',
    ],
    tags: ['Mundial', 'Body Part Split', 'Volume alto'],
    highlight:
      'Cada músculo em um dia específico, com volume alto e descanso estratégico.',
    planDays: [
      {
        label: 'Dia 1 — Peito',
        exercises: [
          { name: 'Supino Inclinado', sets: 5, reps: '8-12' },
          { name: 'Supino Máquina (Chest Press)', sets: 4, reps: '10-12' },
          { name: 'Crucifixo Inclinado', sets: 4, reps: '12' },
          { name: 'Crossover no Cabo', sets: 4, reps: '12-15' },
          { name: 'Paralela (Dips)', sets: 3, reps: 'falha' },
        ],
      },
      {
        label: 'Dia 2 — Costas',
        exercises: [
          { name: 'Puxada na Frente (Pulldown)', sets: 4, reps: '10-12' },
          { name: 'Remada Curvada', sets: 4, reps: '8-10' },
          { name: 'Remada Baixa', sets: 4, reps: '10' },
          { name: 'Pullover na Máquina', sets: 4, reps: '12' },
          { name: 'Levantamento Terra', sets: 3, reps: '6-8' },
        ],
      },
      {
        label: 'Dia 3 — Ombros',
        exercises: [
          { name: 'Desenvolvimento com Halteres', sets: 4, reps: '8-10' },
          { name: 'Elevação Lateral', sets: 5, reps: '12-15' },
          { name: 'Elevação Lateral na Máquina', sets: 4, reps: '15' },
          { name: 'Peck-Deck Reverso', sets: 4, reps: '12-15' },
          { name: 'Encolhimento com Barra', sets: 4, reps: '10' },
        ],
      },
      {
        label: 'Dia 4 — Pernas',
        exercises: [
          { name: 'Leg Press 45', sets: 5, reps: '10-15' },
          { name: 'Agachamento Hack', sets: 4, reps: '10-12' },
          { name: 'Agachamento no Smith', sets: 4, reps: '8-12' },
          { name: 'Cadeira Extensora', sets: 4, reps: '15' },
          { name: 'Mesa Flexora', sets: 4, reps: '12' },
          { name: 'Panturrilha em Pé', sets: 8, reps: '12-20' },
        ],
      },
      {
        label: 'Dia 5 — Braços',
        exercises: [
          { name: 'Rosca Direta', sets: 4, reps: '8-10' },
          { name: 'Rosca Alternada', sets: 4, reps: '10' },
          { name: 'Rosca Concentrada', sets: 3, reps: '12' },
          { name: 'Tríceps Corda na Polia', sets: 4, reps: '10-12' },
          { name: 'Tríceps Testa', sets: 4, reps: '8-10' },
          { name: 'Tríceps Francês', sets: 4, reps: '12' },
        ],
      },
    ],
  },
  {
    id: 'phil-heath-olympia',
    name: 'Phil Heath',
    country: 'EUA',
    era: 'Mr. Olympia 2010s',
    region: 'world',
    focus: 'Divisão tradicional com sessões dedicadas e ênfase em qualidade.',
    split: [
      'Dia 1: Pernas',
      'Dia 2: Peito',
      'Dia 3: Costas',
      'Dia 4: Ombros',
      'Dia 5: Braços',
      'Dia 6: Descanso',
      'Dia 7: Reinicia o ciclo',
    ],
    keyMoves: [
      'Supino com Halteres',
      'Supino Máquina (Chest Press)',
      'Crossover no Cabo',
      'Crucifixo no Peck-Deck',
      'Puxada Neutra na Polia',
      'Remada Baixa',
      'Remada Unilateral no Cabo',
      'Pullover na Máquina',
      'Desenvolvimento no Smith',
      'Elevação Lateral',
      'Elevação Lateral no Cabo',
      'Peck-Deck Reverso',
      'Leg Press 45',
      'Agachamento Hack',
      'Cadeira Extensora',
      'Mesa Flexora',
      'Panturrilha em Pé',
      'Rosca Alternada',
      'Rosca Scott',
      'Rosca no Cabo',
      'Tríceps Corda na Polia',
      'Tríceps Francês',
      'Paralela (Dips)',
    ],
    tags: ['Mundial', 'Divisão clássica', '5 dias'],
    highlight:
      'Rotina com foco em controle de movimento e volume para ombros e braços.',
    planDays: [
      {
        label: 'Dia 1 — Peito',
        exercises: [
          { name: 'Supino com Halteres', sets: 4, reps: '8-12' },
          { name: 'Supino Máquina (Chest Press)', sets: 4, reps: '10-12' },
          { name: 'Crossover no Cabo', sets: 4, reps: '12-15' },
          { name: 'Crucifixo no Peck-Deck', sets: 4, reps: '12' },
        ],
      },
      {
        label: 'Dia 2 — Costas',
        exercises: [
          { name: 'Puxada Neutra na Polia', sets: 4, reps: '10-12' },
          { name: 'Remada Baixa', sets: 4, reps: '10' },
          { name: 'Remada Unilateral no Cabo', sets: 4, reps: '12' },
          { name: 'Pullover na Máquina', sets: 4, reps: '12-15' },
        ],
      },
      {
        label: 'Dia 3 — Ombros',
        exercises: [
          { name: 'Desenvolvimento no Smith', sets: 4, reps: '8-10' },
          { name: 'Elevação Lateral', sets: 5, reps: '12-15' },
          { name: 'Elevação Lateral no Cabo', sets: 4, reps: '15' },
          { name: 'Peck-Deck Reverso', sets: 4, reps: '12-15' },
        ],
      },
      {
        label: 'Dia 4 — Pernas',
        exercises: [
          { name: 'Leg Press 45', sets: 4, reps: '10-15' },
          { name: 'Agachamento Hack', sets: 4, reps: '10' },
          { name: 'Cadeira Extensora', sets: 4, reps: '15' },
          { name: 'Mesa Flexora', sets: 4, reps: '12' },
          { name: 'Panturrilha em Pé', sets: 7, reps: '12-20' },
        ],
      },
      {
        label: 'Dia 5 — Braços',
        exercises: [
          { name: 'Rosca Alternada', sets: 4, reps: '10' },
          { name: 'Rosca Scott', sets: 4, reps: '12' },
          { name: 'Rosca no Cabo', sets: 4, reps: '12-15' },
          { name: 'Tríceps Corda na Polia', sets: 4, reps: '12' },
          { name: 'Tríceps Francês', sets: 4, reps: '12' },
          { name: 'Paralela (Dips)', sets: 3, reps: 'falha' },
        ],
      },
    ],
  },
  {
    id: 'tom-platz-legs',
    name: 'Tom Platz',
    country: 'EUA',
    era: 'Golden Era',
    region: 'world',
    focus: 'Especialização extrema de pernas com muito volume.',
    split: [
      'Dia de pernas (treino icônico e extremamente longo).',
      'Peito + Costas',
      'Ombros',
      'Braços',
    ],
    keyMoves: [
      'Agachamento Livre',
      'Agachamento Hack',
      'Cadeira Extensora',
      'Leg Press 45',
      'Sissy Squat',
      'Mesa Flexora',
      'Panturrilha em Pé',
      'Supino Reto',
      'Supino Inclinado',
      'Crucifixo com Halteres',
      'Barra Fixa',
      'Remada Curvada',
      'Desenvolvimento Militar',
      'Elevação Lateral',
      'Peck-Deck Reverso',
      'Rosca Direta',
      'Rosca Alternada',
      'Tríceps Testa',
      'Paralela (Dips)',
    ],
    tags: ['Mundial', 'Especialização', 'Pernas', 'Golden Era'],
    special: true,
    highlight:
      'Agachamento profundo com altíssimo volume era o núcleo do treino de pernas.',
    planDays: [
      {
        label: 'Dia de Pernas (icônico)',
        exercises: [
          { name: 'Agachamento Livre', sets: 8, reps: '20-30' },
          { name: 'Agachamento Hack', sets: 5, reps: '10-15' },
          { name: 'Cadeira Extensora', sets: 6, reps: '15-20' },
          { name: 'Leg Press 45', sets: 5, reps: '20' },
          { name: 'Sissy Squat', sets: 4, reps: 'falha' },
          { name: 'Mesa Flexora', sets: 5, reps: '12-15' },
          { name: 'Panturrilha em Pé', sets: 10, reps: '12-20' },
        ],
      },
      {
        label: 'Peito + Costas',
        exercises: [
          { name: 'Supino Reto', sets: 5, reps: '8-12' },
          { name: 'Supino Inclinado', sets: 4, reps: '10' },
          { name: 'Crucifixo com Halteres', sets: 4, reps: '12-15' },
          { name: 'Barra Fixa', sets: 5, reps: 'falha' },
          { name: 'Remada Curvada', sets: 5, reps: '8-12' },
        ],
      },
      {
        label: 'Ombros',
        exercises: [
          { name: 'Desenvolvimento Militar', sets: 5, reps: '6-10' },
          { name: 'Elevação Lateral', sets: 5, reps: '12-15' },
          { name: 'Peck-Deck Reverso', sets: 4, reps: '12' },
        ],
      },
      {
        label: 'Braços',
        exercises: [
          { name: 'Rosca Direta', sets: 5, reps: '8-12' },
          { name: 'Rosca Alternada', sets: 4, reps: '10' },
          { name: 'Tríceps Testa', sets: 5, reps: '8-12' },
          { name: 'Paralela (Dips)', sets: 3, reps: 'falha' },
        ],
      },
    ],
  },
  {
    id: 'ramon-dino',
    name: 'Ramon Dino',
    country: 'Brasil',
    era: 'Classic Physique',
    region: 'br',
    focus:
      'Periodização com ênfases alternadas em puxadas, remadas, peito e ombros.',
    split: [
      '1º treino: Costas + bíceps (ênfase em puxadas)',
      '2º treino: Peito + ombro + tríceps (ênfase em peito)',
      '3º treino: Pernas (ênfase em quadríceps)',
      'Descanso',
      '4º treino: Costas + bíceps (ênfase em remadas)',
      '5º treino: Peito + ombro + tríceps (ênfase em ombro)',
      '6º treino: Pernas (ênfase posterior e glúteo)',
      'Descanso',
    ],
    keyMoves: [
      'Barra Fixa',
      'Puxada na Frente (Pulldown)',
      'Remada Curvada',
      'Remada Unilateral no Cabo',
      'Pullover na Máquina',
      'Supino com Halteres',
      'Supino Máquina (Chest Press)',
      'Crucifixo Inclinado',
      'Crossover no Cabo',
      'Abdominal Infra',
      'Abdominal na Polia (Crunch no Cabo)',
      'Desenvolvimento no Smith',
      'Elevação Lateral',
      'Elevação Lateral no Cabo',
      'Peck-Deck Reverso',
      'Agachamento Livre',
      'Leg Press 45',
      'Cadeira Extensora',
      'Mesa Flexora',
      'Panturrilha em Pé',
      'Rosca Direta',
      'Rosca Alternada',
      'Rosca Scott',
      'Tríceps Corda na Polia',
      'Tríceps Francês',
      'Paralela (Dips)',
    ],
    tags: ['Brasil', 'Classic Physique', 'Estética'],
    highlight:
      'Ênfase em dorsais largas e ombros cheios para manter linha clássica.',
    planDays: [
      {
        label: 'Dia 1 — Costas',
        exercises: [
          { name: 'Barra Fixa', sets: 4, reps: 'falha' },
          { name: 'Puxada na Frente (Pulldown)', sets: 4, reps: '10-12' },
          { name: 'Remada Curvada', sets: 4, reps: '8-10' },
          { name: 'Remada Unilateral no Cabo', sets: 4, reps: '12' },
          { name: 'Pullover na Máquina', sets: 4, reps: '12-15' },
        ],
      },
      {
        label: 'Dia 2 — Peito + Abdômen',
        exercises: [
          { name: 'Supino com Halteres', sets: 4, reps: '8-12' },
          { name: 'Supino Máquina (Chest Press)', sets: 4, reps: '10' },
          { name: 'Crucifixo Inclinado', sets: 4, reps: '12-15' },
          { name: 'Crossover no Cabo', sets: 4, reps: '15' },
          { name: 'Abdominal Infra', sets: 4, reps: '15' },
          { name: 'Abdominal na Polia (Crunch no Cabo)', sets: 4, reps: '15' },
        ],
      },
      {
        label: 'Dia 3 — Ombros',
        exercises: [
          { name: 'Desenvolvimento no Smith', sets: 4, reps: '8-10' },
          { name: 'Elevação Lateral', sets: 5, reps: '12-15' },
          { name: 'Elevação Lateral no Cabo', sets: 4, reps: '15' },
          { name: 'Peck-Deck Reverso', sets: 4, reps: '12-15' },
        ],
      },
      {
        label: 'Dia 4 — Pernas',
        exercises: [
          { name: 'Agachamento Livre', sets: 4, reps: '8-12' },
          { name: 'Leg Press 45', sets: 4, reps: '12-15' },
          { name: 'Cadeira Extensora', sets: 4, reps: '15' },
          { name: 'Mesa Flexora', sets: 4, reps: '12' },
          { name: 'Panturrilha em Pé', sets: 8, reps: '12-20' },
        ],
      },
      {
        label: 'Dia 5 — Braços',
        exercises: [
          { name: 'Rosca Direta', sets: 4, reps: '8-10' },
          { name: 'Rosca Alternada', sets: 4, reps: '10' },
          { name: 'Rosca Scott', sets: 3, reps: '12' },
          { name: 'Tríceps Corda na Polia', sets: 4, reps: '12' },
          { name: 'Tríceps Francês', sets: 4, reps: '12' },
          { name: 'Paralela (Dips)', sets: 3, reps: 'falha' },
        ],
      },
    ],
  },
];

const libraryState = {
  query: '',
  filter: 'all',
};

function findExerciseByName(name) {
  if (!name || !Array.isArray(exercises)) return null;
  const target = norm(name);
  return (
    exercises.find((exercise) => norm(exercise.name) === target) ||
    exercises.find(
      (exercise) =>
        norm(exercise.name).includes(target) ||
        target.includes(norm(exercise.name)),
    ) ||
    null
  );
}

function buildLibraryExercise(moveName, fallbackId) {
  const match = findExerciseByName(moveName);
  const base = match || {};
  return {
    id: match?.id ?? `lib-${fallbackId}`,
    name: match?.name || moveName,
    muscle: match?.muscle || 'Geral',
    equipment: match?.equipment || 'Livre',
    difficulty: match?.difficulty || 'Intermediário',
    sets: 3,
    reps: '8-12',
  };
}

function buildLibraryPlanDays(item) {
  if (!Array.isArray(item.planDays) || !item.planDays.length) return null;
  return item.planDays.map((day, dayIndex) => ({
    label: day.label || `Dia ${dayIndex + 1}`,
    exercises: (day.exercises || []).map((exercise, index) => {
      const match = findExerciseByName(exercise.name);
      return {
        id: match?.id ?? `lib-${item.id}-${dayIndex + 1}-${index + 1}`,
        name: match?.name || exercise.name,
        muscle: match?.muscle || 'Geral',
        equipment: match?.equipment || 'Livre',
        difficulty: match?.difficulty || 'Intermediário',
        sets: Number.isFinite(exercise.sets) ? exercise.sets : 3,
        reps: exercise.reps || '8-12',
      };
    }),
  }));
}

function buildLibraryDays(item) {
  const splitLines = Array.isArray(item.split)
    ? item.split
    : item.split
      ? [item.split]
      : [];
  const labels = splitLines
    .map((line) => {
      const parts = String(line).split(':');
      return parts.length > 1 ? parts.slice(1).join(':').trim() : line.trim();
    })
    .filter(Boolean);
  const dayCount = Math.max(1, labels.length);
  const days = Array.from({ length: dayCount }, (_, index) => ({
    label: labels[index] || `Dia ${index + 1}`,
    exercises: [],
  }));
  const moves = item.keyMoves || [];
  moves.forEach((move, index) => {
    const day = days[index % dayCount];
    day.exercises.push(buildLibraryExercise(move, `${item.id}-${index + 1}`));
  });
  return days;
}

function createLibraryWorkout(item) {
  const detailedDays = buildLibraryPlanDays(item);
  const days = detailedDays || buildLibraryDays(item);
  const plan = {
    id: createUuid(),
    name: `Biblioteca — ${item.name}`,
    createdAt: new Date().toISOString(),
    config: {
      division: item.tags?.[0] || 'Biblioteca',
      daysPerWeek: days.length,
      volume: 'medium',
      exerciseSource: 'library',
    },
    days,
    metrics: {
      algorithm: 'Library',
      timeMs: 0,
      equipmentSwitches: 0,
      volumeTotal: days.reduce(
        (sum, day) =>
          sum +
          (day.exercises || []).reduce(
            (acc, exercise) => acc + (Number(exercise.sets) || 0),
            0,
          ),
        0,
      ),
    },
  };
  return normalizeWorkout(plan);
}

function applyLibrarySelection(plan) {
  if (!plan || !Array.isArray(plan.days)) return;
  const ids = plan.days
    .flatMap((day) => day.exercises || [])
    .map((exercise) => exercise.id)
    .filter((id) => Number.isFinite(Number(id)));
  if (!ids.length) return;
  selectedExercises = normalizeSelectedExercises([
    ...selectedExercises,
    ...ids,
  ]);
  saveSelectedExercises();
  updateSelectedCount();
  search();
}

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

const sessionState = {
  workoutId: '',
  dayIndex: 0,
  date: '',
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

function getAllowedDaysForDivision(division) {
  return DIVISION_DAY_RULES[division] || DIVISION_DAY_RULES['Sem Preferência'];
}

function setSelectedDayOption(value) {
  if (!daysOptions) return;
  const allowedDays = getAllowedDaysForDivision(workoutState.config.division);
  if (!allowedDays.includes(value)) return;
  daysOptions
    .querySelectorAll('button')
    .forEach((button) => button.classList.remove('is-selected'));
  const target = daysOptions.querySelector(`button[data-value="${value}"]`);
  if (target) target.classList.add('is-selected');
  workoutState.config.daysPerWeek = value;
}

function updateDaysOptionsForDivision(division) {
  if (!daysOptions) return;
  const allowedDays = getAllowedDaysForDivision(division);
  daysOptions.querySelectorAll('button').forEach((button) => {
    const value = Number(button.dataset.value);
    const isAllowed = allowedDays.includes(value);
    button.disabled = !isAllowed;
    if (!isAllowed) {
      button.classList.remove('is-selected');
    }
  });

  if (!allowedDays.includes(workoutState.config.daysPerWeek)) {
    setSelectedDayOption(allowedDays[0]);
  }
}

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


if (searchInput) {
  searchInput.addEventListener('input', () => search());
}

if (muscleSelect) {
  muscleSelect.addEventListener('change', () => search());
}

if (resultsContainer) {
  resultsContainer.addEventListener('click', (event) => {
    const card = event.target.closest('.exercise-card');
    if (!card) return;
    toggleExercise(Number(card.dataset.exerciseId));
  });
  resultsContainer.addEventListener('keydown', (event) => {
    const card = event.target.closest('.exercise-card');
    if (!card) return;
    if (!['Enter', ' ', 'Spacebar'].includes(event.key)) return;
    event.preventDefault();
    toggleExercise(Number(card.dataset.exerciseId));
  });
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
  if (workoutModal?.classList.contains('is-active')) closeWorkoutModal();
  if (deleteWorkoutModal?.classList.contains('is-active'))
    closeDeleteWorkoutModal();
  if (deleteAccountModal?.classList.contains('is-active'))
    closeDeleteAccountModal();
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

closeDeleteAccountButtons.forEach((button) =>
  button.addEventListener('click', closeDeleteAccountModal),
);

if (deleteAccountModal) {
  deleteAccountModal.addEventListener('click', (event) => {
    if (event.target === deleteAccountModal) closeDeleteAccountModal();
  });
}

if (deleteAccountBtn) {
  deleteAccountBtn.addEventListener('click', openDeleteAccountModal);
}

if (deleteAccountConfirmInput) {
  deleteAccountConfirmInput.addEventListener(
    'input',
    updateDeleteAccountValidation,
  );
}

if (confirmDeleteAccountBtn) {
  confirmDeleteAccountBtn.addEventListener(
    'click',
    handleAccountDeletion,
  );
}

if (authTrigger) {
  authTrigger.addEventListener('click', () => {
    if (cloudSyncState.user) {
      handleAuthLogout();
    } else {
      navigateTo('login');
    }
  });
}

authLogoutButtons.forEach((button) =>
  button.addEventListener('click', () => {
    if (cloudSyncState.user) {
      handleAuthLogout();
    } else {
      navigateTo('login');
    }
  }),
);

if (loginForm) loginForm.addEventListener('submit', handleLoginSubmit);
if (registerForm) registerForm.addEventListener('submit', handleRegisterSubmit);

authSwitchButtons.forEach((button) =>
  button.addEventListener('click', () =>
    switchAuthView(button.dataset.authSwitch || 'login'),
  ),
);

if (authResetLink) {
  authResetLink.addEventListener('click', handlePasswordReset);
}

if (authResendButton) {
  authResendButton.addEventListener('click', handleResendConfirmation);
}

document
  .querySelectorAll('[data-toggle-password]')
  .forEach((button) =>
    button.addEventListener('click', () =>
      togglePasswordVisibility(button),
    ),
  );

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
    const exportWorkoutBtn = event.target.closest('[data-export-workout]');
    if (exportWorkoutBtn) {
      handleWorkoutExportPdf();
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
    button.addEventListener('click', () => {
      if (button.disabled) return;
      setSelectedDayOption(Number(button.dataset.value));
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
      if (group === 'division') {
        updateDaysOptionsForDivision(input.value);
      }
      if (group === 'exerciseSource') {
        updateRequirementSummary();
      }
    });
  });
});

updateDaysOptionsForDivision(workoutState.config.division);
setSelectedDayOption(workoutState.config.daysPerWeek);

renderEvaluationsUI();

/* LOCALSTORAGE */
function normalizeSelectedExercises(list) {
  if (!Array.isArray(list)) return [];
  const validIds = new Set(exercises.map((exercise) => exercise.id));
  const unique = new Set();
  const normalized = [];
  list.forEach((id) => {
    const parsed = Number(id);
    if (!Number.isFinite(parsed) || !validIds.has(parsed)) return;
    if (unique.has(parsed)) return;
    unique.add(parsed);
    normalized.push(parsed);
  });
  return normalized;
}

function saveSelectedExercises() {
  storageService.setJSON(SELECTED_EXERCISES_STORAGE_KEY, selectedExercises);
  touchStateMeta();
  scheduleCloudSync('silent');
}

function loadSelectedExercises() {
  const saved = storageService.getJSON(SELECTED_EXERCISES_STORAGE_KEY, []);
  selectedExercises = normalizeSelectedExercises(saved);
}

/* NAVEGAÇÃO */
function navigateTo(page) {
  const isLogged = Boolean(cloudSyncState.user);
  let targetPage = VALID_PAGES.includes(page) ? page : 'dashboard';
  if (!isLogged && targetPage !== 'login') targetPage = 'login';
  if (isLogged && targetPage === 'login') targetPage = 'dashboard';
  document
    .querySelectorAll('.page')
    .forEach((p) => p.classList.remove('active'));
  const target = document.getElementById(`page-${targetPage}`);
  if (target) target.classList.add('active');

  setAuthScreen(targetPage === 'login');

  document.querySelectorAll('.sidebar-item[data-page]').forEach((item) => {
    item.classList.remove('active');
    if (item.dataset.page === targetPage) item.classList.add('active');
  });

  if (targetPage === 'dashboard') renderDashboard();
  if (targetPage === 'sessao') renderSessionUI();
  if (targetPage === 'biblioteca') renderLibrary();
  if (targetPage === 'treinos') updateTreinosPage();
  if (targetPage === 'progresso') {
    renderEvaluationsUI();
    renderStrengthSection();
  }
  if (targetPage === 'dados') {
    refreshRadioChips();
    renderProfileSummary();
  }

  const sidebar = document.querySelector('.sidebar');
  const overlay = document.querySelector('.sidebar-overlay');
  const toggle = document.querySelector('.menu-toggle');
  sidebar && sidebar.classList.remove('active');
  overlay && overlay.classList.remove('active');
  toggle && toggle.classList.remove('active');

  if (targetPage !== 'login') saveActivePage(targetPage);
}

function updateTreinosPage() {
  const count = document.getElementById('selectedCountTreinos');
  if (count) count.textContent = selectedExercises.length;

  renderWorkoutCards();
  updateRequirementSummary();
  renderDashboard();
  renderSessionUI();
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

function getFirstName(name = '') {
  const trimmed = String(name || '').trim();
  if (!trimmed) return '';
  return trimmed.split(' ')[0];
}

function getLatestWorkout() {
  if (!workouts.length) return null;
  return workouts.reduce((latest, current) => {
    if (!latest) return current;
    const latestTime = new Date(latest.createdAt || 0).getTime();
    const currentTime = new Date(current.createdAt || 0).getTime();
    return currentTime > latestTime ? current : latest;
  }, null);
}

function renderDashboardMetric(label, value) {
  const display =
    typeof value === 'number' && Number.isFinite(value)
      ? formatNumber(value, 0)
      : value || '--';
  return `
    <div>
      <span class="label">${label}</span>
      <strong>${display}</strong>
    </div>
  `;
}

function formatProfileValue(value) {
  if (!value) return '--';
  const text = String(value);
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function renderDashboard() {
  if (!dashboardGreeting) return;

  const name = getFirstName(profileData?.name);
  const greeting = getGreeting();
  dashboardGreeting.textContent = name
    ? `${greeting}, ${name}!`
    : `${greeting}!`;

  if (dashboardSubtext) {
    if (!workouts.length) {
      dashboardSubtext.textContent =
        'Comece criando seu primeiro treino e selecione os exercícios que você mais gosta.';
    } else {
      dashboardSubtext.textContent = `Você tem ${workouts.length} treino${
        workouts.length !== 1 ? 's' : ''
      } salvos e ${selectedExercises.length} exercício${
        selectedExercises.length !== 1 ? 's' : ''
      } selecionado${selectedExercises.length !== 1 ? 's' : ''}.`;
    }
  }

  if (dashWorkoutsCount) dashWorkoutsCount.textContent = workouts.length;
  if (dashSelectedCount)
    dashSelectedCount.textContent = selectedExercises.length;
  if (dashEvaluationCount) dashEvaluationCount.textContent = evaluations.length;

  const latestWorkout = getLatestWorkout();
  const lastVolume =
    latestWorkout && Number.isFinite(latestWorkout.metrics?.volumeTotal)
      ? latestWorkout.metrics.volumeTotal
      : null;
  if (dashLastVolume) dashLastVolume.textContent = lastVolume ?? '--';

  if (dashboardLastWorkout && dashboardLastWorkoutEmpty) {
    if (!latestWorkout) {
      dashboardLastWorkout.innerHTML = '';
      dashboardLastWorkoutEmpty.style.display = 'block';
    } else {
      dashboardLastWorkoutEmpty.style.display = 'none';
      dashboardLastWorkout.innerHTML = `
        <div class="last-eval-header">
          <div>
            <p class="last-eval-date">${latestWorkout.name}</p>
            <p class="last-eval-sub">Criado em ${formatDate(
              latestWorkout.createdAt,
            )}</p>
          </div>
          <span class="chip chip-positive">${
            latestWorkout.config?.division || 'Sem preferência'
          }</span>
        </div>
      `;
    }
  }

  if (dashboardNextSteps) {
    const steps = [];
    const missingFields = [
      profileData?.name ? null : 'nome',
      profileData?.gender ? null : 'gênero',
      profileData?.biotype ? null : 'biotipo',
      profileData?.birthdate ? null : 'data de nascimento',
      profileData?.email ? null : 'e-mail',
    ].filter(Boolean);

    if (!workouts.length)
      steps.push({
        title: 'Criar seu primeiro treino',
        hint: 'Use o assistente inteligente para montar um plano completo.',
      });
    if (selectedExercises.length < 5)
      steps.push({
        title: 'Selecionar exercícios base',
        hint: 'Deixe seus preferidos marcados para treinos mais assertivos.',
      });
    if (!evaluations.length)
      steps.push({
        title: 'Registrar avaliação física',
        hint: 'Acompanhe medidas e evolução do shape.',
      });
    if (missingFields.length)
      steps.push({
        title: 'Completar perfil',
        hint: `${missingFields.length} campo(s) pendente(s) no seu cadastro.`,
      });

    if (!steps.length) {
      steps.push({
        title: 'Tudo em dia!',
        hint: 'Continue ajustando seus treinos e registrando avaliações.',
      });
    }

    dashboardNextSteps.innerHTML = steps
      .map(
        (step) =>
          `<li><span>${step.title}</span><small>${step.hint}</small></li>`,
      )
      .join('');
  }

  if (dashboardProfileSummary) {
    const items = [
      { label: 'Nome', value: profileData?.name || '--' },
      { label: 'Gênero', value: formatProfileValue(profileData?.gender) },
      { label: 'Biotipo', value: formatProfileValue(profileData?.biotype) },
      {
        label: 'Nascimento',
        value: profileData?.birthdate
          ? formatDate(profileData.birthdate)
          : '--',
      },
      {
        label: 'Contato',
        value: profileData?.phone || profileData?.email || '--',
      },
    ];
    dashboardProfileSummary.innerHTML = items
      .map((item) => renderDashboardMetric(item.label, item.value))
      .join('');
  }

  if (dashboardEvaluationSummary && dashboardEvaluationEmpty) {
    if (!evaluations.length) {
      dashboardEvaluationSummary.innerHTML = '';
      dashboardEvaluationEmpty.style.display = 'block';
    } else {
      dashboardEvaluationEmpty.style.display = 'none';
      const latest = evaluations[0];
      dashboardEvaluationSummary.innerHTML = `
        ${renderDashboardMetric('Data', formatDate(latest.date))}
        ${renderSummaryMetric('Peso', latest.weight, 'kg', 1)}
        ${renderSummaryMetric('% Gordura', latest.bodyFat, '%', 1)}
        ${renderSummaryMetric('Cintura', latest.waist, 'cm')}
        ${renderSummaryMetric('Altura', latest.height, 'cm')}
      `;
    }
  }

  renderDashboardChart();
  renderProfileSummary();
}

function renderProfileSummary() {
  if (
    !profileSyncStatus &&
    !profileSyncTime &&
    !profileSyncEmail
  ) {
    return;
  }
  const isSyncing =
    cloudSyncState.syncing ||
    workoutCloudSync.syncing ||
    evaluationCloudSync.syncing;

  if (profileSyncStatus) {
    profileSyncStatus.classList.remove('chip-positive', 'chip-soon');
    if (!cloudSyncState.user) {
      profileSyncStatus.textContent = 'Desconectado';
      profileSyncStatus.classList.add('chip-soon');
    } else if (isSyncing) {
      profileSyncStatus.textContent = 'Sincronizando';
      profileSyncStatus.classList.add('chip-soon');
    } else {
      profileSyncStatus.textContent = 'Sincronizado';
      profileSyncStatus.classList.add('chip-positive');
    }
  }

  if (profileSyncTime) {
    const stamps = [
      cloudSyncState.lastSyncAt,
      workoutCloudSync.lastSyncAt,
      evaluationCloudSync.lastSyncAt,
      stateMeta?.updatedAt,
    ].filter(Boolean);
    const stamp =
      stamps
        .map((value) => ({ value, time: parseTimestamp(value) }))
        .sort((a, b) => b.time - a.time)[0]?.value || '';
    profileSyncTime.textContent = stamp ? formatDateTime(stamp) : '—';
  }

  if (profileSyncEmail) {
    profileSyncEmail.textContent =
      cloudSyncState.user?.email || profileData?.email || '—';
  }
}

function hydrateProfileFromAuth() {
  if (!cloudSyncState.user) return;
  const updates = {};
  const nameFromAuth = cloudSyncState.user?.user_metadata?.name;
  const emailFromAuth = cloudSyncState.user?.email;

  if (!profileData?.name && nameFromAuth) updates.name = nameFromAuth;
  if (!profileData?.email && emailFromAuth) updates.email = emailFromAuth;

  if (Object.keys(updates).length) {
    profileData = { ...profileData, ...updates };
    saveProfileToStorage(profileData);
    populateProfileForm(profileData);
  } else {
    populateProfileForm(profileData);
  }
}

function renderDashboardChart() {
  if (!dashboardChartCanvas || !dashboardChartArea || !dashboardChartEmpty) {
    return;
  }
  if (!window.Chart) {
    dashboardChartArea.style.display = 'none';
    dashboardChartEmpty.style.display = 'block';
    return;
  }

  if (dashboardChartInstance) {
    dashboardChartInstance.destroy();
    dashboardChartInstance = null;
  }

  if (!evaluations.length) {
    dashboardChartArea.style.display = 'none';
    dashboardChartEmpty.style.display = 'block';
    return;
  }

  const sorted = [...evaluations].sort((a, b) => {
    const aTime = new Date(a.date || 0).getTime();
    const bTime = new Date(b.date || 0).getTime();
    return aTime - bTime;
  });

  const labels = sorted.map((entry) => formatDate(entry.date));
  const weightData = sorted.map((entry) =>
    isValidNumber(entry.weight) ? entry.weight : null,
  );
  const bodyFatData = sorted.map((entry) =>
    isValidNumber(entry.bodyFat) ? entry.bodyFat : null,
  );

  dashboardChartArea.style.display = 'block';
  dashboardChartEmpty.style.display = 'none';

  dashboardChartInstance = new window.Chart(dashboardChartCanvas, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Peso (kg)',
          data: weightData,
          borderColor: '#111827',
          backgroundColor: 'rgba(17, 24, 39, 0.08)',
          borderWidth: 2,
          tension: 0.35,
          fill: true,
          pointRadius: 3,
        },
        {
          label: '% Gordura',
          data: bodyFatData,
          borderColor: '#0d9e6e',
          backgroundColor: 'rgba(13, 158, 110, 0.12)',
          borderWidth: 2,
          tension: 0.35,
          fill: false,
          pointRadius: 3,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          grid: {
            color: 'rgba(15, 23, 42, 0.08)',
          },
          ticks: {
            color: '#64748b',
            font: { size: 11 },
          },
        },
        y: {
          grid: {
            color: 'rgba(15, 23, 42, 0.08)',
          },
          ticks: {
            color: '#64748b',
            font: { size: 11 },
          },
        },
      },
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: '#111827',
            boxWidth: 10,
            boxHeight: 10,
            usePointStyle: true,
          },
        },
        tooltip: {
          backgroundColor: '#111827',
          titleColor: '#fff',
          bodyColor: '#fff',
          padding: 10,
        },
      },
    },
  });
}

function renderSessionUI() {
  if (!sessionWorkoutSelect || !sessionDaySelect || !sessionDateInput)
    return;

  if (!workouts.length) {
    if (sessionEmpty) sessionEmpty.style.display = 'block';
    if (sessionContent) sessionContent.style.display = 'none';
    return;
  }

  if (sessionEmpty) sessionEmpty.style.display = 'none';
  if (sessionContent) sessionContent.style.display = 'block';

  sessionWorkoutSelect.innerHTML = workouts
    .map(
      (workout) =>
        `<option value="${workout.id}">${workout.name}</option>`,
    )
    .join('');

  if (!sessionState.workoutId || !workouts.find((w) => w.id === sessionState.workoutId)) {
    sessionState.workoutId = workouts[0].id;
  }

  sessionWorkoutSelect.value = sessionState.workoutId;
  const workout = workouts.find((w) => w.id === sessionState.workoutId);
  if (!workout) return;

  sessionDaySelect.innerHTML = workout.days
    .map(
      (day, index) => `<option value="${index}">${day.label}</option>`,
    )
    .join('');

  if (sessionState.dayIndex >= workout.days.length) {
    sessionState.dayIndex = 0;
  }
  sessionDaySelect.value = String(sessionState.dayIndex);

  if (!sessionState.date) {
    sessionState.date = getTodayInSaoPaulo();
  }
  sessionDateInput.value = sessionState.date;

  if (sessionSummary) {
    sessionSummary.textContent = `${workout.name} • ${workout.days.length} dia(s) • ${workout.config?.division || 'Sem preferência'}`;
  }

  const day = workout.days[sessionState.dayIndex];
  renderSessionExercises(day);
  renderProfileSummary();
}

function renderSessionExercises(day) {
  if (!sessionExercisesContainer) return;
  if (!day || !Array.isArray(day.exercises)) {
    sessionExercisesContainer.innerHTML = '';
    return;
  }

  sessionExercisesContainer.innerHTML = day.exercises
    .map(
      (exercise, index) => `
        <div class="session-exercise-row" data-session-exercise="${index}">
          <div class="session-exercise-info">
            <strong>${exercise.name}</strong>
            <span>${exercise.muscle} • ${exercise.equipment}</span>
          </div>
          <div class="session-exercise-controls">
            <label class="exercise-field">
              <span>Carga (kg)</span>
              <input type="number" min="0" step="0.5" data-session-weight value="">
            </label>
            <label class="exercise-field">
              <span>Reps</span>
              <input type="number" min="0" step="1" data-session-reps value="">
            </label>
          </div>
        </div>
      `,
    )
    .join('');
}

function handleSessionSave() {
  if (!sessionWorkoutSelect || !sessionDaySelect || !sessionDateInput)
    return;
  const workout = workouts.find((w) => w.id === sessionState.workoutId);
  if (!workout) return;
  const day = workout.days[sessionState.dayIndex];
  if (!day) return;

  const dateValue = sessionDateInput.value || getTodayInSaoPaulo();
  const entries = [];

  day.exercises.forEach((exercise, index) => {
    const row = sessionExercisesContainer?.querySelector(
      `[data-session-exercise="${index}"]`,
    );
    if (!row) return;
    const weightInput = row.querySelector('[data-session-weight]');
    const repsInput = row.querySelector('[data-session-reps]');
    const weight = toNumber(weightInput?.value);
    const reps = toNumber(repsInput?.value);
    if (!Number.isFinite(weight) || !Number.isFinite(reps)) return;

    entries.push({
      id: `${Date.now()}-${index}`,
      date: dateValue,
      workoutId: workout.id,
      workoutName: workout.name,
      dayIndex: sessionState.dayIndex,
      dayLabel: day.label,
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      weight,
      reps,
    });
  });

  if (!entries.length) {
    if (sessionFeedback) {
      sessionFeedback.textContent =
        'Preencha carga e repetições para pelo menos um exercício.';
      sessionFeedback.classList.add('is-visible');
    }
    return;
  }

  sessionLogs = [...entries, ...sessionLogs];
  saveSessionLogsToStorage(sessionLogs);
  renderStrengthSection();
  if (sessionFeedback) {
    sessionFeedback.textContent = 'Sessão registrada com sucesso!';
    sessionFeedback.classList.add('is-visible');
    clearTimeout(sessionFeedback._timeout);
    sessionFeedback._timeout = setTimeout(
      () => sessionFeedback.classList.remove('is-visible'),
      3200,
    );
  }
}

function renderStrengthSection() {
  if (!strengthExerciseSelect || !strengthChartArea || !strengthChartEmpty)
    return;

  const exerciseNames = Array.from(
    new Set(sessionLogs.map((entry) => entry.exerciseName).filter(Boolean)),
  );

  strengthExerciseSelect.innerHTML = exerciseNames
    .map((name) => `<option value="${name}">${name}</option>`)
    .join('');

  if (!exerciseNames.length) {
    strengthChartArea.style.display = 'none';
    strengthChartEmpty.style.display = 'block';
    return;
  }

  if (!strengthExerciseSelect.value) {
    strengthExerciseSelect.value = exerciseNames[0];
  }

  strengthChartArea.style.display = 'block';
  strengthChartEmpty.style.display = 'none';
  if (strengthChartMode && !strengthChartState.mode) {
    strengthChartState.mode = 'weight';
  }
  renderStrengthChart(strengthExerciseSelect.value);
}

function renderStrengthChart(exerciseName) {
  if (!strengthChartCanvas || !window.Chart) return;

  const filtered = sessionLogs.filter(
    (entry) => entry.exerciseName === exerciseName,
  );

  if (!filtered.length) {
    strengthChartArea.style.display = 'none';
    strengthChartEmpty.style.display = 'block';
    return;
  }

  const byDate = new Map();
  filtered.forEach((entry) => {
    const dateKey = entry.date || '';
    if (!dateKey) return;
    const current = byDate.get(dateKey) || {
      weightSum: 0,
      repsSum: 0,
      count: 0,
    };
    current.weightSum += Number(entry.weight) || 0;
    current.repsSum += Number(entry.reps) || 0;
    current.count += 1;
    byDate.set(dateKey, current);
  });

  const series = Array.from(byDate.entries())
    .map(([date, stats]) => ({
      date,
      weight: stats.count ? stats.weightSum / stats.count : 0,
      reps: stats.count ? stats.repsSum / stats.count : 0,
    }))
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const labels = series.map((item) => formatDate(item.date));
  const weightData = series.map((item) => Number(item.weight.toFixed(2)));
  const repsData = series.map((item) => Number(item.reps.toFixed(1)));
  const strengthData = series.map((item) =>
    Number((item.weight * item.reps).toFixed(1)),
  );

  if (strengthChartInstance) {
    strengthChartInstance.destroy();
    strengthChartInstance = null;
  }

  const datasets = [];
  if (strengthChartState.mode === 'weight') {
    datasets.push({
      label: 'Carga (kg)',
      data: weightData,
      borderColor: '#0d9e6e',
      backgroundColor: 'rgba(13, 158, 110, 0.12)',
      borderWidth: 2,
      tension: 0.35,
      fill: true,
      yAxisID: 'yPrimary',
    });
  }
  if (strengthChartState.mode === 'strength') {
    datasets.push({
      label: 'Força (peso x reps)',
      data: strengthData,
      borderColor: '#111827',
      backgroundColor: 'rgba(17, 24, 39, 0.08)',
      borderWidth: 2,
      tension: 0.35,
      fill: true,
      yAxisID: 'yPrimary',
    });
  }

  strengthChartInstance = new window.Chart(strengthChartCanvas, {
    type: 'line',
    data: {
      labels,
      datasets,
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          title: {
            display: true,
            text: 'Tempo',
            color: '#64748b',
          },
          grid: { color: 'rgba(15, 23, 42, 0.08)' },
          ticks: { color: '#64748b', font: { size: 11 } },
        },
        yPrimary: {
          title: {
            display: true,
            text:
              strengthChartState.mode === 'strength'
                ? 'Força (peso x reps)'
                : 'Carga (kg)',
            color: '#64748b',
          },
          grid: { color: 'rgba(15, 23, 42, 0.08)' },
          ticks: { color: '#64748b', font: { size: 11 } },
        },
      },
      plugins: {
        legend: {
          display: false,
          position: 'bottom',
          labels: {
            color: '#111827',
            boxWidth: 10,
            boxHeight: 10,
            usePointStyle: true,
          },
        },
        tooltip: {
          backgroundColor: '#111827',
          titleColor: '#fff',
          bodyColor: '#fff',
          callbacks: {
            label(context) {
              const label = context.dataset.label || '';
              const value = context.parsed?.y ?? '';
              return `${label}: ${value}`;
            },
          },
        },
      },
    },
  });
}

function getLibraryInitials(name = '') {
  const parts = String(name || '')
    .trim()
    .split(' ')
    .filter(Boolean);
  if (!parts.length) return '';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function buildLibraryCard(item) {
  const splitLines = Array.isArray(item.split) ? item.split : [item.split];
  const focusLines = Array.isArray(item.focus) ? item.focus : [item.focus];
  const tagList = item.tags || [];
  const exercises = item.keyMoves || [];

  return `
    <article class="library-card">
      <div class="library-card-header">
        <span class="library-avatar">${getLibraryInitials(item.name)}</span>
        <div class="library-title">
          <h3>${item.name}</h3>
          <p>${item.era} • ${item.country}</p>
        </div>
      </div>
      <div class="library-tags">
        ${tagList.map((tag) => `<span class="library-tag">${tag}</span>`).join('')}
      </div>
      <div class="library-section">
        <div class="library-section-title">Divisão</div>
        <div class="library-lines">
          ${splitLines.map((line) => `<div>${line}</div>`).join('')}
        </div>
      </div>
      <div class="library-section">
        <div class="library-section-title">Foco</div>
        <div class="library-lines">
          ${focusLines.map((line) => `<div>${line}</div>`).join('')}
        </div>
      </div>
      <div class="library-section">
        <div class="library-section-title">Exercícios-chave</div>
        <div class="library-exercises">
          ${exercises.map((exercise) => `<span class="library-chip">${exercise}</span>`).join('')}
        </div>
      </div>
      <div class="library-actions">
        <button type="button" class="button-primary button-primary--sm" data-library-add="${item.id}">Adicionar aos meus treinos</button>
      </div>
    </article>
  `;
}

function buildFeaturedCard(item) {
  const splitLines = Array.isArray(item.split) ? item.split : [item.split];
  const focusLines = Array.isArray(item.focus) ? item.focus : [item.focus];
  const exercises = item.keyMoves || [];

  return `
    <article class="library-featured-card">
      <div>
        <div class="library-card-header">
          <span class="library-avatar">${getLibraryInitials(item.name)}</span>
          <div class="library-title">
            <h3>${item.name}</h3>
            <p>${item.era} • ${item.country}</p>
          </div>
        </div>
        <div class="library-tags">
          ${(item.tags || []).map((tag) => `<span class="library-tag">${tag}</span>`).join('')}
        </div>
        <div class="library-section">
          <div class="library-section-title">Divisão</div>
          <div class="library-lines">
            ${splitLines.map((line) => `<div>${line}</div>`).join('')}
          </div>
        </div>
        <div class="library-section">
          <div class="library-section-title">Foco</div>
          <div class="library-lines">
            ${focusLines.map((line) => `<div>${line}</div>`).join('')}
          </div>
        </div>
        <div class="library-section">
          <div class="library-section-title">Exercícios-chave</div>
          <div class="library-exercises">
            ${exercises.map((exercise) => `<span class="library-chip">${exercise}</span>`).join('')}
          </div>
        </div>
        <div class="library-actions">
          <button type="button" class="button-primary button-primary--sm" data-library-add="${item.id}">Adicionar aos meus treinos</button>
        </div>
      </div>
      <div class="library-highlight">
        <p>${item.highlight || 'Treino destacado da biblioteca.'}</p>
      </div>
    </article>
  `;
}

function filterLibraryItems(items) {
  const query = norm(libraryState.query || '');
  const filter = libraryState.filter;
  return items.filter((item) => {
    if (filter === 'world' && item.region !== 'world') return false;
    if (filter === 'br' && item.region !== 'br') return false;
    if (filter === 'special' && !item.special) return false;

    if (!query) return true;
    const haystack = norm(
      [
        item.name,
        item.era,
        item.country,
        item.focus,
        ...(item.tags || []),
        ...(item.keyMoves || []),
        ...(Array.isArray(item.split) ? item.split : [item.split]),
      ].join(' '),
    );
    return haystack.includes(query);
  });
}

function renderLibrary() {
  if (!libraryGrid || !libraryFeatured || !libraryEmpty) return;
  const filtered = filterLibraryItems(WORKOUT_LIBRARY);

  if (!filtered.length) {
    libraryGrid.innerHTML = '';
    libraryFeatured.innerHTML = '';
    libraryFeatured.style.display = 'none';
    libraryEmpty.style.display = 'block';
    return;
  }

  libraryEmpty.style.display = 'none';
  libraryFeatured.innerHTML = '';
  libraryFeatured.style.display = 'none';
  libraryGrid.innerHTML = filtered.map((item) => buildFeaturedCard(item)).join('');
}

/* SELEÇÃO */
function toggleExercise(exerciseId) {
  const index = selectedExercises.indexOf(exerciseId);
  let isSelected = false;
  if (index > -1) {
    selectedExercises.splice(index, 1);
    isSelected = false;
  } else {
    selectedExercises.push(exerciseId);
    isSelected = true;
  }

  const card = document.querySelector(`[data-exercise-id="${exerciseId}"]`);
  if (card) {
    card.classList.toggle('selected', isSelected);
    card.setAttribute('aria-pressed', String(isSelected));
  }

  updateSelectedCount();
  saveSelectedExercises();
}

function updateSelectedCount() {
  const count = document.getElementById('resultsCount');
  if (!count) return;
  count.textContent = `${selectedExercises.length} exercício${
    selectedExercises.length !== 1 ? 's' : ''
  } selecionado${selectedExercises.length !== 1 ? 's' : ''}`;
  renderDashboard();
}

/* FILTROS / CONTROLE */
function getFilteredExercises() {
  const muscle = muscleSelect?.value || 'Todos';
  if (muscle === 'Todos') return exercises;
  return exercises.filter((ex) => ex.muscle === muscle);
}

function buildSearchHaystack(exercise) {
  return norm(
    `${exercise.name} ${exercise.desc} ${exercise.muscle} ${exercise.equipment} ${exercise.difficulty}`,
  );
}

function matchesSearch(exercise, term) {
  if (!term) return true;
  const haystack = buildSearchHaystack(exercise);
  return haystack.includes(term);
}

function search() {
  const rawTerm = searchInput ? searchInput.value.trim() : '';
  const term = norm(rawTerm);
  const filtered = getFilteredExercises();

  if (!term || term.length < 2) {
    renderExercisesView(filtered);
    return;
  }

  const results = filtered.filter((exercise) =>
    matchesSearch(exercise, term),
  );
  renderExercisesView(results);
}

/* RENDER */
function renderExercisesView(list) {
  const container = document.getElementById('results');
  if (!container) return;

  const metricsContainer = document.getElementById('metricsContainer');
  if (metricsContainer) metricsContainer.style.display = 'none';

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
        }" data-exercise-id="${ex.id}" role="button" tabindex="0" aria-pressed="${isSelected}">
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
}

/* PERFIL & AVALIAÇÕES - UI / LÓGICA */
const modalFocusState = new Map();

function openModal(modalElement, options = {}) {
  if (!modalElement) return;
  modalFocusState.set(modalElement, {
    trigger: document.activeElement,
  });
  modalElement.classList.add('is-active');
  modalElement.setAttribute('aria-hidden', 'false');
  document.body?.classList.add('modal-open');

  const focusSelector =
    typeof options.initialFocus === 'string' ? options.initialFocus : null;
  const focusTarget =
    (focusSelector && modalElement.querySelector(focusSelector)) ||
    (options.initialFocus instanceof HTMLElement
      ? options.initialFocus
      : null) ||
    modalElement.querySelector(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
  if (focusTarget) setTimeout(() => focusTarget.focus(), 60);
}

function closeModal(modalElement) {
  if (!modalElement) return;
  modalElement.classList.remove('is-active');
  modalElement.setAttribute('aria-hidden', 'true');
  document.body?.classList.remove('modal-open');
  const state = modalFocusState.get(modalElement);
  modalFocusState.delete(modalElement);
  if (state?.trigger && typeof state.trigger.focus === 'function') {
    setTimeout(() => state.trigger.focus(), 0);
  }
}

function openEvaluationModal() {
  if (!evaluationModal) return;
  openModal(evaluationModal, { initialFocus: 'input[name="height"]' });

  if (!evaluationForm) return;
  evaluationForm.reset();

  const today = getTodayInSaoPaulo();
  const dateInput = evaluationForm.querySelector('input[name="date"]');
  if (dateInput) {
    dateInput.max = today;
    if (!dateInput.value) dateInput.value = today;
  }

}

function closeEvaluationModal() {
  closeModal(evaluationModal);
}

function openClearModal() {
  openModal(clearDataModal, { initialFocus: '[data-confirm-clear]' });
}

function closeClearModal() {
  closeModal(clearDataModal);
}

function openDeleteAccountModal() {
  if (!deleteAccountModal) return;
  if (deleteAccountConfirmInput) deleteAccountConfirmInput.value = '';
  if (confirmDeleteAccountBtn) confirmDeleteAccountBtn.disabled = true;
  if (deleteAccountEmail) {
    deleteAccountEmail.textContent =
      cloudSyncState.user?.email || profileData?.email || '—';
  }
  openModal(deleteAccountModal, { initialFocus: '#deleteAccountConfirmInput' });
}

function closeDeleteAccountModal() {
  closeModal(deleteAccountModal);
}

function updateDeleteAccountValidation() {
  if (!deleteAccountConfirmInput || !confirmDeleteAccountBtn) return;
  const value = deleteAccountConfirmInput.value.trim().toUpperCase();
  confirmDeleteAccountBtn.disabled = value !== 'NUDELETE-2026';
}

async function handleAccountDeletion() {
  if (!cloudSyncState.client || !cloudSyncState.user) {
    showAuthFeedback('Conecte-se para excluir sua conta.', 'error');
    return;
  }
  if (
    !deleteAccountConfirmInput ||
    deleteAccountConfirmInput.value.trim().toUpperCase() !== 'NUDELETE-2026'
  ) {
    showAuthFeedback('Digite NUDELETE-2026 para confirmar.', 'error');
    return;
  }

  const userId = cloudSyncState.user.id;
  const originalLabel = confirmDeleteAccountBtn?.textContent || 'Excluir conta';
  if (confirmDeleteAccountBtn) {
    confirmDeleteAccountBtn.disabled = true;
    confirmDeleteAccountBtn.textContent = 'Excluindo...';
  }

  let deletionError = null;

  try {
    const { error: rpcError } =
      await cloudSyncState.client.rpc('delete_current_user');
    if (rpcError) {
      throw rpcError;
    }
  } catch (error) {
    deletionError = error;
  }

  if (deletionError) {
    const message = String(deletionError?.message || '').toLowerCase();
    console.warn('Falha ao excluir conta:', deletionError);
    if (message.includes('not authenticated')) {
      await safeSignOut({ skipNetwork: true });
      closeDeleteAccountModal();
      showAuthFeedback(
        'Sessão inválida. Faça login novamente para excluir a conta.',
        'error',
      );
    } else if (message.includes('permission') || message.includes('not found')) {
      showAuthFeedback(
        'Crie a função delete_current_user no Supabase antes de excluir.',
        'error',
      );
    } else if (message.includes('token de outro projeto')) {
      await safeSignOut({ skipNetwork: true });
      closeDeleteAccountModal();
      showAuthFeedback(
        'Sessão inválida. Faça login novamente para excluir a conta.',
        'error',
      );
    } else {
      showAuthFeedback(
        'Não foi possível excluir a conta. Verifique a função delete_current_user.',
        'error',
      );
    }
    if (confirmDeleteAccountBtn) {
      confirmDeleteAccountBtn.disabled = false;
      confirmDeleteAccountBtn.textContent = originalLabel;
    }
    return;
  }

  await safeSignOut({ skipNetwork: true });
  cloudSyncState.user = null;
  setStateOwner('');
  resetLocalState();
  closeDeleteAccountModal();
  handleAuthStateChange();
  showAuthFeedback('Conta excluída com sucesso.');
}

function setAuthScreen(isActive) {
  document.body.classList.toggle('auth-screen', isActive);
  if (isActive && authYear) {
    authYear.textContent = new Date().getFullYear();
  }
}

function switchAuthView(view = 'login') {
  const isLogin = view === 'login';
  const isRegister = view === 'register';
  const isConfirm = view === 'confirm';
  if (loginView) {
    loginView.classList.toggle('active', isLogin);
    loginView.setAttribute('aria-hidden', String(!isLogin));
  }
  if (registerView) {
    registerView.classList.toggle('active', isRegister);
    registerView.setAttribute('aria-hidden', String(!isRegister));
  }
  if (confirmView) {
    confirmView.classList.toggle('active', isConfirm);
    confirmView.setAttribute('aria-hidden', String(!isConfirm));
  }
}

function togglePasswordVisibility(button) {
  const wrapper = button?.closest('.auth-input');
  const input = wrapper?.querySelector('input');
  if (!input) return;
  const isPassword = input.type === 'password';
  input.type = isPassword ? 'text' : 'password';
  button.textContent = isPassword ? '🙈' : '👁️';
  button.setAttribute(
    'aria-label',
    isPassword ? 'Ocultar senha' : 'Mostrar senha',
  );
}

function setAuthLoading(form, isLoading) {
  const submit = form?.querySelector('.auth-submit');
  if (!submit) return;
  submit.classList.toggle('loading', isLoading);
  submit.disabled = isLoading;
}

function isRegisterCooldownActive() {
  return registerCooldownUntil > Date.now();
}

function updateRegisterCooldown() {
  const submit = registerForm?.querySelector('.auth-submit');
  const label = submit?.querySelector('.auth-submit-text');
  if (!submit || !label) return;

  const remaining = Math.max(
    0,
    Math.ceil((registerCooldownUntil - Date.now()) / 1000),
  );

  if (remaining > 0) {
    if (!submit.dataset.originalLabel) {
      submit.dataset.originalLabel = label.textContent || 'Começar evolução';
    }
    submit.disabled = true;
    submit.classList.remove('loading');
    label.textContent = `Aguarde ${remaining}s`;
    if (authResendButton) authResendButton.disabled = true;
    registerCooldownTimer = setTimeout(updateRegisterCooldown, 1000);
  } else {
    submit.disabled = false;
    if (submit.dataset.originalLabel) {
      label.textContent = submit.dataset.originalLabel;
    }
    if (authResendButton) authResendButton.disabled = false;
    registerCooldownUntil = 0;
    if (registerCooldownTimer) {
      clearTimeout(registerCooldownTimer);
      registerCooldownTimer = null;
    }
  }
}

function startRegisterCooldown(seconds = REGISTER_COOLDOWN_SECONDS) {
  registerCooldownUntil = Date.now() + seconds * 1000;
  updateRegisterCooldown();
}

async function handleLoginSubmit(event) {
  event.preventDefault();
  if (!cloudSyncState.client) {
    showAuthFeedback(
      'Configure SUPABASE_URL e SUPABASE_ANON_KEY para ativar o login.',
      'error',
    );
    return;
  }

  const email = loginEmailInput?.value?.trim();
  const password = loginPasswordInput?.value || '';
  if (!email || !password) {
    showAuthFeedback('Preencha email e senha.', 'error');
    return;
  }

  setAuthLoading(loginForm, true);
  const { error } = await cloudSyncState.client.auth.signInWithPassword({
    email,
    password,
  });
  setAuthLoading(loginForm, false);

  if (error) {
    showAuthFeedback('Falha ao entrar. Verifique os dados.', 'error');
    return;
  }

  showAuthFeedback('Login realizado com sucesso!');
  loginForm?.reset();
}

async function handleRegisterSubmit(event) {
  event.preventDefault();
  if (!cloudSyncState.client) {
    showAuthFeedback(
      'Configure SUPABASE_URL e SUPABASE_ANON_KEY para ativar o login.',
      'error',
    );
    return;
  }

  if (isRegisterCooldownActive()) {
    updateRegisterCooldown();
    showAuthFeedback('Aguarde alguns segundos para tentar novamente.', 'error');
    return;
  }

  const name = registerNameInput?.value?.trim();
  const email = registerEmailInput?.value?.trim();
  const password = registerPasswordInput?.value || '';
  const confirm = registerConfirmInput?.value || '';

  if (!name || !email || !password || !confirm) {
    showAuthFeedback('Preencha todos os campos.', 'error');
    return;
  }

  if (password.length < 8) {
    showAuthFeedback('A senha deve ter pelo menos 8 caracteres.', 'error');
    return;
  }

  if (password !== confirm) {
    showAuthFeedback('As senhas não coincidem.', 'error');
    return;
  }

  setAuthLoading(registerForm, true);
  const { data, error } = await cloudSyncState.client.auth.signUp({
    email,
    password,
    options: {
      data: { name },
    },
  });
  setAuthLoading(registerForm, false);

  if (error) {
    const message = String(error?.message || '').toLowerCase();
    const status = error?.status || error?.statusCode;
    const code = String(error?.code || '').toLowerCase();
    if (
      code === 'over_email_send_rate_limit' ||
      message.includes('email rate limit')
    ) {
      startRegisterCooldown(300);
      showAuthFeedback(
        'Limite de envio de email do Supabase atingido. Aguarde alguns minutos ou desative a confirmação de email no Supabase.',
        'error',
      );
      return;
    }
    if (status === 429 || message.includes('rate') || message.includes('too')) {
      startRegisterCooldown(REGISTER_COOLDOWN_SECONDS);
      showAuthFeedback(
        `Muitas tentativas. Aguarde ${REGISTER_COOLDOWN_SECONDS}s e tente novamente.`,
        'error',
      );
      return;
    }
    showAuthFeedback('Não foi possível criar a conta.', 'error');
    return;
  }

  if (!data?.session) {
    pendingConfirmEmail = email;
    if (confirmEmailLabel) confirmEmailLabel.textContent = email;
    showAuthFeedback('Conta criada! Confirme o email para entrar.');
    switchAuthView('confirm');
    return;
  }

  showAuthFeedback('Conta criada e autenticada!');
  registerForm?.reset();
}

async function handlePasswordReset(event) {
  event.preventDefault();
  if (!cloudSyncState.client) {
    showAuthFeedback(
      'Configure SUPABASE_URL e SUPABASE_ANON_KEY para ativar o login.',
      'error',
    );
    return;
  }
  const email = loginEmailInput?.value?.trim();
  if (!email) {
    showAuthFeedback('Informe seu email para recuperar a senha.', 'error');
    return;
  }
  const { error } = await cloudSyncState.client.auth.resetPasswordForEmail(
    email,
    {
      redirectTo: window.location.origin,
    },
  );
  if (error) {
    showAuthFeedback('Não foi possível enviar o email.', 'error');
    return;
  }
  showAuthFeedback('Email de recuperação enviado.');
}

async function handleResendConfirmation(event) {
  event.preventDefault();
  if (!cloudSyncState.client) {
    showAuthFeedback(
      'Configure SUPABASE_URL e SUPABASE_ANON_KEY para ativar o login.',
      'error',
    );
    return;
  }

  if (isRegisterCooldownActive()) {
    updateRegisterCooldown();
    showAuthFeedback('Aguarde alguns segundos para tentar novamente.', 'error');
    return;
  }

  const email = pendingConfirmEmail || registerEmailInput?.value?.trim();
  if (!email) {
    showAuthFeedback('Informe o email para reenviar a confirmação.', 'error');
    return;
  }

  try {
    const { error } = await cloudSyncState.client.auth.resend({
      type: 'signup',
      email,
    });
    if (error) {
      const message = String(error?.message || '').toLowerCase();
      const status = error?.status || error?.statusCode;
      const code = String(error?.code || '').toLowerCase();
      if (
        code === 'over_email_send_rate_limit' ||
        message.includes('email rate limit')
      ) {
        startRegisterCooldown(300);
        showAuthFeedback(
          'Limite de envio de email do Supabase atingido. Aguarde alguns minutos antes de reenviar.',
          'error',
        );
        return;
      }
      if (status === 429 || message.includes('rate') || message.includes('too')) {
        startRegisterCooldown(REGISTER_COOLDOWN_SECONDS);
        showAuthFeedback(
          `Muitas tentativas. Aguarde ${REGISTER_COOLDOWN_SECONDS}s e tente novamente.`,
          'error',
        );
        return;
      }
      showAuthFeedback('Não foi possível reenviar o email.', 'error');
      return;
    }
    showAuthFeedback('Email de confirmação reenviado.');
  } catch (error) {
    console.error(error);
    showAuthFeedback('Não foi possível reenviar o email.', 'error');
  }
}

function handleAuthStateChange() {
  updateAuthUI();
  if (cloudSyncState.user) {
    setAuthScreen(false);
    pendingConfirmEmail = '';
    const ownerId = getStateOwner();
    if (ownerId && ownerId !== cloudSyncState.user.id) {
      cloudSyncSuspended = true;
      resetLocalState();
      cloudSyncSuspended = false;
      cloudSyncState.lastSyncAt = null;
      workoutCloudSync.lastSyncAt = null;
      evaluationCloudSync.lastSyncAt = null;
    }
    setStateOwner(cloudSyncState.user.id);
    hydrateProfileFromAuth();
    const preferred = loadActivePage();
    const nextPage = preferred && preferred !== 'login' ? preferred : 'dashboard';
    navigateTo(nextPage);
    loadCloudState();
  } else {
    cloudSyncState.lastSyncAt = null;
    workoutCloudSync.lastSyncAt = null;
    evaluationCloudSync.lastSyncAt = null;
    if (deleteAccountModal?.classList.contains('is-active')) {
      closeDeleteAccountModal();
    }
    switchAuthView('login');
    navigateTo('login');
  }
  if (registerCooldownUntil) updateRegisterCooldown();
}

async function handleProfileSubmit(event) {
  event.preventDefault();
  if (!profileForm) return;

  const formData = new FormData(profileForm);
  const newPassword = String(formData.get('newPassword') || '');
  const confirmPassword = String(formData.get('confirmPassword') || '');

  if (newPassword || confirmPassword) {
    if (!cloudSyncState.client || !cloudSyncState.user) {
      showProfileFeedback('Conecte-se para alterar a senha.', 'error');
      return;
    }
    if (newPassword.length < 8) {
      showProfileFeedback(
        'A nova senha precisa ter pelo menos 8 caracteres.',
        'error',
      );
      return;
    }
    if (newPassword !== confirmPassword) {
      showProfileFeedback('As senhas não coincidem.', 'error');
      return;
    }

    const { error } = await cloudSyncState.client.auth.updateUser({
      password: newPassword,
    });
    if (error) {
      showProfileFeedback('Não foi possível atualizar a senha.', 'error');
      return;
    }
  }

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
  showProfileFeedback('Informações atualizadas com sucesso!');
  renderDashboard();
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
  renderDashboard();
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
  renderDashboard();
  showSuccessFeedback('Avaliação removida.');
}

function populateProfileForm(data = {}) {
  if (!profileForm) return;

  const nameInput = profileForm.querySelector('[name="name"]');
  const phoneInput = profileForm.querySelector('[name="phone"]');
  const birthInput = profileForm.querySelector('[name="birthdate"]');
  const emailInput = profileForm.querySelector('[name="email"]');
  const passwordInput = profileForm.querySelector('[name="newPassword"]');
  const confirmInput = profileForm.querySelector('[name="confirmPassword"]');

  if (nameInput) nameInput.value = data.name || '';
  if (phoneInput) phoneInput.value = data.phone || '';
  if (birthInput) birthInput.value = data.birthdate || '';
  if (emailInput) emailInput.value = data.email || '';
  if (passwordInput) passwordInput.value = '';
  if (confirmInput) confirmInput.value = '';

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
  renderProfileSummary();
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
  renderProfileSummary();
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
  profileFeedback.dataset.type = 'success';
  profileFeedback.classList.add('is-visible');
  clearTimeout(profileFeedback._timeout);
  profileFeedback._timeout = setTimeout(
    () => profileFeedback.classList.remove('is-visible'),
    3200,
  );
}

function showProfileFeedback(message, type = 'success') {
  if (!profileFeedback) return;
  profileFeedback.textContent = message;
  profileFeedback.dataset.type = type;
  profileFeedback.classList.add('is-visible');
  clearTimeout(profileFeedback._timeout);
  profileFeedback._timeout = setTimeout(
    () => profileFeedback.classList.remove('is-visible'),
    3200,
  );
}

function showAuthFeedback(message, type = 'success') {
  if (!authFeedback) return;
  authFeedback.textContent = message;
  authFeedback.dataset.type = type;
  authFeedback.classList.add('is-visible');
  clearTimeout(authFeedback._timeout);
  authFeedback._timeout = setTimeout(
    () => authFeedback.classList.remove('is-visible'),
    3600,
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

function formatDateTime(input) {
  if (!input) return '—';
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(value || ''),
  );
}

function parseJwtPayload(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length < 2) return null;
  try {
    return JSON.parse(atob(parts[1]));
  } catch (_error) {
    return null;
  }
}

function createUuid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const rand = (Math.random() * 16) | 0;
    const value = char === 'x' ? rand : (rand & 0x3) | 0x8;
    return value.toString(16);
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

function normalizeEvaluations(list) {
  if (!Array.isArray(list)) return [];
  const normalized = list.map((entry) => ({
    id: entry?.id || Date.now() + Math.random(),
    height: toNumber(entry?.height),
    waist: toNumber(entry?.waist),
    neck: toNumber(entry?.neck),
    weight: toNumber(entry?.weight),
    bodyFat: toNumber(entry?.bodyFat),
    date: entry?.date || entry?.createdAt || '',
  }));
  return sortEvaluations(normalized);
}

function getEvaluationLocalId(entry) {
  const numeric = Number(entry?.id);
  return Number.isFinite(numeric) ? numeric : null;
}

function normalizeSessionLogs(list) {
  if (!Array.isArray(list)) return [];
  return list
    .map((entry) => ({
      id: entry?.id || `${Date.now()}-${Math.random()}`,
      date: entry?.date || entry?.createdAt || '',
      workoutId: entry?.workoutId || '',
      workoutName: entry?.workoutName || '',
      dayIndex: Number.isFinite(entry?.dayIndex) ? entry.dayIndex : 0,
      dayLabel: entry?.dayLabel || '',
      exerciseId: entry?.exerciseId || '',
      exerciseName: entry?.exerciseName || '',
      weight: toNumber(entry?.weight),
      reps: toNumber(entry?.reps),
    }))
    .filter((entry) => entry.exerciseName);
}

function loadStateMeta() {
  const parsed = storageService.getJSON(STATE_META_STORAGE_KEY, {});
  return parsed && typeof parsed === 'object' ? parsed : {};
}

function setStateMeta(updatedAt) {
  stateMeta = {
    ...(stateMeta && typeof stateMeta === 'object' ? stateMeta : {}),
    updatedAt,
  };
  storageService.setJSON(STATE_META_STORAGE_KEY, stateMeta);
}

function touchStateMeta() {
  if (cloudSyncSuspended) return;
  setStateMeta(new Date().toISOString());
}

function saveSessionLogsToStorage(data) {
  storageService.setJSON(SESSION_STORAGE_KEY, data);
  touchStateMeta();
  scheduleCloudSync('silent');
}

function saveProfileToStorage(data) {
  storageService.setJSON(PROFILE_STORAGE_KEY, data);
  touchStateMeta();
  scheduleCloudSync('silent');
}

function saveEvaluationsToStorage(data) {
  storageService.setJSON(EVALUATION_STORAGE_KEY, data);
  touchStateMeta();
  scheduleCloudSync('silent');
  scheduleEvaluationCloudSync('silent');
}

function loadProfileFromStorage() {
  const raw = storageService.getJSON(PROFILE_STORAGE_KEY, {});
  return raw && typeof raw === 'object' ? raw : {};
}

function loadEvaluationsFromStorage() {
  const parsed = storageService.getJSON(EVALUATION_STORAGE_KEY, []);
  return normalizeEvaluations(parsed);
}

function loadWorkoutsFromStorage() {
  const parsed = storageService.getJSON(WORKOUT_STORAGE_KEY, []);
  return Array.isArray(parsed) ? normalizeWorkoutCollection(parsed) : [];
}

function loadSessionLogsFromStorage() {
  const parsed = storageService.getJSON(SESSION_STORAGE_KEY, []);
  return normalizeSessionLogs(parsed);
}

function getStateOwner() {
  return storageService.getString(STATE_OWNER_STORAGE_KEY, '').trim();
}

function setStateOwner(value) {
  storageService.setString(STATE_OWNER_STORAGE_KEY, value || '');
}

function resetLocalState() {
  selectedExercises = [];
  profileData = {};
  evaluations = [];
  sessionLogs = [];
  workouts = [];
  stateMeta = {};

  storageService.setJSON(SELECTED_EXERCISES_STORAGE_KEY, []);
  storageService.setJSON(PROFILE_STORAGE_KEY, {});
  storageService.setJSON(EVALUATION_STORAGE_KEY, []);
  storageService.setJSON(SESSION_STORAGE_KEY, []);
  storageService.setJSON(WORKOUT_STORAGE_KEY, []);
  storageService.setJSON(STATE_META_STORAGE_KEY, {});

  updateSelectedCount();
  search();
  updateTreinosPage();
  populateProfileForm({});
  renderEvaluationsUI();
  renderStrengthSection();
  renderSessionUI();
  renderDashboard();
}

function ensureWorkoutIds() {
  let changed = false;
  const idMap = new Map();

  workouts = workouts.map((workout) => {
    const currentId = workout.id;
    if (isUuid(currentId)) return workout;
    const newId = createUuid();
    idMap.set(currentId, newId);
    changed = true;
    return { ...workout, id: newId };
  });

  if (changed) {
    sessionLogs = sessionLogs.map((entry) => {
      const updatedId = idMap.get(entry.workoutId);
      if (!updatedId) return entry;
      return { ...entry, workoutId: updatedId };
    });
    saveWorkoutsToStorage(workouts);
    saveSessionLogsToStorage(sessionLogs);
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
  storageService.setJSON(WORKOUT_STORAGE_KEY, data);
  touchStateMeta();
  scheduleCloudSync('silent');
  scheduleWorkoutCloudSync('silent');
}

function saveActivePage(page) {
  const normalized = typeof page === 'string' ? page.trim() : '';
  if (!normalized) return;
  storageService.setString(ACTIVE_PAGE_STORAGE_KEY, normalized);
}

function loadActivePage() {
  const saved = storageService.getString(ACTIVE_PAGE_STORAGE_KEY, '').trim();
  if (saved === 'login') return 'dashboard';
  if (saved && document.getElementById(`page-${saved}`)) return saved;
  return 'dashboard';
}

const compressionService = {
  compress(payload) {
    if (!window.LZString?.compressToBase64) return null;
    return window.LZString.compressToBase64(payload);
  },
  decompress(payload) {
    if (!window.LZString?.decompressFromBase64) return null;
    return window.LZString.decompressFromBase64(payload);
  },
};

function getByteSize(text) {
  if (!text) return 0;
  if (typeof TextEncoder === 'undefined') {
    return new Blob([text]).size;
  }
  return new TextEncoder().encode(text).length;
}

function exportData() {
  if (!window.LZString) {
    alert('Compressão indisponível no momento.');
    return;
  }

  try {
    const payload = buildExportPayload();
    const jsonData = JSON.stringify(payload);
    const originalBytes = getByteSize(jsonData);
    const start = performance.now();
    const compressed = compressionService.compress(jsonData);
    const execTime = performance.now() - start;

    if (!compressed) throw new Error('Falha ao comprimir o payload.');

    const compressedBytes = getByteSize(compressed);
    const compressionRatio =
      originalBytes === 0
        ? 0
        : ((originalBytes - compressedBytes) / originalBytes) * 100;

    const exportPackage = {
      app: 'nushape',
      packageVersion: EXPORT_PACKAGE_VERSION,
      codec: EXPORT_CODEC,
      createdAt: new Date().toISOString(),
      payload: compressed,
    };

    lastExportBlob = new Blob([JSON.stringify(exportPackage)], {
      type: 'application/json',
    });
    const today = new Date().toISOString().split('T')[0];
    lastExportFilename = `nushape-${today}.nushape`;

    updateExportModal({
      originalBytes,
      compressedBytes,
      compressionRatio,
      execTime,
      selectedCount: selectedExercises.length,
      workoutCount: workouts.length,
      evaluationCount: evaluations.length,
      sessionCount: sessionLogs.length,
    });
    openExportModal();
  } catch (error) {
    console.error('Erro ao exportar dados:', error);
    alert('Não foi possível exportar os dados. Tente novamente.');
  }
}

function buildExportPayload() {
  return {
    version: EXPORT_DATA_VERSION,
    generatedAt: new Date().toISOString(),
    data: {
      selectedExercises,
      profile: profileData,
      evaluations,
      sessionLogs,
      workouts,
    },
  };
}

function openExportModal() {
  if (!exportModal) return;
  if (downloadExportBtn) downloadExportBtn.disabled = !lastExportBlob;
  const focusTarget =
    downloadExportBtn && !downloadExportBtn.disabled
      ? downloadExportBtn
      : exportModal.querySelector('[data-close-export], .modal-close');
  openModal(exportModal, { initialFocus: focusTarget });
}

function closeExportModal() {
  closeModal(exportModal);
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
    selectedCount = 0,
    workoutCount = 0,
    evaluationCount = 0,
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
  if (exportSelectedCountEl) exportSelectedCountEl.textContent = selectedCount;
  if (exportWorkoutCountEl) exportWorkoutCountEl.textContent = workoutCount;
  if (exportEvaluationCountEl)
    exportEvaluationCountEl.textContent = evaluationCount;

  if (compressionBarFill) {
    const savings = Math.max(0, Math.min(100, compressionRatio));
    compressionBarFill.style.width = `${savings}%`;
    compressionBarFill.classList.toggle('is-negative', compressionRatio < 0);
  }

  if (downloadExportBtn) downloadExportBtn.disabled = !lastExportBlob;
}

function parseImportPayload(rawData) {
  if (!rawData || typeof rawData !== 'object') return null;

  if (
    rawData.app === 'nushape' &&
    rawData.codec === EXPORT_CODEC &&
    typeof rawData.payload === 'string'
  ) {
    const json = compressionService.decompress(rawData.payload);
    if (!json) return null;
    try {
      return JSON.parse(json);
    } catch (error) {
      console.warn('Payload inválido após descompressão.', error);
      return null;
    }
  }

  if (rawData.version && rawData.data) {
    return rawData;
  }

  if (
    rawData.version === 2 &&
    (rawData.selectedExercises || rawData.profile || rawData.evaluations)
  ) {
    return {
      version: 2,
      data: {
        selectedExercises: rawData.selectedExercises,
        profile: rawData.profile,
        evaluations: rawData.evaluations,
        sessionLogs: rawData.sessionLogs,
        workouts: rawData.workouts,
      },
    };
  }

  return null;
}

function validateImportPayload(payload) {
  if (!payload || typeof payload !== 'object') {
    return { ok: false, message: 'Arquivo inválido.' };
  }

  const version = Number(payload.version);
  if (!Number.isFinite(version)) {
    return { ok: false, message: 'Versão do arquivo ausente.' };
  }

  if (version !== EXPORT_DATA_VERSION && version !== 2) {
    return { ok: false, message: 'Versão do arquivo não suportada.' };
  }

  const data = payload.data || {};
  return {
    ok: true,
    data: {
      selectedExercises: normalizeSelectedExercises(data.selectedExercises),
      profile: data.profile && typeof data.profile === 'object' ? data.profile : {},
      evaluations: normalizeEvaluations(data.evaluations),
      sessionLogs: normalizeSessionLogs(data.sessionLogs),
      workouts: Array.isArray(data.workouts)
        ? normalizeWorkoutCollection(data.workouts)
        : [],
    },
  };
}

function handleImportFile(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const parsedFile = JSON.parse(e.target.result);
      if (
        parsedFile &&
        typeof parsedFile === 'object' &&
        parsedFile.compressed &&
        parsedFile.tree &&
        !parsedFile.codec
      ) {
        throw new Error(
          'Arquivo .nushape antigo não é compatível com esta versão.',
        );
      }
      const payload = parseImportPayload(parsedFile);
      const validation = validateImportPayload(payload);
      if (!validation.ok) {
        throw new Error(validation.message || 'Arquivo inválido');
      }
      applyImportedData(validation.data);
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
  selectedExercises = normalizeSelectedExercises(data.selectedExercises);
  profileData = data.profile || {};
  evaluations = normalizeEvaluations(data.evaluations);
  sessionLogs = normalizeSessionLogs(data.sessionLogs);
  workouts = Array.isArray(data.workouts)
    ? normalizeWorkoutCollection(data.workouts)
    : [];

  saveSelectedExercises();
  saveProfileToStorage(profileData);
  saveEvaluationsToStorage(evaluations);
  saveSessionLogsToStorage(sessionLogs);
  saveWorkoutsToStorage(workouts);

  updateSelectedCount();
  search();
  updateTreinosPage();
  populateProfileForm(profileData);
  renderEvaluationsUI();
  renderStrengthSection();
  renderSessionUI();
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

/* ===================== SUPABASE / CLOUD ===================== */

function getSupabaseConfig() {
  const url =
    typeof window.SUPABASE_URL === 'string' ? window.SUPABASE_URL.trim() : '';
  const anonKey =
    typeof window.SUPABASE_ANON_KEY === 'string'
      ? window.SUPABASE_ANON_KEY.trim()
      : '';
  return { url, anonKey, ready: Boolean(url && anonKey) };
}

function updateAuthUI() {
  const loggedIn = Boolean(cloudSyncState.user);
  if (authTrigger) authTrigger.textContent = loggedIn ? 'Sair' : 'Entrar';
  authLogoutButtons.forEach((button) => {
    button.style.display = loggedIn ? 'inline-flex' : 'none';
  });
}

function getSupabaseProjectRef() {
  const url =
    typeof window.SUPABASE_URL === 'string' ? window.SUPABASE_URL.trim() : '';
  const match = url.match(/https?:\/\/([^.]+)\.supabase\.co/i);
  return match ? match[1] : '';
}

function clearSupabaseLocalSession() {
  const ref = getSupabaseProjectRef();
  if (!ref) return;
  localStorage.removeItem(`sb-${ref}-auth-token`);
  localStorage.removeItem(`sb-${ref}-auth-token-code-verifier`);
}

async function safeSignOut(options = {}) {
  if (!cloudSyncState.client) return;
  const skipNetwork = options.skipNetwork === true;
  try {
    if (!skipNetwork) {
      await cloudSyncState.client.auth.signOut({ scope: 'local' });
    }
  } catch (error) {
    console.warn('Falha ao sair (ignorando):', error);
  } finally {
    if (typeof cloudSyncState.client.auth?.stopAutoRefresh === 'function') {
      cloudSyncState.client.auth.stopAutoRefresh();
    }
    clearSupabaseLocalSession();
  }
}

function parseTimestamp(value) {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function buildCloudPayload() {
  const updatedAt = stateMeta?.updatedAt || new Date().toISOString();
  return {
    version: EXPORT_DATA_VERSION,
    updatedAt,
    data: {
      selectedExercises,
      profile: profileData,
      evaluations,
      sessionLogs,
    },
  };
}

function applyCloudPayload(payload) {
  const validation = validateImportPayload(payload);
  if (!validation.ok) return false;
  cloudSyncSuspended = true;
  applyImportedData(validation.data);
  cloudSyncSuspended = false;
  setStateMeta(payload.updatedAt || new Date().toISOString());
  return true;
}

async function syncToCloud(reason = 'auto') {
  if (!cloudSyncState.client || !cloudSyncState.user) return;
  if (cloudSyncState.syncing) return;
  cloudSyncState.syncing = true;
  renderProfileSummary();
  const payload = buildCloudPayload();
  const updatedAt = payload.updatedAt || new Date().toISOString();
  try {
    const { error } = await cloudSyncState.client
      .from(CLOUD_STATE_TABLE)
      .upsert(
        {
          user_id: cloudSyncState.user.id,
          data: payload,
          updated_at: updatedAt,
        },
        { onConflict: 'user_id' },
      );

    if (error) {
      console.warn('Falha ao sincronizar com a nuvem:', error);
      showAuthFeedback('Erro ao sincronizar com a nuvem.', 'error');
    } else {
      cloudSyncState.lastSyncAt = new Date().toISOString();
      if (reason !== 'silent') {
        showAuthFeedback('Dados sincronizados com a nuvem.');
      }
    }
  } catch (error) {
    console.error(error);
    showAuthFeedback('Erro ao sincronizar com a nuvem.', 'error');
  } finally {
    cloudSyncState.syncing = false;
    renderProfileSummary();
  }
}

function scheduleCloudSync(reason = 'silent') {
  if (!cloudSyncState.client || !cloudSyncState.user) return;
  if (cloudSyncSuspended) return;
  clearTimeout(cloudSyncState.syncTimer);
  cloudSyncState.syncTimer = setTimeout(
    () => syncToCloud(reason),
    1200,
  );
}

function scheduleWorkoutCloudSync(reason = 'silent') {
  if (!cloudSyncState.client || !cloudSyncState.user) return;
  if (cloudSyncSuspended) return;
  clearTimeout(workoutCloudSync.syncTimer);
  workoutCloudSync.syncTimer = setTimeout(
    () => syncWorkoutsToCloud(reason),
    1500,
  );
}

function scheduleEvaluationCloudSync(reason = 'silent') {
  if (!cloudSyncState.client || !cloudSyncState.user) return;
  if (cloudSyncSuspended) return;
  clearTimeout(evaluationCloudSync.syncTimer);
  evaluationCloudSync.syncTimer = setTimeout(
    () => syncEvaluationsToCloud(reason),
    1500,
  );
}

async function syncWorkoutsToCloud(reason = 'silent') {
  if (!cloudSyncState.client || !cloudSyncState.user) return;
  if (cloudSyncSuspended) return;
  if (workoutCloudSync.syncing) return;
  workoutCloudSync.syncing = true;
  renderProfileSummary();

  ensureWorkoutIds();
  const userId = cloudSyncState.user.id;
  const now = new Date().toISOString();
  const workoutRows = workouts.map((workout) => ({
    id: workout.id,
    user_id: userId,
    name: workout.name || 'Treino',
    division: workout.config?.division || null,
    volume: workout.config?.volume || null,
    days_per_week:
      Number(workout.config?.daysPerWeek) ||
      workout.days?.length ||
      null,
    created_at: workout.createdAt || now,
    updated_at: now,
  }));

  try {
    const { data: existing, error: existingError } =
      await cloudSyncState.client
        .from('workouts')
        .select('id')
        .eq('user_id', userId);

    if (existingError) {
      console.warn('Falha ao ler treinos da nuvem:', existingError);
      showAuthFeedback('Erro ao sincronizar treinos.', 'error');
      return;
    }

    if (workoutRows.length) {
      const { error: upsertError } = await cloudSyncState.client
        .from('workouts')
        .upsert(workoutRows, { onConflict: 'id' });
      if (upsertError) {
        console.warn('Falha ao salvar treinos na nuvem:', upsertError);
        showAuthFeedback('Erro ao salvar treinos.', 'error');
        return;
      }
    }

    const existingIds = (existing || []).map((item) => item.id);
    const localIds = new Set(workoutRows.map((row) => row.id));
    const toDelete = existingIds.filter((id) => !localIds.has(id));
    if (toDelete.length) {
      await cloudSyncState.client.from('workouts').delete().in('id', toDelete);
    }

    for (let i = 0; i < workouts.length; i += 1) {
      const workout = workouts[i];
      const workoutId = workout.id;
      await cloudSyncState.client
        .from('workout_days')
        .delete()
        .eq('workout_id', workoutId);

      const dayRows = (workout.days || []).map((day, index) => ({
        id: createUuid(),
        workout_id: workoutId,
        day_index: index,
        label: day.label || `Dia ${index + 1}`,
        focus: day.focus || null,
      }));

      if (dayRows.length) {
        const { error: dayError } = await cloudSyncState.client
          .from('workout_days')
          .insert(dayRows);
        if (dayError) {
          console.warn('Falha ao salvar dias do treino:', dayError);
          showAuthFeedback('Erro ao salvar dias do treino.', 'error');
          continue;
        }

        const exerciseRows = [];
        dayRows.forEach((dayRow, dayIndex) => {
          const exercisesList = workout.days?.[dayIndex]?.exercises || [];
          exercisesList.forEach((exercise, orderIndex) => {
            exerciseRows.push({
              id: createUuid(),
              day_id: dayRow.id,
              exercise_id: Number.isFinite(exercise.id) ? exercise.id : null,
              name: exercise.name || 'Exercício',
              muscle: exercise.muscle || null,
              equipment: exercise.equipment || null,
              difficulty: exercise.difficulty || null,
              sets: Number.isFinite(exercise.sets) ? exercise.sets : null,
              reps: exercise.reps || null,
              order_index: orderIndex,
            });
          });
        });

        if (exerciseRows.length) {
          const { error: exerciseError } = await cloudSyncState.client
            .from('workout_exercises')
            .insert(exerciseRows);
          if (exerciseError) {
            console.warn('Falha ao salvar exercícios do treino:', exerciseError);
            showAuthFeedback('Erro ao salvar exercícios do treino.', 'error');
          }
        }
      }
    }

    workoutCloudSync.lastSyncAt = new Date().toISOString();
    if (reason !== 'silent') {
      showAuthFeedback('Treinos sincronizados.');
    }
  } catch (error) {
    console.error(error);
    showAuthFeedback('Erro ao sincronizar treinos.', 'error');
  } finally {
    workoutCloudSync.syncing = false;
    renderProfileSummary();
  }
}

async function syncEvaluationsToCloud(reason = 'silent') {
  if (!cloudSyncState.client || !cloudSyncState.user) return;
  if (cloudSyncSuspended) return;
  if (evaluationCloudSync.syncing) return;
  evaluationCloudSync.syncing = true;
  renderProfileSummary();

  const userId = cloudSyncState.user.id;
  const now = new Date().toISOString();
  const rows = evaluations
    .map((entry) => {
      const localId = getEvaluationLocalId(entry);
      if (!localId) return null;
      return {
        user_id: userId,
        local_id: localId,
        date: entry.date || null,
        weight: toNumber(entry.weight),
        height: toNumber(entry.height),
        waist: toNumber(entry.waist),
        neck: toNumber(entry.neck),
        body_fat: toNumber(entry.bodyFat),
        updated_at: now,
      };
    })
    .filter(Boolean);

  try {
    const { data: existing, error: existingError } =
      await cloudSyncState.client
        .from(EVALUATIONS_TABLE)
        .select('local_id')
        .eq('user_id', userId);

    if (existingError) {
      console.warn('Falha ao ler avaliações da nuvem:', existingError);
      showAuthFeedback('Erro ao sincronizar avaliações.', 'error');
      return;
    }

    if (rows.length) {
      const { error: upsertError } = await cloudSyncState.client
        .from(EVALUATIONS_TABLE)
        .upsert(rows, { onConflict: 'user_id,local_id' });
      if (upsertError) {
        console.warn('Falha ao salvar avaliações na nuvem:', upsertError);
        showAuthFeedback('Erro ao salvar avaliações.', 'error');
        return;
      }
    }

    const existingIds = (existing || [])
      .map((item) => Number(item.local_id))
      .filter((value) => Number.isFinite(value));
    const localIds = new Set(rows.map((row) => row.local_id));
    const toDelete = existingIds.filter((id) => !localIds.has(id));
    if (toDelete.length) {
      await cloudSyncState.client
        .from(EVALUATIONS_TABLE)
        .delete()
        .eq('user_id', userId)
        .in('local_id', toDelete);
    }

    evaluationCloudSync.lastSyncAt = new Date().toISOString();
    if (reason !== 'silent') {
      showAuthFeedback('Avaliações sincronizadas.');
    }
  } catch (error) {
    console.error(error);
    showAuthFeedback('Erro ao sincronizar avaliações.', 'error');
  } finally {
    evaluationCloudSync.syncing = false;
    renderProfileSummary();
  }
}

async function loadEvaluationsFromCloud(fallbackEvaluations = []) {
  if (!cloudSyncState.client || !cloudSyncState.user) return;
  const userId = cloudSyncState.user.id;
  try {
    const { data, error } = await cloudSyncState.client
      .from(EVALUATIONS_TABLE)
      .select(
        'local_id, date, weight, height, waist, neck, body_fat, updated_at',
      )
      .eq('user_id', userId)
      .order('date', { ascending: false, nullsFirst: true });

    if (error) {
      console.warn('Erro ao carregar avaliações da nuvem:', error);
      showAuthFeedback('Não foi possível carregar avaliações.', 'error');
      return;
    }

    if (!data || !data.length) {
      if (Array.isArray(fallbackEvaluations) && fallbackEvaluations.length) {
        await syncEvaluationsToCloud('silent');
      }
      return;
    }

    const mapped = data.map((row) => ({
      id: Number(row.local_id) || Date.now() + Math.random(),
      date: row.date || '',
      weight: toNumber(row.weight),
      height: toNumber(row.height),
      waist: toNumber(row.waist),
      neck: toNumber(row.neck),
      bodyFat: toNumber(row.body_fat),
    }));

    evaluations = normalizeEvaluations(mapped);
    cloudSyncSuspended = true;
    saveEvaluationsToStorage(evaluations);
    cloudSyncSuspended = false;

    const latestStamp = data.reduce((acc, row) => {
      const time = parseTimestamp(row.updated_at);
      return time > acc ? time : acc;
    }, 0);
    if (latestStamp) {
      evaluationCloudSync.lastSyncAt = new Date(latestStamp).toISOString();
    }

    renderEvaluationsUI();
    renderDashboard();
    renderStrengthSection();
  } catch (error) {
    console.error(error);
    showAuthFeedback('Não foi possível carregar avaliações.', 'error');
  }
}

async function loadWorkoutsFromCloud(fallbackWorkouts = []) {
  if (!cloudSyncState.client || !cloudSyncState.user) return;
  const userId = cloudSyncState.user.id;
  try {
    const { data, error } = await cloudSyncState.client
      .from('workouts')
      .select(
        `id, name, division, volume, days_per_week, created_at, updated_at,
         workout_days (
           id, day_index, label, focus,
           workout_exercises (
             id, exercise_id, name, muscle, equipment, difficulty, sets, reps, order_index
           )
         )`,
      )
      .eq('user_id', userId);

    if (error) {
      console.warn('Erro ao carregar treinos da nuvem:', error);
      showAuthFeedback('Não foi possível carregar seus treinos.', 'error');
      return;
    }

    if (!data || !data.length) {
      if (Array.isArray(fallbackWorkouts) && fallbackWorkouts.length) {
        await syncWorkoutsToCloud('silent');
      }
      return;
    }

    const latestStamp = data.reduce((acc, row) => {
      const time = parseTimestamp(row.updated_at || row.created_at);
      return time > acc ? time : acc;
    }, 0);

    const mapped = data.map((row) => {
      const days = (row.workout_days || [])
        .slice()
        .sort((a, b) => a.day_index - b.day_index)
        .map((day) => ({
          label: day.label || `Dia ${day.day_index + 1}`,
          focus: day.focus || '',
          exercises: (day.workout_exercises || [])
            .slice()
            .sort(
              (a, b) =>
                (a.order_index ?? 0) - (b.order_index ?? 0),
            )
            .map((exercise) => ({
              id: Number.isFinite(exercise.exercise_id)
                ? exercise.exercise_id
                : null,
              name: exercise.name || 'Exercício',
              muscle: exercise.muscle || '',
              equipment: exercise.equipment || '',
              difficulty: exercise.difficulty || '',
              sets: Number.isFinite(exercise.sets) ? exercise.sets : null,
              reps: exercise.reps || '',
            })),
        }));

      const workout = {
        id: row.id,
        name: row.name || 'Treino',
        createdAt: row.created_at || new Date().toISOString(),
        config: {
          division: row.division || 'Sem Preferência',
          volume: row.volume || 'medium',
          daysPerWeek:
            Number(row.days_per_week) || days.length || 0,
        },
        days,
        metrics: {},
      };
      updateWorkoutMetrics(workout);
      return workout;
    });

    workouts = normalizeWorkoutCollection(mapped);
    cloudSyncSuspended = true;
    saveWorkoutsToStorage(workouts);
    cloudSyncSuspended = false;
    if (latestStamp) {
      workoutCloudSync.lastSyncAt = new Date(latestStamp).toISOString();
    }
    updateTreinosPage();
    if (
      activeWorkoutId &&
      !workouts.some((workout) => workout.id === activeWorkoutId)
    ) {
      activeWorkoutId = null;
    }
  } catch (error) {
    console.error(error);
    showAuthFeedback('Não foi possível carregar seus treinos.', 'error');
  }
}

async function loadCloudState() {
  if (!cloudSyncState.client || !cloudSyncState.user) return;
  try {
    const { data, error } = await cloudSyncState.client
      .from(CLOUD_STATE_TABLE)
      .select('data, updated_at')
      .eq('user_id', cloudSyncState.user.id)
      .maybeSingle();

    if (error) {
      console.warn('Erro ao carregar dados da nuvem:', error);
      showAuthFeedback('Não foi possível carregar seus dados.', 'error');
      return;
    }

    if (!data || !data.data) {
      await syncToCloud('silent');
      return;
    }

    const remotePayload = data.data;
    const remoteUpdatedAt = parseTimestamp(
      remotePayload.updatedAt || data.updated_at,
    );
    const localUpdatedAt = parseTimestamp(stateMeta?.updatedAt);

    if (!localUpdatedAt || remoteUpdatedAt >= localUpdatedAt) {
      const applied = applyCloudPayload(remotePayload);
      if (applied) showAuthFeedback('Dados carregados da nuvem.');
    } else {
      await syncToCloud('silent');
    }
  } catch (error) {
    console.error(error);
    showAuthFeedback('Erro ao carregar seus dados.', 'error');
  } finally {
    await loadEvaluationsFromCloud(evaluations);
    await loadWorkoutsFromCloud(workouts);
  }
}

async function initSupabase() {
  const { url, anonKey, ready } = getSupabaseConfig();
  if (!ready || !window.supabase?.createClient) {
    handleAuthStateChange();
    return;
  }

  cloudSyncState.client = window.supabase.createClient(url, anonKey);
  cloudSyncState.ready = true;

  try {
    const { data, error } = await cloudSyncState.client.auth.getSession();
    if (error) {
      console.warn('Falha ao recuperar sessão:', error);
    }
    cloudSyncState.user = data?.session?.user || null;
    handleAuthStateChange();

    cloudSyncState.client.auth.onAuthStateChange((_event, session) => {
      cloudSyncState.user = session?.user || null;
      handleAuthStateChange();
    });
  } catch (error) {
    console.error(error);
  }
}

async function handleAuthLogout() {
  if (!cloudSyncState.client) return;
  await safeSignOut();
  cloudSyncState.user = null;
  clearTimeout(cloudSyncState.syncTimer);
  clearTimeout(workoutCloudSync.syncTimer);
  clearTimeout(evaluationCloudSync.syncTimer);
  handleAuthStateChange();
  showAuthFeedback('Você saiu da conta.');
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
  renderDashboard();
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
  goToWorkoutStep(1);
  if (generationResult) generationResult.style.display = 'none';
  generationProgress
    ?.querySelectorAll('li')
    .forEach((li) => li.classList.remove('is-complete'));
  const bar = generationProgress?.querySelector('.progress-bar span');
  if (bar) bar.style.width = '0%';
  resetGenerationButton();
  updateRequirementSummary();
  const focusTarget =
    divisionOptions?.querySelector('input:checked') ||
    divisionOptions?.querySelector('input') ||
    daysOptions?.querySelector('button.is-selected') ||
    daysOptions?.querySelector('button');
  openModal(workoutModal, { initialFocus: focusTarget });
}

function closeWorkoutModal() {
  closeModal(workoutModal);
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

function generateAIWorkoutPlan(execTime = 0) {
  if (!window.AIWorkoutGenerator?.generatePlan) return null;
  const result = window.AIWorkoutGenerator.generatePlan({
    config: workoutState.config,
    exercises,
    selectedExercises,
    profile: profileData,
  });
  if (!result || !Array.isArray(result.days)) return null;

  const plan = {
    id: createUuid(),
    name: `Treino ${workouts.length + 1}`,
    createdAt: new Date().toISOString(),
    config: { ...workoutState.config },
    days: result.days,
    metrics: {
      algorithm: 'AI Planner',
      timeMs: execTime,
      equipmentSwitches: result.days.reduce(
        (acc, day) => acc + calculateEquipmentSwitches(day.exercises),
        0,
      ),
      volumeTotal: result.days.reduce(
        (acc, day) =>
          acc +
          day.exercises.reduce(
            (sum, exercise) => sum + (Number(exercise.sets) || 0),
            0,
          ),
        0,
      ),
    },
  };

  return { plan: normalizeWorkout(plan), meta: result.meta || {} };
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

function applyAiSelection(plan) {
  if (!plan || !Array.isArray(plan.days)) return;
  const ids = plan.days
    .flatMap((day) => day.exercises || [])
    .map((exercise) => exercise.id)
    .filter((id) => Number.isFinite(id));
  if (!ids.length) return;
  selectedExercises = normalizeSelectedExercises([
    ...selectedExercises,
    ...ids,
  ]);
  saveSelectedExercises();
  updateSelectedCount();
  search();
  updateTreinosPage();
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
                      <img src="assets/icons/reordenar.svg" alt="" width="16" height="16">
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

async function handleWorkoutExportPdf() {
  if (!activeWorkoutId) return;
  const workout = workouts.find((w) => w.id === activeWorkoutId);
  if (!workout) return;
  if (!window.PDFExporter?.exportWorkoutPdf) {
    alert('Exportação PDF indisponível no momento.');
    return;
  }
  try {
    await window.PDFExporter.exportWorkoutPdf(workout, {
      profile: profileData,
      preview: true,
    });
  } catch (error) {
    console.error(error);
    alert('Não foi possível gerar o PDF.');
  }
}

function openDeleteWorkoutModal(workoutId) {
  if (!deleteWorkoutModal || !workoutId) return;
  workoutPendingDeletion = workoutId;
  const workout = workouts.find((w) => w.id === workoutId);
  if (deleteWorkoutName) {
    deleteWorkoutName.textContent = workout ? workout.name : '';
  }
  openModal(deleteWorkoutModal, { initialFocus: '#confirmDeleteWorkoutBtn' });
}

function closeDeleteWorkoutModal() {
  workoutPendingDeletion = null;
  closeModal(deleteWorkoutModal);
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
  const stepDelay = 220;
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
    }, stepDelay * (index + 1));
  });

  setTimeout(() => {
    const execTime = performance.now() - start;
    const result = generateAIWorkoutPlan(execTime);
    const plan = result?.plan;
    if (!plan) {
      generationResult.innerHTML =
        '<strong>Não foi possível gerar o treino.</strong> Tente ajustar os parâmetros.';
      generationResult.style.display = 'block';
      resetGenerationButton();
      return;
    }

    workouts.push(plan);
    saveWorkoutsToStorage(workouts);
    renderWorkoutCards();
    showWorkoutDetails(plan.id);

    const warningText = result?.meta?.warning;
    generationResult.innerHTML = `<strong>Treino gerado!</strong> Tempo: ${plan.metrics.timeMs.toFixed(
      2,
    )} ms • Volume total: ${
      plan.metrics.volumeTotal
    } séries${warningText ? `<br><span style="color: var(--muted); font-size: 13px;">${warningText}</span>` : ''}`;
    applyAiSelection(plan);
    generationResult.style.display = 'block';
    markGenerationFinished();
    if (generateWorkoutBtn) {
      generateWorkoutBtn.disabled = false;
      generateWorkoutBtn.classList.remove('is-loading');
    }
  }, stepDelay * tasks.length + 300);
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


/* FUNÇÕES EXTRAS */

function clearAllData() {
  storageService.clearAll();
  selectedExercises = [];
  profileData = {};
  evaluations = [];
  sessionLogs = [];
  workouts = [];
  touchStateMeta();
  scheduleCloudSync('clear');
  scheduleWorkoutCloudSync('clear');
  scheduleEvaluationCloudSync('clear');

  updateSelectedCount();
  search();
  updateTreinosPage();
  populateProfileForm({});
  renderEvaluationsUI();
  renderStrengthSection();
  renderSessionUI();
  closeEvaluationModal();
  closeClearModal();
  closeExportModal();

  const activePageEl = document.querySelector('.page.active');
  const currentPage = activePageEl?.id?.replace('page-', '') || 'dashboard';
  saveActivePage(currentPage);

  alert('✅ Todos os dados foram limpos com sucesso!');
  showSuccessFeedback('Todos os dados foram limpos com sucesso!');
}

initSupabase();
loadSelectedExercises();
search();
updateSelectedCount();
const initialPage = loadActivePage();
navigateTo(initialPage);
