import { PROBLEMS } from '../data/problems.js';
import { getSolvedProblems, getAttempts, getUnlockedHints, getUnderstandingAssessments } from './storage.js';
import { getRevisionPipeline } from './revisionService.js';

/**
 * Calculates topic-level statistics, transparent mastery scores (0-100),
 * and empirical evidence thresholds ('insufficient' | 'early' | 'established').
 */
export function getTopicStats() {
  const solved = getSolvedProblems();
  const attempts = getAttempts();

  const topics = ['Arrays', 'Strings', 'Binary Search', 'Linked Lists', 'Stacks', 'Trees'];

  return topics.map(topic => {
    const topicProblems = PROBLEMS.filter(p => p.topic === topic);
    const totalCount = topicProblems.length;
    const solvedCount = topicProblems.filter(p => solved.includes(p.id)).length;
    
    // All attempts recorded for this topic
    const topicAttempts = attempts.filter(a => a.topic === topic);
    const totalAttempts = topicAttempts.length;
    const successfulAttempts = topicAttempts.filter(a => a.success).length;
    const failedAttempts = topicAttempts.filter(a => !a.success).length;

    // Self-reported accuracy
    const accuracy = totalAttempts > 0 
      ? Math.round((successfulAttempts / totalAttempts) * 100) 
      : 0;

    // Hints used in this topic
    let totalHintsUsed = 0;
    topicProblems.forEach(p => {
      totalHintsUsed += getUnlockedHints(p.id);
    });

    // Evidence Threshold Rule:
    // - 0 attempts: 'insufficient' ("Not enough data")
    // - 1 to 2 attempts: 'early' ("Early estimate")
    // - 3+ attempts: 'established' ("Sufficient data")
    let evidenceLevel = 'insufficient';
    let evidenceLabel = 'Not enough data';

    if (totalAttempts === 1) {
      evidenceLevel = 'early';
      evidenceLabel = 'Early estimate (1 attempt)';
    } else if (totalAttempts === 2) {
      evidenceLevel = 'early';
      evidenceLabel = 'Early estimate (2 attempts)';
    } else if (totalAttempts >= 3) {
      evidenceLevel = 'established';
      evidenceLabel = `Established (${totalAttempts} attempts)`;
    }

    // Transparent Deterministic Mastery Formula (0 - 100):
    // 1. Completion component: up to 50 points based on solved count / total problems
    // 2. Accuracy component: up to 35 points based on successful attempts / total attempts
    // 3. Hint autonomy component: up to 15 points (fewer average hints = higher autonomy)
    let mastery = 0;

    if (totalAttempts > 0 || solvedCount > 0) {
      const completionPts = totalCount > 0 ? (solvedCount / totalCount) * 50 : 0;
      const accuracyPts = totalAttempts > 0 ? (successfulAttempts / totalAttempts) * 35 : 0;
      
      const avgHints = totalHintsUsed / Math.max(1, solvedCount);
      const autonomyPts = Math.max(0, 15 - avgHints * 5); // 0 hints = 15pts, 1 hint = 10pts, 2 hints = 5pts, 3 hints = 0pts

      mastery = Math.min(100, Math.max(0, Math.round(completionPts + accuracyPts + autonomyPts)));
    }

    return {
      topic,
      totalCount,
      solvedCount,
      totalAttempts,
      successfulAttempts,
      failedAttempts,
      accuracy,
      hintsUsed: totalHintsUsed,
      mastery,
      evidenceLevel,
      evidenceLabel
    };
  });
}

/**
 * Overall summary metrics for dashboard cards
 */
export function getOverallMetrics() {
  const solved = getSolvedProblems();
  const attempts = getAttempts();
  const totalProblems = PROBLEMS.length;
  const uniqueSolved = solved.length;
  const totalAttempts = attempts.length;
  const successfulAttempts = attempts.filter(a => a.success).length;

  const overallAccuracy = totalAttempts > 0
    ? Math.round((successfulAttempts / totalAttempts) * 100)
    : 0;

  let totalHintsUnlocked = 0;
  PROBLEMS.forEach(p => {
    totalHintsUnlocked += getUnlockedHints(p.id);
  });

  const avgHintsPerProblem = uniqueSolved > 0
    ? (totalHintsUnlocked / uniqueSolved).toFixed(1)
    : '0.0';

  return {
    totalProblems,
    uniqueSolved,
    completionPercentage: Math.round((uniqueSolved / totalProblems) * 100),
    totalAttempts,
    successfulAttempts,
    overallAccuracy,
    totalHintsUnlocked,
    avgHintsPerProblem
  };
}

/**
 * Transparent, Rule-Based Adaptive Recommendation Engine
 * Strictly derives all recommendations from actual user attempts with honest explanations.
 */
export function getAdaptiveRecommendation() {
  const solved = getSolvedProblems();
  const attempts = getAttempts();
  const pipeline = getRevisionPipeline();

  // RULE 1: All Problems Solved -> Recommend Revision
  if (solved.length === PROBLEMS.length && PROBLEMS.length > 0) {
    // If there is an overdue review, prioritize it
    if (pipeline.overdue && pipeline.overdue.length > 0) {
      const overdueTarget = pipeline.overdue[0].problem;
      return {
        problem: overdueTarget,
        badge: 'Retention Overdue • Spaced Review',
        reason: `You have solved all ${PROBLEMS.length} problems! Re-solve ${overdueTarget.title} (${pipeline.overdue[0].daysOverdue} day(s) overdue) from memory.`,
        whyThisProblem: 'Scheduled spaced-repetition intervals protect against cognitive decay. Reviewing this problem now will restore active recall.',
        targetMetric: 'Recall Retention',
        difficulty: overdueTarget.difficulty,
        topic: overdueTarget.topic,
        isRevision: true
      };
    }

    // Otherwise find problem where user unlocked the most hints
    let targetProblem = PROBLEMS[0];
    let maxHints = -1;

    PROBLEMS.forEach(p => {
      const h = getUnlockedHints(p.id);
      if (h > maxHints) {
        maxHints = h;
        targetProblem = p;
      }
    });

    return {
      problem: targetProblem,
      badge: 'Curriculum Complete • Revision',
      reason: `You have solved all ${PROBLEMS.length} problems! Re-solve ${targetProblem.title} with fewer hints for revision.`,
      whyThisProblem: `You have completed the entire 10-problem curriculum. To deepen your mastery, we recommend revising ${targetProblem.title}, where you previously unlocked ${maxHints} hint(s).`,
      targetMetric: 'Zero-Hint Challenge',
      difficulty: targetProblem.difficulty,
      topic: targetProblem.topic,
      isRevision: true
    };
  }

  // RULE 2: Insufficient History / New User
  if (attempts.length === 0) {
    const beginnerProblem = PROBLEMS.find(p => p.id === 'two-sum') || PROBLEMS[0];
    return {
      problem: beginnerProblem,
      badge: 'Beginner Baseline',
      reason: 'You have not started practising yet. Start with a beginner problem.',
      whyThisProblem: 'No previous attempts recorded. We start with a beginner-friendly problem to benchmark your problem-solving baseline.',
      targetMetric: 'Establish Baseline',
      difficulty: beginnerProblem.difficulty,
      topic: beginnerProblem.topic
    };
  }

  // RULE 3: Weak Topic with Repeated Mistakes (Knowledge Gap Prioritization)
  // Inspect recent recorded attempts for repeated failures in a topic
  const recentAttempts = attempts.slice(0, 5);
  const failedByTopic = {};
  recentAttempts.forEach(att => {
    if (!att.success) {
      failedByTopic[att.topic] = (failedByTopic[att.topic] || 0) + 1;
    }
  });

  for (const [topic, count] of Object.entries(failedByTopic)) {
    if (count >= 2) {
      // Find an unsolved problem in this topic (prefer Easy to rebuild core intuition)
      const unsolvedInTopic = PROBLEMS.filter(p => p.topic === topic && !solved.includes(p.id));
      if (unsolvedInTopic.length > 0) {
        const target = unsolvedInTopic.find(p => p.difficulty === 'Easy') || unsolvedInTopic[0];
        return {
          problem: target,
          badge: 'Targeted Remediation',
          reason: `You have struggled with ${count} recent ${topic.toLowerCase()} attempts. Try a simpler ${topic.toLowerCase()} problem.`,
          whyThisProblem: `Detected ${count} recent unsuccessful attempts in ${topic}. Practising this foundational problem will help you master the core pattern before tackling harder questions.`,
          targetMetric: `${topic} Recovery`,
          difficulty: target.difficulty,
          topic: target.topic
        };
      }
    }
  }

  // RULE 4: Spaced Repetition Revision Due (Overdue or Due Today)
  if (pipeline.overdue && pipeline.overdue.length > 0) {
    const topOverdue = pipeline.overdue[0].problem;
    const daysOverdue = pipeline.overdue[0].daysOverdue;
    return {
      problem: topOverdue,
      badge: 'Spaced Revision Due',
      reason: daysOverdue > 0
        ? `You have ${pipeline.overdue.length} problem(s) overdue for spaced repetition. Review ${topOverdue.title} (${daysOverdue} day(s) overdue) to prevent forgetting.`
        : `You have ${pipeline.overdue.length} problem(s) overdue for spaced repetition. Review ${topOverdue.title} to prevent forgetting.`,
      whyThisProblem: `Spaced repetition protects long-term memory. Re-solving ${topOverdue.title} now reinforces concepts before proceeding to new topics.`,
      targetMetric: 'Retention Recovery',
      difficulty: topOverdue.difficulty,
      topic: topOverdue.topic,
      isRevision: true
    };
  }

  if (pipeline.dueToday && pipeline.dueToday.length > 0) {
    const topDue = pipeline.dueToday[0].problem;
    return {
      problem: topDue,
      badge: 'Spaced Revision Due',
      reason: `${topDue.title} is due for spaced-repetition review today. Re-solve it from memory to reinforce retention.`,
      whyThisProblem: `Scheduled active recall strengthens long-term memory. Re-solving ${topDue.title} today keeps retention high.`,
      targetMetric: 'Active Recall',
      difficulty: topDue.difficulty,
      topic: topDue.topic,
      isRevision: true
    };
  }

  // RULE 4B: Cognitive Understanding Gaps (Adaptive Intelligence Engine)
  // Inspects recent understanding assessments for specific diagnosed gaps
  const allAssessments = getUnderstandingAssessments();
  if (allAssessments && allAssessments.length > 0) {
    const recentProblemIds = [...new Set(recentAttempts.map(a => a.problemId))];
    for (const probId of recentProblemIds) {
      const probAssessments = allAssessments.filter(a => a && a.problemId === probId);
      if (probAssessments.length > 0) {
        const latestAss = probAssessments[0];
        const actionType = latestAss.recommendedAction?.actionType;
        const targetProblem = PROBLEMS.find(p => p.id === probId);

        if (targetProblem && actionType) {
          // 1. Weak complexity reasoning on accepted solve
          if (actionType === 'COMPLEXITY_DRILL') {
            return {
              problem: targetProblem,
              badge: 'Complexity Reflection Due',
              reason: `Your implementation was accepted for ${targetProblem.title}, but your complexity analysis scored low. Complete the complexity reflection.`,
              whyThisProblem: 'Identified by Adaptive Intelligence Engine: Code implementation passed, but asymptotic complexity analysis scored below 60%.',
              targetMetric: 'Complexity Analysis',
              difficulty: targetProblem.difficulty,
              topic: targetProblem.topic
            };
          }

          // 2. Sound concept but edge-case/boundary failure on unsolved problem
          if (actionType === 'EDGE_CASE_REMEDIATION' && !solved.includes(probId)) {
            return {
              problem: targetProblem,
              badge: 'Edge-Case Debugging',
              reason: `Your conceptual understanding of ${targetProblem.title} is solid, but tests failed on edge cases. Practice boundary tracing.`,
              whyThisProblem: 'Identified by Adaptive Intelligence Engine: Strong conceptual grasp with boundary/edge-case test failures.',
              targetMetric: 'Edge-Case Debugging',
              difficulty: targetProblem.difficulty,
              topic: targetProblem.topic
            };
          }

          // 3. High hint reliance on solve
          if (actionType === 'BLIND_CHALLENGE') {
            return {
              problem: targetProblem,
              badge: 'Independent Recall Challenge',
              reason: `You reached an accepted solution for ${targetProblem.title} with significant hint assistance. Re-solve it independently in Blind Solve mode.`,
              whyThisProblem: 'Identified by Adaptive Intelligence Engine: Solution reached with high hint reliance (independence score < 55%).',
              targetMetric: 'Autonomy Consolidation',
              difficulty: targetProblem.difficulty,
              topic: targetProblem.topic
            };
          }

          // 4. Low conceptual understanding
          if (actionType === 'CONCEPT_REVISION' && !solved.includes(probId)) {
            return {
              problem: targetProblem,
              badge: 'Conceptual Review',
              reason: `Assessment detected a foundational conceptual gap in ${targetProblem.title}. Review core invariants.`,
              whyThisProblem: 'Identified by Adaptive Intelligence Engine: Conceptual understanding scored below 50%.',
              targetMetric: 'Conceptual Reinforcement',
              difficulty: targetProblem.difficulty,
              topic: targetProblem.topic
            };
          }
        }
      }
    }
  }

  // RULE 5: High Autonomy Streak -> Advance Difficulty
  // Check if last 2 attempts were successful and used 0 hints
  if (recentAttempts.length >= 2 && recentAttempts[0].success && recentAttempts[1].success) {
    if (recentAttempts[0].hintsUnlocked === 0 && recentAttempts[1].hintsUnlocked === 0) {
      // Guard: Do not advance if the latest solve had poor complexity or conceptual understanding
      const latestAss = allAssessments.find(a => a && a.problemId === recentAttempts[0].problemId);
      const hasBlockingGap = latestAss && (
        (latestAss.dimensions?.complexityAnalysis?.score !== null && latestAss.dimensions.complexityAnalysis.score < 60) ||
        (latestAss.dimensions?.conceptualUnderstanding?.score !== null && latestAss.dimensions.conceptualUnderstanding.score < 60)
      );

      if (!hasBlockingGap) {
        // Find an unsolved Medium problem
        const unsolvedMedium = PROBLEMS.find(p => !solved.includes(p.id) && p.difficulty === 'Medium');
        if (unsolvedMedium) {
          return {
            problem: unsolvedMedium,
            badge: 'Challenge Advance',
            reason: 'You solved your last two problems without hints. Consider trying a harder problem.',
            whyThisProblem: 'You completed your last 2 problems independently without requesting hints. You are ready to challenge yourself with higher-level constraints.',
            targetMetric: 'Push Complexity',
            difficulty: unsolvedMedium.difficulty,
            topic: unsolvedMedium.topic
          };
        }
      }
    }
  }

  // RULE 6: Unpractised Topic Exploration
  // Find topics that have zero attempts recorded but still have unsolved problems
  const topicStats = getTopicStats();
  const unpracticedTopic = topicStats.find(t => t.totalAttempts === 0 && t.solvedCount === 0);

  if (unpracticedTopic) {
    const topicProblems = PROBLEMS.filter(p => p.topic === unpracticedTopic.topic && !solved.includes(p.id));
    if (topicProblems.length > 0) {
      const easyProb = topicProblems.find(p => p.difficulty === 'Easy') || topicProblems[0];
      return {
        problem: easyProb,
        badge: 'Topic Exploration',
        reason: `You have not practised ${unpracticedTopic.topic.toLowerCase()} yet. Start with a beginner problem.`,
        whyThisProblem: `You have 0 recorded attempts in ${unpracticedTopic.topic}. Broadening your topic breadth is essential for well-rounded algorithmic competence.`,
        targetMetric: `Explore ${unpracticedTopic.topic}`,
        difficulty: easyProb.difficulty,
        topic: easyProb.topic
      };
    }
  }

  // RULE 7: Lowest Mastery Topic with Unsolved Problems
  const unsolvedTopics = topicStats
    .filter(t => t.solvedCount < t.totalCount)
    .sort((a, b) => a.mastery - b.mastery);

  if (unsolvedTopics.length > 0) {
    const weakTopic = unsolvedTopics[0];
    const unsolvedInWeak = PROBLEMS.filter(p => p.topic === weakTopic.topic && !solved.includes(p.id));
    if (unsolvedInWeak.length > 0) {
      const target = unsolvedInWeak.find(p => p.difficulty === 'Easy') || unsolvedInWeak[0];
      return {
        problem: target,
        badge: 'Mastery Calibration',
        reason: weakTopic.evidenceLevel === 'insufficient'
          ? `You have not practised ${weakTopic.topic.toLowerCase()} yet. Start with a beginner problem.`
          : `Your mastery in ${weakTopic.topic} is currently ${weakTopic.mastery}%. Practice this problem to strengthen your understanding.`,
        whyThisProblem: `Identified as your lowest-scoring topic (${weakTopic.mastery}%) among remaining unsolved curriculum questions.`,
        targetMetric: `Elevate ${weakTopic.topic}`,
        difficulty: target.difficulty,
        topic: target.topic
      };
    }
  }

  // RULE 8: Fallback to earliest unsolved
  const fallback = PROBLEMS.find(p => !solved.includes(p.id)) || PROBLEMS[0];
  return {
    problem: fallback,
    badge: 'Curriculum Progression',
    reason: 'Recommended based on standard curriculum progression.',
    whyThisProblem: 'Selected as the next sequential foundational problem in your curriculum.',
    targetMetric: 'Curriculum Advance',
    difficulty: fallback.difficulty,
    topic: fallback.topic
  };
}

/**
 * Generates data for a compact 28-day practice activity heatmap.
 */
export function getActivityHeatmapData() {
  const attempts = getAttempts();
  const dayMs = 24 * 60 * 60 * 1000;
  const days = 28;
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  const heatmap = [];

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today.getTime() - i * dayMs);
    const dateStr = date.toISOString().split('T')[0];
    
    const dayAttempts = attempts.filter(a => {
      const aDate = a.timestamp.split('T')[0];
      return aDate === dateStr;
    });

    const count = dayAttempts.length;
    const solves = dayAttempts.filter(a => a.success).length;

    let level = 0;
    if (count > 0 && count <= 1) level = 1;
    else if (count >= 2 && count <= 3) level = 2;
    else if (count >= 4 && count <= 5) level = 3;
    else if (count > 5) level = 4;

    heatmap.push({
      date: dateStr,
      displayDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      dayOfWeek: date.toLocaleDateString('en-US', { weekday: 'short' }),
      count,
      solves,
      level
    });
  }

  return heatmap;
}

/**
 * Aggregates diagnosisCategory data from all automated C++ attempts that failed.
 * Returns an array of category objects sorted by frequency, giving the learner
 * a transparent breakdown of their most common mistake types.
 *
 * Each element: { category, label, color, count, percentage, affectedProblems }
 */
export function getMistakePatternStats() {
  const attempts = getAttempts();

  // Only consider automated C++ failed attempts that have a diagnosis category
  const diagnosedFailures = attempts.filter(
    a => !a.success && a.evaluationType === 'automated' && a.diagnosisCategory
  );

  if (diagnosedFailures.length === 0) {
    return { categories: [], totalDiagnosed: 0, hasData: false };
  }

  // Metadata for each category
  const CATEGORY_META = {
    COMPILATION_ERROR: {
      label: 'Syntax / Compilation Error',
      color: '#F87171',
      bg: 'rgba(248, 113, 113, 0.12)',
      description: 'Code could not be compiled by GCC. Typically missing semicolons, mismatched braces, or undeclared variables.'
    },
    RUNTIME_ERROR: {
      label: 'Runtime Error',
      color: '#F87171',
      bg: 'rgba(248, 113, 113, 0.1)',
      description: 'Code compiled but crashed during execution. Common causes: out-of-bounds access, segmentation fault, or division by zero.'
    },
    EDGE_CASE_FAILURE: {
      label: 'Edge-Case Failure',
      color: '#818CF8',
      bg: 'rgba(129, 140, 248, 0.12)',
      description: 'Visible tests passed but hidden tests (covering edge cases) failed. The core logic is right, but boundary conditions are unhandled.'
    },
    BOUNDARY_ERROR: {
      label: 'Off-by-One / Boundary Error',
      color: '#FBBF24',
      bg: 'rgba(251, 191, 36, 0.12)',
      description: 'Output differs from expected by exactly 1. Typically an incorrect loop bound, inclusive vs. exclusive range, or 0-vs-1 indexing.'
    },
    OUTPUT_FORMAT_ERROR: {
      label: 'Output Formatting Mismatch',
      color: '#38BDF8',
      bg: 'rgba(56, 189, 248, 0.12)',
      description: 'The values appear correct but are formatted differently from the expected output (brackets, spaces, delimiters).'
    },
    LOGIC_ERROR: {
      label: 'Incorrect Algorithm / Logic',
      color: '#FB7185',
      bg: 'rgba(244, 63, 94, 0.12)',
      description: 'Most or all tests fail. The algorithm itself does not produce correct results for the given problem.'
    },
    PARTIAL_LOGIC_ERROR: {
      label: 'Partial Logic Error',
      color: '#FB7185',
      bg: 'rgba(244, 63, 94, 0.1)',
      description: 'Some tests pass but others fail. The general approach may be correct, but it does not handle all input patterns.'
    },
    TLE: {
      label: 'Time Complexity Issue',
      color: '#FACC15',
      bg: 'rgba(250, 204, 21, 0.12)',
      description: 'Solution timed out. Usually indicates an O(n²) or worse algorithm where a more efficient approach is needed.'
    },
    UNKNOWN: {
      label: 'Unclassified Failure',
      color: '#6B7280',
      bg: 'rgba(107, 114, 128, 0.12)',
      description: 'Insufficient evidence to classify the mistake type.'
    }
  };

  // Count occurrences and track affected problem IDs
  const counts = {};
  const problemSets = {};

  for (const att of diagnosedFailures) {
    const cat = att.diagnosisCategory;
    counts[cat] = (counts[cat] || 0) + 1;
    if (!problemSets[cat]) problemSets[cat] = new Set();
    problemSets[cat].add(att.problemId);
  }

  const total = diagnosedFailures.length;

  const categories = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([category, count]) => {
      const meta = CATEGORY_META[category] || {
        label: category,
        color: '#6B7280',
        bg: 'rgba(107, 114, 128, 0.12)',
        description: ''
      };
      return {
        category,
        label: meta.label,
        color: meta.color,
        bg: meta.bg,
        description: meta.description,
        count,
        percentage: Math.round((count / total) * 100),
        affectedProblems: problemSets[category] ? problemSets[category].size : 0
      };
    });

  // Compute a dominant weakness insight
  const dominant = categories[0] || null;
  let insight = null;

  if (dominant && dominant.percentage >= 50) {
    insight = {
      title: `Primary Pattern: ${dominant.label}`,
      detail: `${dominant.percentage}% of your diagnosed failures share this category. ${dominant.description}`
    };
  } else if (categories.length >= 3) {
    insight = {
      title: 'Diverse Failure Pattern',
      detail: `Your failures are distributed across ${categories.length} mistake types, suggesting a need for broad practice across algorithm correctness, edge cases, and code quality.`
    };
  } else if (dominant) {
    insight = {
      title: `Recurring Pattern: ${dominant.label}`,
      detail: `This category appears most often in your failed attempts. ${dominant.description}`
    };
  }

  return {
    categories,
    totalDiagnosed: total,
    hasData: true,
    insight
  };
}
