import { getSolvedProblems, recordAttempt } from './storage.js';
import { PROBLEMS } from '../data/problems.js';

export const SPACED_INTERVALS = [1, 3, 7, 14, 30]; // Days per stage (Stages 1 through 5)

const REVISION_STORAGE_KEY = 'adaptivedsa_revisions';

function notifyStorageChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('adaptivedsa_storage_updated'));
  }
}

/**
 * Reads all stored revisions, safely initializing any solved problems
 * that have not yet been registered in the spaced repetition pipeline.
 */
export function getRevisions() {
  let revisions = {};
  try {
    const raw = localStorage.getItem(REVISION_STORAGE_KEY);
    if (raw) {
      revisions = JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed reading revision data from localStorage', e);
    revisions = {};
  }

  // Safety check: Ensure every solved problem is enrolled in the revision pipeline
  const solved = getSolvedProblems();
  let changed = false;

  solved.forEach(problemId => {
    if (!revisions[problemId]) {
      const dayMs = 24 * 60 * 60 * 1000;
      revisions[problemId] = {
        problemId,
        stage: 1,
        intervalDays: SPACED_INTERVALS[0], // 1 day
        lastReviewedAt: new Date().toISOString(),
        dueDate: new Date(Date.now() + 1 * dayMs).toISOString(),
        history: []
      };
      changed = true;
    }
  });

  if (changed) {
    saveRevisions(revisions);
  }

  return revisions;
}

/**
 * Persists the revisions map to localStorage.
 */
export function saveRevisions(revisions) {
  try {
    localStorage.setItem(REVISION_STORAGE_KEY, JSON.stringify(revisions));
    notifyStorageChange();
  } catch (e) {
    console.error('Failed writing revision data to localStorage', e);
  }
}

/**
 * Initializes or schedules a problem for revision upon successful solve.
 */
export function scheduleInitialRevision(problemId, solveTimestamp = new Date().toISOString()) {
  const revisions = getRevisions();
  const dayMs = 24 * 60 * 60 * 1000;

  // If already scheduled, don't wipe existing history
  if (revisions[problemId]) {
    return revisions[problemId];
  }

  revisions[problemId] = {
    problemId,
    stage: 1,
    intervalDays: SPACED_INTERVALS[0], // 1 day
    lastReviewedAt: solveTimestamp,
    dueDate: new Date(new Date(solveTimestamp).getTime() + 1 * dayMs).toISOString(),
    history: []
  };

  saveRevisions(revisions);
  return revisions[problemId];
}

/**
 * Records the honest outcome of an active recall revision session.
 * 
 * Outcome options:
 * - 'independent': Solved from memory without hints -> advance to next spaced interval.
 * - 'with_hints': Needed hints to recall -> drop to Stage 1 (1 day) for prompt reinforcement.
 * - 'failed': Could not recall / solve -> reset to Stage 1 (1 day).
 */
export function recordRevisionOutcome(problemId, outcome, notes = '') {
  const revisions = getRevisions();
  const dayMs = 24 * 60 * 60 * 1000;
  const now = new Date();

  let entry = revisions[problemId];
  if (!entry) {
    entry = scheduleInitialRevision(problemId);
  }

  const previousStage = entry.stage || 1;
  let newStage = 1;
  let nextIntervalDays = SPACED_INTERVALS[0];

  if (outcome === 'independent') {
    // Advance to next stage (max stage 5: 30 days)
    newStage = Math.min(SPACED_INTERVALS.length, previousStage + 1);
    nextIntervalDays = SPACED_INTERVALS[newStage - 1];
  } else if (outcome === 'with_hints') {
    // Substantial help needed: schedule an earlier retry (Stage 1: 1 day)
    newStage = 1;
    nextIntervalDays = SPACED_INTERVALS[0];
  } else {
    // Failed: reset to Stage 1 (1 day)
    newStage = 1;
    nextIntervalDays = SPACED_INTERVALS[0];
  }

  // Calculate next due date from now (never in the past)
  const nextDueDate = new Date(now.getTime() + nextIntervalDays * dayMs).toISOString();

  const historyItem = {
    id: 'rev_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
    timestamp: now.toISOString(),
    outcome, // 'independent' | 'with_hints' | 'failed'
    previousStage,
    newStage,
    intervalDays: nextIntervalDays,
    notes
  };

  entry.stage = newStage;
  entry.intervalDays = nextIntervalDays;
  entry.lastReviewedAt = now.toISOString();
  entry.dueDate = nextDueDate;
  entry.history = entry.history || [];
  entry.history.unshift(historyItem);

  revisions[problemId] = entry;
  saveRevisions(revisions);

  // Synchronize with existing attempt log so topic stats & activity heatmap update
  const prob = PROBLEMS.find(p => p.id === problemId);
  if (prob) {
    recordAttempt({
      problemId: prob.id,
      problemTitle: prob.title,
      topic: prob.topic,
      difficulty: prob.difficulty,
      success: outcome !== 'failed',
      hintsUnlocked: outcome === 'with_hints' ? 2 : 0,
      code: `// Active Recall Revision (${outcome})\n`
    });
  }

  return entry;
}

/**
 * Analyzes revision due dates and computes pipeline categorization
 * and honest retention metrics.
 */
export function getRevisionPipeline() {
  const revisions = getRevisions();
  const now = new Date();
  
  // Start of today and end of today in local time
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  const overdue = [];
  const dueToday = [];
  const upcoming = [];

  let totalRevisionsCompleted = 0;
  let independentSolves = 0;
  let withHintsSolves = 0;
  let failedSolves = 0;

  Object.values(revisions).forEach(rev => {
    const prob = PROBLEMS.find(p => p.id === rev.problemId);
    if (!prob) return;

    const dueDate = new Date(rev.dueDate);
    const dayMs = 24 * 60 * 60 * 1000;
    
    // Aggregates for retention metric
    if (rev.history && rev.history.length > 0) {
      rev.history.forEach(h => {
        totalRevisionsCompleted++;
        if (h.outcome === 'independent') independentSolves++;
        else if (h.outcome === 'with_hints') withHintsSolves++;
        else if (h.outcome === 'failed') failedSolves++;
      });
    }

    const item = {
      ...rev,
      problem: prob,
      daysOverdue: Math.max(0, Math.floor((now.getTime() - dueDate.getTime()) / dayMs)),
      daysUntilDue: Math.max(0, Math.ceil((dueDate.getTime() - now.getTime()) / dayMs)),
      displayDueDate: dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    };

    if (dueDate < startOfToday) {
      overdue.push(item);
    } else if (dueDate <= endOfToday) {
      dueToday.push(item);
    } else {
      upcoming.push(item);
    }
  });

  // Sort: overdue by most overdue first, dueToday, upcoming by nearest due date
  overdue.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  dueToday.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  upcoming.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

  // Recall Retention Rate:
  // Defined as (Independent Revisions / Total Completed Revisions) * 100
  const recallRetentionRate = totalRevisionsCompleted > 0
    ? Math.round((independentSolves / totalRevisionsCompleted) * 100)
    : null;

  return {
    overdue,
    dueToday,
    upcoming,
    totalDueCount: overdue.length + dueToday.length,
    activeInPipeline: Object.keys(revisions).length,
    totalRevisionsCompleted,
    independentSolves,
    withHintsSolves,
    failedSolves,
    recallRetentionRate,
    metricDefinition: 'Percentage of spaced-repetition recall sessions solved independently without hints.'
  };
}
