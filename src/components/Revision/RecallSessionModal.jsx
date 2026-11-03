import React, { useState } from 'react';
import { 
  Brain, 
  X, 
  CheckCircle2, 
  HelpCircle, 
  XCircle, 
  Lightbulb, 
  Lock, 
  Unlock, 
  RotateCcw,
  Sparkles,
  Clock,
  ShieldCheck
} from 'lucide-react';
import { recordRevisionOutcome, SPACED_INTERVALS } from '../../services/revisionService.js';
import { getUnlockedHints } from '../../services/storage.js';

export default function RecallSessionModal({ 
  revisionItem, 
  onClose, 
  onOutcomeRecorded 
}) {
  if (!revisionItem || !revisionItem.problem) return null;

  const { problem, stage = 1, intervalDays = 1, daysOverdue = 0 } = revisionItem;
  const [draftCode, setDraftCode] = useState(problem.starterCode);
  const [hintsRevealed, setHintsRevealed] = useState(false);
  const [unlockedHintsCount] = useState(() => getUnlockedHints(problem.id));

  const nextStage = Math.min(5, stage + 1);
  const nextIntervalDays = SPACED_INTERVALS[nextStage - 1];

  const handleRecord = (outcome) => {
    recordRevisionOutcome(problem.id, outcome);
    if (onOutcomeRecorded) onOutcomeRecorded(outcome);
    onClose();
  };

  const difficultyClass = problem.difficulty === 'Easy' 
    ? 'badge-easy' 
    : problem.difficulty === 'Medium' 
    ? 'badge-medium' 
    : 'badge-hard';

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.82)',
      backdropFilter: 'blur(8px)',
      zIndex: 110,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.25rem'
    }}>
      <div 
        className="card" 
        style={{ 
          maxWidth: '820px', 
          width: '100%', 
          maxHeight: '92vh', 
          overflowY: 'auto', 
          padding: '2rem',
          border: '1px solid var(--border-accent)',
          boxShadow: '0 0 32px -4px var(--accent-primary-glow)'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.25rem', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <span className="badge" style={{ background: 'var(--accent-primary-dim)', color: 'var(--accent-primary)', border: '1px solid var(--border-accent)' }}>
                <Brain size={13} />
                <span>Active Recall Revision • Stage {stage} of 5</span>
              </span>
              {daysOverdue > 0 && (
                <span className="badge badge-hard">
                  Overdue by {daysOverdue} day(s)
                </span>
              )}
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{problem.title}</h2>
          </div>

          <button 
            onClick={onClose} 
            className="btn btn-ghost btn-sm"
            style={{ padding: '0.4rem' }}
            aria-label="Close Recall Session"
          >
            <X size={18} />
          </button>
        </div>

        {/* Cognitive Recall Instructions */}
        <div style={{
          padding: '0.85rem 1.15rem',
          background: 'rgba(103, 232, 249, 0.08)',
          border: '1px solid rgba(103, 232, 249, 0.25)',
          borderRadius: 'var(--radius-md)',
          fontSize: '0.875rem',
          color: 'var(--text-main)',
          marginBottom: '1.25rem',
          lineHeight: 1.5
        }}>
          <strong style={{ color: 'var(--accent-secondary)' }}>Recall-First Protocol: </strong>
          Attempt to reconstruct the core algorithm and edge cases from memory without looking at past notes or hints. When finished, honestly select your recall outcome below.
        </div>

        {/* Problem Summary & Constraints */}
        <div style={{ background: 'var(--bg-surface)', padding: '1rem 1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <span className={`badge ${difficultyClass}`}>{problem.difficulty}</span>
            <span className="badge badge-topic">{problem.topic}</span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.55 }}>
            {problem.summary || problem.description.slice(0, 220) + '...'}
          </p>
        </div>

        {/* Active Recall Code Area */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Memory Scratchpad (JavaScript)
            </span>
            <button 
              onClick={() => setDraftCode(problem.starterCode)} 
              className="btn btn-ghost btn-sm"
              style={{ fontSize: '0.725rem', padding: '0.2rem 0.5rem' }}
            >
              <RotateCcw size={12} />
              Reset Code
            </button>
          </div>
          <textarea
            className="editor-textarea"
            style={{ height: '180px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}
            value={draftCode}
            onChange={(e) => setDraftCode(e.target.value)}
            placeholder="// Try to write the solution from memory..."
            spellCheck="false"
          />
        </div>

        {/* Optional Hint Peek Section */}
        <div style={{ marginBottom: '1.75rem', border: '1px dashed var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '0.85rem 1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.825rem', color: 'var(--text-muted)' }}>
              <Lightbulb size={15} color="var(--accent-warning)" />
              <span>Need assistance? Revealing hints will count as <em>"Solved with hints"</em>.</span>
            </div>
            <button 
              onClick={() => setHintsRevealed(prev => !prev)}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem' }}
            >
              {hintsRevealed ? <Unlock size={13} /> : <Lock size={13} />}
              <span>{hintsRevealed ? 'Hide Hints' : 'Peek at Hint 1'}</span>
            </button>
          </div>

          {hintsRevealed && (
            <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', fontSize: '0.825rem', color: 'var(--text-main)', border: '1px solid rgba(167, 139, 250, 0.25)' }}>
              <strong>Hint 1 (Conceptual): </strong>
              {problem.hints && problem.hints[0] ? problem.hints[0].content : 'Think through the fundamental data structure properties.'}
            </div>
          )}
        </div>

        {/* Honest Recall Outcome Buttons */}
        <div>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.65rem' }}>
            Record Your Honest Recall Outcome
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
            {/* Option A: Solved Independently */}
            <button
              onClick={() => handleRecord('independent')}
              className="btn"
              style={{
                background: 'rgba(134, 239, 172, 0.12)',
                border: '1px solid rgba(134, 239, 172, 0.35)',
                color: '#86EFAC',
                flexDirection: 'column',
                alignItems: 'flex-start',
                padding: '0.85rem 1rem',
                textAlign: 'left'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, fontSize: '0.9rem' }}>
                <CheckCircle2 size={16} />
                <span>Solved Independently</span>
              </div>
              <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Full recall. Advance to Stage {nextStage} ({nextIntervalDays}d interval).
              </span>
            </button>

            {/* Option B: Solved with Hints */}
            <button
              onClick={() => handleRecord('with_hints')}
              className="btn"
              style={{
                background: 'rgba(253, 224, 71, 0.1)',
                border: '1px solid rgba(253, 224, 71, 0.35)',
                color: '#FDE047',
                flexDirection: 'column',
                alignItems: 'flex-start',
                padding: '0.85rem 1rem',
                textAlign: 'left'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, fontSize: '0.9rem' }}>
                <HelpCircle size={16} />
                <span>Solved with Hints</span>
              </div>
              <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Needed a nudge. Reset to Stage 1 (1d retry) to reinforce.
              </span>
            </button>

            {/* Option C: Could Not Solve */}
            <button
              onClick={() => handleRecord('failed')}
              className="btn"
              style={{
                background: 'rgba(252, 165, 165, 0.1)',
                border: '1px solid rgba(252, 165, 165, 0.35)',
                color: '#FCA5A5',
                flexDirection: 'column',
                alignItems: 'flex-start',
                padding: '0.85rem 1rem',
                textAlign: 'left'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, fontSize: '0.9rem' }}>
                <XCircle size={16} />
                <span>Could Not Solve</span>
              </div>
              <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Forgot approach. Reset to Stage 1 (1d retry).
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
