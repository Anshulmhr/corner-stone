import React from 'react';
import { CheckCircle2, CircleDashed, CircleDot, Lightbulb, ChevronRight, Clock, Code } from 'lucide-react';
import { CPP_SUPPORTED_PROBLEMS } from '../../data/cppTestSuites.js';

export default function ProblemCard({ problem, isSolved, isAttempted, hintsUsed = 0, onSelect }) {
  const isCppSupported = CPP_SUPPORTED_PROBLEMS.includes(problem.id);
  const difficultyClass = problem.difficulty === 'Easy' 
    ? 'badge-easy' 
    : problem.difficulty === 'Medium' 
    ? 'badge-medium' 
    : 'badge-hard';

  return (
    <div 
      className={`problem-card ${isSolved ? 'solved-border' : ''}`}
      onClick={() => onSelect(problem)}
    >
      <div className="problem-left">
        <div className="problem-status-icon">
          {isSolved ? (
            <CheckCircle2 size={20} color="var(--accent-success)" />
          ) : isAttempted ? (
            <CircleDot size={20} color="var(--accent-primary)" />
          ) : (
            <CircleDashed size={20} color="var(--text-dim)" />
          )}
        </div>

        <div className="problem-info">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="problem-title">{problem.title}</span>
            {isCppSupported && (
              <span className="badge" style={{ background: 'rgba(103, 232, 249, 0.1)', color: 'var(--accent-secondary)', fontSize: '0.675rem', border: '1px solid rgba(103, 232, 249, 0.25)' }}>
                C++ Verified
              </span>
            )}
          </div>

          <div className="problem-meta-row">
            <span className={`badge ${difficultyClass}`}>{problem.difficulty}</span>
            <span className="badge badge-topic">{problem.topic}</span>
            {hintsUsed > 0 && (
              <span className="badge badge-hint">
                <Lightbulb size={11} />
                <span>Hints: {hintsUsed}/3</span>
              </span>
            )}
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
              <Clock size={12} />
              {problem.estimatedTime}
            </span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <button 
          className={`btn ${isSolved ? 'btn-secondary' : 'btn-primary'} btn-sm`}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(problem);
          }}
        >
          <span>{isSolved ? 'Review' : 'Solve'}</span>
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
