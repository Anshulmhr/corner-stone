import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Lightbulb, 
  Lock, 
  Unlock, 
  CheckCircle2, 
  AlertTriangle, 
  RotateCcw, 
  Play, 
  Sparkles,
  ArrowRight,
  Info,
  Clock,
  ShieldCheck,
  Send,
  Loader2,
  EyeOff,
  Trophy,
  Timer
} from 'lucide-react';
import { 
  getUnlockedHints, 
  unlockNextHint, 
  getCodeDraft, 
  saveCodeDraft, 
  recordAttempt, 
  getAttempts,
  isProblemSolved 
} from '../../services/storage.js';
import { 
  calculateIndependenceScore, 
  getActiveBlindSession, 
  startBlindSession, 
  incrementBlindSubmissions, 
  endBlindSession, 
  abandonBlindSession 
} from '../../services/blindSolveService.js';
import { CPP_SUPPORTED_PROBLEMS, CPP_STARTER_CODE } from '../../data/cppTestSuites.js';
import { evaluateCppSubmission } from '../../services/codeExecutionService.js';
import CppCodeEditor from './CppCodeEditor.jsx';
import TestResultsPanel from './TestResultsPanel.jsx';
import LearningCoachPanel from './LearningCoachPanel.jsx';
import UnderstandingReflectionPanel from './UnderstandingReflectionPanel.jsx';

export default function ProblemSolverView({ 
  problem, 
  onBack, 
  onNavigateNext, 
  recommendation 
}) {
  const isCppSupported = CPP_SUPPORTED_PROBLEMS.includes(problem?.id);
  const cppStarterCode = CPP_STARTER_CODE[problem?.id];

  const [language, setLanguage] = useState(isCppSupported ? 'cpp' : 'javascript');
  const [unlockedLevel, setUnlockedLevel] = useState(0);
  const [code, setCode] = useState('');
  const [isSolved, setIsSolved] = useState(false);
  const [alertMessage, setAlertMessage] = useState(null);
  
  // Real C++ Execution State
  const [isExecuting, setIsExecuting] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState(null);

  // Blind Solve Challenge Mode State
  const [isBlindMode, setIsBlindMode] = useState(false);
  const [blindSession, setBlindSession] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [blindResults, setBlindResults] = useState(null);

  // Timer helper
  const formatTimer = (secs) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
  };

  // Timer effect for active Blind Solve session
  useEffect(() => {
    if (!isBlindMode || !blindSession) return;

    const interval = setInterval(() => {
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - blindSession.startTime) / 1000)));
    }, 1000);

    return () => clearInterval(interval);
  }, [isBlindMode, blindSession]);

  // Initialize data on problem or language change
  useEffect(() => {
    if (!problem) return;
    const currentHints = getUnlockedHints(problem.id);
    setUnlockedLevel(currentHints);
    setIsSolved(isProblemSolved(problem.id));
    setAlertMessage(null);
    setEvaluationResult(null);
    setBlindResults(null);

    // Check for an active running blind session for this problem (e.g. after refresh)
    const active = getActiveBlindSession(problem.id);
    if (active) {
      setIsBlindMode(true);
      setBlindSession(active);
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - active.startTime) / 1000)));
    } else {
      setIsBlindMode(false);
      setBlindSession(null);
      setElapsedSeconds(0);
    }

    const defaultStarter = (language === 'cpp' && cppStarterCode)
      ? cppStarterCode
      : problem.starterCode;

    setCode(getCodeDraft(problem.id, defaultStarter, language));
  }, [problem, language, cppStarterCode]);

  if (!problem) return null;

  // Blind Challenge Handlers
  const handleStartBlindChallenge = () => {
    const session = startBlindSession(problem.id, unlockedLevel);
    setIsBlindMode(true);
    setBlindSession(session);
    setElapsedSeconds(0);
    setBlindResults(null);
    setAlertMessage({
      type: 'attempt',
      text: 'Blind Solve Challenge activated! Hints are concealed. Test your independent algorithmic intuition.'
    });
  };

  const handleExitBlindChallenge = () => {
    if (window.confirm('Exit Blind Solve Challenge? Progressive hints will be unlocked, but this challenge will be marked as incomplete.')) {
      abandonBlindSession(problem.id);
      setIsBlindMode(false);
      setBlindSession(null);
      setAlertMessage({
        type: 'attempt',
        text: 'Exited Blind Solve Mode. Hints are now unlocked and accessible.'
      });
    }
  };

  // Handle Code changes
  const handleCodeChange = (newCode) => {
    setCode(newCode);
    saveCodeDraft(problem.id, newCode, language);
  };

  const handleResetCode = () => {
    const defaultStarter = (language === 'cpp' && cppStarterCode)
      ? cppStarterCode
      : problem.starterCode;

    if (window.confirm(`Reset ${language.toUpperCase()} code editor to starter template?`)) {
      setCode(defaultStarter);
      saveCodeDraft(problem.id, defaultStarter, language);
      setEvaluationResult(null);
    }
  };

  // Progressive Hint Unlock
  const handleUnlockHint = () => {
    if (unlockedLevel >= 3) return;
    const next = unlockNextHint(problem.id);
    setUnlockedLevel(next);
  };

  // Switch Language
  const handleLanguageSwitch = (newLang) => {
    setLanguage(newLang);
    const defaultStarter = (newLang === 'cpp' && cppStarterCode)
      ? cppStarterCode
      : problem.starterCode;
    setCode(getCodeDraft(problem.id, defaultStarter, newLang));
    setEvaluationResult(null);
  };

  // REAL C++ Execution & Submission Handler
  const handleRunAndSubmit = async () => {
    if (language !== 'cpp' || !isCppSupported) {
      handleManualSolve();
      return;
    }

    setIsExecuting(true);
    setAlertMessage(null);

    // If blind mode is active, increment session submission counter
    let currentSession = blindSession;
    if (isBlindMode) {
      currentSession = incrementBlindSubmissions(problem.id);
      setBlindSession(currentSession);
    }

    try {
      const previousAttempts = getAttempts().filter(a => a.problemId === problem.id);
      const evalOutcome = await evaluateCppSubmission(problem.id, code, previousAttempts);
      setEvaluationResult(evalOutcome);

      const isAccepted = evalOutcome.status === 'ACCEPTED';

      let scoreResult = null;
      let finalElapsed = elapsedSeconds;

      if (isBlindMode && isAccepted) {
        const completed = endBlindSession(problem.id);
        finalElapsed = completed ? completed.elapsedSeconds : elapsedSeconds;
        const subCount = completed ? completed.submissionCount : (currentSession?.submissionCount || 1);
        scoreResult = calculateIndependenceScore({
          success: true,
          submissionCount: subCount,
          hintsUsed: 0
        });

        setBlindResults({
          success: true,
          timeTaken: finalElapsed,
          submissionCount: subCount,
          hintsUsed: 0,
          scoreData: scoreResult
        });
        setIsBlindMode(false);
        setBlindSession(null);
      }

      // Record attempt in progress audit
      recordAttempt({
        problemId: problem.id,
        problemTitle: problem.title,
        topic: problem.topic,
        difficulty: problem.difficulty,
        success: isAccepted,
        hintsUnlocked: isBlindMode ? 0 : unlockedLevel,
        code,
        evaluationType: 'automated',
        language: 'cpp',
        status: evalOutcome.status,
        passedCount: evalOutcome.passedCount,
        totalCount: evalOutcome.totalCount,
        executionTimeMs: evalOutcome.executionTimeMs,
        diagnosisCategory: evalOutcome.diagnosis?.category || null,
        isBlindSolve: isBlindMode || !!scoreResult,
        blindSolveTimeSeconds: isBlindMode || scoreResult ? finalElapsed : null,
        independenceScore: scoreResult ? scoreResult.score : null
      });

      if (isAccepted) {
        setIsSolved(true);
        if (!scoreResult) {
          setAlertMessage({
            type: 'success',
            text: `All ${evalOutcome.passedCount}/${evalOutcome.totalCount} automated test cases passed in ${evalOutcome.executionTimeMs}ms! Problem marked as verified.`
          });
        }
      } else if (evalOutcome.status === 'COMPILATION_ERROR') {
        setAlertMessage({
          type: 'error',
          text: 'Compilation error. Check the GCC compiler output below to fix syntax issues.'
        });
      } else if (evalOutcome.status === 'RUNTIME_ERROR') {
        setAlertMessage({
          type: 'error',
          text: 'Runtime error occurred during execution.'
        });
      } else if (evalOutcome.status === 'WRONG_ANSWER') {
        setAlertMessage({
          type: 'error',
          text: `${evalOutcome.passedCount} of ${evalOutcome.totalCount} test cases passed. Inspect failed tests below.`
        });
      }
    } catch (err) {
      setAlertMessage({
        type: 'error',
        text: `Execution failed: ${err.message}`
      });
    } finally {
      setIsExecuting(false);
    }
  };

  // Manual fallback solve for JS or exploratory mode
  const handleManualSolve = () => {
    let scoreResult = null;
    let finalElapsed = elapsedSeconds;

    if (isBlindMode) {
      const completed = endBlindSession(problem.id);
      finalElapsed = completed ? completed.elapsedSeconds : elapsedSeconds;
      const subCount = completed ? completed.submissionCount : 1;
      scoreResult = calculateIndependenceScore({
        success: true,
        submissionCount: subCount,
        hintsUsed: 0
      });

      setBlindResults({
        success: true,
        timeTaken: finalElapsed,
        submissionCount: subCount,
        hintsUsed: 0,
        scoreData: scoreResult
      });
      setIsBlindMode(false);
      setBlindSession(null);
    }

    recordAttempt({
      problemId: problem.id,
      problemTitle: problem.title,
      topic: problem.topic,
      difficulty: problem.difficulty,
      success: true,
      hintsUnlocked: isBlindMode ? 0 : unlockedLevel,
      code,
      evaluationType: 'manual',
      language,
      status: 'ACCEPTED',
      isBlindSolve: isBlindMode || !!scoreResult,
      blindSolveTimeSeconds: isBlindMode || scoreResult ? finalElapsed : null,
      independenceScore: scoreResult ? scoreResult.score : null
    });

    setIsSolved(true);
    if (!scoreResult) {
      setAlertMessage({
        type: 'success',
        text: `Self-reported solve recorded with ${unlockedLevel} hint(s) unlocked.`
      });
    }
  };

  // Record an Incomplete/Manual Practice Attempt
  const handleRecordPracticeAttempt = () => {
    recordAttempt({
      problemId: problem.id,
      problemTitle: problem.title,
      topic: problem.topic,
      difficulty: problem.difficulty,
      success: false,
      hintsUnlocked: unlockedLevel,
      code,
      evaluationType: 'manual',
      language,
      status: 'INCOMPLETE'
    });

    setAlertMessage({
      type: 'attempt',
      text: `Practice attempt logged with ${unlockedLevel} hint(s) unlocked. Check hints or test cases for guidance.`
    });
  };

  const difficultyClass = problem.difficulty === 'Easy' 
    ? 'badge-easy' 
    : problem.difficulty === 'Medium' 
    ? 'badge-medium' 
    : 'badge-hard';

  return (
    <div className="solver-container">
      {/* Top Bar with Navigation & Status */}
      <div className="solver-top-bar">
        <button onClick={onBack} className="btn btn-ghost btn-sm">
          <ArrowLeft size={16} />
          <span>Back to Problems</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          {isBlindMode ? (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              padding: '0.25rem 0.65rem',
              borderRadius: '9999px',
              color: '#F87171',
              fontSize: '0.75rem',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)'
            }}>
              <EyeOff size={13} />
              <span>Blind Challenge: {formatTimer(elapsedSeconds)}</span>
            </div>
          ) : (
            <button 
              onClick={handleStartBlindChallenge}
              className="btn btn-secondary btn-sm"
              style={{ 
                border: '1px solid rgba(239, 68, 68, 0.4)', 
                color: '#F87171',
                background: 'rgba(239, 68, 68, 0.08)',
                fontSize: '0.75rem',
                padding: '0.25rem 0.65rem'
              }}
              title="Challenge yourself to solve without progressive hints"
            >
              <EyeOff size={13} />
              <span>Blind Solve</span>
            </button>
          )}

          <span className={`badge ${difficultyClass}`}>{problem.difficulty}</span>
          <span className="badge badge-topic">{problem.topic}</span>
          {isSolved ? (
            <span className="badge badge-easy" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <CheckCircle2 size={13} />
              Solved
            </span>
          ) : (
            <span className="badge" style={{ background: 'var(--bg-surface)', color: 'var(--text-dim)', border: '1px solid var(--border-subtle)' }}>
              In Progress
            </span>
          )}
        </div>
      </div>

      {/* Main Two-Column Solving Grid */}
      <div className="solver-grid">
        {/* Left Column: Problem Statement & Progressive Hints */}
        <div className="problem-panel">
          {/* Problem Statement Card */}
          <div className="problem-statement-card">
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
              <div>
                <h1 style={{ fontSize: '1.65rem', fontWeight: 800, marginBottom: '0.4rem' }}>
                  {problem.title}
                </h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', color: 'var(--text-dim)', fontSize: '0.8rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Clock size={13} />
                    Target: {problem.estimatedTime}
                  </span>
                  <span>•</span>
                  <span>ID: {problem.id}</span>
                  {isCppSupported && (
                    <>
                      <span>•</span>
                      <span style={{ color: 'var(--accent-success)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                        <ShieldCheck size={13} /> Real C++ Execution Supported
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="problem-desc">
              {problem.description}
            </div>

            {/* Examples */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ fontSize: '0.825rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
                Examples
              </div>
              {problem.examples.map((ex, i) => (
                <div key={i} className="example-box">
                  <div className="example-title">Example {i + 1}</div>
                  <div><strong style={{ color: 'var(--text-muted)' }}>Input:</strong> <code>{ex.input}</code></div>
                  <div><strong style={{ color: 'var(--text-muted)' }}>Output:</strong> <code>{ex.output}</code></div>
                  {ex.explanation && (
                    <div style={{ color: 'var(--text-dim)', fontSize: '0.8rem', marginTop: '0.2rem' }}>
                      <em>Explanation: {ex.explanation}</em>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Constraints */}
            <div>
              <div style={{ fontSize: '0.825rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.04em', marginBottom: '0.5rem' }}>
                Constraints
              </div>
              <ul className="constraints-list">
                {problem.constraints.map((c, i) => (
                  <li key={i}><code>{c}</code></li>
                ))}
              </ul>
            </div>
          </div>

          {/* SIGNATURE FEATURE: Progressive Hints System / Blind Challenge Mode */}
          {isBlindMode ? (
            <div className="blind-challenge-card">
              <div className="blind-challenge-pill">
                <EyeOff size={13} />
                <span>Blind Challenge Active</span>
              </div>

              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '0.4rem', color: 'var(--text-main)' }}>
                Hints Concealed
              </h3>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '1rem' }}>
                You are currently in <strong>Blind Challenge Mode</strong>. Progressive hints are concealed to test whether you can solve this problem with complete autonomy.
              </p>

              <div className="blind-stats-grid">
                <div className="blind-stat-box">
                  <div className="blind-stat-label">Elapsed Time</div>
                  <div className="blind-stat-value" style={{ color: '#F87171' }}>
                    {formatTimer(elapsedSeconds)}
                  </div>
                </div>
                <div className="blind-stat-box">
                  <div className="blind-stat-label">Submissions</div>
                  <div className="blind-stat-value">
                    {blindSession?.submissionCount || 0}
                  </div>
                </div>
                <div className="blind-stat-box">
                  <div className="blind-stat-label">Hints Used</div>
                  <div className="blind-stat-value" style={{ color: 'var(--accent-success)' }}>
                    0 / 3
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '1.25rem' }}>
                <button 
                  onClick={handleExitBlindChallenge}
                  className="btn btn-ghost btn-sm"
                  style={{ width: '100%', border: '1px solid var(--border-medium)', color: 'var(--text-muted)', fontSize: '0.8rem' }}
                >
                  <Unlock size={14} />
                  <span>Exit Blind Mode & Unlock Hints</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="hints-container">
              <div className="hints-header">
                <div className="hints-title-wrap">
                  <Lightbulb size={20} color="var(--accent-primary)" />
                  <span className="hints-title">Progressive Hints</span>
                </div>

                {/* Step indicator: 3 pills */}
                <div className="hints-stepper">
                  <div className={`hint-step-indicator ${unlockedLevel >= 1 ? 'unlocked' : ''}`} title="Hint 1: Conceptual Nudge" />
                  <div className={`hint-step-indicator ${unlockedLevel >= 2 ? 'unlocked' : ''}`} title="Hint 2: Specific Approach" />
                  <div className={`hint-step-indicator ${unlockedLevel >= 3 ? 'unlocked' : ''}`} title="Hint 3: Algorithmic Blueprint" />
                </div>
              </div>

              <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: '-0.5rem' }}>
                Unlock hints step-by-step. AdaptiveDSA tracks hint reliance to balance challenge and guidance.
              </p>

              {/* Hint Cards */}
              <div className="hints-deck">
                {problem.hints.map((hint) => {
                  const isUnlocked = unlockedLevel >= hint.level;
                  return (
                    <div key={hint.level} className={`hint-card ${isUnlocked ? 'unlocked' : ''}`}>
                      <div className="hint-card-header">
                        <div className="hint-card-title">
                          {isUnlocked ? (
                            <Unlock size={14} color="var(--accent-primary)" />
                          ) : (
                            <Lock size={14} color="var(--text-dim)" />
                          )}
                          <span>{hint.title}</span>
                        </div>
                        <span className="hint-level-tag">Level {hint.level}</span>
                      </div>

                      {isUnlocked ? (
                        <div className="hint-card-body">
                          {hint.content}
                        </div>
                      ) : (
                        <div className="hint-locked-placeholder">
                          <Lock size={14} />
                          <span>Hint {hint.level} is locked. Unlock sequentially when you need a nudge.</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Hint Unlock Button */}
              {unlockedLevel < 3 ? (
                <button 
                  onClick={handleUnlockHint}
                  className="btn btn-secondary"
                  style={{ width: '100%', border: '1px solid var(--border-accent)', color: 'var(--accent-primary)' }}
                >
                  <Lightbulb size={16} />
                  <span>Unlock Hint {unlockedLevel + 1} ({unlockedLevel === 0 ? 'Conceptual Nudge' : unlockedLevel === 1 ? 'Specific Approach' : 'Algorithmic Blueprint'})</span>
                </button>
              ) : (
                <div style={{ textAlign: 'center', fontSize: '0.775rem', color: 'var(--text-dim)', padding: '0.25rem' }}>
                  All 3 hints unlocked. Take your time to write and trace your solution!
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Code Editor & Execution Panel */}
        <div className="editor-panel">
          {/* Blind Solve Results Summary Card */}
          {blindResults && (
            <div className="blind-results-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <div style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(167, 139, 250, 0.15)',
                    color: 'var(--accent-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Trophy size={18} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                      Blind Solve Challenge Results
                    </h3>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                      Performance summary & autonomy analysis
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="badge badge-easy" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.3rem 0.65rem' }}>
                    <CheckCircle2 size={13} /> Solved Independently
                  </span>
                  <button 
                    onClick={() => setBlindResults(null)}
                    className="btn btn-ghost btn-sm"
                    style={{ fontSize: '0.75rem', padding: '0.2rem 0.45rem' }}
                  >
                    × Dismiss
                  </button>
                </div>
              </div>

              <div className="blind-stats-grid">
                <div className="blind-stat-box">
                  <div className="blind-stat-label">Independence Score</div>
                  <div className="blind-stat-value" style={{ color: 'var(--accent-primary)', fontSize: '1.25rem' }}>
                    {blindResults.scoreData.score}<span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>/100</span>
                  </div>
                </div>

                <div className="blind-stat-box">
                  <div className="blind-stat-label">Time Taken</div>
                  <div className="blind-stat-value">
                    {formatTimer(blindResults.timeTaken)}
                  </div>
                </div>

                <div className="blind-stat-box">
                  <div className="blind-stat-label">Submissions</div>
                  <div className="blind-stat-value">
                    {blindResults.submissionCount}
                  </div>
                </div>

                <div className="blind-stat-box">
                  <div className="blind-stat-label">Hints Used</div>
                  <div className="blind-stat-value" style={{ color: 'var(--accent-success)' }}>
                    {blindResults.hintsUsed} / 3
                  </div>
                </div>
              </div>

              <div style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '0.75rem 1rem',
                fontSize: '0.8rem',
                lineHeight: 1.5,
                marginTop: '0.75rem'
              }}>
                <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.2rem' }}>
                  Scoring Rule Breakdown:
                </div>
                <div style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', marginBottom: '0.45rem' }}>
                  {blindResults.scoreData.explanation}
                </div>
                <div style={{ color: 'var(--text-dim)', fontSize: '0.72rem', fontStyle: 'italic', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.4rem' }}>
                  {blindResults.scoreData.disclaimer}
                </div>
              </div>
            </div>
          )}
          {/* Execution Environment Status Banner */}
          {language === 'cpp' && isCppSupported ? (
            <div style={{
              padding: '0.75rem 1rem',
              background: 'rgba(134, 239, 172, 0.08)',
              border: '1px solid rgba(134, 239, 172, 0.3)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              fontSize: '0.8rem',
              color: 'var(--text-main)'
            }}>
              <ShieldCheck size={16} style={{ color: 'var(--accent-success)', flexShrink: 0 }} />
              <span>
                <strong>Real C++ Execution Active:</strong> Code compiles with GCC 10.2 and runs in a sandbox. Submissions are genuinely evaluated against real test cases.
              </span>
            </div>
          ) : (
            <div className="honest-demo-banner">
              <Info size={16} style={{ flexShrink: 0 }} />
              <span>
                <strong>Self-Reported Mode:</strong> JavaScript submissions are self-reported. Select C++ above for automated test execution.
              </span>
            </div>
          )}

          {/* Feedback Alert */}
          {alertMessage && (
            <div className={`attempt-feedback-alert ${alertMessage.type === 'success' ? 'alert-success' : 'alert-attempted'}`}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                {alertMessage.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                <span>{alertMessage.text}</span>
              </div>
              <button 
                onClick={() => setAlertMessage(null)}
                style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '1.1rem' }}
              >
                ×
              </button>
            </div>
          )}

          {/* Code Editor Card */}
          <div className="code-editor-card">
            <div className="editor-toolbar">
              <div className="editor-toolbar-left">
                <div className="window-dots">
                  <div className="window-dot" style={{ background: '#EF4444' }} />
                  <div className="window-dot" style={{ background: '#F59E0B' }} />
                  <div className="window-dot" style={{ background: '#10B981' }} />
                </div>
                <span className="editor-filename">
                  {language === 'cpp' ? 'solution.cpp' : 'solution.js'}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                {/* Language Selector */}
                <select
                  value={language}
                  onChange={(e) => handleLanguageSwitch(e.target.value)}
                  className="filter-select"
                  style={{
                    padding: '0.25rem 0.6rem',
                    fontSize: '0.75rem',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-medium)',
                    color: 'var(--text-main)',
                    borderRadius: 'var(--radius-sm)'
                  }}
                >
                  {isCppSupported && <option value="cpp">C++ (GCC 10.2)</option>}
                  <option value="javascript">JavaScript (Manual)</option>
                </select>

                <button 
                  onClick={handleResetCode}
                  className="btn btn-ghost btn-sm"
                  title="Reset to starter code"
                  style={{ padding: '0.25rem 0.5rem' }}
                >
                  <RotateCcw size={13} />
                </button>
              </div>
            </div>

            {/* Embedded Monaco Editor */}
            <CppCodeEditor
              value={code}
              onChange={handleCodeChange}
              language={language}
              height="380px"
            />
          </div>

          {/* Primary Action Buttons */}
          <div className="solver-actions-row">
            {language === 'cpp' && isCppSupported ? (
              <>
                <button 
                  onClick={handleRunAndSubmit}
                  className="btn btn-primary"
                  disabled={isExecuting}
                  style={{ flex: 1, padding: '0.75rem 1.25rem', fontSize: '0.925rem' }}
                >
                  {isExecuting ? (
                    <>
                      <Loader2 size={16} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
                      <span>Compiling & Running C++...</span>
                    </>
                  ) : (
                    <>
                      <Play size={16} fill="currentColor" />
                      <span>Run & Submit C++ Code</span>
                    </>
                  )}
                </button>

                <button 
                  onClick={handleRecordPracticeAttempt}
                  className="btn btn-ghost btn-sm"
                  disabled={isExecuting}
                  title="Record attempt without automatic test submission"
                >
                  <span>Log Practice</span>
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={handleRecordPracticeAttempt}
                  className="btn btn-secondary"
                >
                  <Send size={15} />
                  <span>Log Practice Attempt</span>
                </button>

                <button 
                  onClick={handleManualSolve}
                  className="btn btn-success"
                >
                  <CheckCircle2 size={16} />
                  <span>{isSolved ? 'Update / Re-verify Solved' : 'Mark as Solved'}</span>
                </button>
              </>
            )}
          </div>

          {/* Test Results Panel */}
          {(isExecuting || evaluationResult) && (
            <TestResultsPanel 
              evaluation={evaluationResult} 
              isRunning={isExecuting} 
            />
          )}

          {/* Cognitive Understanding & Reflection Panel */}
          <UnderstandingReflectionPanel
            problem={problem}
            evaluationResult={evaluationResult}
            isBlindMode={isBlindMode}
          />

          {/* Context-Aware AI Learning Coach */}
          <LearningCoachPanel
            problem={problem}
            code={code}
            evaluationResult={evaluationResult}
            isBlindMode={isBlindMode}
            onExitBlindMode={handleExitBlindChallenge}
            attemptHistory={getAttempts().filter(a => a.problemId === problem.id)}
          />

          {/* Next Recommended Navigation Callout if Solved */}
          {isSolved && recommendation && recommendation.problem && recommendation.problem.id !== problem.id && (
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-accent)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem'
            }}>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Next Adaptive Recommendation
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                  {recommendation.problem.title} ({recommendation.problem.topic})
                </div>
              </div>
              <button 
                onClick={() => onNavigateNext(recommendation.problem)}
                className="btn btn-primary btn-sm"
              >
                <span>Continue</span>
                <ArrowRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
