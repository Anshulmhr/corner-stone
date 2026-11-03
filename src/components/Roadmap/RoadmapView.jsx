import React, { useState } from 'react';
import { 
  GitFork, 
  CheckCircle2, 
  Lock, 
  Unlock, 
  AlertTriangle, 
  Play, 
  Sparkles, 
  ArrowRight, 
  Layers, 
  Brain, 
  Info, 
  Clock, 
  Target,
  ChevronRight,
  Compass
} from 'lucide-react';
import { getAdaptiveRoadmap, TOPIC_STATUSES } from '../../services/roadmapService.js';
import { PROBLEMS } from '../../data/problems.js';

export default function RoadmapView({
  topicStats = [],
  solvedIds = [],
  attempts = [],
  onSelectProblem,
  onNavigateProblems
}) {
  const [filterStatus, setFilterStatus] = useState('ALL');

  const roadmapData = getAdaptiveRoadmap({
    topicStats,
    solvedIds,
    attempts,
    problems: PROBLEMS
  });

  const { nodes, recommendedTopic, recommendationReason, completedCount, totalCurriculumTopics } = roadmapData;

  const filteredNodes = nodes.filter(node => {
    if (filterStatus === 'ALL') return true;
    if (filterStatus === 'LOCKED') return node.status === TOPIC_STATUSES.LOCKED;
    if (filterStatus === 'AVAILABLE') return node.status !== TOPIC_STATUSES.LOCKED;
    if (filterStatus === 'COMPLETED') return node.status === TOPIC_STATUSES.COMPLETED;
    return true;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case TOPIC_STATUSES.COMPLETED:
        return (
          <span className="badge" style={{ background: 'rgba(34, 197, 94, 0.12)', color: '#4ADE80', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
            <CheckCircle2 size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-1px' }} />
            Completed
          </span>
        );
      case TOPIC_STATUSES.NEEDS_PRACTICE:
        return (
          <span className="badge" style={{ background: 'rgba(251, 146, 60, 0.12)', color: '#FB923C', border: '1px solid rgba(251, 146, 60, 0.3)' }}>
            <AlertTriangle size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-1px' }} />
            Needs Practice
          </span>
        );
      case TOPIC_STATUSES.IN_PROGRESS:
        return (
          <span className="badge" style={{ background: 'rgba(56, 189, 248, 0.12)', color: '#38BDF8', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
            <Play size={11} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-1px' }} />
            In Progress
          </span>
        );
      case TOPIC_STATUSES.READY:
        return (
          <span className="badge" style={{ background: 'rgba(167, 139, 250, 0.12)', color: '#C084FC', border: '1px solid rgba(167, 139, 250, 0.3)' }}>
            <Sparkles size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-1px' }} />
            Ready to Learn
          </span>
        );
      case TOPIC_STATUSES.LOCKED:
      default:
        return (
          <span className="badge" style={{ background: 'var(--bg-surface)', color: 'var(--text-dim)', border: '1px solid var(--border-subtle)' }}>
            <Lock size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-1px' }} />
            Locked
          </span>
        );
    }
  };

  return (
    <div className="roadmap-container">
      {/* Header Section */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(167, 139, 250, 0.12)',
              color: 'var(--accent-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Compass size={18} />
            </div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 800 }}>
              Adaptive Learning Roadmap
            </h1>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.925rem', maxWidth: '750px' }}>
            A personalized DSA prerequisite graph that dynamically updates based on your actual problem-solving telemetry,
            guiding you through core fundamentals before unlocking higher-level structures.
          </p>
        </div>

        {/* Global Progress Pill */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-accent)',
          borderRadius: 'var(--radius-lg)',
          padding: '0.75rem 1.25rem'
        }}>
          <div>
            <div style={{ fontSize: '0.725rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Curriculum Progress
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-primary)' }}>
              {completedCount} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>/ {totalCurriculumTopics} Topics</span>
            </div>
          </div>
          <div style={{
            width: '45px',
            height: '45px',
            borderRadius: '50%',
            background: `conic-gradient(var(--accent-primary) ${(completedCount / totalCurriculumTopics) * 360}deg, var(--bg-surface) 0deg)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '3px'
          }}>
            <div style={{
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              background: 'var(--bg-card)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.75rem',
              fontWeight: 700
            }}>
              {Math.round((completedCount / totalCurriculumTopics) * 100)}%
            </div>
          </div>
        </div>
      </div>

      {/* Recommended Next Focus Card (Requirement 6) */}
      {recommendedTopic && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(167, 139, 250, 0.09) 0%, rgba(23, 23, 34, 0.95) 100%)',
          border: '1px solid var(--border-accent)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.5rem',
          marginBottom: '2rem',
          boxShadow: '0 0 24px -6px var(--accent-primary-glow)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="recommendation-pill" style={{ marginBottom: 0 }}>
                <Sparkles size={12} /> Recommended Next Focus
              </span>
              <span className="badge badge-topic">{recommendedTopic.topic}</span>
              {getStatusBadge(recommendedTopic.status)}
            </div>
          </div>

          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '0.4rem', color: 'var(--text-main)' }}>
            {recommendedTopic.title}
          </h2>

          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.55, marginBottom: '1rem' }}>
            {recommendationReason}
          </p>

          {/* Quick Problem Launch from Recommendation (Requirement 7) */}
          {recommendedTopic.problems && recommendedTopic.problems.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Next available problem:</span>
              {(() => {
                const nextProbMeta = recommendedTopic.problems.find(p => !p.isSolved) || recommendedTopic.problems[0];
                const fullProblem = PROBLEMS.find(p => p.id === nextProbMeta.id);
                return (
                  <button
                    onClick={() => fullProblem && onSelectProblem(fullProblem)}
                    className="btn btn-primary btn-sm"
                    style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem' }}
                  >
                    <span>{nextProbMeta.isSolved ? 'Review' : 'Solve'} {nextProbMeta.title}</span>
                    <ArrowRight size={14} />
                  </button>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* Filter Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {[
            { id: 'ALL', label: 'All Topics' },
            { id: 'AVAILABLE', label: 'Unlocked' },
            { id: 'LOCKED', label: 'Prerequisite Locked' },
            { id: 'COMPLETED', label: 'Completed' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilterStatus(f.id)}
              className={`btn btn-sm ${filterStatus === f.id ? 'btn-primary' : 'btn-ghost'}`}
              style={{ fontSize: '0.775rem', padding: '0.35rem 0.75rem' }}
            >
              {f.label}
            </button>
          ))}
        </div>

        <span style={{ fontSize: '0.775rem', color: 'var(--text-dim)' }}>
          Showing {filteredNodes.length} of {nodes.length} topics
        </span>
      </div>

      {/* Roadmap Topics Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {filteredNodes.map((node, index) => {
          const isRecommended = recommendedTopic?.id === node.id;
          return (
            <div
              key={node.id}
              className="card"
              style={{
                border: isRecommended ? '1px solid var(--accent-primary)' : '1px solid var(--border-medium)',
                boxShadow: isRecommended ? '0 0 16px -4px var(--accent-primary-glow)' : 'none',
                opacity: !node.isUnlocked && node.coveredInCurriculum ? 0.75 : 1
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: node.isUnlocked ? 'rgba(167, 139, 250, 0.15)' : 'var(--bg-surface)',
                    color: node.isUnlocked ? 'var(--accent-primary)' : 'var(--text-dim)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.85rem',
                    fontWeight: 800,
                    fontFamily: 'var(--font-mono)'
                  }}>
                    {index + 1}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>
                        {node.title}
                      </h3>
                      {getStatusBadge(node.status)}
                      <span className="badge" style={{ fontSize: '0.675rem', background: 'var(--bg-surface)', color: 'var(--text-dim)' }}>
                        {node.estimatedDifficulty}
                      </span>
                    </div>
                  </div>
                </div>

                {node.coveredInCurriculum && (
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                      {node.solvedCount}/{node.totalProblems} Solved • {node.mastery}% Mastery
                    </div>
                    <div style={{
                      width: '120px',
                      height: '4px',
                      background: 'var(--bg-surface)',
                      borderRadius: '99px',
                      overflow: 'hidden',
                      marginTop: '0.25rem',
                      marginLeft: 'auto'
                    }}>
                      <div style={{
                        width: `${node.mastery}%`,
                        height: '100%',
                        background: node.mastery >= 70 ? '#4ADE80' : node.mastery > 0 ? 'var(--accent-primary)' : 'transparent',
                        borderRadius: '99px'
                      }} />
                    </div>
                  </div>
                )}
              </div>

              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '0.85rem' }}>
                {node.description}
              </p>

              {/* Prerequisites Breakdown */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                fontSize: '0.775rem',
                padding: '0.5rem 0.75rem',
                background: 'var(--bg-surface)',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '1rem',
                flexWrap: 'wrap'
              }}>
                <span style={{ color: 'var(--text-dim)', fontWeight: 600 }}>Prerequisites:</span>
                {node.prerequisites.length === 0 ? (
                  <span style={{ color: '#4ADE80', fontWeight: 600 }}>None (Foundational Entry)</span>
                ) : (
                  node.prerequisites.map(prereq => {
                    const isPrereqSatisfied = !node.unmetPrerequisites.includes(prereq);
                    return (
                      <span
                        key={prereq}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          color: isPrereqSatisfied ? '#4ADE80' : 'var(--text-dim)',
                          fontWeight: 600
                        }}
                      >
                        {isPrereqSatisfied ? <CheckCircle2 size={12} /> : <Lock size={12} />}
                        {prereq}
                      </span>
                    );
                  })
                )}
                <span style={{ color: 'var(--text-dim)', marginLeft: 'auto', fontStyle: 'italic' }}>
                  {node.statusReason}
                </span>
              </div>

              {/* Covered Problems or Curriculum Limitation Note (Requirements 7 & 9) */}
              {node.coveredInCurriculum ? (
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-dim)', letterSpacing: '0.04em', marginBottom: '0.5rem' }}>
                    Practice Problems ({node.solvedCount}/{node.totalProblems} complete)
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.65rem' }}>
                    {node.problems.map(prob => {
                      const fullProblem = PROBLEMS.find(p => p.id === prob.id);
                      return (
                        <div
                          key={prob.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.65rem 0.85rem',
                            background: prob.isSolved ? 'rgba(34, 197, 94, 0.04)' : 'var(--bg-surface)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: 'var(--radius-sm)'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0, marginRight: '0.5rem' }}>
                            {prob.isSolved ? (
                              <CheckCircle2 size={15} style={{ color: '#4ADE80', flexShrink: 0 }} />
                            ) : (
                              <div style={{ width: '15px', height: '15px', borderRadius: '50%', border: '1.5px solid var(--text-dim)', flexShrink: 0 }} />
                            )}
                            <span style={{ fontSize: '0.825rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {prob.title}
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexShrink: 0 }}>
                            <span className={`badge badge-${prob.difficulty.toLowerCase()}`} style={{ fontSize: '0.65rem' }}>
                              {prob.difficulty}
                            </span>
                            <button
                              onClick={() => fullProblem && onSelectProblem(fullProblem)}
                              className="btn btn-ghost btn-sm"
                              style={{ fontSize: '0.725rem', padding: '0.2rem 0.5rem' }}
                              title="Open problem in C++ solver"
                            >
                              {prob.isSolved ? 'Review' : 'Solve'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* Honest Curriculum Limitation Note (Requirement 9) */
                <div style={{
                  padding: '0.75rem 1rem',
                  background: 'rgba(234, 179, 8, 0.05)',
                  border: '1px solid rgba(234, 179, 8, 0.25)',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  fontSize: '0.8rem',
                  color: 'var(--text-muted)'
                }}>
                  <Info size={16} style={{ color: '#EAB308', flexShrink: 0 }} />
                  <span>
                    <strong style={{ color: '#EAB308' }}>Curriculum Scope: </strong>
                    {node.scopeNote}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
