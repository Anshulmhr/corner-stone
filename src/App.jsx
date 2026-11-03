import React, { useState, useEffect, useCallback } from 'react';
import { PROBLEMS } from './data/problems';
import { 
  getSolvedProblems, 
  getAttempts, 
  getUnlockedHints, 
  clearAllProgress 
} from './services/storage';
import { 
  getTopicStats, 
  getOverallMetrics, 
  getAdaptiveRecommendation, 
  getActivityHeatmapData,
  getMistakePatternStats
} from './services/adaptiveEngine';
import { getRevisionPipeline } from './services/revisionService';

import { isDemoProfile, switchProgressProfile } from './services/progressProfile.js';
import PilotPanel from './components/PilotPanel';
import { openPilotProblem } from './services/pilot.js';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import DashboardView from './components/Dashboard/DashboardView';
import ProblemsView from './components/Problems/ProblemsView';
import ProblemSolverView from './components/Solver/ProblemSolverView';
import ProgressView from './components/Progress/ProgressView';
import RoadmapView from './components/Roadmap/RoadmapView';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'problems' | 'roadmap' | 'progress' | 'solver'
  const [pilotView, setPilotView] = useState(null);
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [selectedTopicFilter, setSelectedTopicFilter] = useState('All');
  const [mobileOpen, setMobileOpen] = useState(false);

  // App reactive state
  const [solvedIds, setSolvedIds] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [hintsMap, setHintsMap] = useState({});
  const [metrics, setMetrics] = useState(() => getOverallMetrics());
  const [topicStats, setTopicStats] = useState(() => getTopicStats());
  const [recommendation, setRecommendation] = useState(() => getAdaptiveRecommendation());
  const [heatmapData, setHeatmapData] = useState(() => getActivityHeatmapData());
  const [revisionPipeline, setRevisionPipeline] = useState(() => getRevisionPipeline());
  const [mistakePatternStats, setMistakePatternStats] = useState(() => getMistakePatternStats());

  // Function to refresh state from localStorage
  const refreshAppState = useCallback(() => {
    const solved = getSolvedProblems();
    const atts = getAttempts();
    
    const hMap = {};
    PROBLEMS.forEach(p => {
      hMap[p.id] = getUnlockedHints(p.id);
    });

    setSolvedIds(solved);
    setAttempts(atts);
    setHintsMap(hMap);
    setMetrics(getOverallMetrics());
    setTopicStats(getTopicStats());
    setRecommendation(getAdaptiveRecommendation());
    setHeatmapData(getActivityHeatmapData());
    setRevisionPipeline(getRevisionPipeline());
    setMistakePatternStats(getMistakePatternStats());
  }, []);

  // Initial load and localStorage listener
  useEffect(() => {
    refreshAppState();

    const handleStorageChange = () => {
      refreshAppState();
    };

    window.addEventListener('adaptivedsa_storage_updated', handleStorageChange);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('adaptivedsa_storage_updated', handleStorageChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [refreshAppState]);

  // Navigate to problem solver
  const handleStartSolving = (problem, recommendationId) => {
    setPilotView(openPilotProblem(problem.id, recommendationId));
    setSelectedProblem(problem);
    setActiveTab('solver');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Back from problem solver to problems list
  const handleBackToProblems = () => {
    setActiveTab('problems');
  };

  const handleResetData = () => {
    const profile = isDemoProfile ? 'demo' : 'personal';
    if (window.confirm(`Clear all ${profile} progress, including drafts, reflections and active challenges?`)) {
      clearAllProgress();
      window.location.reload();
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <Sidebar 
        activeTab={activeTab === 'solver' ? 'problems' : activeTab}
        setActiveTab={setActiveTab}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        onSwitchProfile={switchProgressProfile}
        onResetData={handleResetData}
        solvedCount={metrics.uniqueSolved}
        totalProblems={PROBLEMS.length}
        dueRevisionCount={revisionPipeline.totalDueCount}
      />

      {/* Main Content Area */}
      <div className="main-content">
        {/* Top Navbar */}
        <Navbar 
          activeTab={activeTab}
          setMobileOpen={setMobileOpen}
          currentProblem={selectedProblem}
          overallAccuracy={metrics.overallAccuracy}
          solvedCount={metrics.uniqueSolved}
          totalProblems={PROBLEMS.length}
          dueRevisionCount={revisionPipeline.totalDueCount}
          onNavigateProblems={() => setActiveTab('problems')}
        />

        {isDemoProfile && (
          <div className="demo-profile-banner" role="status">
            <strong>Demo profile</strong> Practice here is saved only in this tab.
            <button className="btn btn-secondary btn-sm" onClick={switchProgressProfile}>Return to my progress</button>
          </div>
        )}

        {/* View Routing */}
        <main className="page-wrapper">
          {activeTab === 'dashboard' && (
            <DashboardView 
              metrics={metrics}
              recommendation={recommendation}
              topicStats={topicStats}
              heatmapData={heatmapData}
              revisionPipeline={revisionPipeline}
              onRefresh={refreshAppState}
              onStartSolving={handleStartSolving}
              onNavigateProblems={() => setActiveTab('problems')}
              onNavigateRoadmap={() => setActiveTab('roadmap')}
              onSelectTopicFilter={setSelectedTopicFilter}
            />
          )}

          {activeTab === 'dashboard' && !isDemoProfile && <PilotPanel />}

          {activeTab === 'problems' && (
            <ProblemsView 
              problems={PROBLEMS}
              solvedIds={solvedIds}
              attempts={attempts}
              hintsMap={hintsMap}
              selectedTopic={selectedTopicFilter}
              onSelectTopic={setSelectedTopicFilter}
              onSelectProblem={handleStartSolving}
            />
          )}

          {activeTab === 'roadmap' && (
            <RoadmapView 
              topicStats={topicStats}
              solvedIds={solvedIds}
              attempts={attempts}
              onSelectProblem={handleStartSolving}
              onNavigateProblems={() => setActiveTab('problems')}
            />
          )}

          {activeTab === 'solver' && selectedProblem && (
            <ProblemSolverView
              key={selectedProblem.id}
              pilotView={pilotView}
              problem={selectedProblem}
              onBack={handleBackToProblems}
              onNavigateNext={handleStartSolving}
              recommendation={recommendation}
            />
          )}

          {activeTab === 'progress' && (
            <ProgressView 
              metrics={metrics}
              topicStats={topicStats}
              attempts={attempts}
              solvedIds={solvedIds}
              hintsMap={hintsMap}
              mistakePatternStats={mistakePatternStats}
              onSwitchProfile={switchProgressProfile}
              onResetData={handleResetData}
              onSelectProblem={handleStartSolving}
            />
          )}
        </main>
      </div>
    </div>
  );
}
