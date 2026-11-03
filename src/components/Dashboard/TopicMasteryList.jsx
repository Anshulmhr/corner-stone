import React from 'react';
import { Layers, Info } from 'lucide-react';

export default function TopicMasteryList({ topics = [], onSelectTopic }) {
  return (
    <div className="card" style={{ height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div 
            style={{ 
              width: '28px', 
              height: '28px', 
              borderRadius: 'var(--radius-sm)', 
              background: 'rgba(103, 232, 249, 0.1)',
              color: 'var(--accent-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(103, 232, 249, 0.2)'
            }}
          >
            <Layers size={15} />
          </div>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Topic Mastery</h3>
            <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>Transparent rule-based calibration</p>
          </div>
        </div>
      </div>

      <div className="topic-mastery-list">
        {topics.map(t => {
          const isInsufficient = t.evidenceLevel === 'insufficient';
          const isEarly = t.evidenceLevel === 'early';

          return (
            <div 
              key={t.topic} 
              className="topic-row" 
              onClick={() => onSelectTopic && onSelectTopic(t.topic)}
              style={{ cursor: onSelectTopic ? 'pointer' : 'default' }}
            >
              <div className="topic-meta">
                <span className="topic-name">
                  {t.topic}
                  <span className="topic-stats-badge">
                    ({t.solvedCount}/{t.totalCount} solved • {t.totalAttempts} att)
                  </span>
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  {isInsufficient ? (
                    <span 
                      className="badge" 
                      style={{ 
                        background: 'var(--bg-surface)', 
                        color: 'var(--text-dim)', 
                        border: '1px solid var(--border-subtle)',
                        fontSize: '0.7rem'
                      }}
                    >
                      Not enough data
                    </span>
                  ) : isEarly ? (
                    <>
                      <span 
                        className="badge" 
                        style={{ 
                          background: 'rgba(167, 139, 250, 0.1)', 
                          color: 'var(--accent-primary)', 
                          border: '1px solid rgba(167, 139, 250, 0.25)',
                          fontSize: '0.675rem'
                        }}
                      >
                        Early estimate
                      </span>
                      <span className="topic-mastery-val">{t.mastery}%</span>
                    </>
                  ) : (
                    <span className="topic-mastery-val">{t.mastery}%</span>
                  )}
                </div>
              </div>

              <div className="progress-track">
                <div 
                  className="progress-fill" 
                  style={{ 
                    width: isInsufficient ? '0%' : `${t.mastery}%`,
                    background: isInsufficient 
                      ? 'transparent'
                      : t.mastery === 100 
                      ? 'linear-gradient(90deg, #86EFAC 0%, #67E8F9 100%)' 
                      : undefined
                  }} 
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
