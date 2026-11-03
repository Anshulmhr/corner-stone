import React, { useState, useEffect } from 'react';
import { 
  BrainCircuit, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  ChevronDown, 
  ChevronUp, 
  RotateCcw, 
  Sparkles, 
  HelpCircle, 
  Info, 
  ShieldCheck, 
  ArrowRight,
  Clock,
  Layers,
  Cpu
} from 'lucide-react';
import { 
  assessProblemSolving, 
  getProblemComprehensionCheck 
} from '../../services/intelligenceEngine.js';
import { 
  getLatestAssessment, 
  saveUnderstandingAssessment, 
  getReflectionDraft, 
  saveReflectionDraft,
  getAttempts,
  getUnlockedHints
} from '../../services/storage.js';

export default function UnderstandingReflectionPanel({
  problem,
  evaluationResult = null,
  isBlindMode = false,
  onAssessmentUpdated = null
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [approachExplanation, setApproachExplanation] = useState('');
  const [statedTimeComplexity, setStatedTimeComplexity] = useState('');
  const [statedSpaceComplexity, setStatedSpaceComplexity] = useState('');
  const [complexityReasoning, setComplexityReasoning] = useState('');
  const [selectedQuizOption, setSelectedQuizOption] = useState(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [assessment, setAssessment] = useState(null);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  const comprehensionQuestion = problem ? getProblemComprehensionCheck(problem.id) : null;

  // Load drafts and existing assessment when problem changes
  useEffect(() => {
    if (!problem) return;

    // Load saved assessment
    const existing = getLatestAssessment(problem.id);
    setAssessment(existing);

    // Load reflection draft
    const draft = getReflectionDraft(problem.id);
    if (draft) {
      setApproachExplanation(draft.approachExplanation || '');
      setStatedTimeComplexity(draft.statedTimeComplexity || '');
      setStatedSpaceComplexity(draft.statedSpaceComplexity || '');
      setComplexityReasoning(draft.complexityReasoning || '');
      if (draft.selectedQuizOption !== undefined && draft.selectedQuizOption !== null) {
        setSelectedQuizOption(draft.selectedQuizOption);
        setQuizSubmitted(Boolean(draft.quizSubmitted));
      } else {
        setSelectedQuizOption(null);
        setQuizSubmitted(false);
      }
    } else {
      setApproachExplanation('');
      setStatedTimeComplexity('');
      setStatedSpaceComplexity('');
      setComplexityReasoning('');
      setSelectedQuizOption(null);
      setQuizSubmitted(false);
    }

    setFeedbackMsg(null);
  }, [problem?.id]);

  // Persist draft changes
  const updateDraft = (updates) => {
    if (!problem) return;
    const currentDraft = {
      approachExplanation,
      statedTimeComplexity,
      statedSpaceComplexity,
      complexityReasoning,
      selectedQuizOption,
      quizSubmitted,
      ...updates
    };
    saveReflectionDraft(problem.id, currentDraft);
  };

  const handleApproachChange = (val) => {
    setApproachExplanation(val);
    updateDraft({ approachExplanation: val });
  };

  const handleTimeChange = (val) => {
    setStatedTimeComplexity(val);
    updateDraft({ statedTimeComplexity: val });
  };

  const handleSpaceChange = (val) => {
    setStatedSpaceComplexity(val);
    updateDraft({ statedSpaceComplexity: val });
  };

  const handleReasoningChange = (val) => {
    setComplexityReasoning(val);
    updateDraft({ complexityReasoning: val });
  };

  const handleQuizSelect = (idx) => {
    if (quizSubmitted) return;
    setSelectedQuizOption(idx);
    setQuizSubmitted(true);
    updateDraft({ selectedQuizOption: idx, quizSubmitted: true });
  };

  const handleResetDraft = () => {
    if (!problem) return;
    setApproachExplanation('');
    setStatedTimeComplexity('');
    setStatedSpaceComplexity('');
    setComplexityReasoning('');
    setSelectedQuizOption(null);
    setQuizSubmitted(false);
    updateDraft({
      approachExplanation: '',
      statedTimeComplexity: '',
      statedSpaceComplexity: '',
      complexityReasoning: '',
      selectedQuizOption: null,
      quizSubmitted: false
    });
    setFeedbackMsg(null);
  };

  // Run assessment
  const handleAssessUnderstanding = () => {
    if (!problem) return;

    const problemAttempts = getAttempts().filter(a => a.problemId === problem.id);
    const hintsUnlocked = getUnlockedHints(problem.id);

    // Build comprehension check evidence if question was answered
    let comprehensionEvidence = null;
    if (comprehensionQuestion && quizSubmitted && selectedQuizOption !== null) {
      comprehensionEvidence = {
        questionId: comprehensionQuestion.id,
        answered: true,
        isCorrect: selectedQuizOption === comprehensionQuestion.correctIndex
      };
    }

    // Assemble observed evidence object
    const evidence = {
      submissionStatus: evaluationResult?.status || null,
      testsPassed: evaluationResult?.passedCount ?? null,
      totalTests: evaluationResult?.totalCount ?? null,
      executionTimeMs: evaluationResult?.executionTimeMs ?? null,
      mistakeCategory: evaluationResult?.diagnosis?.category || null,
      hintsUnlocked,
      attemptCount: problemAttempts.length,
      isBlindSolve,
      statedTimeComplexity: statedTimeComplexity.trim() || null,
      statedSpaceComplexity: statedSpaceComplexity.trim() || null,
      complexityReasoning: complexityReasoning.trim() || null,
      approachExplanation: approachExplanation.trim() || null,
      comprehensionCheck: comprehensionEvidence
    };

    const newAssessment = assessProblemSolving({
      problemId: problem.id,
      problemTitle: problem.title,
      topic: problem.topic,
      difficulty: problem.difficulty,
      evidence
    });

    saveUnderstandingAssessment(newAssessment);
    setAssessment(newAssessment);
    setFeedbackMsg('Assessment evaluated and saved across all 5 dimensions.');

    if (onAssessmentUpdated) {
      onAssessmentUpdated(newAssessment);
    }
  };

  if (!problem) return null;

  return (
    <div 
      className="card"
      style={{
        marginTop: '1.25rem',
        padding: '0',
        overflow: 'hidden',
        border: '1px solid var(--border-medium)',
        background: 'var(--bg-card)'
      }}
    >
      {/* Collapsible Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem 1.25rem',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          color: 'var(--text-main)',
          gap: '1rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(99, 102, 241, 0.12)',
              color: 'var(--accent-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <BrainCircuit size={18} />
          </div>

          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                Cognitive Understanding & Reflection
              </span>
              {assessment && assessment.overallSummary && (
                <span
                  style={{
                    fontSize: '0.725rem',
                    padding: '0.15rem 0.5rem',
                    borderRadius: '999px',
                    fontWeight: 600,
                    background: assessment.overallSummary.compositeScore !== null
                      ? 'rgba(16, 185, 129, 0.12)'
                      : 'rgba(239, 68, 68, 0.1)',
                    color: assessment.overallSummary.compositeScore !== null
                      ? '#10B981'
                      : '#EF4444'
                  }}
                >
                  {assessment.overallSummary.compositeScore !== null
                    ? `Assessed: ${assessment.overallSummary.compositeScore}/100`
                    : 'Insufficient Evidence'}
                </span>
              )}
            </div>
            <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
              Optional • Explain your approach and complexity to evaluate understanding across 5 dimensions
            </div>
          </div>
        </div>

        <div style={{ color: 'var(--text-muted)', flexShrink: 0 }}>
          {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </button>

      {/* Collapsible Content */}
      {isOpen && (
        <div style={{ padding: '0 1.25rem 1.25rem', borderTop: '1px solid var(--border-subtle)' }}>
          {/* Informational Callout */}
          <div
            style={{
              marginTop: '1rem',
              marginBottom: '1rem',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(99, 102, 241, 0.05)',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              fontSize: '0.8rem',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.65rem'
            }}
          >
            <Info size={15} style={{ color: 'var(--accent-primary)', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong>Formative Reflection:</strong> Providing your approach and complexity reasoning enriches your assessment profile. It is entirely optional and never restricts code compilation or test submissions.
            </div>
          </div>

          {/* Form Fields */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            {/* Approach Text */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Your Algorithmic Approach & Key Invariant (Own Words)
              </label>
              <textarea
                value={approachExplanation}
                onChange={(e) => handleApproachChange(e.target.value)}
                placeholder="Explain how your solution works, what data structure was chosen, and how you handle state transitions (e.g., using a hash map to look up target - num in a single pass)..."
                rows={3}
                style={{
                  width: '100%',
                  background: 'var(--bg-main)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.6rem 0.75rem',
                  color: 'var(--text-main)',
                  fontSize: '0.85rem',
                  fontFamily: 'inherit',
                  resize: 'vertical'
                }}
              />
            </div>

            {/* Complexity Dropdowns */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Expected Time Complexity
                </label>
                <select
                  value={statedTimeComplexity}
                  onChange={(e) => handleTimeChange(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'var(--bg-main)',
                    border: '1px solid var(--border-medium)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.55rem 0.65rem',
                    color: 'var(--text-main)',
                    fontSize: '0.825rem'
                  }}
                >
                  <option value="">-- Select Time Complexity --</option>
                  <option value="O(1)">O(1) - Constant Time</option>
                  <option value="O(log n)">O(log n) - Logarithmic Time</option>
                  <option value="O(n)">O(n) - Linear Time</option>
                  <option value="O(n log n)">O(n log n) - Linearithmic Time</option>
                  <option value="O(n^2)">O(n²) - Quadratic Time</option>
                  <option value="O(2^n)">O(2ⁿ) - Exponential Time</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Expected Auxiliary Space Complexity
                </label>
                <select
                  value={statedSpaceComplexity}
                  onChange={(e) => handleSpaceChange(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'var(--bg-main)',
                    border: '1px solid var(--border-medium)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.55rem 0.65rem',
                    color: 'var(--text-main)',
                    fontSize: '0.825rem'
                  }}
                >
                  <option value="">-- Select Space Complexity --</option>
                  <option value="O(1)">O(1) - Constant Auxiliary Space</option>
                  <option value="O(log n)">O(log n) - Logarithmic Call Stack</option>
                  <option value="O(h)">O(h) - Tree Height Recursion Stack</option>
                  <option value="O(n)">O(n) - Linear Auxiliary Space (Map/Array)</option>
                  <option value="O(n^2)">O(n²) - Quadratic Space</option>
                </select>
              </div>
            </div>

            {/* Complexity Reasoning */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Complexity Reasoning & Structural Justification
              </label>
              <textarea
                value={complexityReasoning}
                onChange={(e) => handleReasoningChange(e.target.value)}
                placeholder="Why does your solution achieve this time and space? (e.g., iterates through n elements once with O(1) hash map operations, requiring O(n) memory to store seen values)..."
                rows={2}
                style={{
                  width: '100%',
                  background: 'var(--bg-main)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.6rem 0.75rem',
                  color: 'var(--text-main)',
                  fontSize: '0.85rem',
                  fontFamily: 'inherit',
                  resize: 'vertical'
                }}
              />
            </div>

            {/* Comprehension Check (if available) */}
            {comprehensionQuestion && (
              <div 
                style={{
                  padding: '0.85rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-card-hover)',
                  border: '1px solid var(--border-subtle)',
                  marginTop: '0.25rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.5rem' }}>
                  <HelpCircle size={15} style={{ color: 'var(--accent-secondary)' }} />
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-secondary)' }}>
                    Comprehension & Tracing Check
                  </span>
                </div>

                <p style={{ fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.75rem', color: 'var(--text-main)' }}>
                  {comprehensionQuestion.question}
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  {comprehensionQuestion.options.map((opt, idx) => {
                    const isSelected = selectedQuizOption === idx;
                    const isCorrect = idx === comprehensionQuestion.correctIndex;

                    let bg = 'var(--bg-main)';
                    let border = 'var(--border-medium)';
                    let color = 'var(--text-main)';

                    if (quizSubmitted) {
                      if (isCorrect) {
                        bg = 'rgba(16, 185, 129, 0.12)';
                        border = '#10B981';
                        color = '#10B981';
                      } else if (isSelected) {
                        bg = 'rgba(239, 68, 68, 0.12)';
                        border = '#EF4444';
                        color = '#EF4444';
                      }
                    } else if (isSelected) {
                      border = 'var(--accent-primary)';
                    }

                    return (
                      <button
                        key={idx}
                        onClick={() => handleQuizSelect(idx)}
                        disabled={quizSubmitted}
                        style={{
                          textAlign: 'left',
                          padding: '0.55rem 0.8rem',
                          borderRadius: 'var(--radius-sm)',
                          background: bg,
                          border: `1px solid ${border}`,
                          color: color,
                          fontSize: '0.8rem',
                          cursor: quizSubmitted ? 'default' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <span style={{ fontWeight: 700, opacity: 0.8 }}>
                          {String.fromCharCode(65 + idx)}.
                        </span>
                        <span style={{ flex: 1 }}>{opt}</span>
                        {quizSubmitted && isCorrect && <CheckCircle2 size={15} style={{ color: '#10B981', flexShrink: 0 }} />}
                        {quizSubmitted && isSelected && !isCorrect && <XCircle size={15} style={{ color: '#EF4444', flexShrink: 0 }} />}
                      </button>
                    );
                  })}
                </div>

                {quizSubmitted && comprehensionQuestion.explanation && (
                  <div
                    style={{
                      marginTop: '0.75rem',
                      padding: '0.5rem 0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      background: selectedQuizOption === comprehensionQuestion.correctIndex
                        ? 'rgba(16, 185, 129, 0.08)'
                        : 'rgba(239, 68, 68, 0.08)',
                      fontSize: '0.775rem',
                      color: selectedQuizOption === comprehensionQuestion.correctIndex ? '#10B981' : '#EF4444'
                    }}
                  >
                    <strong>{selectedQuizOption === comprehensionQuestion.correctIndex ? 'Correct: ' : 'Explanation: '}</strong>
                    {comprehensionQuestion.explanation}
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginTop: '0.25rem' }}>
              <button
                onClick={handleAssessUnderstanding}
                className="btn btn-primary btn-sm"
                style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
              >
                <BrainCircuit size={15} />
                <span>Evaluate Cognitive Understanding</span>
              </button>

              <button
                onClick={handleResetDraft}
                className="btn btn-ghost btn-sm"
                style={{ fontSize: '0.775rem' }}
                title="Clear current reflection draft"
              >
                <RotateCcw size={13} />
                <span>Reset Draft</span>
              </button>

              {feedbackMsg && (
                <span style={{ fontSize: '0.775rem', color: '#10B981', fontWeight: 600 }}>
                  ✓ {feedbackMsg}
                </span>
              )}
            </div>
          </div>

          {/* Assessment Scorecard Display */}
          {assessment && (
            <div
              style={{
                marginTop: '1.5rem',
                borderTop: '1px solid var(--border-medium)',
                paddingTop: '1.25rem'
              }}
            >
              {/* Overall Summary Bar */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.85rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-main)',
                  border: '1px solid var(--border-medium)',
                  marginBottom: '1rem',
                  flexWrap: 'wrap',
                  gap: '0.75rem'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.725rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Composite Cognitive Assessment
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.2rem' }}>
                    <span style={{ fontSize: '1.4rem', fontWeight: 800 }}>
                      {assessment.overallSummary?.compositeScore !== null
                        ? `${assessment.overallSummary.compositeScore}/100`
                        : 'Insufficient Data'}
                    </span>
                    <span 
                      style={{ 
                        fontSize: '0.75rem', 
                        padding: '0.15rem 0.5rem', 
                        borderRadius: '999px',
                        fontWeight: 600,
                        background: assessment.overallSummary?.evidenceReliability === 'established'
                          ? 'rgba(16, 185, 129, 0.12)'
                          : assessment.overallSummary?.evidenceReliability === 'moderate'
                          ? 'rgba(245, 158, 11, 0.12)'
                          : 'rgba(239, 68, 68, 0.1)',
                        color: assessment.overallSummary?.evidenceReliability === 'established'
                          ? '#10B981'
                          : assessment.overallSummary?.evidenceReliability === 'moderate'
                          ? '#F59E0B'
                          : '#EF4444'
                      }}
                    >
                      {assessment.overallSummary?.evidenceReliability?.toUpperCase()} EVIDENCE ({assessment.overallSummary?.availableDimensionsCount || 0}/5 dimensions)
                    </span>
                  </div>
                </div>

                <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', maxWidth: '380px' }}>
                  {assessment.overallSummary?.calculationBasis}
                </div>
              </div>

              {/* 5 Separate Dimensions Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                  gap: '0.85rem',
                  marginBottom: '1rem'
                }}
              >
                {/* 1. Implementation Ability */}
                <DimensionCard 
                  dimension={assessment.dimensions.implementationAbility}
                  icon={<Cpu size={15} />}
                />

                {/* 2. Independence */}
                <DimensionCard 
                  dimension={assessment.dimensions.independence}
                  icon={<ShieldCheck size={15} />}
                />

                {/* 3. Complexity Analysis */}
                <DimensionCard 
                  dimension={assessment.dimensions.complexityAnalysis}
                  icon={<Clock size={15} />}
                />

                {/* 4. Conceptual Understanding */}
                <DimensionCard 
                  dimension={assessment.dimensions.conceptualUnderstanding}
                  icon={<BrainCircuit size={15} />}
                />

                {/* 5. Algorithm Selection */}
                <DimensionCard 
                  dimension={assessment.dimensions.algorithmSelection}
                  icon={<Layers size={15} />}
                />
              </div>

              {/* Recommended Action Banner */}
              {assessment.recommendedAction && (
                <div
                  style={{
                    padding: '1rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-main)',
                    border: '1px solid var(--border-accent)',
                    marginBottom: '1rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                    <Sparkles size={15} style={{ color: 'var(--accent-primary)' }} />
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Recommended Action: {assessment.recommendedAction.badge}
                    </span>
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                    {assessment.recommendedAction.reason}
                  </div>
                  <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                    <strong>Goal:</strong> {assessment.recommendedAction.pedagogicalObjective}
                  </div>
                </div>
              )}

              {/* Academic Disclaimer Callout */}
              <div
                style={{
                  fontSize: '0.725rem',
                  color: 'var(--text-muted)',
                  borderTop: '1px solid var(--border-subtle)',
                  paddingTop: '0.65rem',
                  fontStyle: 'italic',
                  lineHeight: 1.4
                }}
              >
                * {assessment.disclaimer}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Sub-component: Individual Dimension Card ─────────────────────────────────
function DimensionCard({ dimension, icon }) {
  if (!dimension) return null;

  const isInsufficient = dimension.status === 'insufficient_evidence';
  const isEstimate = dimension.evidenceType?.includes('ESTIMATED');

  return (
    <div
      style={{
        padding: '0.85rem',
        borderRadius: 'var(--radius-sm)',
        background: 'var(--bg-main)',
        border: `1px solid ${isInsufficient ? 'var(--border-subtle)' : 'var(--border-medium)'}`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
      }}
    >
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.4rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.825rem', fontWeight: 700 }}>
            <span style={{ color: 'var(--accent-primary)' }}>{icon}</span>
            <span>{dimension.dimension}</span>
          </div>
          <span
            style={{
              fontSize: '0.65rem',
              padding: '0.1rem 0.4rem',
              borderRadius: '999px',
              fontWeight: 600,
              background: isEstimate ? 'rgba(99, 102, 241, 0.12)' : 'rgba(16, 185, 129, 0.1)',
              color: isEstimate ? 'var(--accent-primary)' : '#10B981'
            }}
          >
            {isEstimate ? 'ESTIMATE' : 'TELEMETRY'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.4rem' }}>
          <span style={{ fontSize: '1.25rem', fontWeight: 800 }}>
            {dimension.score !== null ? `${dimension.score}/100` : '—'}
          </span>
          <span
            style={{
              fontSize: '0.725rem',
              fontWeight: 600,
              color: isInsufficient
                ? 'var(--text-muted)'
                : dimension.score >= 80
                ? '#10B981'
                : dimension.score >= 60
                ? '#F59E0B'
                : '#EF4444'
            }}
          >
            {dimension.tier}
          </span>
        </div>

        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', lineHeight: 1.35 }}>
          {dimension.calculation}
        </div>
      </div>

      <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.35rem', opacity: 0.8 }}>
        {dimension.limitationNote}
      </div>
    </div>
  );
}
