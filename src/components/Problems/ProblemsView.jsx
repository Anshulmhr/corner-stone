import React, { useState, useMemo } from 'react';
import { Search, Filter, CheckCircle2, RotateCcw } from 'lucide-react';
import { TOPICS, DIFFICULTIES } from '../../data/problems';
import ProblemCard from './ProblemCard';

export default function ProblemsView({ 
  problems = [], 
  solvedIds = [], 
  attempts = [],
  hintsMap = {},
  selectedTopic = 'All',
  onSelectTopic,
  onSelectProblem 
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All'); // 'All', 'Solved', 'Unsolved', 'Attempted'

  // Determine attempted IDs from attempts list
  const attemptedIds = useMemo(() => {
    return Array.from(new Set(attempts.map(a => a.problemId)));
  }, [attempts]);

  // Filter problems
  const filteredProblems = useMemo(() => {
    return problems.filter(problem => {
      // Search
      const matchesSearch = 
        problem.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        problem.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
        problem.summary.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      // Topic
      if (selectedTopic !== 'All' && problem.topic !== selectedTopic) {
        return false;
      }

      // Difficulty
      if (difficultyFilter !== 'All' && problem.difficulty !== difficultyFilter) {
        return false;
      }

      // Status
      const isSolved = solvedIds.includes(problem.id);
      const isAttempted = attemptedIds.includes(problem.id);

      if (statusFilter === 'Solved' && !isSolved) return false;
      if (statusFilter === 'Unsolved' && isSolved) return false;
      if (statusFilter === 'Attempted' && (!isAttempted || isSolved)) return false;

      return true;
    });
  }, [problems, searchQuery, selectedTopic, difficultyFilter, statusFilter, solvedIds, attemptedIds]);

  const handleResetFilters = () => {
    setSearchQuery('');
    onSelectTopic('All');
    setDifficultyFilter('All');
    setStatusFilter('All');
  };

  return (
    <div className="problems-container">
      {/* Page Header */}
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.85rem', fontWeight: 800, marginBottom: '0.4rem' }}>
          Problem Bank
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Curated core problems covering Arrays, Strings, Binary Search, Linked Lists, Stacks, and Trees.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="problems-filter-bar">
        <div className="search-input-box">
          <Search size={16} />
          <input
            type="text"
            className="search-input"
            placeholder="Search problems by name, pattern, or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-group">
          {/* Topic Filter */}
          <select 
            className="filter-select"
            value={selectedTopic}
            onChange={(e) => onSelectTopic(e.target.value)}
          >
            {TOPICS.map(topic => (
              <option key={topic} value={topic}>Topic: {topic}</option>
            ))}
          </select>

          {/* Difficulty Filter */}
          <select 
            className="filter-select"
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
          >
            {DIFFICULTIES.map(diff => (
              <option key={diff} value={diff}>Difficulty: {diff}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select 
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">Status: All</option>
            <option value="Unsolved">Status: Unsolved</option>
            <option value="Solved">Status: Solved</option>
            <option value="Attempted">Status: In Progress</option>
          </select>

          {(searchQuery || selectedTopic !== 'All' || difficultyFilter !== 'All' || statusFilter !== 'All') && (
            <button 
              onClick={handleResetFilters}
              className="btn btn-ghost btn-sm"
              title="Reset all filters"
            >
              <RotateCcw size={14} />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Problems Counter Banner */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        marginBottom: '1rem',
        fontSize: '0.8rem',
        color: 'var(--text-dim)'
      }}>
        <span>Showing {filteredProblems.length} of {problems.length} problems</span>
        <span>{solvedIds.length} solved</span>
      </div>

      {/* Problem Cards List */}
      {filteredProblems.length > 0 ? (
        <div className="problems-list">
          {filteredProblems.map(problem => {
            const isSolved = solvedIds.includes(problem.id);
            const isAttempted = attemptedIds.includes(problem.id);
            const hintsUsed = hintsMap[problem.id] || 0;

            return (
              <ProblemCard
                key={problem.id}
                problem={problem}
                isSolved={isSolved}
                isAttempted={isAttempted}
                hintsUsed={hintsUsed}
                onSelect={onSelectProblem}
              />
            );
          })}
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
          <p style={{ color: 'var(--text-main)', fontWeight: 600, marginBottom: '0.5rem', fontSize: '1.1rem' }}>
            No matching problems found
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
            Try tweaking your search term, topic filter, or difficulty settings.
          </p>
          <button onClick={handleResetFilters} className="btn btn-secondary btn-sm">
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
}
