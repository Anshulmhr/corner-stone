import React, { useState } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  Terminal, 
  Shield, 
  Loader2,
  ChevronRight,
  Code,
  Sparkles,
  Lightbulb
} from 'lucide-react';

function getCategoryTheme(cat) {
  switch (cat) {
    case 'EDGE_CASE_FAILURE':
      return {
        border: 'rgba(129, 140, 248, 0.4)',
        bg: 'rgba(129, 140, 248, 0.1)',
        color: '#818CF8',
        accent: '#818CF8'
      };
    case 'BOUNDARY_ERROR':
      return {
        border: 'rgba(251, 191, 36, 0.4)',
        bg: 'rgba(251, 191, 36, 0.1)',
        color: '#FBBF24',
        accent: '#FBBF24'
      };
    case 'COMPILATION_ERROR':
    case 'RUNTIME_ERROR':
      return {
        border: 'rgba(248, 113, 113, 0.4)',
        bg: 'rgba(248, 113, 113, 0.1)',
        color: '#F87171',
        accent: '#F87171'
      };
    case 'OUTPUT_FORMAT_ERROR':
      return {
        border: 'rgba(56, 189, 248, 0.4)',
        bg: 'rgba(56, 189, 248, 0.1)',
        color: '#38BDF8',
        accent: '#38BDF8'
      };
    case 'TLE':
      return {
        border: 'rgba(250, 204, 21, 0.4)',
        bg: 'rgba(250, 204, 21, 0.1)',
        color: '#FACC15',
        accent: '#FACC15'
      };
    case 'LOGIC_ERROR':
    case 'PARTIAL_LOGIC_ERROR':
    default:
      return {
        border: 'rgba(244, 63, 94, 0.4)',
        bg: 'rgba(244, 63, 94, 0.1)',
        color: '#FB7185',
        accent: '#FB7185'
      };
  }
}

export default function TestResultsPanel({ 
  evaluation, 
  isRunning 
}) {
  const [selectedCaseIdx, setSelectedCaseIdx] = useState(0);

  if (isRunning) {
    return (
      <div className="card" style={{ padding: '1.75rem', textAlign: 'center', background: 'var(--bg-card)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
          <Loader2 size={24} style={{ color: 'var(--accent-primary)', animation: 'spin 1s linear infinite' }} />
          <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
            Compiling and Executing C++ Solution...
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', maxWidth: '420px' }}>
            Sending source to secure GCC 10.2 sandbox, running all test cases, and evaluating output correctness.
          </p>
        </div>
      </div>
    );
  }

  if (!evaluation) return null;

  const {
    status,
    passedCount = 0,
    totalCount = 0,
    results = [],
    compilerError,
    runtimeError,
    executionTimeMs = 0,
    message,
    diagnosis
  } = evaluation;

  // Selected test case details
  const activeCase = results && results.length > selectedCaseIdx ? results[selectedCaseIdx] : results[0];

  return (
    <div className="card" style={{ padding: '1.25rem 1.5rem', background: 'var(--bg-card)', border: '1px solid var(--border-medium)' }}>
      {/* Status Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          {status === 'ACCEPTED' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: 'var(--accent-success)', fontWeight: 800, fontSize: '1.15rem' }}>
              <CheckCircle2 size={20} />
              <span>Accepted</span>
            </div>
          ) : status === 'WRONG_ANSWER' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#FCA5A5', fontWeight: 800, fontSize: '1.15rem' }}>
              <XCircle size={20} />
              <span>Wrong Answer</span>
            </div>
          ) : status === 'COMPILATION_ERROR' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#F87171', fontWeight: 800, fontSize: '1.15rem' }}>
              <AlertTriangle size={20} />
              <span>Compilation Error</span>
            </div>
          ) : status === 'RUNTIME_ERROR' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#F87171', fontWeight: 800, fontSize: '1.15rem' }}>
              <AlertTriangle size={20} />
              <span>Runtime Error</span>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: 'var(--text-muted)', fontWeight: 700 }}>
              <AlertTriangle size={18} />
              <span>{status}</span>
            </div>
          )}

          {totalCount > 0 && (
            <span className="badge" style={{ 
              background: status === 'ACCEPTED' ? 'var(--accent-success-dim)' : 'rgba(252, 165, 165, 0.1)', 
              color: status === 'ACCEPTED' ? 'var(--accent-success)' : '#FCA5A5',
              fontFamily: 'var(--font-mono)',
              fontWeight: 700 
            }}>
              {passedCount} / {totalCount} Test Cases Passed
            </span>
          )}
        </div>

        {executionTimeMs > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
            <Clock size={13} />
            <span>{executionTimeMs} ms</span>
          </div>
        )}
      </div>

      {/* User Friendly Message (e.g. Empty Submission) */}
      {message && (
        <div style={{ padding: '0.75rem 1rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
          {message}
        </div>
      )}

      {/* Mistake Diagnosis Panel */}
      {diagnosis && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid var(--border-medium)',
          borderLeft: `4px solid ${getCategoryTheme(diagnosis.category).accent}`,
          borderRadius: 'var(--radius-md)',
          padding: '1rem 1.15rem',
          marginBottom: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.65rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '6px',
                background: getCategoryTheme(diagnosis.category).bg,
                color: getCategoryTheme(diagnosis.category).accent,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Sparkles size={14} />
              </div>
              <span style={{
                fontSize: '0.75rem',
                fontWeight: 800,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--text-dim)'
              }}>
                Mistake Diagnosis
              </span>
            </div>

            <span className="badge" style={{
              background: getCategoryTheme(diagnosis.category).bg,
              color: getCategoryTheme(diagnosis.category).color,
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '0.2rem 0.6rem',
              borderRadius: '999px',
              border: `1px solid ${getCategoryTheme(diagnosis.category).border}`
            }}>
              {diagnosis.label}
            </span>
          </div>

          <p style={{
            fontSize: '0.85rem',
            color: 'var(--text-main)',
            lineHeight: 1.55,
            margin: 0
          }}>
            {diagnosis.explanation}
          </p>

          {diagnosis.nextStep && (
            <div style={{
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.65rem 0.85rem',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.55rem'
            }}>
              <Lightbulb size={15} style={{ color: '#FBBF24', flexShrink: 0, marginTop: '2px' }} />
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                <strong style={{ color: 'var(--text-main)', marginRight: '4px' }}>Recommended Next Step:</strong>
                {diagnosis.nextStep}
              </div>
            </div>
          )}

          {diagnosis.historyNote && (
            <div style={{
              fontSize: '0.75rem',
              color: '#FCA5A5',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              marginTop: '2px'
            }}>
              <AlertTriangle size={13} style={{ flexShrink: 0 }} />
              <span>{diagnosis.historyNote}</span>
            </div>
          )}
        </div>
      )}

      {/* Compilation Error Display */}
      {status === 'COMPILATION_ERROR' && compilerError && (
        <div style={{ background: '#0E0E17', border: '1px solid rgba(248, 113, 113, 0.35)', borderRadius: 'var(--radius-md)', padding: '1rem', overflowX: 'auto', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#F87171', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            <Terminal size={14} />
            <span>GCC Compiler Output</span>
          </div>
          <pre style={{ color: '#FCA5A5', fontSize: '0.775rem', fontFamily: 'var(--font-mono)', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
            {compilerError}
          </pre>
        </div>
      )}

      {/* Runtime Error Display */}
      {status === 'RUNTIME_ERROR' && runtimeError && (
        <div style={{ background: '#0E0E17', border: '1px solid rgba(248, 113, 113, 0.35)', borderRadius: 'var(--radius-md)', padding: '1rem', overflowX: 'auto', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#F87171', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            <Terminal size={14} />
            <span>Runtime Execution Error</span>
          </div>
          <pre style={{ color: '#FCA5A5', fontSize: '0.775rem', fontFamily: 'var(--font-mono)', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
            {runtimeError}
          </pre>
        </div>
      )}

      {/* Test Cases Results Navigator */}
      {results && results.length > 0 && (
        <div>
          {/* Tabs for Test Cases */}
          <div style={{ display: 'flex', gap: '0.45rem', marginBottom: '0.85rem', flexWrap: 'wrap' }}>
            {results.map((tc, idx) => (
              <button
                key={tc.id}
                onClick={() => setSelectedCaseIdx(idx)}
                className={`btn btn-sm ${selectedCaseIdx === idx ? 'btn-secondary' : 'btn-ghost'}`}
                style={{
                  border: selectedCaseIdx === idx ? '1px solid var(--border-accent)' : '1px solid var(--border-subtle)',
                  padding: '0.35rem 0.65rem',
                  fontSize: '0.75rem',
                  color: tc.passed ? 'var(--accent-success)' : '#FCA5A5'
                }}
              >
                {tc.passed ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                <span>{tc.name}</span>
                {tc.isHidden && (
                  <Shield size={11} title="Protected Test Case" style={{ color: 'var(--text-dim)', marginLeft: '2px' }} />
                )}
              </button>
            ))}
          </div>

          {/* Active Test Case Detail */}
          {activeCase && (
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1rem', fontSize: '0.825rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{activeCase.name}</span>
                <span className={`badge ${activeCase.passed ? 'badge-easy' : 'badge-hard'}`}>
                  {activeCase.passed ? 'Passed' : 'Failed'}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div>
                  <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '2px' }}>
                    Input
                  </span>
                  <div style={{ background: '#0E0E17', padding: '0.45rem 0.65rem', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)', color: 'var(--text-main)', fontSize: '0.8rem' }}>
                    {activeCase.inputDisplay}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '2px' }}>
                      Expected Output
                    </span>
                    <div style={{ background: '#0E0E17', padding: '0.45rem 0.65rem', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)', color: 'var(--accent-success)', fontSize: '0.8rem' }}>
                      {activeCase.expectedOutput}
                    </div>
                  </div>

                  <div>
                    <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '2px' }}>
                      Actual Output
                    </span>
                    <div style={{ background: '#0E0E17', padding: '0.45rem 0.65rem', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)', color: activeCase.passed ? 'var(--accent-success)' : '#FCA5A5', fontSize: '0.8rem' }}>
                      {activeCase.actualOutput}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
