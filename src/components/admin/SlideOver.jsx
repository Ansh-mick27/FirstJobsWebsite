'use client';
import { useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * SlideOver — a right-side drawer panel
 * Props:
 *   open: boolean
 *   onClose: () => void
 *   title: string
 *   width?: string  (default '540px')
 *   children: ReactNode
 */
export default function SlideOver({ open, onClose, title, width = '540px', children }) {
    // Lock body scroll when open
    useEffect(() => {
        if (open) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [open]);

    // Close on Escape
    useEffect(() => {
        if (!open) return;
        const handler = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            display: 'flex', alignItems: 'stretch',
        }}>
            {/* Backdrop */}
            <div
                onClick={onClose}
                style={{
                    position: 'absolute', inset: 0,
                    background: 'rgba(0,0,0,0.65)',
                    backdropFilter: 'blur(2px)',
                }}
            />

            {/* Panel */}
            <div style={{
                position: 'absolute', top: 0, right: 0, bottom: 0,
                width, maxWidth: '100vw',
                background: 'var(--bg-surface)',
                borderLeft: '1px solid var(--border)',
                display: 'flex', flexDirection: 'column',
                animation: 'slideOverIn 0.22s ease',
                boxShadow: '-8px 0 32px rgba(0,0,0,0.35)',
            }}>
                {/* Header */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '1.1rem 1.5rem',
                    borderBottom: '1px solid var(--border)',
                    flexShrink: 0,
                }}>
                    <span style={{
                        fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700,
                        color: 'var(--text-primary)',
                    }}>{title}</span>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none', border: '1px solid var(--border)', borderRadius: '7px',
                            padding: '0.3rem', cursor: 'pointer', color: 'var(--text-muted)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--danger)'; e.currentTarget.style.color = 'var(--danger)'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Scrollable content */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
                    {children}
                </div>
            </div>

            <style>{`
                @keyframes slideOverIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to   { transform: translateX(0);    opacity: 1; }
                }
            `}</style>
        </div>
    );
}
