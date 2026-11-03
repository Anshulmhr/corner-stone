// Adaptive Learning Roadmap Engine
// Pure deterministic service for computing prerequisite relationships, topic readiness,
// progress status, and next-topic recommendations based on actual learning telemetry.

import { PROBLEMS } from '../data/problems.js';

/**
 * DSA Curriculum Roadmap Topology
 * Defines the canonical computer science topic dependency graph.
 */
export const ROADMAP_TOPICS = [
  {
    id: 'arrays',
    topic: 'Arrays',
    title: 'Arrays & Dynamic Arrays',
    description: 'Fundamental contiguous data structures, linear traversal, two-pointer techniques, and prefix sums.',
    prerequisites: [],
    coveredInCurriculum: true,
    estimatedDifficulty: 'Foundational'
  },
  {
    id: 'strings',
    topic: 'Strings',
    title: 'Strings & Character Manipulation',
    description: 'ASCII/Unicode manipulation, string hashing, palindromes, sliding window, and anagram frequencies.',
    prerequisites: ['Arrays'],
    coveredInCurriculum: true,
    estimatedDifficulty: 'Foundational'
  },
  {
    id: 'binary-search',
    topic: 'Binary Search',
    title: 'Binary Search & Order Discovery',
    description: 'Logarithmic search space elimination, sorted ranges, rotated pivots, and boundary detection.',
    prerequisites: ['Arrays'],
    coveredInCurriculum: true,
    estimatedDifficulty: 'Intermediate'
  },
  {
    id: 'linked-lists',
    topic: 'Linked Lists',
    title: 'Linked Lists & Pointer Traversal',
    description: 'Node chaining, pointer redirection, list reversal, fast-and-slow runner technique, and list merging.',
    prerequisites: ['Arrays'],
    coveredInCurriculum: true,
    estimatedDifficulty: 'Foundational'
  },
  {
    id: 'stacks',
    topic: 'Stacks',
    title: 'Stacks & LIFO Processing',
    description: 'Last-in first-out structures, monotonic stacks, bracket validation, and function call simulation.',
    prerequisites: ['Arrays'],
    coveredInCurriculum: true,
    estimatedDifficulty: 'Foundational'
  },
  {
    id: 'trees',
    topic: 'Trees',
    title: 'Trees & Hierarchical Recursion',
    description: 'Binary trees, tree depth, recursive DFS traversals, and hierarchical pointer navigation.',
    prerequisites: ['Linked Lists', 'Stacks'],
    coveredInCurriculum: true,
    estimatedDifficulty: 'Intermediate'
  },
  // Advanced Topics (Honest Curriculum Limitations - Requirement 9)
  {
    id: 'heaps',
    topic: 'Heaps',
    title: 'Heaps & Priority Queues',
    description: 'Binary heap invariant, top-K selection, and priority-driven stream processing.',
    prerequisites: ['Trees', 'Binary Search'],
    coveredInCurriculum: false,
    estimatedDifficulty: 'Advanced',
    scopeNote: 'Curriculum Scope Limitation: Not covered in current 20-problem demo dataset. Practice problems planned for future expansion.'
  },
  {
    id: 'graphs',
    topic: 'Graphs',
    title: 'Graphs & Adjacency Traversal',
    description: 'Breadth-first search (BFS), depth-first search (DFS), topological sort, and cycle detection.',
    prerequisites: ['Trees', 'Stacks'],
    coveredInCurriculum: false,
    estimatedDifficulty: 'Advanced',
    scopeNote: 'Curriculum Scope Limitation: Not covered in current 20-problem demo dataset. Practice problems planned for future expansion.'
  },
  {
    id: 'dynamic-programming',
    topic: 'Dynamic Programming',
    title: 'Dynamic Programming & Memoization',
    description: 'Optimal substructure, overlapping subproblems, memoization tables, and state transitions.',
    prerequisites: ['Arrays', 'Binary Search'],
    coveredInCurriculum: false,
    estimatedDifficulty: 'Advanced',
    scopeNote: 'Curriculum Scope Limitation: Not covered in current 20-problem demo dataset. Practice problems planned for future expansion.'
  }
];

export const TOPIC_STATUSES = {
  LOCKED: 'Locked by prerequisite',
  READY: 'Ready to learn',
  IN_PROGRESS: 'In progress',
  NEEDS_PRACTICE: 'Needs practice',
  COMPLETED: 'Completed'
};

/**
 * Computes status and metrics for all roadmap topics.
 */
export function getAdaptiveRoadmap({
  topicStats = [],
  solvedIds = [],
  attempts = [],
  problems = PROBLEMS
} = {}) {
  // Map stats by topic name for fast O(1) lookup
  const statsMap = {};
  topicStats.forEach(ts => {
    statsMap[ts.topic] = ts;
  });

  // Track recent struggle: topics with >= 2 failed attempts in recent 5 attempts
  const recentFailures = {};
  attempts.slice(0, 5).forEach(att => {
    if (!att.success) {
      recentFailures[att.topic] = (recentFailures[att.topic] || 0) + 1;
    }
  });

  // First pass: evaluate covered topics completion map for prerequisite checks
  const completedTopics = new Set();
  ROADMAP_TOPICS.forEach(topicDef => {
    if (!topicDef.coveredInCurriculum) return;

    const topicProblems = problems.filter(p => p.topic === topicDef.topic);
    const solvedInTopic = topicProblems.filter(p => solvedIds.includes(p.id));
    const allSolved = topicProblems.length > 0 && solvedInTopic.length === topicProblems.length;

    if (allSolved) {
      completedTopics.add(topicDef.topic);
    }
  });

  // Second pass: compute individual topic node states
  const topicNodes = ROADMAP_TOPICS.map(topicDef => {
    const topicProblems = problems.filter(p => p.topic === topicDef.topic);
    const solvedInTopic = topicProblems.filter(p => solvedIds.includes(p.id));
    const stats = statsMap[topicDef.topic] || {
      mastery: 0,
      totalAttempts: 0,
      successfulAttempts: 0,
      failedAttempts: 0,
      accuracy: 0,
      evidenceLevel: 'insufficient'
    };

    // Check prerequisite satisfaction
    const unmetPrerequisites = topicDef.prerequisites.filter(
      prereq => !completedTopics.has(prereq)
    );
    const isUnlocked = unmetPrerequisites.length === 0;

    let status = TOPIC_STATUSES.LOCKED;
    let statusReason = '';

    if (!topicDef.coveredInCurriculum) {
      // Uncovered topic (Requirement 9)
      if (!isUnlocked) {
        status = TOPIC_STATUSES.LOCKED;
        statusReason = `Locked: requires completion of ${unmetPrerequisites.join(', ')}.`;
      } else {
        status = TOPIC_STATUSES.READY;
        statusReason = 'All prerequisites satisfied. (Practice problems not in current 20-problem scope).';
      }
    } else if (!isUnlocked) {
      status = TOPIC_STATUSES.LOCKED;
      statusReason = `Locked: complete ${unmetPrerequisites.join(', ')} first.`;
    } else {
      // Unlocked covered topic
      const isComplete = topicProblems.length > 0 && solvedInTopic.length === topicProblems.length;
      const recentStruggle = (recentFailures[topicDef.topic] || 0) >= 2;
      const lowMastery = stats.totalAttempts >= 2 && stats.mastery < 50;

      if (isComplete) {
        status = TOPIC_STATUSES.COMPLETED;
        statusReason = `Completed all ${topicProblems.length} curriculum problem(s) in ${topicDef.topic}.`;
      } else if (recentStruggle || lowMastery) {
        status = TOPIC_STATUSES.NEEDS_PRACTICE;
        statusReason = recentStruggle
          ? `Needs practice: detected ${recentFailures[topicDef.topic]} recent unsuccessful attempts.`
          : `Needs practice: current mastery is ${stats.mastery}% with repeated errors.`;
      } else if (stats.totalAttempts > 0 || solvedInTopic.length > 0) {
        status = TOPIC_STATUSES.IN_PROGRESS;
        statusReason = `In progress: ${solvedInTopic.length}/${topicProblems.length} problem(s) solved (${stats.mastery}% mastery).`;
      } else {
        status = TOPIC_STATUSES.READY;
        statusReason = topicDef.prerequisites.length === 0
          ? 'Foundational entry point: ready to start.'
          : `Prerequisites met (${topicDef.prerequisites.join(', ')}): ready to learn.`;
      }
    }

    return {
      ...topicDef,
      status,
      statusReason,
      isUnlocked,
      unmetPrerequisites,
      totalProblems: topicProblems.length,
      solvedCount: solvedInTopic.length,
      problems: topicProblems.map(p => ({
        id: p.id,
        title: p.title,
        difficulty: p.difficulty,
        isSolved: solvedIds.includes(p.id)
      })),
      mastery: stats.mastery,
      accuracy: stats.accuracy,
      totalAttempts: stats.totalAttempts,
      evidenceLevel: stats.evidenceLevel
    };
  });

  // Determine Recommended Next Topic (Requirement 6)
  let recommendedNode = null;
  let recommendationReason = '';

  // 1. Highest priority: Topic needing practice
  const needsPractice = topicNodes.find(
    n => n.coveredInCurriculum && n.status === TOPIC_STATUSES.NEEDS_PRACTICE
  );
  if (needsPractice) {
    recommendedNode = needsPractice;
    recommendationReason = `Prioritizing ${needsPractice.topic}: evidence indicates knowledge gaps or recurring errors. Re-solving core patterns here will establish stability before progressing.`;
  }

  // 2. Second priority: In-progress topic
  if (!recommendedNode) {
    const inProgress = topicNodes.find(
      n => n.coveredInCurriculum && n.status === TOPIC_STATUSES.IN_PROGRESS
    );
    if (inProgress) {
      recommendedNode = inProgress;
      recommendationReason = `Continuing ${inProgress.topic}: you have active momentum with ${inProgress.solvedCount}/${inProgress.totalProblems} solved. Complete this module to unlock downstream algorithmic concepts.`;
    }
  }

  // 3. Third priority: Ready to learn topic
  if (!recommendedNode) {
    const ready = topicNodes.find(
      n => n.coveredInCurriculum && n.status === TOPIC_STATUSES.READY
    );
    if (ready) {
      recommendedNode = ready;
      recommendationReason = ready.prerequisites.length === 0
        ? `Starting with ${ready.topic}: baseline foundational module with no prerequisite dependencies.`
        : `Advancing to ${ready.topic}: all prerequisites (${ready.prerequisites.join(', ')}) are completed. Ready to expand your problem-solving breadth.`;
    }
  }

  // 4. Fourth priority: All curriculum topics completed
  if (!recommendedNode) {
    const lowestMasteryCompleted = topicNodes
      .filter(n => n.coveredInCurriculum && n.status === TOPIC_STATUSES.COMPLETED)
      .sort((a, b) => a.mastery - b.mastery)[0];

    recommendedNode = lowestMasteryCompleted || topicNodes[0];
    recommendationReason = `All 6 curriculum modules are completed! Recommend revision and zero-hint challenges in ${recommendedNode.topic} to deepen active recall.`;
  }

  return {
    nodes: topicNodes,
    recommendedTopic: recommendedNode,
    recommendationReason,
    completedCount: topicNodes.filter(n => n.status === TOPIC_STATUSES.COMPLETED).length,
    totalCurriculumTopics: topicNodes.filter(n => n.coveredInCurriculum).length
  };
}
