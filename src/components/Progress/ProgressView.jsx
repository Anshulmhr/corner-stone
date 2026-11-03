import React, { useState } from 'react';
import { 
  LineChart, 
  CheckCircle2, 
  XCircle, 
  Lightbulb, 
  Layers, 
  Sparkles, 
  RotateCcw,
  Clock,
  Target,
  BarChart2,
  AlertTriangle,
  Brain,
  TrendingDown
} from 'lucide-react';
import { PROBLEMS } from '../../data/problems';

export default function ProgressView({ 
  metrics, 
  topicStats = [], 
  attempts = [], 
  solvedIds = [], 
  hintsMap = {},
  mistakePatternStats = { categories: [], totalDiagnosed: 0, hasData: false },
  onSeedDemo, 
  onResetData,
  onSelectProblem
}) {
  const [filterTopic, setFilterTopic] = useState('All');

  // Hint reliance breakdown: how many problems solved with 0, 1, 2, or 3 hints
  const hintDistribution = { 0: 0, 1: 0, 2: 0, 3: 0 };
  solvedIds.forEach(id => {
    const h = hintsMap[id] || 0;
    if (hintDistribution[h] !== undefined) {
      hintDistribution[h]++;
    }
  });

  // Filtered attempts log
  const filteredAttempts = attempts.filter(att => {
    if (filterTopic !== 'All' && att.topic !== filterTopic) return false;
    return true;
  });

  return (
    <div className="progress-container">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, marginBottom: '0.4rem' }}>
            Learning Analytics & History
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Empirical insights into your algorithmic cognition, topic strengths, and progressive hint reliance.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={onSeedDemo} className="btn btn-secondary btn-sm">
            <Sparkles size={14} style={{ color: 'var(--accent-primary)' }} />
            <span>Load Demo Activity</span>
          </button>
          <button onClick={onResetData} className="btn btn-ghost btn-sm">
            <RotateCcw size={14} />
            <span>Reset Data</span>
          </button>
        </div>
      </div>

      {/* Two-Column Analytics: Topic Breakdown & Hint Reliance */}
      <div className="progress-grid">
        {/* Topic Breakdown Card */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem' }}>
            <div 
              style={{ 
                width: '30px', 
                height: '30px', 
                borderRadius: 'var(--radius-sm)', 
                background: 'rgba(103, 232, 249, 0.1)', 
                color: 'var(--accent-secondary)',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}
            >
              <Layers size={16} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Topic Competency Breakdown</h3>
              <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>Solves, attempts & accuracy per category</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {topicStats.map(t => {
              const isInsufficient = t.evidenceLevel === 'insufficient';
              const isEarly = t.evidenceLevel === 'early';

              return (
                <div key={t.topic} style={{ background: 'var(--bg-surface)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{t.topic}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      {isInsufficient ? (
                        <span className="badge" style={{ background: 'var(--bg-card)', color: 'var(--text-dim)', fontSize: '0.7rem' }}>
                          Not enough data
                        </span>
                      ) : (
                        <>
                          {isEarly && (
                            <span className="badge" style={{ background: 'rgba(167, 139, 250, 0.1)', color: 'var(--accent-primary)', fontSize: '0.675rem' }}>
                              Early estimate
                            </span>
                          )}
                          <span style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-primary)', fontWeight: 700 }}>
                            {t.mastery}% Mastery
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.775rem', color: 'var(--text-dim)', marginBottom: '0.4rem' }}>
                    <span>{t.solvedCount} of {t.totalCount} solved • {t.totalAttempts} attempts</span>
                    <span>Self-reported accuracy: {t.accuracy}%</span>
                  </div>
                  <div className="progress-track" style={{ height: '6px' }}>
                    <div 
                      className="progress-fill" 
                      style={{ 
                        width: isInsufficient ? '0%' : `${t.mastery}%`,
                        background: isInsufficient ? 'transparent' : undefined 
                      }} 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Hint Reliance & Efficiency */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem' }}>
            <div 
              style={{ 
                width: '30px', 
                height: '30px', 
                borderRadius: 'var(--radius-sm)', 
                background: 'rgba(167, 139, 250, 0.1)', 
                color: 'var(--accent-primary)',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}
            >
              <Lightbulb size={16} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Cognitive Hint Reliance</h3>
              <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>Hints requested before achieving successful solve</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ background: 'var(--bg-surface)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--accent-success)', fontFamily: 'var(--font-mono)' }}>
                {hintDistribution[0]}
              </div>
              <div style={{ fontSize: '0.775rem', fontWeight: 600, color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                0 Hints (Fully Independent)
              </div>
            </div>

            <div style={{ background: 'var(--bg-surface)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--accent-secondary)', fontFamily: 'var(--font-mono)' }}>
                {hintDistribution[1]}
              </div>
              <div style={{ fontSize: '0.775rem', fontWeight: 600, color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                1 Hint (Conceptual Nudge)
              </div>
            </div>

            <div style={{ background: 'var(--bg-surface)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--accent-warning)', fontFamily: 'var(--font-mono)' }}>
                {hintDistribution[2]}
              </div>
              <div style={{ fontSize: '0.775rem', fontWeight: 600, color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                2 Hints (Approach Clue)
              </div>
            </div>

            <div style={{ background: 'var(--bg-surface)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)' }}>
                {hintDistribution[3]}
              </div>
              <div style={{ fontSize: '0.775rem', fontWeight: 600, color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                3 Hints (Full Blueprint)
              </div>
            </div>
          </div>

          <div style={{ 
            padding: '0.85rem 1rem', 
            background: 'rgba(167, 139, 250, 0.06)', 
            border: '1px solid rgba(167, 139, 250, 0.2)', 
            borderRadius: 'var(--radius-md)',
            fontSize: '0.825rem',
            color: 'var(--text-muted)',
            lineHeight: 1.5
          }}>
            <strong style={{ color: 'var(--accent-primary)' }}>Adaptive Insight: </strong>
            {metrics.avgHintsPerProblem <= 1.0 
              ? 'Excellent autonomous problem solving! Your hint usage is low and balanced.' 
              : 'You are leveraging hints effectively when getting stuck. As you review topics, challenge yourself to solve with one fewer hint.'}
          </div>
        </div>
      </div>

      {/* Mistake Pattern Analysis Card */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: '30px',
              height: '30px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(244, 63, 94, 0.1)',
              color: '#FB7185',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Brain size={16} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Mistake Pattern Analysis</h3>
              <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                Diagnosis categories from all automated C++ submissions
              </p>
            </div>
          </div>

          {mistakePatternStats.hasData && (
            <span style={{
              fontSize: '0.75rem',
              color: 'var(--text-dim)',
              fontFamily: 'var(--font-mono)',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '999px',
              padding: '0.2rem 0.75rem'
            }}>
              {mistakePatternStats.totalDiagnosed} diagnosed failure{mistakePatternStats.totalDiagnosed !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {!mistakePatternStats.hasData ? (
          <div style={{
            textAlign: 'center',
            padding: '2rem 1rem',
            color: 'var(--text-dim)',
            fontSize: '0.875rem'
          }}>
            <Brain size={28} style={{ marginBottom: '0.75rem', opacity: 0.4 }} />
            <p style={{ marginBottom: '0.35rem' }}>No diagnosed failure data yet.</p>
            <p style={{ fontSize: '0.775rem' }}>
              Submit C++ solutions on the Problems page to automatically diagnose mistake patterns.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            {/* Category breakdown bars */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {mistakePatternStats.categories.map(cat => (
                <div key={cat.category}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <span style={{
                        display: 'inline-block',
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: cat.color,
                        flexShrink: 0
                      }} />
                      <span style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-main)' }}>
                        {cat.label}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                        {cat.count}× across {cat.affectedProblems} problem{cat.affectedProblems !== 1 ? 's' : ''}
                      </span>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        fontFamily: 'var(--font-mono)',
                        color: cat.color
                      }}>
                        {cat.percentage}%
                      </span>
                    </div>
                  </div>
                  <div style={{
                    height: '5px',
                    background: 'var(--bg-surface)',
                    borderRadius: '99px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${cat.percentage}%`,
                      background: cat.color,
                      borderRadius: '99px',
                      transition: 'width 0.4s ease'
                    }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Insight block */}
            {mistakePatternStats.insight && (
              <div style={{
                padding: '0.85rem 1rem',
                background: 'rgba(244, 63, 94, 0.06)',
                border: '1px solid rgba(244, 63, 94, 0.2)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.825rem',
                color: 'var(--text-muted)',
                lineHeight: 1.55
              }}>
                <strong style={{ color: '#FB7185' }}>
                  <TrendingDown size={13} style={{ display: 'inline', marginRight: '5px', verticalAlign: 'text-bottom' }} />
                  {mistakePatternStats.insight.title}:&nbsp;
                </strong>
                {mistakePatternStats.insight.detail}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Chronological Learning Attempts History */}
      <div className="card attempts-table-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Chronological Activity History</h3>
            <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>Audit trail of practice attempts, self-reported solves, and hint levels</p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Filter Topic:</span>
            <select 
              className="filter-select"
              value={filterTopic}
              onChange={(e) => setFilterTopic(e.target.value)}
              style={{ padding: '0.4rem 0.75rem' }}
            >
              <option value="All">All Topics</option>
              {topicStats.map(t => (
                <option key={t.topic} value={t.topic}>{t.topic}</option>
              ))}
            </select>
          </div>
        </div>

        {filteredAttempts.length > 0 ? (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Problem</th>
                  <th>Evaluation</th>
                  <th>Diagnosis</th>
                  <th>Topic</th>
                  <th>Difficulty</th>
                  <th>Hints</th>
                  <th>Timestamp</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredAttempts.map(att => {
                  const prob = PROBLEMS.find(p => p.id === att.problemId);
                  const date = new Date(att.timestamp);
                  const timeStr = date.toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  });

                  return (
                    <tr key={att.id}>
                      <td>
                        {att.success ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--accent-success)', fontWeight: 600 }}>
                            <CheckCircle2 size={16} /> Solved
                          </span>
                        ) : (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: att.status === 'COMPILATION_ERROR' ? '#F87171' : 'var(--text-dim)' }}>
                            <XCircle size={16} /> {att.status === 'COMPILATION_ERROR' ? 'Compile Error' : att.status === 'WRONG_ANSWER' ? 'Wrong Answer' : 'Attempted'}
                          </span>
                        )}
                      </td>
                      <td style={{ fontWeight: 600 }}>{att.problemTitle}</td>
                      <td>
                        {att.evaluationType === 'automated' ? (
                          <span className="badge" style={{ background: 'rgba(103, 232, 249, 0.1)', color: 'var(--accent-secondary)', fontSize: '0.7rem' }}>
                            C++ Sandbox {att.totalCount ? `(${att.passedCount}/${att.totalCount})` : ''}
                          </span>
                        ) : (
                          <span className="badge" style={{ background: 'var(--bg-surface)', color: 'var(--text-dim)', fontSize: '0.7rem' }}>
                            Self-Reported
                          </span>
                        )}
                      </td>
                      <td>
                        {att.diagnosisCategory ? (
                          <span 
                            className="badge"
                            style={{ 
                              background: att.diagnosisCategory === 'COMPILATION_ERROR' ? 'rgba(248, 113, 113, 0.12)' :
                                          att.diagnosisCategory === 'EDGE_CASE_FAILURE' ? 'rgba(129, 140, 248, 0.12)' :
                                          att.diagnosisCategory === 'BOUNDARY_ERROR' ? 'rgba(251, 191, 36, 0.12)' :
                                          att.diagnosisCategory === 'OUTPUT_FORMAT_ERROR' ? 'rgba(56, 189, 248, 0.12)' :
                                          att.diagnosisCategory === 'TLE' ? 'rgba(250, 204, 21, 0.12)' :
                                          'rgba(244, 63, 94, 0.12)',
                              color: att.diagnosisCategory === 'COMPILATION_ERROR' ? '#F87171' :
                                     att.diagnosisCategory === 'EDGE_CASE_FAILURE' ? '#818CF8' :
                                     att.diagnosisCategory === 'BOUNDARY_ERROR' ? '#FBBF24' :
                                     att.diagnosisCategory === 'OUTPUT_FORMAT_ERROR' ? '#38BDF8' :
                                     att.diagnosisCategory === 'TLE' ? '#FACC15' :
                                     '#FB7185',
                              fontSize: '0.675rem',
                              fontWeight: 600,
                              whiteSpace: 'nowrap'
                            }}
                            title={att.diagnosisExplanation || ''}
                          >
                            {att.diagnosisCategory === 'COMPILATION_ERROR' ? 'Compiler' :
                             att.diagnosisCategory === 'EDGE_CASE_FAILURE' ? 'Edge Case' :
                             att.diagnosisCategory === 'BOUNDARY_ERROR' ? 'Boundary' :
                             att.diagnosisCategory === 'OUTPUT_FORMAT_ERROR' ? 'Format' :
                             att.diagnosisCategory === 'LOGIC_ERROR' ? 'Logic' :
                             att.diagnosisCategory === 'PARTIAL_LOGIC_ERROR' ? 'Partial' :
                             att.diagnosisCategory === 'TLE' ? 'Time Limit' :
                             att.diagnosisCategory === 'RUNTIME_ERROR' ? 'Runtime' :
                             att.diagnosisCategory}
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.725rem', color: 'var(--text-dim)' }}>
                            —
                          </span>
                        )}
                      </td>
                      <td>
                        <span className="badge badge-topic">{att.topic}</span>
                      </td>
                      <td>
                        <span className={`badge badge-${att.difficulty.toLowerCase()}`}>
                          {att.difficulty}
                        </span>
                      </td>
                      <td>
                        {att.isBlindSolve ? (
                          <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#F87171', fontSize: '0.675rem', fontWeight: 600 }}>
                            Blind {att.independenceScore !== null && att.independenceScore !== undefined ? `(${att.independenceScore} pts)` : '(0 hints)'}
                          </span>
                        ) : (
                          <span className="badge badge-hint">
                            <Lightbulb size={11} />
                            {att.hintsUnlocked} / 3 hints
                          </span>
                        )}
                      </td>
                      <td style={{ fontSize: '0.775rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                        {timeStr}
                      </td>
                      <td>
                        {prob && (
                          <button 
                            onClick={() => onSelectProblem(prob)}
                            className="btn btn-ghost btn-sm"
                            style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                          >
                            Open
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-dim)' }}>
            <p style={{ marginBottom: '0.75rem' }}>No learning attempts recorded yet.</p>
            <button onClick={onSeedDemo} className="btn btn-secondary btn-sm">
              <Sparkles size={14} style={{ color: 'var(--accent-primary)' }} />
              Load Sample Activity
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
