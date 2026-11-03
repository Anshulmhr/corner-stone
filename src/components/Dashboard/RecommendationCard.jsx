import React from 'react';
import { Sparkles, ArrowRight, HelpCircle, CheckCircle } from 'lucide-react';

export default function RecommendationCard({ recommendation, onStartSolving }) {
  if (!recommendation || !recommendation.problem) return null;

  const { problem, badge, reason, whyThisProblem, targetMetric, difficulty, topic } = recommendation;

  const difficultyClass = difficulty === 'Easy' 
    ? 'badge-easy' 
    : difficulty === 'Medium' 
    ? 'badge-medium' 
    : 'badge-hard';

  return (
    <div className="recommendation-card">
      <div className="recommendation-pill">
        <Sparkles size={13} />
        <span>Recommended Next Problem • {badge}</span>
      </div>

      <div className="recommendation-content">
        <div className="recommendation-info">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
            <h2 className="recommendation-title">{problem.title}</h2>
          </div>

          {/* Primary Reason */}
          <p className="recommendation-reason" style={{ fontWeight: 600, color: 'var(--text-main)' }}>
            "{reason}"
          </p>

          {/* "Why this problem?" Truthful rule explanation */}
          {whyThisProblem && (
            <div style={{
              margin: '0.65rem 0 0.85rem',
              padding: '0.65rem 0.85rem',
              background: 'rgba(23, 23, 34, 0.75)',
              border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.8rem',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.5rem',
              lineHeight: 1.45
            }}>
              <HelpCircle size={14} style={{ color: 'var(--accent-secondary)', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ color: 'var(--accent-secondary)' }}>Why this problem? </strong>
                <span>{whyThisProblem}</span>
              </div>
            </div>
          )}

          <div className="recommendation-tags">
            <span className={`badge ${difficultyClass}`}>{difficulty}</span>
            <span className="badge badge-topic">{topic}</span>
            <span 
              className="badge" 
              style={{ 
                background: 'rgba(167, 139, 250, 0.08)', 
                color: 'var(--accent-primary)',
                border: '1px solid rgba(167, 139, 250, 0.2)' 
              }}
            >
              Target: {targetMetric}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
              Est. {problem.estimatedTime}
            </span>
          </div>
        </div>

        <div>
          <button 
            onClick={() => onStartSolving(problem)}
            className="btn btn-primary"
            style={{ padding: '0.8rem 1.6rem', fontSize: '0.95rem' }}
          >
            <span>{recommendation.isRevision ? 'Review Problem' : 'Start Solving'}</span>
            <ArrowRight size={17} />
          </button>
        </div>
      </div>
    </div>
  );
}
