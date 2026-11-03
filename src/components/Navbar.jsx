import React from 'react';
import { Menu, Zap, Target, BookOpen, Brain } from 'lucide-react';

export default function Navbar({ 
  activeTab, 
  setMobileOpen, 
  currentProblem, 
  overallAccuracy = 0, 
  solvedCount = 0,
  totalProblems = 10,
  dueRevisionCount = 0,
  onNavigateProblems
}) {
  return (
    <header className="navbar">
      <div className="navbar-left">
        <button 
          className="mobile-menu-btn"
          onClick={() => setMobileOpen(prev => !prev)}
          aria-label="Toggle navigation menu"
        >
          <Menu size={18} />
        </button>

        <div className="navbar-title">
          <span>AdaptiveDSA</span>
          <span style={{ color: 'var(--text-dim)' }}>/</span>
          {activeTab === 'solver' && currentProblem ? (
            <>
              <span 
                onClick={onNavigateProblems}
                style={{ cursor: 'pointer', color: 'var(--text-muted)' }}
                className="hover-underline"
              >
                Problems
              </span>
              <span style={{ color: 'var(--text-dim)' }}>/</span>
              <span className="current-view">{currentProblem.title}</span>
            </>
          ) : (
            <span className="current-view">
              {activeTab === 'dashboard' && 'Dashboard'}
              {activeTab === 'problems' && 'Problem Bank'}
              {activeTab === 'roadmap' && 'Adaptive Roadmap'}
              {activeTab === 'progress' && 'Learning Analytics'}
            </span>
          )}
        </div>
      </div>

      <div className="navbar-actions">
        {dueRevisionCount > 0 && (
          <div 
            className="badge" 
            style={{ 
              background: 'rgba(253, 224, 71, 0.1)', 
              color: '#FDE047',
              border: '1px solid rgba(253, 224, 71, 0.3)',
              padding: '0.35rem 0.65rem'
            }}
            title="Spaced repetition recall reviews are due"
          >
            <Brain size={13} />
            <span><strong style={{ fontFamily: 'var(--font-mono)' }}>{dueRevisionCount}</strong> Due for Review</span>
          </div>
        )}

        {/* Quick stat badges */}
        <div 
          className="badge" 
          style={{ 
            background: 'var(--bg-surface)', 
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-muted)',
            padding: '0.35rem 0.65rem'
          }}
          title="Outcomes are self-reported for demo purposes"
        >
          <Target size={13} style={{ color: 'var(--accent-secondary)' }} />
          <span>Self-Reported Acc: <strong style={{ color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>{overallAccuracy}%</strong></span>
        </div>

        <div 
          className="badge" 
          style={{ 
            background: 'var(--bg-surface)', 
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-muted)',
            padding: '0.35rem 0.65rem'
          }}
        >
          <Zap size={13} style={{ color: 'var(--accent-success)' }} />
          <span>Solved: <strong style={{ color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>{solvedCount}/{totalProblems}</strong></span>
        </div>
      </div>
    </header>
  );
}
