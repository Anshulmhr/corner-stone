import React, { useState } from 'react';
import { Calendar, Flame } from 'lucide-react';

export default function ActivityHeatmap({ heatmapData = [] }) {
  const [hoveredDay, setHoveredDay] = useState(null);

  // Total attempts in the 28 days
  const totalPeriodAttempts = heatmapData.reduce((sum, d) => sum + d.count, 0);
  const activeDays = heatmapData.filter(d => d.count > 0).length;

  return (
    <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div 
              style={{ 
                width: '28px', 
                height: '28px', 
                borderRadius: 'var(--radius-sm)', 
                background: 'rgba(167, 139, 250, 0.1)',
                color: 'var(--accent-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(167, 139, 250, 0.2)'
              }}
            >
              <Calendar size={15} />
            </div>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Practice Activity</h3>
              <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>Last 4 weeks cadence</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: 600 }}>
            <Flame size={14} />
            <span>{activeDays} Active Days</span>
          </div>
        </div>

        <div className="heatmap-container">
          <div className="heatmap-grid">
            {heatmapData.map((day, idx) => (
              <div
                key={day.date || idx}
                className={`heatmap-cell level-${day.level}`}
                onMouseEnter={() => setHoveredDay(day)}
                onMouseLeave={() => setHoveredDay(null)}
                title={`${day.displayDate}: ${day.count} attempts (${day.solves} solves)`}
              />
            ))}
          </div>

          <div className="heatmap-legend">
            <span>Less</span>
            <div className="legend-box level-0" style={{ background: 'var(--bg-surface)' }} />
            <div className="legend-box" style={{ background: 'rgba(167, 139, 250, 0.3)' }} />
            <div className="legend-box" style={{ background: 'rgba(167, 139, 250, 0.55)' }} />
            <div className="legend-box" style={{ background: 'rgba(167, 139, 250, 0.8)' }} />
            <div className="legend-box" style={{ background: 'var(--accent-primary)' }} />
            <span>More</span>
          </div>
        </div>
      </div>

      <div style={{ 
        marginTop: '1rem', 
        padding: '0.65rem 0.85rem', 
        background: 'var(--bg-surface)', 
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-subtle)',
        fontSize: '0.775rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {hoveredDay ? (
          <>
            <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
              {hoveredDay.dayOfWeek}, {hoveredDay.displayDate}
            </span>
            <span style={{ color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)' }}>
              {hoveredDay.count} attempts • {hoveredDay.solves} solves
            </span>
          </>
        ) : (
          <>
            <span style={{ color: 'var(--text-dim)' }}>Hover a square for details</span>
            <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              {totalPeriodAttempts} total attempts recorded
            </span>
          </>
        )}
      </div>
    </div>
  );
}
