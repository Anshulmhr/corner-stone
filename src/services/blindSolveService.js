// Service for Blind Solve Challenge Mode
// Provides session tracking, timing, transparent independence scoring, and session lifecycle.

const BLIND_SESSION_KEY_PREFIX = 'adaptivedsa_blind_session_';

/**
 * Calculates a transparent independence score (0 - 100).
 *
 * SCORING RULES:
 * 1. Correctness: +70 points for verified solution (ACCEPTED), 0 otherwise.
 * 2. Attempt Efficiency (only if solved):
 *    - 1 submission: +20 points
 *    - 2 submissions: +15 points
 *    - 3 submissions: +10 points
 *    - 4+ submissions: +5 points
 * 3. Zero-Hint Autonomy (only if solved):
 *    - 0 hints used: +10 points
 *    - 1 hint used: +5 points
 *    - 2+ hints used: +0 points
 *
 * Total Range: 0 to 100.
 *
 * DISCLAIMER: This practice metric measures session autonomy and self-reliance.
 * It is not a standardized test of intelligence, cognitive capacity, or general algorithmic mastery.
 */
export function calculateIndependenceScore({ success, submissionCount = 1, hintsUsed = 0 }) {
  if (!success) {
    return {
      score: 0,
      breakdown: {
        correctness: 0,
        attemptsBonus: 0,
        autonomyBonus: 0
      },
      explanation: 'Challenge incomplete or not verified. Only fully passed solutions earn an independence score.',
      disclaimer: 'This practice score measures problem autonomy for this session and is not a validated measure of intelligence or algorithmic mastery.'
    };
  }

  const correctness = 70;

  let attemptsBonus = 5;
  if (submissionCount <= 1) attemptsBonus = 20;
  else if (submissionCount === 2) attemptsBonus = 15;
  else if (submissionCount === 3) attemptsBonus = 10;

  let autonomyBonus = 0;
  if (hintsUsed === 0) autonomyBonus = 10;
  else if (hintsUsed === 1) autonomyBonus = 5;

  const total = correctness + attemptsBonus + autonomyBonus;

  return {
    score: total,
    breakdown: {
      correctness,
      attemptsBonus,
      autonomyBonus
    },
    explanation: `Verified Solve (+${correctness}) + Attempt Efficiency (+${attemptsBonus} for ${submissionCount} submit${submissionCount !== 1 ? 's' : ''}) + Zero-Hint Autonomy (+${autonomyBonus} for ${hintsUsed} hint${hintsUsed !== 1 ? 's' : ''}) = ${total}/100`,
    disclaimer: 'This practice score measures problem autonomy for this session and is not a validated measure of intelligence or algorithmic mastery.'
  };
}

/**
 * Gets any currently active blind solve session for a problem.
 */
export function getActiveBlindSession(problemId) {
  try {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(BLIND_SESSION_KEY_PREFIX + problemId);
    if (!raw) return null;
    const session = JSON.parse(raw);
    if (session && session.active) {
      return session;
    }
    return null;
  } catch (e) {
    console.error('Failed reading blind session', e);
    return null;
  }
}

/**
 * Starts a new blind solve challenge session for a problem.
 */
export function startBlindSession(problemId, currentHintsUnlocked = 0) {
  try {
    const session = {
      problemId,
      startTime: Date.now(),
      submissionCount: 0,
      hintsAtStart: currentHintsUnlocked,
      hintsUsedInSession: 0,
      active: true
    };
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(BLIND_SESSION_KEY_PREFIX + problemId, JSON.stringify(session));
    }
    return session;
  } catch (e) {
    console.error('Failed starting blind session', e);
    return null;
  }
}

/**
 * Increments the submission counter for an active blind session.
 */
export function incrementBlindSubmissions(problemId) {
  try {
    const session = getActiveBlindSession(problemId);
    if (!session) return null;
    session.submissionCount = (session.submissionCount || 0) + 1;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(BLIND_SESSION_KEY_PREFIX + problemId, JSON.stringify(session));
    }
    return session;
  } catch (e) {
    console.error('Failed incrementing blind submissions', e);
    return null;
  }
}

/**
 * Completes an active blind solve session upon verified solution.
 */
export function endBlindSession(problemId) {
  try {
    const session = getActiveBlindSession(problemId);
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(BLIND_SESSION_KEY_PREFIX + problemId);
    }
    if (!session) return null;

    const elapsedSeconds = Math.max(1, Math.round((Date.now() - session.startTime) / 1000));
    return {
      problemId,
      startTime: session.startTime,
      elapsedSeconds,
      submissionCount: Math.max(1, session.submissionCount),
      hintsUsed: session.hintsUsedInSession || session.hintsAtStart || 0
    };
  } catch (e) {
    console.error('Failed ending blind session', e);
    return null;
  }
}

/**
 * Abandons an active blind solve session without recording a solve.
 */
export function abandonBlindSession(problemId) {
  try {
    const session = getActiveBlindSession(problemId);
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(BLIND_SESSION_KEY_PREFIX + problemId);
    }
    if (!session) return null;

    const elapsedSeconds = Math.max(1, Math.round((Date.now() - session.startTime) / 1000));
    return {
      problemId,
      elapsedSeconds,
      submissionCount: session.submissionCount || 0,
      abandoned: true
    };
  } catch (e) {
    console.error('Failed abandoning blind session', e);
    return null;
  }
}
