import React, { useState } from 'react';
import { 
  Brain, 
  Clock, 
  Calendar, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight, 
  Layers, 
  Info,
  Sparkles,
  RotateCcw
} from 'lucide-react';
import RecallSessionModal from './RecallSessionModal';

export default function RevisionDashboard({ 
  revisionPipeline, 
  onRefresh, 
  onNavigateProblems 
}) {
  const [activeRecallItem, setActiveRecallItem] = useState(null);

  if (!revisionPipeline) return null;

  const {
    overdue = [],
    dueToday = [],
    upcoming = [],
    totalDueCount = 0,
    activeInPipeline = 0,
    totalRevisionsCompleted = 0,
    recallRetentionRate,
    metricDefinition
  } = revisionPipeline;

  const dueProblems = [...overdue, ...dueToday];

  return (
    <div className="card" style={{ marginBottom: '1.75rem', padding: '1.75rem 2rem' }}>
      {/* Active Recall Modal */}
      {activeRecallItem && (
        <RecallSessionModal
          revisionItem={activeRecallItem}
          onClose={() => setActiveRecallItem(null)}
          onOutcomeRecorded={() => {
            if (onRefresh) onRefresh();
          }}
        />
      )}

      {/* Header & Subtitle */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
            <div 
              style={{ 
                width: '32px', 
                height: '32px', 
                borderRadius: 'var(--radius-sm)', 
                background: 'rgba(167, 139, 250, 0.12)', 
                color: 'var(--accent-primary)',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                border: '1px solid rgba(167, 139, 250, 0.25)' 
              }}
            >
              <Brain size={18} />
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
              Adaptive Revision & Spaced Retention
            </h2>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', maxWidth: '680px' }}>
            Spaced repetition intervals (1, 3, 7, 14, 30 days) calibrated to cement your algorithmic memory before cognitive decay sets in.
          </p>
        </div>

        {/* Pipeline Summary Pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="badge" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', padding: '0.35rem 0.65rem' }}>
            <Layers size={13} style={{ color: 'var(--accent-secondary)' }} />
            <span>Active Pipeline: <strong style={{ color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>{activeInPipeline} problems</strong></span>
          </span>
        </div>
      </div>

      {/* Retention KPI Metric Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '0.85rem', 
        marginBottom: '1.5rem' 
      }}>
        {/* Retention Rate */}
        <div style={{ background: 'var(--bg-surface)', padding: '1rem 1.15rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Recall Retention Rate
            </span>
            <CheckCircle2 size={15} style={{ color: recallRetentionRate !== null ? 'var(--accent-success)' : 'var(--text-dim)' }} />
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: recallRetentionRate !== null ? 'var(--accent-success)' : 'var(--text-dim)' }}>
            {recallRetentionRate !== null ? `${recallRetentionRate}%` : 'Pending'}
          </div>
          <div style={{ fontSize: '0.725rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
            {totalRevisionsCompleted > 0 
              ? `${revisionPipeline.independentSolves} of ${totalRevisionsCompleted} revisions solved without hints`
              : 'Benchmark forms after 1st revision'}
          </div>
        </div>

        {/* Overdue */}
        <div style={{ 
          background: overdue.length > 0 ? 'rgba(252, 165, 165, 0.05)' : 'var(--bg-surface)', 
          padding: '1rem 1.15rem', 
          borderRadius: 'var(--radius-md)', 
          border: overdue.length > 0 ? '1px solid rgba(252, 165, 165, 0.25)' : '1px solid var(--border-subtle)' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Overdue Reviews
            </span>
            <AlertCircle size={15} style={{ color: overdue.length > 0 ? '#FCA5A5' : 'var(--accent-success)' }} />
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: overdue.length > 0 ? '#FCA5A5' : 'var(--accent-success)' }}>
            {overdue.length}
          </div>
          <div style={{ fontSize: '0.725rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
            {overdue.length > 0 ? 'Higher risk of memory decay' : 'No overdue reviews'}
          </div>
        </div>

        {/* Due Today */}
        <div style={{ background: 'var(--bg-surface)', padding: '1rem 1.15rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Due Today
            </span>
            <Clock size={15} style={{ color: 'var(--accent-warning)' }} />
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: dueToday.length > 0 ? '#FDE047' : 'var(--text-main)' }}>
            {dueToday.length}
          </div>
          <div style={{ fontSize: '0.725rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
            Ready for active recall
          </div>
        </div>

        {/* Upcoming */}
        <div style={{ background: 'var(--bg-surface)', padding: '1rem 1.15rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Upcoming Reviews
            </span>
            <Calendar size={15} style={{ color: 'var(--accent-secondary)' }} />
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-main)' }}>
            {upcoming.length}
          </div>
          <div style={{ fontSize: '0.725rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
            Scheduled across 3–30 day intervals
          </div>
        </div>
      </div>

      {/* Metric Definition Note */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '0.45rem', 
        fontSize: '0.75rem', 
        color: 'var(--text-dim)', 
        marginBottom: '1.5rem',
        padding: '0.4rem 0.65rem',
        background: 'rgba(23, 23, 34, 0.4)',
        borderRadius: 'var(--radius-sm)'
      }}>
        <Info size={13} style={{ color: 'var(--accent-secondary)' }} />
        <span><strong>Retention Definition: </strong>{metricDefinition}</span>
      </div>

      {/* Due & Overdue Problems Section */}
      <div style={{ display: 'grid', gridTemplateColumns: dueProblems.length > 0 && upcoming.length > 0 ? '1.2fr 0.8fr' : '1fr', gap: '1.5rem' }}>
        {/* Due Problems Queue */}
        <div>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>Review Due Problems ({dueProblems.length})</span>
            {dueProblems.length > 0 && (
              <span className="badge badge-hint" style={{ fontSize: '0.675rem' }}>
                Action Required
              </span>
            )}
          </div>

          {dueProblems.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {dueProblems.map(item => {
                const isOverdue = item.daysOverdue > 0;
                return (
                  <div 
                    key={item.problemId}
                    style={{
                      background: 'var(--bg-surface)',
                      border: isOverdue ? '1px solid rgba(252, 165, 165, 0.35)' : '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.85rem 1.15rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '1rem',
                      flexWrap: 'wrap'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                          {item.problem.title}
                        </span>
                        {isOverdue ? (
                          <span className="badge badge-hard" style={{ fontSize: '0.675rem' }}>
                            {item.daysOverdue}d overdue
                          </span>
                        ) : (
                          <span className="badge badge-medium" style={{ fontSize: '0.675rem' }}>
                            Due Today
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        <span className="badge badge-topic" style={{ padding: '0.1rem 0.4rem', fontSize: '0.675rem' }}>
                          {item.problem.topic}
                        </span>
                        <span>Stage {item.stage} ({item.intervalDays}d interval)</span>
                      </div>
                    </div>

                    <button 
                      onClick={() => setActiveRecallItem(item)}
                      className="btn btn-primary btn-sm"
                      style={{ padding: '0.45rem 0.95rem' }}
                    >
                      <Brain size={14} />
                      <span>Start Recall Review</span>
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '1.75rem',
              textAlign: 'center'
            }}>
              <CheckCircle2 size={24} style={{ color: 'var(--accent-success)', margin: '0 auto 0.5rem' }} />
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                All caught up! No reviews due today.
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', maxWidth: '420px', margin: '0 auto' }}>
                {activeInPipeline > 0 
                  ? 'Your active retention pipeline is healthy. Your next scheduled spaced review will appear here when due.'
                  : 'Solve problems in the curriculum to enroll them in the spaced repetition retention pipeline.'}
              </p>
            </div>
          )}
        </div>

        {/* Upcoming Reviews Schedule */}
        {upcoming.length > 0 && (
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.75rem' }}>
              Upcoming Spaced Reviews ({upcoming.length})
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {upcoming.slice(0, 4).map(item => (
                <div 
                  key={item.problemId}
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.65rem 0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.8rem'
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{item.problem.title}</span>
                    <span style={{ color: 'var(--text-dim)', marginLeft: '0.4rem', fontSize: '0.725rem' }}>({item.problem.topic})</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="badge" style={{ background: 'var(--bg-card)', color: 'var(--accent-secondary)', fontSize: '0.675rem' }}>
                      In {item.daysUntilDue} day(s)
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                      Stage {item.stage}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
