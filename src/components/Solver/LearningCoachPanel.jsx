import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Lightbulb, 
  HelpCircle, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  ArrowRight, 
  Loader2, 
  ShieldAlert, 
  RotateCcw,
  BookOpen,
  Cpu,
  BrainCircuit
} from 'lucide-react';
import { requestCoachGuidance } from '../../services/coachService.js';

export default function LearningCoachPanel({
  problem,
  code,
  evaluationResult,
  isBlindMode,
  onExitBlindMode,
  attemptHistory = []
}) {
  const [activeTab, setActiveTab] = useState('explain'); // 'explain' | 'hint' | 'test'
  const [loading, setLoading] = useState(false);
  const [coachResponse, setCoachResponse] = useState(null);
  const [currentHintLevel, setCurrentHintLevel] = useState(1);
  const [selectedQuizOption, setSelectedQuizOption] = useState(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Trigger coach fetch on tab change or when evaluationResult changes
  useEffect(() => {
    if (isBlindMode) {
      setCoachResponse(null);
      return;
    }
    fetchGuidance(activeTab, activeTab === 'hint' ? currentHintLevel : 1);
  }, [activeTab, evaluationResult, isBlindMode]);

  const fetchGuidance = async (action, hintLvl = 1) => {
    if (isBlindMode) return;
    setLoading(true);
    setErrorMsg(null);
    setSelectedQuizOption(null);
    setQuizSubmitted(false);

    try {
      const resp = await requestCoachGuidance({
        action,
        problem,
        userCode: code,
        submissionOutcome: evaluationResult,
        hintLevel: hintLvl,
        isBlindMode,
        attemptHistory
      });

      if (!resp.ok) {
        if (resp.blockedByBlindMode) {
          setErrorMsg(resp.message);
        } else {
          setErrorMsg(resp.message || 'Unable to load coach guidance.');
        }
        setCoachResponse(null);
      } else {
        setCoachResponse(resp);
      }
    } catch (err) {
      setErrorMsg(`Error contacting coach: ${err.message}`);
      setCoachResponse(null);
    } finally {
      setLoading(false);
    }
  };

  const handleNextHintLevel = () => {
    if (currentHintLevel < 3) {
      const nextLvl = currentHintLevel + 1;
      setCurrentHintLevel(nextLvl);
      fetchGuidance('hint', nextLvl);
    }
  };

  const handleResetHintLevel = () => {
    setCurrentHintLevel(1);
    fetchGuidance('hint', 1);
  };

  const handleQuizSelect = (idx) => {
    if (quizSubmitted) return;
    setSelectedQuizOption(idx);
    setQuizSubmitted(true);
  };

  const handleRetryQuiz = () => {
    setSelectedQuizOption(null);
    setQuizSubmitted(false);
    fetchGuidance('test', currentHintLevel);
  };

  // Blind Solve Guard UI
  if (isBlindMode) {
    return (
      <div className="card" style={{
        marginTop: '1.25rem',
        padding: '1.25rem',
        background: 'rgba(239, 68, 68, 0.04)',
        border: '1px solid rgba(239, 68, 68, 0.35)',
        borderRadius: 'var(--radius-lg)'
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
          <div style={{
            padding: '0.5rem',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(239, 68, 68, 0.15)',
            color: '#F87171'
          }}>
            <ShieldAlert size={20} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <h3 style={{ fontSize: '0.975rem', fontWeight: 800, margin: 0, color: '#F87171' }}>
                AI Learning Coach Disabled in Blind Solve Mode
              </h3>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
              Blind Challenge tests your independent algorithmic problem-solving. Progressive hints, root-cause explanations, and understanding checks are locked until you exit Blind Solve mode.
            </p>
            {onExitBlindMode && (
              <button
                onClick={onExitBlindMode}
                className="btn btn-secondary btn-sm"
                style={{
                  marginTop: '0.75rem',
                  fontSize: '0.75rem',
                  borderColor: 'rgba(239, 68, 68, 0.4)',
                  color: '#F87171'
                }}
              >
                Exit Blind Solve to Enable Coach
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const coachData = coachResponse?.data;
  const isAiSource = coachResponse?.source === 'ai';

  return (
    <div className="card" style={{
      marginTop: '1.25rem',
      padding: '1.25rem',
      background: 'var(--bg-card)',
      border: '1px solid var(--border-medium)',
      borderRadius: 'var(--radius-lg)'
    }}>
      {/* Coach Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem',
        marginBottom: '1rem',
        paddingBottom: '0.75rem',
        borderBottom: '1px solid var(--border-subtle)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, rgba(167, 139, 250, 0.25), rgba(99, 102, 241, 0.25))',
            color: 'var(--accent-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Sparkles size={18} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h3 style={{ fontSize: '0.975rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                Context-Aware AI Learning Coach
              </h3>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.675rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '9999px',
                background: isAiSource ? 'rgba(16, 185, 129, 0.15)' : 'rgba(99, 102, 241, 0.15)',
                color: isAiSource ? '#34D399' : '#818CF8',
                border: `1px solid ${isAiSource ? 'rgba(16, 185, 129, 0.3)' : 'rgba(99, 102, 241, 0.3)'}`
              }}>
                {isAiSource ? <Cpu size={10} /> : <BrainCircuit size={10} />}
                {isAiSource ? 'Live AI Mode' : 'Deterministic Mentor Mode'}
              </span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
              Socratic guidance tailored to your C++ code and submission outcome.
            </p>
          </div>
        </div>
      </div>

      {/* 3 Explicit Action Tabs */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '0.5rem',
        marginBottom: '1rem'
      }}>
        <button
          onClick={() => setActiveTab('explain')}
          className={`btn ${activeTab === 'explain' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.45rem',
            padding: '0.55rem 0.5rem',
            fontSize: '0.775rem',
            fontWeight: 700
          }}
        >
          <BookOpen size={14} />
          <span>Explain My Mistake</span>
        </button>

        <button
          onClick={() => setActiveTab('hint')}
          className={`btn ${activeTab === 'hint' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.45rem',
            padding: '0.55rem 0.5rem',
            fontSize: '0.775rem',
            fontWeight: 700
          }}
        >
          <Lightbulb size={14} />
          <span>Give Me a Hint (L{currentHintLevel})</span>
        </button>

        <button
          onClick={() => setActiveTab('test')}
          className={`btn ${activeTab === 'test' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.45rem',
            padding: '0.55rem 0.5rem',
            fontSize: '0.775rem',
            fontWeight: 700
          }}
        >
          <HelpCircle size={14} />
          <span>Test My Understanding</span>
        </button>
      </div>

      {/* Body Area */}
      {loading ? (
        <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', color: 'var(--accent-primary)', margin: '0 auto 0.65rem' }} />
          <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Analyzing C++ code and submission context...</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Evaluating mistakes and preparing pedagogical guidance</div>
        </div>
      ) : errorMsg ? (
        <div style={{
          padding: '0.85rem 1rem',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#F87171',
          fontSize: '0.825rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={15} />
            <span>{errorMsg}</span>
          </div>
        </div>
      ) : coachData ? (
        <div>
          {/* TAB 1: EXPLAIN MY MISTAKE */}
          {activeTab === 'explain' && (
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '0.65rem',
                flexWrap: 'wrap',
                gap: '0.5rem'
              }}>
                <div style={{ fontWeight: 800, fontSize: '0.925rem', color: 'var(--text-main)' }}>
                  {coachData.title || 'Mistake Analysis'}
                </div>
                {coachData.category && (
                  <span className="badge" style={{
                    fontSize: '0.7rem',
                    background: 'rgba(167, 139, 250, 0.15)',
                    color: 'var(--accent-primary)',
                    border: '1px solid rgba(167, 139, 250, 0.35)'
                  }}>
                    {coachData.category}
                  </span>
                )}
              </div>

              <p style={{ fontSize: '0.825rem', color: 'var(--text-main)', lineHeight: 1.6, marginBottom: '0.65rem' }}>
                {coachData.explanation}
              </p>

              {coachData.details && (
                <div style={{
                  padding: '0.75rem 0.95rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '0.8rem',
                  color: 'var(--text-muted)',
                  lineHeight: 1.55,
                  marginBottom: '0.75rem'
                }}>
                  {coachData.details}
                </div>
              )}

              {coachData.compilerSnippet && (
                <pre style={{
                  fontSize: '0.725rem',
                  fontFamily: 'var(--font-mono)',
                  padding: '0.65rem 0.85rem',
                  background: 'rgba(0, 0, 0, 0.35)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  color: '#F87171',
                  overflowX: 'auto',
                  marginBottom: '0.75rem'
                }}>
                  {coachData.compilerSnippet}
                </pre>
              )}

              {coachData.nextStep && (
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.65rem',
                  padding: '0.75rem 0.95rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  color: 'var(--text-main)',
                  fontSize: '0.8rem'
                }}>
                  <ArrowRight size={16} color="#34D399" style={{ marginTop: '2px', flexShrink: 0 }} />
                  <div>
                    <strong style={{ color: '#34D399' }}>Actionable Next Step: </strong>
                    {coachData.nextStep}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: GIVE ME A HINT (PROGRESSIVE) */}
          {activeTab === 'hint' && (
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '0.75rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="badge" style={{
                    background: 'rgba(245, 158, 11, 0.15)',
                    color: '#F59E0B',
                    border: '1px solid rgba(245, 158, 11, 0.35)',
                    fontSize: '0.725rem'
                  }}>
                    Level {coachData.level} of {coachData.maxLevel || 3}
                  </span>
                  <strong style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>
                    {coachData.title || (coachData.level === 1 ? 'Conceptual Nudge' : coachData.level === 2 ? 'Specific Approach' : 'Algorithmic Blueprint')}
                  </strong>
                </div>

                {currentHintLevel > 1 && (
                  <button
                    onClick={handleResetHintLevel}
                    className="btn btn-ghost btn-sm"
                    style={{ fontSize: '0.7rem', padding: '0.2rem 0.45rem' }}
                    title="Return to Level 1 conceptual nudge"
                  >
                    <RotateCcw size={11} /> Reset
                  </button>
                )}
              </div>

              <div style={{
                padding: '0.85rem 1rem',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-medium)',
                fontSize: '0.825rem',
                lineHeight: 1.6,
                color: 'var(--text-main)',
                marginBottom: '0.85rem'
              }}>
                {coachData.content}
              </div>

              {coachData.nudge && (
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.85rem', fontStyle: 'italic' }}>
                  {coachData.nudge}
                </p>
              )}

              {/* Progressive Hint Button */}
              {coachData.canProgress && currentHintLevel < 3 ? (
                <button
                  onClick={handleNextHintLevel}
                  className="btn btn-secondary"
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    border: '1px solid var(--border-accent)',
                    color: 'var(--accent-primary)',
                    fontSize: '0.8rem',
                    padding: '0.65rem'
                  }}
                >
                  <Lightbulb size={14} />
                  <span>Request Level {currentHintLevel + 1} Hint ({currentHintLevel === 1 ? 'More Specific Approach' : 'Algorithmic Blueprint'})</span>
                </button>
              ) : (
                <div style={{
                  textAlign: 'center',
                  fontSize: '0.75rem',
                  color: 'var(--text-dim)',
                  padding: '0.35rem'
                }}>
                  All progressive hint levels unlocked. Synthesize this blueprint into your C++ solution!
                </div>
              )}
            </div>
          )}

          {/* TAB 3: TEST MY UNDERSTANDING */}
          {activeTab === 'test' && (
            <div>
              <div style={{ marginBottom: '0.65rem' }}>
                <span className="badge" style={{
                  background: 'rgba(56, 189, 248, 0.15)',
                  color: '#38BDF8',
                  border: '1px solid rgba(56, 189, 248, 0.35)',
                  fontSize: '0.7rem',
                  marginBottom: '0.45rem',
                  display: 'inline-block'
                }}>
                  Misconception & Tracing Check
                </span>
                <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
                  {coachData.question}
                </div>
              </div>

              {/* Multiple Choice Options */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', marginBottom: '0.85rem' }}>
                {coachData.options?.map((opt, idx) => {
                  const isSelected = selectedQuizOption === idx;
                  const isCorrect = idx === coachData.correctIndex;

                  let borderColor = 'var(--border-subtle)';
                  let bg = 'var(--bg-surface)';
                  let textColor = 'var(--text-main)';

                  if (quizSubmitted) {
                    if (isCorrect) {
                      borderColor = 'rgba(16, 185, 129, 0.5)';
                      bg = 'rgba(16, 185, 129, 0.12)';
                      textColor = '#34D399';
                    } else if (isSelected && !isCorrect) {
                      borderColor = 'rgba(239, 68, 68, 0.5)';
                      bg = 'rgba(239, 68, 68, 0.12)';
                      textColor = '#F87171';
                    }
                  } else if (isSelected) {
                    borderColor = 'var(--accent-primary)';
                    bg = 'rgba(167, 139, 250, 0.1)';
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleQuizSelect(idx)}
                      disabled={quizSubmitted}
                      style={{
                        textAlign: 'left',
                        padding: '0.65rem 0.85rem',
                        borderRadius: 'var(--radius-md)',
                        background: bg,
                        border: `1px solid ${borderColor}`,
                        color: textColor,
                        fontSize: '0.8rem',
                        cursor: quizSubmitted ? 'default' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.65rem',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <span>{opt}</span>
                      {quizSubmitted && isCorrect && <CheckCircle2 size={16} color="#34D399" />}
                      {quizSubmitted && isSelected && !isCorrect && <XCircle size={16} color="#F87171" />}
                    </button>
                  );
                })}
              </div>

              {/* Feedback Explanation */}
              {quizSubmitted && (
                <div style={{
                  padding: '0.75rem 0.95rem',
                  borderRadius: 'var(--radius-md)',
                  background: selectedQuizOption === coachData.correctIndex ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                  border: `1px solid ${selectedQuizOption === coachData.correctIndex ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                  fontSize: '0.8rem',
                  lineHeight: 1.5,
                  marginBottom: '0.75rem'
                }}>
                  <strong style={{ color: selectedQuizOption === coachData.correctIndex ? '#34D399' : '#F59E0B' }}>
                    {selectedQuizOption === coachData.correctIndex ? '✓ Correct! ' : 'Notice: '}
                  </strong>
                  <span>{coachData.explanation}</span>
                </div>
              )}

              {quizSubmitted && (
                <button
                  onClick={handleRetryQuiz}
                  className="btn btn-ghost btn-sm"
                  style={{ fontSize: '0.75rem', width: '100%', border: '1px solid var(--border-subtle)' }}
                >
                  <RotateCcw size={12} />
                  <span>Try Another Check / Re-test</span>
                </button>
              )}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
