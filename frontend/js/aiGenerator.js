/* ===============================================
   AI Workout Generator v2.1 - Scientific Edition
   Correções críticas:
   - Volume altera SETS/REPS, não exercícios
   - Sem exercícios redundantes
   - Garantia de todos grupos musculares
   - Priorização: Compostos → Isolamentos
   =============================================== */

(function (global) {
  'use strict';

  // ========================================
  // 1. UTILITIES
  // ========================================

  function normalize(value) {
    if (typeof global.norm === 'function') return global.norm(value);
    return String(value || '')
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase();
  }

  function normalizeForMatch(value) {
    return normalize(value)
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  function createRng(seed) {
    let state = seed % 2147483647;
    if (state <= 0) state += 2147483646;
    return function rng() {
      state = (state * 16807) % 2147483647;
      return (state - 1) / 2147483646;
    };
  }

  const PLAN_HISTORY = new Map();
  const MAX_HISTORY = 3;

  function getHistoryKey(config) {
    return `${config.division || 'Sem Preferência'}|${config.daysPerWeek || 0}`;
  }

  function buildPlanSignature(days) {
    return days
      .map((day) => (day.exercises || []).map((ex) => ex.id).join(','))
      .join('|');
  }

  function wasRecentlyGenerated(historyKey, signature) {
    const recent = PLAN_HISTORY.get(historyKey) || [];
    return recent.includes(signature);
  }

  function rememberPlan(historyKey, signature) {
    const recent = PLAN_HISTORY.get(historyKey) || [];
    recent.unshift(signature);
    PLAN_HISTORY.set(historyKey, recent.slice(0, MAX_HISTORY));
  }

  function pickCandidate(candidates, rng) {
    if (!candidates.length) return null;
    const topSize = Math.min(3, candidates.length);
    const top = candidates.slice(0, topSize);
    const weights = top.map(
      (item, index) => Math.max(1, item.score) * (1 - index * 0.1),
    );
    const total = weights.reduce((sum, weight) => sum + weight, 0);
    let target = rng() * total;
    for (let i = 0; i < top.length; i += 1) {
      target -= weights[i];
      if (target <= 0) return top[i];
    }
    return top[0];
  }

  const EXCLUDED_EXERCISE_KEYWORDS = ['box squat'];

  function isExcludedExercise(exercise) {
    const text = normalizeForMatch(
      `${exercise?.name || ''} ${exercise?.desc || ''}`,
    );
    return EXCLUDED_EXERCISE_KEYWORDS.some((keyword) => text.includes(keyword));
  }

  // ========================================
  // 2. EXERCISE CLASSIFICATION
  // ========================================

  const EXERCISE_PATTERNS = {
    // Peitoral
    peitoral_composto: [
      'supino',
      'bench',
      'chest press',
      'peito',
      'press',
      'flexao',
      'push up',
      'push-up',
      'dips',
      'paralela',
    ],
    peitoral_isolamento: [
      'crucifixo',
      'fly',
      'crossover',
      'pec deck',
      'peck deck',
      'pec',
    ],

    // Costas
    costas_composto: [
      'barra fixa',
      'pull up',
      'pull-up',
      'chin up',
      'pulldown',
      'puxada',
      'remada',
      'row',
      'lat',
      'dorsal',
      'rack pull',
      'landmine',
      'meadows',
      'pendlay',
    ],
    costas_isolamento: [
      'pullover',
      'pull over',
      'serrote',
      'bracos estendidos',
      'straight arm',
    ],

    // Ombros
    ombros_composto: [
      'desenvolvimento',
      'press',
      'military',
      'overhead',
      'shoulder press',
      'arnold',
      'z press',
      'landmine',
      'cuban press',
    ],
    ombros_isolamento: [
      'elevacao lateral',
      'elevacao frontal',
      'lateral',
      'frontal',
      'remada alta',
      'upright row',
      'face pull',
      'reverse',
      'y raise',
      'y-raise',
      'delto',
    ],
    deltoide_posterior: [
      'face pull',
      'reverse fly',
      'crucifixo inverso',
      'peck deck reverso',
      'peck-deck reverso',
      'peck deck reverse',
      'rear delt',
      'reverse',
      'y-raise',
      'y raise',
    ],

    // Pernas - Quadríceps
    quad_composto: [
      'agachamento',
      'squat',
      'front squat',
      'box squat',
      'zercher',
      'leg press',
      'pressa',
      'hack',
      'split squat',
      'bulgar',
      'afundo',
      'passada',
      'lunge',
      'step up',
      'step-up',
      'smith',
    ],
    quad_isolamento: [
      'extensora',
      'cadeira extensora',
      'leg extension',
      'extensao',
      'sissy',
    ],

    // Pernas - Posterior
    posterior_composto: [
      'levantamento terra',
      'terra',
      'deadlift',
      'stiff',
      'romeno',
      'rdl',
      'good morning',
      'kettlebell swing',
      'swing',
      'glute ham',
      'ghr',
      'reverse hyper',
      'jefferson',
      'deficit',
    ],
    posterior_isolamento: [
      'flexora',
      'mesa flexora',
      'leg curl',
      'nordic',
      'curl',
    ],

    // Glúteos
    gluteos_composto: [
      'hip thrust',
      'glute bridge',
      'bridge',
      'ponte',
      'elevacao pelvica',
      'elevacao de quadril',
      'pelvica',
      'glute drive',
    ],
    gluteos_isolamento: [
      'abdutora',
      'abducao',
      'coice',
      'kickback',
      'glute kickback',
    ],

    // Braços
    biceps: [
      'rosca',
      'curl',
      'biceps',
      'martelo',
      'scott',
      'spider',
      'concentrada',
      'alternada',
      '21',
      'barra w',
      'ez',
      'inclinado',
    ],
    triceps: [
      'triceps',
      'testa',
      'frances',
      'corda',
      'polia',
      'pushdown',
      'pressdown',
      'coice',
      'kickback',
      'jm press',
      'close grip',
      'supino fechado',
      'press fechado',
      'skull',
      'paralela',
      'dips',
    ],

    // Abdômen
    abdomen_isolamento: [
      'abdominal',
      'crunch',
      'infra',
      'prancha',
      'plank',
      'hollow',
      'dead bug',
      'ab wheel',
      'roda',
    ],

    // Panturrilhas
    panturrilha: ['panturrilha', 'panturr', 'calf', 'donkey'],
  };

  // Exercícios que são variações do mesmo movimento (evitar redundância)
  const EXERCISE_FAMILIES = {
    agachamento: [
      'agachamento livre',
      'agachamento no smith',
      'agachamento frontal',
      'agachamento bulgaro',
      'agachamento hack',
      'box squat',
      'hack squat',
      'hack',
      'smith squat',
    ],
    supino: [
      'supino reto',
      'supino inclinado',
      'supino declinado',
      'supino no smith',
      'supino com halteres',
    ],
    desenvolvimento: [
      'desenvolvimento militar',
      'desenvolvimento com halteres',
      'desenvolvimento arnold',
      'desenvolvimento no smith',
    ],
    remada: [
      'remada curvada',
      'remada cavalinho',
      'remada baixa',
      'remada unilateral',
      'remada t',
    ],
    terra: ['levantamento terra', 'stiff', 'romeno', 'rdl'],
    'good morning': [
      'good morning com barra',
      'good morning com halteres',
      'good morning na smith',
    ],
    puxada: ['puxada frente', 'puxada aberta', 'pulldown', 'puxada triangulo'],
    rosca: [
      'rosca direta',
      'rosca com barra w',
      'rosca alternada',
      'rosca martelo',
    ],
  };

  function getExerciseFamily(exerciseName) {
    const norm = normalize(exerciseName);
    for (const [family, variations] of Object.entries(EXERCISE_FAMILIES)) {
      if (variations.some((v) => norm.includes(normalize(v)))) {
        return family;
      }
    }
    return norm;
  }

  function getExerciseType(exercise, muscle) {
    const text = normalize(`${exercise.name} ${exercise.desc || ''}`);
    const patterns = {
      Peitoral: {
        compound: EXERCISE_PATTERNS.peitoral_composto,
        isolation: EXERCISE_PATTERNS.peitoral_isolamento,
      },
      Costas: {
        compound: EXERCISE_PATTERNS.costas_composto,
        isolation: EXERCISE_PATTERNS.costas_isolamento,
      },
      Ombros: {
        compound: EXERCISE_PATTERNS.ombros_composto,
        isolation: EXERCISE_PATTERNS.ombros_isolamento,
      },
      'Deltoide Posterior': {
        compound: [],
        isolation: EXERCISE_PATTERNS.deltoide_posterior,
      },
      Quadríceps: {
        compound: EXERCISE_PATTERNS.quad_composto,
        isolation: EXERCISE_PATTERNS.quad_isolamento,
      },
      Posterior: {
        compound: EXERCISE_PATTERNS.posterior_composto,
        isolation: EXERCISE_PATTERNS.posterior_isolamento,
      },
      Glúteos: {
        compound: EXERCISE_PATTERNS.gluteos_composto,
        isolation: EXERCISE_PATTERNS.gluteos_isolamento,
      },
      Bíceps: { compound: EXERCISE_PATTERNS.biceps, isolation: [] },
      Tríceps: { compound: EXERCISE_PATTERNS.triceps, isolation: [] },
      Abdômen: {
        compound: [],
        isolation: EXERCISE_PATTERNS.abdomen_isolamento,
      },
      Panturrilhas: { compound: EXERCISE_PATTERNS.panturrilha, isolation: [] },
    };

    const musclePatterns = patterns[muscle];
    if (!musclePatterns) return 'auxiliary';

    if (musclePatterns.compound.some((pattern) => text.includes(pattern)))
      return 'compound';
    if (musclePatterns.isolation.some((pattern) => text.includes(pattern)))
      return 'isolation';

    return 'auxiliary';
  }

  function scoreExercise(exercise, targetMuscle, position, type) {
    let score = 100;

    // Prioridade por tipo
    if (type === 'compound') score += 100;
    else if (type === 'isolation') score += 50;

    // Exercícios compostos sempre no início
    if (position === 0 && type === 'compound') score += 50;
    if (position === 1 && type === 'compound') score += 30;

    // Exercícios com barra têm prioridade em compostos
    const text = normalize(exercise.name);
    if (text.includes('barra') && type === 'compound') score += 20;

    return score;
  }

  // ========================================
  // 3. MUSCLE CATEGORY RESOLUTION
  // ========================================

  const LEG_KEYWORDS = {
    quadriceps: [
      'agach',
      'squat',
      'leg press',
      'pressa',
      'extensora',
      'leg extension',
      'hack',
      'frontal',
      'front squat',
      'passada',
      'afundo',
      'lunge',
      'split squat',
      'bulgar',
      'step up',
      'step-up',
      'pistol',
      'box squat',
      'zercher',
      'smith',
      'sissy',
      'adutora',
      'adutor',
    ],
    posterior: [
      'posterior',
      'stiff',
      'romeno',
      'terra',
      'deadlift',
      'rdl',
      'good morning',
      'flexora',
      'mesa flexora',
      'leg curl',
      'nordic',
      'glute ham',
      'ghr',
      'reverse hyper',
      'jefferson',
      'deficit',
      'swing',
      'kettlebell swing',
    ],
    gluteos: [
      'glute',
      'hip thrust',
      'glute bridge',
      'ponte',
      'bridge',
      'elevacao pelvica',
      'elevacao de quadril',
      'pelvica',
      'abducao',
      'abdutora',
      'coice',
      'kickback',
      'glute drive',
      'curtsy',
    ],
    panturrilhas: ['panturr', 'calf', 'donkey'],
  };

  const LEG_CATEGORY_PRIORITY = [
    'Panturrilhas',
    'Posterior',
    'Glúteos',
    'Quadríceps',
  ];

  function scoreKeywords(text, keywords) {
    let score = 0;
    keywords.forEach((keyword) => {
      if (text.includes(keyword)) score += 1;
    });
    return score;
  }

  function resolveLegCategory(text) {
    const scores = {
      Quadríceps: scoreKeywords(text, LEG_KEYWORDS.quadriceps),
      Posterior: scoreKeywords(text, LEG_KEYWORDS.posterior),
      Glúteos: scoreKeywords(text, LEG_KEYWORDS.gluteos),
      Panturrilhas: scoreKeywords(text, LEG_KEYWORDS.panturrilhas),
    };

    const maxScore = Math.max(...Object.values(scores));
    if (maxScore === 0) return 'Pernas';

    const winners = Object.entries(scores)
      .filter(([, score]) => score === maxScore)
      .map(([category]) => category);

    if (winners.length === 1) return winners[0];

    const prioritized = LEG_CATEGORY_PRIORITY.find((category) =>
      winners.includes(category),
    );
    return prioritized || winners[0];
  }

  const UPPER_KEYWORDS = {
    Peitoral: [
      'supino',
      'bench',
      'chest press',
      'peito',
      'pec',
      'crucifixo',
      'fly',
      'crossover',
      'pec deck',
      'peck deck',
      'paralela',
      'dips',
      'push up',
      'push-up',
      'flexao',
    ],
    Costas: [
      'remada',
      'row',
      'puxada',
      'pulldown',
      'pull up',
      'pull-up',
      'chin up',
      'barra fixa',
      'lat',
      'dorsal',
      'serrote',
      'rack pull',
      'landmine',
      'meadows',
      'pendlay',
    ],
    Ombros: [
      'desenvolvimento',
      'shoulder press',
      'overhead',
      'military',
      'arnold',
      'landmine',
      'z press',
      'cuban',
      'elevacao lateral',
      'elevacao frontal',
      'lateral',
      'frontal',
      'face pull',
      'remada alta',
      'upright row',
      'y raise',
      'y-raise',
      'delto',
    ],
    'Deltoide Posterior': [
      'face pull',
      'reverse fly',
      'crucifixo inverso',
      'peck deck reverso',
      'peck-deck reverso',
      'peck deck reverse',
      'rear delt',
      'reverse',
      'y-raise',
      'y raise',
    ],
    Bíceps: [
      'rosca',
      'curl',
      'biceps',
      'martelo',
      'scott',
      'spider',
      'concentrada',
      'alternada',
      'barra w',
      'ez',
      'inclinado',
    ],
    Tríceps: [
      'triceps',
      'testa',
      'frances',
      'corda',
      'polia',
      'pushdown',
      'pressdown',
      'coice',
      'kickback',
      'jm press',
      'close grip',
      'supino fechado',
      'press fechado',
      'skull',
    ],
    Trapézio: ['trapezio', 'shrug', 'encolhimento'],
    Antebraços: ['antebraco', 'wrist', 'reverse curl', 'rosca inversa'],
    Abdômen: [
      'abdominal',
      'crunch',
      'infra',
      'prancha',
      'plank',
      'hollow',
      'dead bug',
      'ab wheel',
      'roda',
    ],
    Lombar: ['lombar', 'back extension', 'hiperextensao'],
  };

  const UPPER_CATEGORY_PRIORITY = [
    'Costas',
    'Peitoral',
    'Deltoide Posterior',
    'Ombros',
    'Tríceps',
    'Bíceps',
    'Trapézio',
    'Antebraços',
    'Lombar',
    'Abdômen',
  ];

  function resolveUpperCategory(text) {
    const scores = {};
    Object.entries(UPPER_KEYWORDS).forEach(([category, keywords]) => {
      scores[category] = scoreKeywords(text, keywords);
    });

    const maxScore = Math.max(...Object.values(scores));
    if (maxScore === 0) return '';

    const winners = Object.entries(scores)
      .filter(([, score]) => score === maxScore)
      .map(([category]) => category);

    if (winners.length === 1) return winners[0];

    const prioritized = UPPER_CATEGORY_PRIORITY.find((category) =>
      winners.includes(category),
    );
    return prioritized || winners[0];
  }

  const MOVEMENT_PATTERNS = {
    horizontal_push: [
      'supino',
      'bench',
      'chest press',
      'press inclinado',
      'press declinado',
      'push up',
      'push-up',
      'flexao',
      'paralela',
      'dips',
    ],
    vertical_push: [
      'desenvolvimento',
      'overhead',
      'military',
      'arnold',
      'shoulder press',
      'landmine press',
      'z press',
      'press militar',
    ],
    horizontal_pull: [
      'remada',
      'row',
      't-bar',
      'landmine',
      'meadows',
      'pendlay',
      'seal row',
      'serrote',
    ],
    vertical_pull: [
      'puxada',
      'pulldown',
      'pull up',
      'pull-up',
      'chin up',
      'barra fixa',
      'lat pulldown',
    ],
    rear_delt: [
      'face pull',
      'reverse fly',
      'crucifixo inverso',
      'peck deck reverso',
      'peck-deck reverso',
      'peck deck reverse',
      'rear delt',
      'reverse',
      'y-raise',
      'y raise',
    ],
    lateral_delt: ['elevacao lateral', 'lateral raise'],
    squat: [
      'agachamento',
      'squat',
      'leg press',
      'hack',
      'front squat',
      'box squat',
      'zercher',
      'smith',
    ],
    hinge: [
      'terra',
      'deadlift',
      'romeno',
      'stiff',
      'rdl',
      'good morning',
      'kettlebell swing',
      'swing',
    ],
    hamstring_iso: ['flexora', 'mesa flexora', 'leg curl', 'nordic'],
    calf: ['panturr', 'calf', 'donkey'],
    core: [
      'abdominal',
      'crunch',
      'prancha',
      'plank',
      'hollow',
      'dead bug',
      'ab wheel',
      'roda',
    ],
    glute: [
      'glute',
      'hip thrust',
      'glute bridge',
      'bridge',
      'ponte',
      'elevacao pelvica',
      'elevacao de quadril',
      'pelvica',
      'abducao',
      'abdutora',
      'coice',
      'kickback',
      'glute drive',
    ],
    biceps: [
      'rosca',
      'curl',
      'biceps',
      'martelo',
      'scott',
      'spider',
      'concentrada',
      'alternada',
      'barra w',
      'ez',
      'inclinado',
    ],
    triceps: [
      'triceps',
      'testa',
      'frances',
      'corda',
      'polia',
      'pushdown',
      'pressdown',
      'coice',
      'kickback',
      'jm press',
      'close grip',
      'supino fechado',
      'press fechado',
      'skull',
      'paralela',
      'dips',
    ],
  };

  const REQUIREMENT_DEFS = {
    horizontal_push: { muscle: 'Peitoral', type: 'compound' },
    vertical_push: { muscle: 'Ombros', type: 'compound' },
    lateral_delt: { muscle: 'Ombros', type: 'isolation' },
    horizontal_pull: { muscle: 'Costas', type: 'compound' },
    vertical_pull: { muscle: 'Costas', type: 'compound' },
    rear_delt: { muscle: 'Deltoide Posterior', type: 'isolation' },
    squat: { muscle: 'Quadríceps', type: 'compound' },
    hinge: { muscle: 'Posterior', type: 'compound' },
    hamstring_iso: { muscle: 'Posterior', type: 'isolation' },
    calf: { muscle: 'Panturrilhas', type: 'isolation' },
    core: { muscle: 'Abdômen', type: 'isolation' },
    glute: { muscle: 'Glúteos', type: 'compound' },
    biceps: { muscle: 'Bíceps', type: 'isolation' },
    triceps: { muscle: 'Tríceps', type: 'isolation' },
  };

  const REQUIREMENT_CATEGORY_ALLOWLIST = {
    horizontal_push: ['Peitoral'],
    vertical_push: ['Ombros'],
    lateral_delt: ['Ombros'],
    horizontal_pull: ['Costas'],
    vertical_pull: ['Costas'],
    rear_delt: ['Deltoide Posterior', 'Ombros'],
    squat: ['Quadríceps', 'Pernas'],
    hinge: ['Posterior', 'Glúteos', 'Pernas'],
    hamstring_iso: ['Posterior'],
    calf: ['Panturrilhas'],
    core: ['Abdômen'],
    glute: ['Glúteos'],
    biceps: ['Bíceps'],
    triceps: ['Tríceps'],
  };

  const TYPE_REQUIREMENTS = {
    push: ['horizontal_push', 'vertical_push', 'lateral_delt'],
    pull: ['vertical_pull', 'horizontal_pull', 'rear_delt'],
    lower: ['squat', 'hinge', 'hamstring_iso', 'calf'],
    upper: [
      'horizontal_push',
      'horizontal_pull',
      'vertical_push',
      'vertical_pull',
      'rear_delt',
    ],
    full: ['horizontal_push', 'horizontal_pull', 'squat', 'hinge'],
    delts: ['vertical_push', 'lateral_delt', 'rear_delt'],
    arms: [],
  };

  function buildRequirementsForTemplate(template, gender) {
    if (!template) return [];
    const base = TYPE_REQUIREMENTS[template.type] || [];
    if (template.type === 'upper') {
      if (gender === 'female') {
        if (template.emphasis === 'back') {
          return [
            'horizontal_pull',
            'vertical_pull',
            'horizontal_push',
            'rear_delt',
            'biceps',
          ];
        }
        if (template.emphasis === 'chest') {
          return [
            'horizontal_push',
            'horizontal_pull',
            'vertical_pull',
            'rear_delt',
            'triceps',
          ];
        }
        return [
          'horizontal_push',
          'horizontal_pull',
          'vertical_pull',
          'rear_delt',
          'biceps',
        ];
      }
      if (template.emphasis === 'back') {
        return [
          'horizontal_pull',
          'vertical_pull',
          'horizontal_push',
          'vertical_push',
          'rear_delt',
        ];
      }
      if (template.emphasis === 'chest') {
        return [
          'horizontal_push',
          'vertical_push',
          'horizontal_pull',
          'vertical_pull',
          'rear_delt',
        ];
      }
    }
    if (template.type === 'lower') {
      if (template.emphasis === 'posterior') {
        return ['hinge', 'squat', 'hamstring_iso', 'calf'];
      }
      if (template.emphasis === 'quads') {
        return ['squat', 'hinge', 'hamstring_iso', 'calf'];
      }
      if (template.emphasis === 'glutes') {
        if (gender === 'female') {
          return ['glute', 'hinge', 'hamstring_iso', 'calf'];
        }
        return ['hinge', 'squat', 'hamstring_iso', 'calf'];
      }
    }
    return base;
  }

  function applyFemaleBias(templates = [], division = '') {
    const output = templates.map((entry) => ({
      ...entry,
      muscles: (entry.muscles || []).map((muscle) => ({ ...muscle })),
    }));

    const lowerDays = output.filter((entry) => entry.type === 'lower');
    if (!lowerDays.length) return output;

    if (division === 'Upper / Lower' && lowerDays.length >= 2) {
      const gluteDay = lowerDays[1];
      gluteDay.emphasis = 'glutes';
      gluteDay.muscles = [
        { name: 'Glúteos', compounds: 2, isolations: 1 },
        { name: 'Posterior', compounds: 1, isolations: 1 },
        { name: 'Panturrilhas', compounds: 0, isolations: 1 },
      ];
    }

    lowerDays.forEach((day, index) => {
      if (division === 'Upper / Lower' && index === 1) return;
      const gluteIndex = day.muscles.findIndex(
        (muscle) => muscle.name === 'Glúteos',
      );
      if (gluteIndex >= 0) {
        day.muscles[gluteIndex].isolations = Math.max(
          1,
          day.muscles[gluteIndex].isolations || 0,
        );
      } else {
        day.muscles.push({ name: 'Glúteos', compounds: 1, isolations: 1 });
      }
    });

    return output;
  }

  function applyMaleBias(templates = []) {
    return templates.map((entry) => {
      if (entry.type !== 'lower') return { ...entry };
      const muscles = (entry.muscles || []).filter(
        (muscle) => muscle.name !== 'Glúteos',
      );
      return {
        ...entry,
        muscles,
      };
    });
  }

  function matchesPattern(text, pattern) {
    const keywords = MOVEMENT_PATTERNS[pattern];
    if (!keywords) return false;
    return keywords.some((keyword) => text.includes(keyword));
  }

  function selectExerciseForRequirement({
    requirement,
    pool,
    usedDay,
    usedGlobal,
    usedFamilies,
    position,
    goal,
    volume,
    rng,
    gender,
    template,
  }) {
    const def = REQUIREMENT_DEFS[requirement];
    if (!def) return null;
    let allowedCategories = REQUIREMENT_CATEGORY_ALLOWLIST[requirement] || [];
    if (requirement === 'hinge' && gender === 'male') {
      allowedCategories = allowedCategories.filter(
        (category) => category !== 'Glúteos',
      );
    }
    const textForMatch = (exercise) =>
      normalizeForMatch(`${exercise.name || ''} ${exercise.desc || ''}`);

    let candidates = pool.filter((exercise) => {
      if (usedDay.has(exercise.id)) return false;
      if (isExcludedExercise(exercise)) return false;
      const text = textForMatch(exercise);
      if (!matchesPattern(text, requirement)) return false;
      if (allowedCategories.length) {
        const category = resolveExerciseCategory(exercise);
        return allowedCategories.includes(category);
      }
      return true;
    });

    if (!candidates.length && (def.muscle || allowedCategories.length)) {
      const allowedFallback = allowedCategories.length
        ? allowedCategories
        : [def.muscle];
      candidates = pool.filter((exercise) => {
        if (usedDay.has(exercise.id)) return false;
        if (isExcludedExercise(exercise)) return false;
        return allowedFallback.includes(resolveExerciseCategory(exercise));
      });
    }

    if (!candidates.length) return null;

    const unusedGlobal = candidates.filter(
      (exercise) => !usedGlobal.has(exercise.id),
    );
    if (unusedGlobal.length) candidates = unusedGlobal;

    candidates = candidates.filter(
      (exercise) => !usedFamilies.has(getExerciseFamily(exercise.name)),
    );

    if (!candidates.length) return null;

    if (
      requirement === 'squat' &&
      gender === 'male' &&
      template?.emphasis === 'posterior'
    ) {
      const preferred = candidates.find((exercise) =>
        textForMatch(exercise).includes('hack'),
      );
      const secondary = preferred
        ? null
        : candidates.find((exercise) =>
            textForMatch(exercise).includes('leg press'),
          );
      const chosen = preferred || secondary;
      if (chosen) {
        const type = getExerciseType(chosen, def.muscle);
        return {
          exercise: chosen,
          type,
          prescription: getPrescription(type, position, goal, volume),
          targetMuscle: def.muscle,
        };
      }
    }

    const scored = candidates.map((exercise) => {
      const type = getExerciseType(exercise, def.muscle);
      let score = scoreExercise(exercise, def.muscle, position, type);
      if (def.type && type === def.type) score += 40;
      if (def.type && type !== def.type) score -= 20;
      return { exercise, type, score };
    });

    scored.sort((a, b) => b.score - a.score);
    const best = pickCandidate(scored, rng);
    if (!best) return null;

    return {
      exercise: best.exercise,
      type: best.type,
      prescription: getPrescription(best.type, position, goal, volume),
      targetMuscle: def.muscle,
    };
  }

  function consumeMuscleCounts(muscles, targetMuscle, exerciseType) {
    if (!targetMuscle) return;
    const muscleSpec = muscles.find((item) => item.name === targetMuscle);
    if (!muscleSpec) return;
    if (exerciseType === 'compound' && muscleSpec.compounds > 0) {
      muscleSpec.compounds -= 1;
      return;
    }
    if (exerciseType === 'isolation' && muscleSpec.isolations > 0) {
      muscleSpec.isolations -= 1;
      return;
    }
    if (muscleSpec.isolations > 0) {
      muscleSpec.isolations -= 1;
      return;
    }
    if (muscleSpec.compounds > 0) {
      muscleSpec.compounds -= 1;
    }
  }

  function getLowerOrderWeight(item, index, template) {
    const text = normalizeForMatch(
      `${item.exercise.name || ''} ${item.exercise.desc || ''}`,
    );
    const category = resolveExerciseCategory(item.exercise);
    let weight = 50;
    const emphasis = template?.emphasis || '';
    if (matchesPattern(text, 'squat')) {
      weight = emphasis === 'posterior' ? 20 : 10;
    } else if (matchesPattern(text, 'hinge')) {
      weight = emphasis === 'posterior' ? 10 : 20;
    } else if (category === 'Glúteos') weight = 30;
    else if (category === 'Quadríceps') weight = 35;
    else if (category === 'Posterior') weight = 40;
    else if (category === 'Panturrilhas') weight = 60;
    return { weight, index };
  }

  function orderExercisesForTemplate(exercises, template) {
    if (template.type !== 'lower') return exercises;
    return exercises
      .map((item, index) => ({
        item,
        ...getLowerOrderWeight(item, index, template),
      }))
      .sort((a, b) => a.weight - b.weight || a.index - b.index)
      .map((entry) => entry.item);
  }

  function resolveExerciseCategory(exercise = {}) {
    const muscle = normalize(exercise.muscle || '');
    const text = normalizeForMatch(
      `${exercise.name || ''} ${exercise.desc || ''}`,
    );

    if (muscle.includes('peito') || muscle.includes('peitoral'))
      return 'Peitoral';
    if (muscle.includes('costa') || muscle.includes('dorso')) return 'Costas';
    if (muscle.includes('ombro') || muscle.includes('delto')) {
      const inferred = resolveUpperCategory(text);
      if (inferred === 'Deltoide Posterior') return inferred;
      return 'Ombros';
    }
    if (muscle.includes('trapezio')) return 'Trapézio';
    if (muscle.includes('biceps')) return 'Bíceps';
    if (muscle.includes('triceps')) return 'Tríceps';
    if (muscle.includes('antebraco')) return 'Antebraços';
    if (muscle.includes('abd')) return 'Abdômen';
    if (muscle.includes('lombar')) return 'Posterior';
    if (muscle.includes('glute')) return 'Glúteos';
    if (muscle.includes('panturr')) return 'Panturrilhas';
    if (muscle.includes('posterior')) return 'Posterior';
    if (muscle.includes('total')) {
      const inferred = resolveUpperCategory(text);
      return inferred || 'Outros';
    }

    // Análise de pernas
    if (muscle.includes('perna')) {
      return resolveLegCategory(text);
    }

    const inferred = resolveUpperCategory(text);
    return inferred || 'Outros';
  }

  // ========================================
  // 4. PROFILE RESOLUTION
  // ========================================

  function resolveGoal(profile = {}) {
    const raw = profile.goal || profile.objetivo || '';
    const norm = normalize(raw);
    if (norm.includes('forc')) return 'forca';
    if (norm.includes('emagre') || norm.includes('defin'))
      return 'emagrecimento';
    return 'hipertrofia';
  }

  function resolveGender(profile = {}) {
    const raw = profile.gender || profile.genero || profile.sexo || '';
    const norm = normalize(raw);
    if (norm.includes('fem') || norm.includes('mulher') || norm === 'f')
      return 'female';
    if (norm.includes('masc') || norm.includes('homem') || norm === 'm')
      return 'male';
    return 'other';
  }

  // ========================================
  // 5. VOLUME SYSTEM (CORRETO)
  // ========================================

  // Volume altera SETS, não número de exercícios!
  function getVolumeSetsMultiplier(volume) {
    const multipliers = {
      low: 0.6, // 60% dos sets (ex: 3×8 vira 2×8)
      medium: 1.0, // 100% (padrão)
      high: 1.4, // 140% dos sets (ex: 3×8 vira 4×8)
      deload: 0.5, // 50% (ex: 3×8 vira 2×10 com RIR maior)
    };
    return multipliers[volume] || 1.0;
  }

  // ========================================
  // 6. PRESCRIPTION SYSTEM
  // ========================================

  function getPrescription(exerciseType, position, goal, volume) {
    const isDeload = volume === 'deload';
    const setsMultiplier = getVolumeSetsMultiplier(volume);

    if (isDeload) {
      return {
        sets: exerciseType === 'compound' ? 2 : 1,
        reps: '10-12',
        rir: '3-4',
      };
    }

    const basePrescriptions = {
      hipertrofia: {
        compound: {
          first: { sets: 3, reps: '6-8', rir: '1-2' },
          regular: { sets: 3, reps: '8-10', rir: '1-2' },
        },
        isolation: {
          first: { sets: 3, reps: '10-12', rir: '1-2' },
          regular: { sets: 2, reps: '10-12', rir: '2' },
        },
        auxiliary: {
          first: { sets: 2, reps: '12-15', rir: '2-3' },
          regular: { sets: 2, reps: '12-15', rir: '2-3' },
        },
      },
      forca: {
        compound: {
          first: { sets: 4, reps: '3-5', rir: '1-2' },
          regular: { sets: 3, reps: '5-6', rir: '1-2' },
        },
        isolation: {
          first: { sets: 3, reps: '8-10', rir: '2' },
          regular: { sets: 2, reps: '8-10', rir: '2' },
        },
        auxiliary: {
          first: { sets: 2, reps: '10-12', rir: '2-3' },
          regular: { sets: 2, reps: '10-12', rir: '2-3' },
        },
      },
      emagrecimento: {
        compound: {
          first: { sets: 3, reps: '12-15', rir: '2' },
          regular: { sets: 2, reps: '12-15', rir: '2' },
        },
        isolation: {
          first: { sets: 2, reps: '15-20', rir: '2-3' },
          regular: { sets: 2, reps: '15-20', rir: '2-3' },
        },
        auxiliary: {
          first: { sets: 2, reps: '15-20', rir: '3' },
          regular: { sets: 2, reps: '15-20', rir: '3' },
        },
      },
    };

    const goalPreset = basePrescriptions[goal] || basePrescriptions.hipertrofia;
    const typePreset = goalPreset[exerciseType] || goalPreset.auxiliary;
    const positionKey = position === 0 ? 'first' : 'regular';
    const base = typePreset[positionKey];

    // Aplicar multiplicador de volume
    const adjustedSets = Math.max(1, Math.round(base.sets * setsMultiplier));

    return {
      sets: adjustedSets,
      reps: base.reps,
      rir: base.rir,
    };
  }

  // ========================================
  // 7. DIVISION TEMPLATES (CORRIGIDO)
  // ========================================

  function getDivisionTemplate(config, gender) {
    const division = config.division || 'Sem Preferência';
    const days = Number(config.daysPerWeek) || 4;

    const templates = {
      'Bro Split': [
        {
          label: 'Peito',
          muscles: [{ name: 'Peitoral', compounds: 2, isolations: 1 }],
          type: 'push',
        },
        {
          label: 'Costas',
          muscles: [
            { name: 'Costas', compounds: 2, isolations: 1 },
            { name: 'Trapézio', compounds: 0, isolations: 1 },
          ],
          type: 'pull',
        },
        {
          label: 'Pernas',
          muscles: [
            { name: 'Quadríceps', compounds: 2, isolations: 1 },
            { name: 'Posterior', compounds: 1, isolations: 1 },
            { name: 'Panturrilhas', compounds: 0, isolations: 1 },
          ],
          type: 'lower',
        },
        {
          label: 'Ombros',
          muscles: [
            { name: 'Ombros', compounds: 1, isolations: 2 },
            { name: 'Deltoide Posterior', compounds: 0, isolations: 1 },
            { name: 'Trapézio', compounds: 0, isolations: 1 },
          ],
          type: 'delts',
        },
        {
          label: 'Braços',
          muscles: [
            { name: 'Bíceps', compounds: 2, isolations: 1 },
            { name: 'Tríceps', compounds: 2, isolations: 1 },
          ],
          type: 'arms',
        },
      ],

      'Push / Pull / Legs': [
        {
          label: 'Push',
          muscles: [
            { name: 'Peitoral', compounds: 2, isolations: 1 },
            { name: 'Ombros', compounds: 1, isolations: 1 },
            { name: 'Tríceps', compounds: 1, isolations: 1 },
          ],
          type: 'push',
        },
        {
          label: 'Pull',
          muscles: [
            { name: 'Costas', compounds: 2, isolations: 1 },
            { name: 'Bíceps', compounds: 1, isolations: 1 },
            { name: 'Deltoide Posterior', compounds: 0, isolations: 1 },
            { name: 'Trapézio', compounds: 0, isolations: 1 },
          ],
          type: 'pull',
        },
        {
          label: 'Legs',
          muscles: [
            { name: 'Quadríceps', compounds: 1, isolations: 1 },
            { name: 'Posterior', compounds: 1, isolations: 1 },
            { name: 'Glúteos', compounds: 1, isolations: 0 },
            { name: 'Panturrilhas', compounds: 0, isolations: 1 },
          ],
          type: 'lower',
        },
      ],

      'Upper / Lower': [
        {
          label: 'Upper 1',
          emphasis: 'chest',
          muscles: [
            { name: 'Peitoral', compounds: 1, isolations: 1 },
            { name: 'Costas', compounds: 1, isolations: 0 },
            { name: 'Ombros', compounds: 0, isolations: 1 },
            { name: 'Deltoide Posterior', compounds: 0, isolations: 0 },
            { name: 'Bíceps', compounds: 1, isolations: 0 },
            { name: 'Tríceps', compounds: 1, isolations: 0 },
          ],
          type: 'upper',
        },
        {
          label: 'Lower 1',
          emphasis: 'quads',
          muscles: [
            { name: 'Quadríceps', compounds: 1, isolations: 1 },
            { name: 'Posterior', compounds: 1, isolations: 0 },
            { name: 'Glúteos', compounds: 0, isolations: 0 },
            { name: 'Panturrilhas', compounds: 0, isolations: 1 },
          ],
          type: 'lower',
        },
        {
          label: 'Upper 2',
          emphasis: 'back',
          muscles: [
            { name: 'Peitoral', compounds: 1, isolations: 0 },
            { name: 'Costas', compounds: 1, isolations: 1 },
            { name: 'Ombros', compounds: 0, isolations: 1 },
            { name: 'Deltoide Posterior', compounds: 0, isolations: 0 },
            { name: 'Bíceps', compounds: 1, isolations: 0 },
            { name: 'Tríceps', compounds: 1, isolations: 0 },
          ],
          type: 'upper',
        },
        {
          label: 'Lower 2',
          emphasis: 'posterior',
          muscles: [
            { name: 'Quadríceps', compounds: 1, isolations: 0 },
            { name: 'Posterior', compounds: 1, isolations: 1 },
            { name: 'Glúteos', compounds: 1, isolations: 0 },
            { name: 'Panturrilhas', compounds: 0, isolations: 1 },
          ],
          type: 'lower',
        },
      ],

      'PPL + Upper/Lower': [
        {
          label: 'Pull',
          muscles: [
            { name: 'Costas', compounds: 2, isolations: 1 },
            { name: 'Bíceps', compounds: 1, isolations: 1 },
            { name: 'Deltoide Posterior', compounds: 0, isolations: 1 },
            { name: 'Trapézio', compounds: 0, isolations: 1 },
          ],
          type: 'pull',
        },
        {
          label: 'Push',
          muscles: [
            { name: 'Peitoral', compounds: 1, isolations: 1 },
            { name: 'Ombros', compounds: 1, isolations: 2 },
            { name: 'Tríceps', compounds: 1, isolations: 1 },
          ],
          type: 'push',
        },
        {
          label: 'Legs',
          muscles: [
            { name: 'Quadríceps', compounds: 2, isolations: 1 },
            { name: 'Posterior', compounds: 1, isolations: 1 },
            { name: 'Panturrilhas', compounds: 0, isolations: 1 },
          ],
          type: 'lower',
        },
        {
          label: 'Upper',
          muscles: [
            { name: 'Peitoral', compounds: 1, isolations: 1 },
            { name: 'Costas', compounds: 1, isolations: 1 },
            { name: 'Ombros', compounds: 0, isolations: 1 },
            { name: 'Deltoide Posterior', compounds: 0, isolations: 1 },
            { name: 'Bíceps', compounds: 1, isolations: 0 },
            { name: 'Tríceps', compounds: 1, isolations: 0 },
          ],
          type: 'upper',
        },
        {
          label: 'Lower',
          muscles: [
            { name: 'Posterior', compounds: 1, isolations: 1 },
            { name: 'Glúteos', compounds: 2, isolations: 1 },
            { name: 'Panturrilhas', compounds: 0, isolations: 1 },
          ],
          type: 'lower',
        },
      ],

      'Full Body': [
        {
          label: 'Full Body A',
          muscles: [
            { name: 'Peitoral', compounds: 1, isolations: 0 },
            { name: 'Costas', compounds: 1, isolations: 0 },
            { name: 'Quadríceps', compounds: 1, isolations: 1 },
            { name: 'Ombros', compounds: 1, isolations: 0 },
            { name: 'Abdômen', compounds: 0, isolations: 1 },
          ],
          type: 'full',
        },
        {
          label: 'Full Body B',
          muscles: [
            { name: 'Costas', compounds: 1, isolations: 1 },
            { name: 'Peitoral', compounds: 1, isolations: 0 },
            { name: 'Posterior', compounds: 1, isolations: 0 },
            { name: 'Bíceps', compounds: 1, isolations: 0 },
            { name: 'Tríceps', compounds: 1, isolations: 0 },
            { name: 'Abdômen', compounds: 0, isolations: 1 },
          ],
          type: 'full',
        },
      ],

      'Sem Preferência': [
        {
          label: 'Push',
          muscles: [
            { name: 'Peitoral', compounds: 1, isolations: 1 },
            { name: 'Ombros', compounds: 1, isolations: 1 },
            { name: 'Tríceps', compounds: 1, isolations: 0 },
          ],
          type: 'push',
        },
        {
          label: 'Pull',
          muscles: [
            { name: 'Costas', compounds: 2, isolations: 1 },
            { name: 'Bíceps', compounds: 1, isolations: 0 },
            { name: 'Deltoide Posterior', compounds: 0, isolations: 1 },
            { name: 'Trapézio', compounds: 0, isolations: 1 },
          ],
          type: 'pull',
        },
        {
          label: 'Legs',
          muscles: [
            { name: 'Quadríceps', compounds: 2, isolations: 1 },
            { name: 'Posterior', compounds: 1, isolations: 1 },
            { name: 'Panturrilhas', compounds: 0, isolations: 1 },
          ],
          type: 'lower',
        },
        {
          label: 'Upper',
          muscles: [
            { name: 'Peitoral', compounds: 1, isolations: 1 },
            { name: 'Costas', compounds: 1, isolations: 1 },
            { name: 'Ombros', compounds: 1, isolations: 1 },
            { name: 'Bíceps', compounds: 1, isolations: 0 },
            { name: 'Tríceps', compounds: 1, isolations: 0 },
          ],
          type: 'upper',
        },
      ],
    };

    const base = templates[division] || templates['Sem Preferência'];
    const output = [];

    for (let i = 0; i < days; i++) {
      output.push(base[i % base.length]);
    }

    const adjusted =
      gender === 'female'
        ? applyFemaleBias(output, division)
        : gender === 'male'
          ? applyMaleBias(output)
          : output;

    return adjusted.map((entry) => ({
      ...entry,
      requirements: buildRequirementsForTemplate(entry, gender),
    }));
  }

  // ========================================
  // 8. EXERCISE SELECTION (SEM REDUNDÂNCIA)
  // ========================================

  function selectExercisesForMuscle({
    muscle,
    compounds,
    isolations,
    pool,
    usedDay,
    usedGlobal,
    usedFamilies,
    position,
    goal,
    volume,
    rng,
  }) {
    const selected = [];
    let currentPosition = position;

    // Filtrar candidatos por categoria
    let candidates = pool.filter((ex) => {
      const category = resolveExerciseCategory(ex);
      return (
        category === muscle && !usedDay.has(ex.id) && !isExcludedExercise(ex)
      );
    });

    if (
      !candidates.length &&
      ['Quadríceps', 'Posterior', 'Glúteos', 'Panturrilhas'].includes(muscle)
    ) {
      candidates = pool.filter((ex) => {
        const category = resolveExerciseCategory(ex);
        return (
          category === 'Pernas' &&
          !usedDay.has(ex.id) &&
          !isExcludedExercise(ex)
        );
      });
    }

    if (!candidates.length && muscle === 'Bíceps') {
      candidates = pool.filter((ex) => {
        const category = resolveExerciseCategory(ex);
        return (
          category === 'Antebraços' &&
          !usedDay.has(ex.id) &&
          !isExcludedExercise(ex)
        );
      });
    }

    if (!candidates.length) return selected;

    // Separar por tipo
    const compoundCandidates = candidates
      .map((ex) => ({
        exercise: ex,
        type: getExerciseType(ex, muscle),
        family: getExerciseFamily(ex.name),
        score: 0,
      }))
      .filter((item) => item.type === 'compound')
      .filter((item) => !usedFamilies.has(item.family)); // Evitar redundância

    const isolationCandidates = candidates
      .map((ex) => ({
        exercise: ex,
        type: getExerciseType(ex, muscle),
        family: getExerciseFamily(ex.name),
        score: 0,
      }))
      .filter((item) => item.type === 'isolation')
      .filter((item) => !usedFamilies.has(item.family));

    // Selecionar compostos
    for (let i = 0; i < compounds && compoundCandidates.length > 0; i++) {
      // Calcular scores
      compoundCandidates.forEach((item) => {
        item.score = scoreExercise(
          item.exercise,
          muscle,
          currentPosition,
          item.type,
        );
      });

      // Ordenar por score
      compoundCandidates.sort((a, b) => b.score - a.score);

      // Pegar o melhor
      const best = pickCandidate(compoundCandidates, rng);
      if (best) {
        const prescription = getPrescription(
          best.type,
          currentPosition,
          goal,
          volume,
        );
        selected.push({
          exercise: best.exercise,
          prescription,
          type: best.type,
        });

        usedDay.add(best.exercise.id);
        usedGlobal.add(best.exercise.id);
        usedFamilies.add(best.family); // Marcar família como usada
        const bestIndex = compoundCandidates.indexOf(best);
        if (bestIndex >= 0) compoundCandidates.splice(bestIndex, 1);
        currentPosition++;
      }
    }

    // Selecionar isolamentos
    for (let i = 0; i < isolations && isolationCandidates.length > 0; i++) {
      isolationCandidates.forEach((item) => {
        item.score = scoreExercise(
          item.exercise,
          muscle,
          currentPosition,
          item.type,
        );
      });

      isolationCandidates.sort((a, b) => b.score - a.score);

      const best = pickCandidate(isolationCandidates, rng);
      if (best) {
        const prescription = getPrescription(
          best.type,
          currentPosition,
          goal,
          volume,
        );
        selected.push({
          exercise: best.exercise,
          prescription,
          type: best.type,
        });

        usedDay.add(best.exercise.id);
        usedGlobal.add(best.exercise.id);
        usedFamilies.add(best.family);
        const bestIndex = isolationCandidates.indexOf(best);
        if (bestIndex >= 0) isolationCandidates.splice(bestIndex, 1);
        currentPosition++;
      }
    }

    return selected;
  }

  // ========================================
  // 9. DAY BUILDER
  // ========================================

  function buildDay({ template, pool, usedGlobal, goal, volume, rng, gender }) {
    const usedDay = new Set();
    const usedFamilies = new Set(); // Evitar exercícios redundantes no mesmo dia
    const exercises = [];
    let position = 0;
    const musclePlan = template.muscles.map((muscle) => ({
      ...muscle,
    }));
    const requirements = template.requirements || [];
    const dayPool =
      template.type === 'lower'
        ? pool.filter((exercise) => {
            const category = resolveExerciseCategory(exercise);
            return [
              'Quadríceps',
              'Posterior',
              'Glúteos',
              'Panturrilhas',
              'Pernas',
            ].includes(category);
          })
        : pool;

    requirements.forEach((requirement) => {
      const picked = selectExerciseForRequirement({
        requirement,
        pool: dayPool,
        usedDay,
        usedGlobal,
        usedFamilies,
        position,
        goal,
        volume,
        rng,
        gender,
        template,
      });

      if (!picked) return;

      exercises.push({
        exercise: picked.exercise,
        prescription: picked.prescription,
        type: picked.type,
      });

      usedDay.add(picked.exercise.id);
      usedGlobal.add(picked.exercise.id);
      usedFamilies.add(getExerciseFamily(picked.exercise.name));
      consumeMuscleCounts(musclePlan, picked.targetMuscle, picked.type);
      position += 1;
    });

    const maxExercises =
      template.type === 'upper'
        ? gender === 'female'
          ? 5
          : 7
        : template.type === 'lower'
          ? 6
          : Infinity;
    const minExercises =
      template.type === 'upper'
        ? gender === 'female'
          ? 5
          : 5
        : template.type === 'lower'
          ? gender === 'male'
            ? 5
            : 4
          : 0;

    // Processar cada músculo do template
    for (const muscleSpec of musclePlan) {
      if (exercises.length >= maxExercises) break;
      const selected = selectExercisesForMuscle({
        muscle: muscleSpec.name,
        compounds: Math.max(0, muscleSpec.compounds),
        isolations: Math.max(0, muscleSpec.isolations),
        pool: dayPool,
        usedDay,
        usedGlobal,
        usedFamilies,
        position,
        goal,
        volume,
        rng,
      });

      if (selected.length) {
        const remaining = maxExercises - exercises.length;
        exercises.push(...selected.slice(0, remaining));
      }
      position += selected.length;
    }

    if (exercises.length < minExercises) {
      const remaining = minExercises - exercises.length;
      const fillerPatterns =
        template.type === 'lower'
          ? ['squat', 'hinge', 'hamstring_iso', 'calf']
          : ['horizontal_push', 'horizontal_pull', 'rear_delt'];

      fillerPatterns.some((pattern) => {
        if (exercises.length >= minExercises) return true;
        const picked = selectExerciseForRequirement({
          requirement: pattern,
          pool: dayPool,
          usedDay,
          usedGlobal,
          usedFamilies,
          position,
          goal,
          volume,
          rng,
          gender,
          template,
        });
        if (!picked) return false;
        exercises.push({
          exercise: picked.exercise,
          prescription: picked.prescription,
          type: picked.type,
        });
        usedDay.add(picked.exercise.id);
        usedGlobal.add(picked.exercise.id);
        usedFamilies.add(getExerciseFamily(picked.exercise.name));
        position += 1;
        return false;
      });
    }

    const orderedExercises = orderExercisesForTemplate(exercises, template);

    // Formatar output
    return {
      label: template.label,
      focus: template.muscles.map((m) => m.name).join(' / '),
      exercises: orderedExercises.map((item) => ({
        id: item.exercise.id,
        name: item.exercise.name,
        muscle: item.exercise.muscle,
        equipment: item.exercise.equipment,
        difficulty: item.exercise.difficulty,
        sets: item.prescription.sets,
        reps: item.prescription.reps,
        rir: item.prescription.rir,
        type: item.type,
      })),
    };
  }

  // ========================================
  // 10. MAIN GENERATOR
  // ========================================

  function generatePlan({ config, exercises, selectedExercises, profile }) {
    const meta = { warnings: [] };

    // Resolver perfil
    const goal = resolveGoal(profile);
    const gender = resolveGender(profile);

    // Montar pool de exercícios
    let pool =
      config.exerciseSource === 'selected' && Array.isArray(selectedExercises)
        ? exercises.filter((ex) => selectedExercises.includes(ex.id))
        : exercises.slice();

    if (!pool.length) {
      pool = exercises.slice();
      meta.warnings.push(
        'Nenhum exercício selecionado. Usando banco completo.',
      );
    }

    // Obter templates
    const templates = getDivisionTemplate(config, gender);
    const historyKey = getHistoryKey(config);

    let days = [];
    let signature = '';
    const attempts = 3;

    for (let attempt = 0; attempt < attempts; attempt += 1) {
      const seed =
        Date.now() + Math.floor(Math.random() * 100000) + attempt * 997;
      const rng = createRng(seed);
      const usedGlobal = new Set();

      days = templates.map((template) =>
        buildDay({
          template,
          pool,
          usedGlobal,
          goal,
          volume: config.volume,
          rng,
          gender,
        }),
      );

      signature = buildPlanSignature(days);
      if (!wasRecentlyGenerated(historyKey, signature)) break;
    }

    rememberPlan(historyKey, signature);

    // Calcular estatísticas
    const stats = calculateStats(days);

    return {
      days,
      meta: {
        warning: meta.warnings.join(' '),
        profile: { goal },
        stats,
      },
    };
  }

  // ========================================
  // 11. STATISTICS
  // ========================================

  function calculateStats(days) {
    const muscleVolume = {};
    let totalSets = 0;

    days.forEach((day) => {
      day.exercises.forEach((ex) => {
        const muscle = resolveExerciseCategory(ex);
        if (!muscleVolume[muscle]) muscleVolume[muscle] = 0;
        muscleVolume[muscle] += ex.sets;
        totalSets += ex.sets;
      });
    });

    return {
      totalExercises: days.reduce((sum, day) => sum + day.exercises.length, 0),
      totalSets,
      muscleVolume,
    };
  }

  // ========================================
  // EXPORT
  // ========================================

  global.AIWorkoutGenerator = {
    generatePlan,
    version: '2.1',
  };
})(window);
