const STORAGE_KEYS = {
  SOLVED: 'adaptivedsa_solved_ids',
  ATTEMPTS: 'adaptivedsa_attempts_log',
  HINTS: 'adaptivedsa_unlocked_hints',
  CODE: 'adaptivedsa_code_drafts',
  REVISIONS: 'adaptivedsa_revisions',
  ASSESSMENTS: 'adaptivedsa_understanding_assessments'
};

// Dispatch custom event so reactive components can re-render immediately
function notifyStorageChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('adaptivedsa_storage_updated'));
  }
}

export function getSolvedProblems() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SOLVED);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Failed reading solved problems', e);
    return [];
  }
}

export function isProblemSolved(problemId) {
  const solved = getSolvedProblems();
  return solved.includes(problemId);
}

export function getAttempts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ATTEMPTS);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Failed reading attempts', e);
    return [];
  }
}

export function getUnlockedHints(problemId) {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.HINTS);
    const hintsMap = raw ? JSON.parse(raw) : {};
    return hintsMap[problemId] || 0; // returns 0, 1, 2, or 3
  } catch (e) {
    console.error('Failed reading hints', e);
    return 0;
  }
}

export function unlockNextHint(problemId) {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.HINTS);
    const hintsMap = raw ? JSON.parse(raw) : {};
    const current = hintsMap[problemId] || 0;
    const nextLevel = Math.min(3, current + 1);
    hintsMap[problemId] = nextLevel;
    localStorage.setItem(STORAGE_KEYS.HINTS, JSON.stringify(hintsMap));
    notifyStorageChange();
    return nextLevel;
  } catch (e) {
    console.error('Failed unlocking hint', e);
    return 1;
  }
}

export function getCodeDraft(problemId, defaultCode = '', language = 'cpp') {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CODE);
    const codeMap = raw ? JSON.parse(raw) : {};
    const key = `${language}_${problemId}`;
    if (codeMap[key] !== undefined) return codeMap[key];
    if (language === 'javascript' && codeMap[problemId] !== undefined) return codeMap[problemId];
    return defaultCode;
  } catch (e) {
    return defaultCode;
  }
}

export function saveCodeDraft(problemId, code, language = 'cpp') {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CODE);
    const codeMap = raw ? JSON.parse(raw) : {};
    const key = `${language}_${problemId}`;
    codeMap[key] = code;
    // Also save legacy key if JS
    if (language === 'javascript') {
      codeMap[problemId] = code;
    }
    localStorage.setItem(STORAGE_KEYS.CODE, JSON.stringify(codeMap));
  } catch (e) {
    console.error('Failed saving code draft', e);
  }
}

export function recordAttempt({ 
  problemId, 
  problemTitle, 
  topic, 
  difficulty, 
  success, 
  hintsUnlocked = 0, 
  code = '',
  evaluationType = 'automated', // 'automated' | 'manual'
  language = 'cpp',             // 'cpp' | 'javascript'
  status = null,                // 'ACCEPTED' | 'WRONG_ANSWER' | 'COMPILATION_ERROR' | 'RUNTIME_ERROR'
  passedCount = null,
  totalCount = null,
  executionTimeMs = null,
  diagnosisCategory = null,
  isBlindSolve = false,
  blindSolveTimeSeconds = null,
  independenceScore = null
}) {
  try {
    const attempts = getAttempts();
    const newAttempt = {
      id: 'att_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      problemId,
      problemTitle,
      topic,
      difficulty,
      success,
      hintsUnlocked,
      timestamp: new Date().toISOString(),
      codeLength: code.length,
      evaluationType,
      language,
      status: status || (success ? 'ACCEPTED' : 'INCOMPLETE'),
      passedCount,
      totalCount,
      executionTimeMs,
      diagnosisCategory,
      isBlindSolve,
      blindSolveTimeSeconds,
      independenceScore
    };
    // Prepend latest
    attempts.unshift(newAttempt);
    localStorage.setItem(STORAGE_KEYS.ATTEMPTS, JSON.stringify(attempts));

    // If success, ensure problem is in solved list without duplicates
    if (success) {
      const solved = getSolvedProblems();
      if (!solved.includes(problemId)) {
        solved.push(problemId);
        localStorage.setItem(STORAGE_KEYS.SOLVED, JSON.stringify(solved));
      }

      // Auto-schedule for spaced repetition if not already scheduled
      try {
        const rawRev = localStorage.getItem(STORAGE_KEYS.REVISIONS);
        const revMap = rawRev ? JSON.parse(rawRev) : {};
        if (!revMap[problemId]) {
          const dayMs = 24 * 60 * 60 * 1000;
          revMap[problemId] = {
            problemId,
            stage: 1,
            intervalDays: 1,
            lastReviewedAt: new Date().toISOString(),
            dueDate: new Date(Date.now() + 1 * dayMs).toISOString(),
            history: []
          };
          localStorage.setItem(STORAGE_KEYS.REVISIONS, JSON.stringify(revMap));
        }
      } catch (err) {
        console.error('Error auto-scheduling revision on solve', err);
      }
    }

    notifyStorageChange();
    return newAttempt;
  } catch (e) {
    console.error('Failed recording attempt', e);
  }
}

export function clearAllProgress() {
  try {
    localStorage.removeItem(STORAGE_KEYS.SOLVED);
    localStorage.removeItem(STORAGE_KEYS.ATTEMPTS);
    localStorage.removeItem(STORAGE_KEYS.HINTS);
    localStorage.removeItem(STORAGE_KEYS.CODE);
    localStorage.removeItem(STORAGE_KEYS.REVISIONS);
    localStorage.removeItem(STORAGE_KEYS.ASSESSMENTS);
    notifyStorageChange();
  } catch (e) {
    console.error('Failed clearing progress', e);
  }
}

/**
 * Retrieves all stored understanding assessments, optionally filtered by problemId.
 * Safely handles missing or malformed JSON data.
 */
export function getUnderstandingAssessments(problemId = null) {
  try {
    if (typeof localStorage === 'undefined') return [];
    const raw = localStorage.getItem(STORAGE_KEYS.ASSESSMENTS);
    if (!raw) return [];
    const list = JSON.parse(raw);
    if (!Array.isArray(list)) return [];
    if (problemId) {
      return list.filter(item => item && item.problemId === problemId);
    }
    return list;
  } catch (e) {
    console.error('Failed reading understanding assessments', e);
    return [];
  }
}

/**
 * Retrieves the most recent assessment for a specific problem.
 */
export function getLatestAssessment(problemId) {
  try {
    const list = getUnderstandingAssessments(problemId);
    return list.length > 0 ? list[0] : null;
  } catch (e) {
    console.error('Failed reading latest assessment', e);
    return null;
  }
}

/**
 * Persists an understanding assessment record.
 * De-duplicates identical assessment IDs and prepends newest record.
 */
export function saveUnderstandingAssessment(assessment) {
  try {
    if (!assessment || !assessment.problemId) return null;
    if (typeof localStorage === 'undefined') return assessment;

    const list = getUnderstandingAssessments();
    
    // De-duplicate: replace existing if matching assessmentId, otherwise prepend
    const existingIndex = list.findIndex(a => a && a.assessmentId === assessment.assessmentId);
    if (existingIndex !== -1) {
      list[existingIndex] = assessment;
    } else {
      list.unshift(assessment);
    }

    localStorage.setItem(STORAGE_KEYS.ASSESSMENTS, JSON.stringify(list));
    notifyStorageChange();
    return assessment;
  } catch (e) {
    console.error('Failed saving understanding assessment', e);
    return null;
  }
}

/**
 * Retrieves draft reflection inputs for a problem to prevent loss during navigation.
 */
export function getReflectionDraft(problemId) {
  try {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem('adaptivedsa_reflection_draft_' + problemId);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

/**
 * Persists draft reflection inputs for a problem.
 */
export function saveReflectionDraft(problemId, draft) {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem('adaptivedsa_reflection_draft_' + problemId, JSON.stringify(draft));
  } catch (e) {
    console.error('Failed saving reflection draft', e);
  }
}

export function loadDemoSeedData() {
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  const demoSolved = [
    'two-sum',
    'best-time-to-buy-and-sell-stock',
    'valid-anagram',
    'valid-parentheses'
  ];

  const demoHints = {
    'two-sum': 1,
    'best-time-to-buy-and-sell-stock': 0,
    'valid-anagram': 0,
    'binary-search': 3,
    'valid-parentheses': 2,
    'reverse-linked-list': 1
  };

  const demoAttempts = [
    {
      id: 'demo_1',
      problemId: 'valid-parentheses',
      problemTitle: 'Valid Parentheses',
      topic: 'Stacks',
      difficulty: 'Easy',
      success: true,
      hintsUnlocked: 2,
      timestamp: new Date(now - 1 * dayMs + 3600000).toISOString(),
      codeLength: 184,
      evaluationType: 'automated',
      language: 'cpp',
      status: 'ACCEPTED',
      passedCount: 4,
      totalCount: 4
    },
    {
      id: 'demo_2',
      problemId: 'binary-search',
      problemTitle: 'Binary Search',
      topic: 'Binary Search',
      difficulty: 'Easy',
      success: false,
      hintsUnlocked: 3,
      timestamp: new Date(now - 2 * dayMs + 1800000).toISOString(),
      codeLength: 142,
      evaluationType: 'automated',
      language: 'cpp',
      status: 'WRONG_ANSWER',
      passedCount: 3,
      totalCount: 4,
      diagnosisCategory: 'BOUNDARY_ERROR',
      diagnosisExplanation: 'Output differs from expected by 1; loop bound or condition off by one.'
    },
    {
      id: 'demo_3',
      problemId: 'binary-search',
      problemTitle: 'Binary Search',
      topic: 'Binary Search',
      difficulty: 'Easy',
      success: false,
      hintsUnlocked: 2,
      timestamp: new Date(now - 2 * dayMs).toISOString(),
      codeLength: 120,
      evaluationType: 'automated',
      language: 'cpp',
      status: 'COMPILATION_ERROR',
      diagnosisCategory: 'COMPILATION_ERROR',
      diagnosisExplanation: 'G++ compilation failed with syntax/type errors.'
    },
    {
      id: 'demo_4',
      problemId: 'valid-anagram',
      problemTitle: 'Valid Anagram',
      topic: 'Strings',
      difficulty: 'Easy',
      success: true,
      hintsUnlocked: 0,
      timestamp: new Date(now - 3 * dayMs + 7200000).toISOString(),
      codeLength: 210,
      evaluationType: 'automated',
      language: 'cpp',
      status: 'ACCEPTED',
      passedCount: 4,
      totalCount: 4
    },
    {
      id: 'demo_5',
      problemId: 'best-time-to-buy-and-sell-stock',
      problemTitle: 'Best Time to Buy and Sell Stock',
      topic: 'Arrays',
      difficulty: 'Easy',
      success: true,
      hintsUnlocked: 0,
      timestamp: new Date(now - 5 * dayMs).toISOString(),
      codeLength: 165,
      evaluationType: 'manual',
      language: 'cpp',
      status: 'ACCEPTED'
    },
    {
      id: 'demo_6',
      problemId: 'two-sum',
      problemTitle: 'Two Sum',
      topic: 'Arrays',
      difficulty: 'Easy',
      success: true,
      hintsUnlocked: 1,
      timestamp: new Date(now - 6 * dayMs).toISOString(),
      codeLength: 198,
      evaluationType: 'automated',
      language: 'cpp',
      status: 'ACCEPTED',
      passedCount: 4,
      totalCount: 4
    },
    {
      id: 'demo_7',
      problemId: 'reverse-linked-list',
      problemTitle: 'Reverse Linked List',
      topic: 'Linked Lists',
      difficulty: 'Easy',
      success: false,
      hintsUnlocked: 1,
      timestamp: new Date(now - 7 * dayMs).toISOString(),
      codeLength: 95,
      evaluationType: 'automated',
      language: 'cpp',
      status: 'WRONG_ANSWER',
      passedCount: 2,
      totalCount: 4,
      diagnosisCategory: 'EDGE_CASE_FAILURE',
      diagnosisExplanation: 'Passed visible test cases but failed empty/single-node edge cases.'
    }
  ];

  // Seed spaced-repetition revisions
  const demoRevisions = {
    'best-time-to-buy-and-sell-stock': {
      problemId: 'best-time-to-buy-and-sell-stock',
      stage: 1,
      intervalDays: 1,
      lastReviewedAt: new Date(now - 2 * dayMs).toISOString(),
      dueDate: new Date(now - 1 * dayMs).toISOString(), // OVERDUE by 1 day
      history: []
    },
    'valid-anagram': {
      problemId: 'valid-anagram',
      stage: 1,
      intervalDays: 1,
      lastReviewedAt: new Date(now - 1 * dayMs).toISOString(),
      dueDate: new Date(now).toISOString(), // DUE TODAY
      history: [
        {
          id: 'rev_h1',
          timestamp: new Date(now - 1 * dayMs).toISOString(),
          outcome: 'independent',
          previousStage: 1,
          newStage: 2,
          intervalDays: 3
        }
      ]
    },
    'two-sum': {
      problemId: 'two-sum',
      stage: 2,
      intervalDays: 3,
      lastReviewedAt: new Date(now - 1 * dayMs).toISOString(),
      dueDate: new Date(now + 2 * dayMs).toISOString(), // UPCOMING in 2 days
      history: [
        {
          id: 'rev_h2',
          timestamp: new Date(now - 2 * dayMs).toISOString(),
          outcome: 'with_hints',
          previousStage: 1,
          newStage: 1,
          intervalDays: 1
        }
      ]
    },
    'valid-parentheses': {
      problemId: 'valid-parentheses',
      stage: 3,
      intervalDays: 7,
      lastReviewedAt: new Date(now - 1 * dayMs).toISOString(),
      dueDate: new Date(now + 6 * dayMs).toISOString(), // UPCOMING in 6 days
      history: [
        {
          id: 'rev_h3',
          timestamp: new Date(now - 8 * dayMs).toISOString(),
          outcome: 'independent',
          previousStage: 2,
          newStage: 3,
          intervalDays: 7
        }
      ]
    }
  };

  localStorage.setItem(STORAGE_KEYS.SOLVED, JSON.stringify(demoSolved));
  localStorage.setItem(STORAGE_KEYS.HINTS, JSON.stringify(demoHints));
  localStorage.setItem(STORAGE_KEYS.ATTEMPTS, JSON.stringify(demoAttempts));
  localStorage.setItem(STORAGE_KEYS.REVISIONS, JSON.stringify(demoRevisions));
  notifyStorageChange();
}

