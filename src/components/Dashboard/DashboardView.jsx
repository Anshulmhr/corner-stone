import React from 'react';
import { 
  CheckCircle2, 
  Target, 
  Flame, 
  Lightbulb, 
  ArrowRight,
  TrendingUp,
  Cpu,
  Compass
} from 'lucide-react';
import MetricCard from './MetricCard';
import RecommendationCard from './RecommendationCard';
import TopicMasteryList from './TopicMasteryList';
import ActivityHeatmap from './ActivityHeatmap';
import RevisionDashboard from '../Revision/RevisionDashboard';

export default function DashboardView({ 
  metrics, 
  recommendation, 
  topicStats, 
  heatmapData, 
  revisionPipeline,
  onRefresh,
  onStartSolving,
  onNavigateProblems,
  onNavigateRoadmap,
  onSelectTopicFilter
}) {
  return (
    <div className="dashboard-container">
      {/* Dashboard Top Header */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-heading">Think deeper. Code smarter.</h1>
          <p className="dashboard-subheading">
            Adaptive DSA tracks your cognitive patterns, reveals targeted hints on demand, and calibrates your curriculum toward algorithmic mastery.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', alignSelf: 'flex-start' }}>
          {onNavigateRoadmap && (
            <button 
              onClick={onNavigateRoadmap}
              className="btn btn-secondary"
            >
              <Compass size={16} style={{ color: 'var(--accent-primary)' }} />
              <span>Adaptive Roadmap</span>
            </button>
          )}
          <button 
            onClick={onNavigateProblems}
            className="btn btn-ghost"
          >
            <span>Browse 10 Problems</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="metrics-grid">
        <MetricCard
          title="Problems Solved"
          value={`${metrics.uniqueSolved} / ${metrics.totalProblems}`}
          context={`${metrics.completionPercentage}% of core curriculum completed`}
          icon={CheckCircle2}
          accent="success"
        />
        <MetricCard
          title="Attempt Accuracy"
          value={`${metrics.overallAccuracy}%`}
          context={`Self-reported • ${metrics.successfulAttempts} solves / ${metrics.totalAttempts} total attempts`}
          icon={Target}
          accent="secondary"
        />
        <MetricCard
          title="Hint Reliance"
          value={`${metrics.avgHintsPerProblem} / prob`}
          context={`${metrics.totalHintsUnlocked} total hints unlocked across all problems`}
          icon={Lightbulb}
          accent="primary"
        />
        <MetricCard
          title="Active Practice"
          value={`${metrics.totalAttempts}`}
          context={`Recorded code attempts in local storage`}
          icon={TrendingUp}
          accent="warning"
        />
      </div>

      {/* Distinctive Recommendation Card */}
      <RecommendationCard 
        recommendation={recommendation} 
        onStartSolving={onStartSolving} 
      />

      {/* Adaptive Revision and Spaced Retention Section */}
      <RevisionDashboard 
        revisionPipeline={revisionPipeline}
        onRefresh={onRefresh}
        onNavigateProblems={onNavigateProblems}
      />

      {/* Two-Column Section: Topic Mastery & Activity Heatmap */}
      <div className="dashboard-grid">
        <div>
          <TopicMasteryList 
            topics={topicStats} 
            onSelectTopic={(topic) => {
              onSelectTopicFilter(topic);
              onNavigateProblems();
            }} 
          />
        </div>
        <div>
          <ActivityHeatmap heatmapData={heatmapData} />
        </div>
      </div>
    </div>
  );
}
