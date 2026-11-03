// Automated Test Suite for Adaptive Learning Roadmap Engine
import { PROBLEMS } from './src/data/problems.js';

// Polyfill minimal browser localStorage and Event
const storage = new Map();
global.localStorage = {
  getItem: (key) => storage.get(key) || null,
  setItem: (key, val) => storage.set(key, String(val)),
  removeItem: (key) => storage.delete(key),
  clear: () => storage.clear()
};

global.window = {
  dispatchEvent: () => {}
};
global.Event = class Event {};

const {
  getAdaptiveRoadmap,
  ROADMAP_TOPICS,
  TOPIC_STATUSES
} = await import('./src/services/roadmapService.js');

const {
  getTopicStats
} = await import('./src/services/adaptiveEngine.js');

const {
  recordAttempt,
  clearAllProgress
} = await import('./src/services/storage.js');

const results = [];
function test(name, fn) {
  try {
    fn();
    results.push({ name, passed: true });
    console.log(`✓ PASS: ${name}`);
  } catch (err) {
    results.push({ name, passed: false, error: err.message });
    console.error(`✗ FAIL: ${name}: ${err.message}`);
  }
}

console.log('--- Starting Adaptive Learning Roadmap Engine Tests ---\n');

// TEST 1: Empty History
test('1. Empty history initializes Arrays as Ready and downstream topics as Locked', () => {
  clearAllProgress();

  const roadmap = getAdaptiveRoadmap({
    topicStats: [],
    solvedIds: [],
    attempts: [],
    problems: PROBLEMS
  });

  const arraysNode = roadmap.nodes.find(n => n.topic === 'Arrays');
  if (!arraysNode) throw new Error('Arrays topic node not found');
  if (arraysNode.status !== TOPIC_STATUSES.READY) {
    throw new Error(`Expected Arrays status to be 'Ready to learn', got '${arraysNode.status}'`);
  }

  // Downstream topics with Arrays as prerequisite should be Locked
  const stringsNode = roadmap.nodes.find(n => n.topic === 'Strings');
  if (stringsNode.status !== TOPIC_STATUSES.LOCKED) {
    throw new Error(`Expected Strings status to be 'Locked by prerequisite', got '${stringsNode.status}'`);
  }
  if (!stringsNode.unmetPrerequisites.includes('Arrays')) {
    throw new Error('Expected Strings to have Arrays in unmetPrerequisites');
  }

  // Trees requires Linked Lists and Stacks, so it must be Locked
  const treesNode = roadmap.nodes.find(n => n.topic === 'Trees');
  if (treesNode.status !== TOPIC_STATUSES.LOCKED) {
    throw new Error(`Expected Trees status to be 'Locked by prerequisite', got '${treesNode.status}'`);
  }

  // Next recommended topic must be Arrays
  if (roadmap.recommendedTopic.topic !== 'Arrays') {
    throw new Error(`Expected recommended topic 'Arrays', got '${roadmap.recommendedTopic.topic}'`);
  }
  if (!roadmap.recommendationReason.includes('Arrays')) {
    throw new Error('Recommendation reason should mention Arrays');
  }
});

// TEST 2: Topic Readiness after Prerequisite Completion
test('2. Completing Arrays unlocks downstream topics to Ready to learn', () => {
  clearAllProgress();

  // Solve all problems in Arrays
  const arrayProblems = PROBLEMS.filter(p => p.topic === 'Arrays');
  arrayProblems.forEach(p => {
    recordAttempt({
      problemId: p.id,
      problemTitle: p.title,
      topic: p.topic,
      difficulty: p.difficulty,
      success: true
    });
  });

  const topicStats = getTopicStats();
  const solvedIds = arrayProblems.map(p => p.id);

  const roadmap = getAdaptiveRoadmap({
    topicStats,
    solvedIds,
    attempts: arrayProblems.map(() => ({ success: true })),
    problems: PROBLEMS
  });

  const arraysNode = roadmap.nodes.find(n => n.topic === 'Arrays');
  if (arraysNode.status !== TOPIC_STATUSES.COMPLETED) {
    throw new Error(`Expected Arrays status 'Completed', got '${arraysNode.status}'`);
  }

  // Strings, Binary Search, Linked Lists, Stacks should now be Ready to learn
  ['Strings', 'Binary Search', 'Linked Lists', 'Stacks'].forEach(topic => {
    const node = roadmap.nodes.find(n => n.topic === topic);
    if (node.status !== TOPIC_STATUSES.READY) {
      throw new Error(`Expected ${topic} to be 'Ready to learn' after Arrays completed, got '${node.status}'`);
    }
    if (node.unmetPrerequisites.length !== 0) {
      throw new Error(`Expected ${topic} to have 0 unmet prerequisites`);
    }
  });
});

// TEST 3: Multi-Prerequisite Locking (Trees)
test('3. Trees remains Locked until BOTH Linked Lists and Stacks are completed', () => {
  clearAllProgress();

  // Complete Arrays
  const solvedIds = PROBLEMS.filter(p => p.topic === 'Arrays').map(p => p.id);

  // Complete ONLY Stacks
  const stackIds = PROBLEMS.filter(p => p.topic === 'Stacks').map(p => p.id);
  solvedIds.push(...stackIds);

  let roadmap = getAdaptiveRoadmap({
    topicStats: [],
    solvedIds,
    attempts: [],
    problems: PROBLEMS
  });

  let treesNode = roadmap.nodes.find(n => n.topic === 'Trees');
  // Linked Lists is not complete, so Trees MUST remain Locked
  if (treesNode.status !== TOPIC_STATUSES.LOCKED) {
    throw new Error(`Expected Trees to be Locked when Linked Lists is incomplete, got '${treesNode.status}'`);
  }
  if (!treesNode.unmetPrerequisites.includes('Linked Lists')) {
    throw new Error('Trees should list Linked Lists as unmet prerequisite');
  }

  // Now complete Linked Lists
  const listIds = PROBLEMS.filter(p => p.topic === 'Linked Lists').map(p => p.id);
  solvedIds.push(...listIds);

  roadmap = getAdaptiveRoadmap({
    topicStats: [],
    solvedIds,
    attempts: [],
    problems: PROBLEMS
  });

  treesNode = roadmap.nodes.find(n => n.topic === 'Trees');
  // Now that both Linked Lists and Stacks are completed, Trees must be Ready to learn
  if (treesNode.status !== TOPIC_STATUSES.READY) {
    throw new Error(`Expected Trees to be 'Ready to learn', got '${treesNode.status}'`);
  }
  if (treesNode.unmetPrerequisites.length !== 0) {
    throw new Error('Trees should have 0 unmet prerequisites now');
  }
});

// TEST 4: Weak-Topic Remediation Priority
test('4. Repeated failures in an unlocked topic set status to Needs practice and prioritize it', () => {
  clearAllProgress();

  // Arrays completed, so Strings is unlocked
  const solvedIds = PROBLEMS.filter(p => p.topic === 'Arrays').map(p => p.id);

  // Record 2 failed attempts in Strings
  const attempts = [
    { problemId: 'valid-anagram', topic: 'Strings', success: false },
    { problemId: 'valid-anagram', topic: 'Strings', success: false }
  ];

  const roadmap = getAdaptiveRoadmap({
    topicStats: [],
    solvedIds,
    attempts,
    problems: PROBLEMS
  });

  const stringsNode = roadmap.nodes.find(n => n.topic === 'Strings');
  if (stringsNode.status !== TOPIC_STATUSES.NEEDS_PRACTICE) {
    throw new Error(`Expected Strings status to be 'Needs practice', got '${stringsNode.status}'`);
  }

  // Recommended topic should be Strings due to priority remediation
  if (roadmap.recommendedTopic.topic !== 'Strings') {
    throw new Error(`Expected recommended topic 'Strings', got '${roadmap.recommendedTopic.topic}'`);
  }
  if (!roadmap.recommendationReason.includes('Prioritizing Strings')) {
    throw new Error('Recommendation reason should explain prioritization due to knowledge gap');
  }
});

// TEST 5: Honest Curriculum Limitations for Advanced Topics
test('5. Advanced topics outside the curriculum scope are never claimed Completed without evidence', () => {
  clearAllProgress();

  // Solve ALL problems in the curriculum
  const allSolvedIds = PROBLEMS.map(p => p.id);

  const roadmap = getAdaptiveRoadmap({
    topicStats: [],
    solvedIds: allSolvedIds,
    attempts: [],
    problems: PROBLEMS
  });

  // Verify all 6 covered topics are Completed
  const coveredTopics = ['Arrays', 'Strings', 'Binary Search', 'Linked Lists', 'Stacks', 'Trees'];
  coveredTopics.forEach(t => {
    const node = roadmap.nodes.find(n => n.topic === t);
    if (node.status !== TOPIC_STATUSES.COMPLETED) {
      throw new Error(`Expected covered topic ${t} to be 'Completed', got '${node.status}'`);
    }
  });

  // Advanced topics (Heaps, Graphs, Dynamic Programming) have coveredInCurriculum: false
  // and MUST NOT be marked Completed
  const uncoveredTopics = ['Heaps', 'Graphs', 'Dynamic Programming'];
  uncoveredTopics.forEach(t => {
    const node = roadmap.nodes.find(n => n.topic === t);
    if (!node) throw new Error(`Node not found for ${t}`);
    if (node.status === TOPIC_STATUSES.COMPLETED) {
      throw new Error(`Uncovered topic ${t} should NEVER be marked Completed without curriculum problems!`);
    }
    if (!node.scopeNote) {
      throw new Error(`Uncovered topic ${t} must have an honest curriculum scopeNote`);
    }
  });
});

console.log(`\n--- Test Summary ---`);
const passedCount = results.filter(r => r.passed).length;
console.log(`Passed: ${passedCount}/${results.length}`);
if (passedCount === results.length) {
  console.log('All Adaptive Learning Roadmap Engine tests PASSED successfully!');
} else {
  process.exit(1);
}
