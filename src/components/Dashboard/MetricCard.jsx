import React from 'react';

export default function MetricCard({ title, value, context, icon: Icon, accent = 'primary' }) {
  const accentColors = {
    primary: {
      bg: 'rgba(167, 139, 250, 0.12)',
      color: '#A78BFA',
      border: 'rgba(167, 139, 250, 0.25)'
    },
    secondary: {
      bg: 'rgba(103, 232, 249, 0.12)',
      color: '#67E8F9',
      border: 'rgba(103, 232, 249, 0.25)'
    },
    success: {
      bg: 'rgba(134, 239, 172, 0.12)',
      color: '#86EFAC',
      border: 'rgba(134, 239, 172, 0.25)'
    },
    warning: {
      bg: 'rgba(253, 224, 71, 0.12)',
      color: '#FDE047',
      border: 'rgba(253, 224, 71, 0.25)'
    }
  };

  const currentTheme = accentColors[accent] || accentColors.primary;

  return (
    <div className="metric-card">
      <div className="metric-header">
        <span className="metric-title">{title}</span>
        {Icon && (
          <div 
            className="metric-icon-wrapper" 
            style={{ 
              background: currentTheme.bg, 
              color: currentTheme.color,
              border: `1px solid ${currentTheme.border}`
            }}
          >
            <Icon size={16} />
          </div>
        )}
      </div>
      <div className="metric-value-row">
        <span className="metric-value">{value}</span>
      </div>
      {context && <div className="metric-context">{context}</div>}
    </div>
  );
}
