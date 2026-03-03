'use client';

import { useEffect, useState } from 'react';

export default function XPBar({
    progress = 0,
    max = 100,
    label = "Progress",
    level = 1,
    color = "primary" // primary, accent, success, info
}) {
    const [width, setWidth] = useState(0);

    useEffect(() => {
        // Animation effect on mount or progress change
        const percentage = Math.min(100, Math.max(0, (progress / max) * 100));
        setTimeout(() => setWidth(percentage), 100);
    }, [progress, max]);

    // Dynamic style based on color prop
    const colorStyles = {
        primary: { fill: 'var(--primary)', glow: 'var(--primary-glow)', border: 'var(--border-active)' },
        accent: { fill: 'var(--accent)', glow: 'var(--accent-glow)', border: 'var(--accent)' },
        success: { fill: 'var(--success)', glow: 'rgba(16, 185, 129, 0.4)', border: 'var(--success)' },
        info: { fill: 'var(--info)', glow: 'rgba(56, 189, 248, 0.4)', border: 'var(--info)' }
    };

    const currentStyle = colorStyles[color] || colorStyles.primary;

    return (
        <div style={{ width: '100%', marginBottom: '16px' }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                marginBottom: '8px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        color: currentStyle.fill,
                        background: currentStyle.glow,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        textTransform: 'uppercase',
                        letterSpacing: '1px'
                    }}>
                        LVL {level}
                    </span>
                    <span style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '0.875rem',
                        color: 'var(--text-primary)',
                        fontWeight: '600'
                    }}>
                        {label}
                    </span>
                </div>
                <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.875rem',
                    color: 'var(--text-secondary)'
                }}>
                    {progress} / {max} <span style={{ color: 'var(--text-muted)' }}>XP</span>
                </span>
            </div>

            <div style={{
                height: '14px',
                width: '100%',
                background: 'var(--bg-overlay)',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                overflow: 'hidden',
                position: 'relative',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)'
            }}>
                {/* Slanted lines pattern for arcade feel inside the bar */}
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.1) 10px, rgba(0,0,0,0.1) 20px)',
                    zIndex: 2,
                    pointerEvents: 'none'
                }}></div>

                <div style={{
                    height: '100%',
                    width: `${width}%`,
                    background: currentStyle.fill,
                    boxShadow: `0 0 10px ${currentStyle.glow}, inset 0 2px 2px rgba(255,255,255,0.4), inset 0 -2px 2px rgba(0,0,0,0.2)`,
                    borderRadius: '6px',
                    transition: 'width 1s cubic-bezier(0.2, 0.8, 0.2, 1)',
                    position: 'relative',
                    zIndex: 1
                }}>
                    {/* Highlight on top edge of fill */}
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '2px',
                        background: 'rgba(255,255,255,0.4)'
                    }}></div>
                </div>
            </div>
        </div>
    );
}
