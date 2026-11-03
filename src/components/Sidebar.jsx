import React from 'react';
import { 
  LayoutDashboard, 
  Code2, 
  LineChart, 
  Cpu, 
  X, 
  RotateCcw, 
  Sparkles,
  CheckCircle2,
  Compass
} from 'lucide-react';

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  mobileOpen, 
  setMobileOpen,
  onSeedDemo,
  onResetData,
  solvedCount = 0,
  totalProblems = 10,
  dueRevisionCount = 0
}) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: dueRevisionCount > 0 ? `${dueRevisionCount} Due` : null },
    { id: 'problems', label: 'Problems', icon: Code2 },
    { id: 'roadmap', label: 'Roadmap', icon: Compass },
    { id: 'progress', label: 'Progress', icon: LineChart },
  ];

  const handleNavClick = (tabId) => {
    setActiveTab(tabId);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(4px)',
            zIndex: 95
          }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        {/* Brand Header */}
        <div className="sidebar-brand">
          <div className="brand-icon-box">
            <Cpu size={20} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="brand-title">
              Adaptive<span style={{ color: 'var(--accent-primary)' }}>DSA</span>
            </div>
          </div>
          <span className="brand-badge">MVP</span>
          {mobileOpen && (
            <button 
              onClick={() => setMobileOpen(false)}
              className="btn btn-ghost btn-sm"
              style={{ padding: '0.25rem', marginLeft: 'auto' }}
              aria-label="Close Sidebar"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="sidebar-nav">
          <div style={{ 
            fontSize: '0.7rem', 
            fontWeight: 700, 
            textTransform: 'uppercase', 
            color: 'var(--text-dim)', 
            padding: '0.25rem 0.75rem',
            letterSpacing: '0.06em' 
          }}>
            Navigation
          </div>

          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`nav-item ${isActive ? 'active' : ''}`}
                style={{ justifyContent: 'space-between' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <Icon size={18} className="nav-icon" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="badge" style={{ background: 'rgba(253, 224, 71, 0.15)', color: '#FDE047', fontSize: '0.675rem', padding: '0.1rem 0.4rem' }}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* Quick Problem Progress Metric */}
          <div style={{ 
            marginTop: 'auto', 
            padding: '1rem', 
            background: 'var(--bg-surface)', 
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)' 
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.775rem', fontWeight: 600, color: 'var(--text-muted)' }}>Curriculum</span>
              <span style={{ fontSize: '0.775rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--accent-success)' }}>
                {solvedCount}/{totalProblems}
              </span>
            </div>
            <div className="progress-track" style={{ height: '6px' }}>
              <div 
                className="progress-fill" 
                style={{ width: `${(solvedCount / totalProblems) * 100}%` }}
              />
            </div>
          </div>
        </nav>

        {/* Footer Quick Actions */}
        <div className="sidebar-footer">
          <div className="sidebar-demo-badge">
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span className="status-dot"></span> Local Storage
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--accent-primary)' }}>
              v1.0 Demo
            </span>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              onClick={onSeedDemo} 
              className="btn btn-secondary btn-sm"
              style={{ flex: 1, fontSize: '0.725rem', padding: '0.4rem 0.5rem' }}
              title="Populate demo data with sample attempts and heatmap"
            >
              <Sparkles size={13} style={{ color: 'var(--accent-primary)' }} />
              Demo Data
            </button>
            <button 
              onClick={onResetData} 
              className="btn btn-ghost btn-sm"
              style={{ fontSize: '0.725rem', padding: '0.4rem 0.5rem' }}
              title="Reset all progress to zero"
            >
              <RotateCcw size={13} />
              Reset
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
