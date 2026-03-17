'use client';

/**
 * TabBar — horizontal tab navigation
 * Props:
 *   tabs: { id: string, label: string, badge?: number | string }[]
 *   active: string  (id of active tab)
 *   onChange: (id: string) => void
 */
export default function TabBar({ tabs, active, onChange }) {
    return (
        <div style={{
            display: 'flex',
            borderBottom: '1px solid var(--border)',
            background: 'var(--bg-surface)',
            padding: '0 2rem',
            gap: '0',
            overflowX: 'auto',
        }}>
            {tabs.map(tab => {
                const isActive = tab.id === active;
                return (
                    <button
                        key={tab.id}
                        onClick={() => onChange(tab.id)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.45rem',
                            padding: '0.9rem 1.25rem',
                            background: 'none',
                            border: 'none',
                            borderBottom: `2px solid ${isActive ? 'var(--primary)' : 'transparent'}`,
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            fontWeight: isActive ? 600 : 400,
                            color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                            transition: 'all 0.15s',
                            whiteSpace: 'nowrap',
                            marginBottom: '-1px', // overlap the border-bottom
                        }}
                        onMouseEnter={e => {
                            if (!isActive) e.currentTarget.style.color = 'var(--text-secondary)';
                        }}
                        onMouseLeave={e => {
                            if (!isActive) e.currentTarget.style.color = 'var(--text-muted)';
                        }}
                    >
                        {tab.icon && <span style={{ display: 'flex', alignItems: 'center' }}>{tab.icon}</span>}
                        {tab.label}
                        {tab.badge != null && (
                            <span style={{
                                fontSize: '0.7rem',
                                padding: '0.1rem 0.42rem',
                                borderRadius: '99px',
                                background: isActive ? 'var(--primary)' : 'var(--bg-elevated)',
                                color: isActive ? '#fff' : 'var(--text-muted)',
                                fontWeight: 600,
                                minWidth: '18px',
                                textAlign: 'center',
                            }}>
                                {tab.badge}
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}
