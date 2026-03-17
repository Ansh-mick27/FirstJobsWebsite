'use client';
import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

/**
 * ConfirmModal — reusable danger confirmation dialog
 * Props:
 *   open: boolean
 *   onClose: () => void
 *   onConfirm: () => void
 *   title: string
 *   message: ReactNode
 *   confirmLabel?: string
 *   loading?: boolean
 */
export default function ConfirmModal({
    open, onClose, onConfirm,
    title, message,
    confirmLabel = 'Delete',
    loading = false,
}) {
    useEffect(() => {
        if (!open) return;
        const handler = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div
            style={{
                position: 'fixed', inset: 0, zIndex: 1100,
                background: 'rgba(0,0,0,0.72)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '1.5rem',
            }}
            onClick={onClose}
        >
            <div
                style={{
                    background: 'var(--bg-surface)', border: '1px solid var(--border)',
                    borderRadius: '16px', padding: '2rem', maxWidth: '420px', width: '100%',
                    animation: 'confirmModalIn 0.18s ease',
                }}
                onClick={e => e.stopPropagation()}
            >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '1rem' }}>
                    <div style={{
                        width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
                        background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <AlertTriangle size={18} color="var(--danger)" />
                    </div>
                    <div>
                        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                            {title}
                        </h2>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.55 }}>
                            {message}
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '0.6rem 1.2rem',
                            background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                            borderRadius: '8px', color: 'var(--text-secondary)', cursor: 'pointer',
                            fontSize: '0.875rem', fontWeight: 500,
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        style={{
                            padding: '0.6rem 1.2rem',
                            background: 'var(--danger)', border: 'none',
                            borderRadius: '8px', color: '#fff', cursor: loading ? 'not-allowed' : 'pointer',
                            fontSize: '0.875rem', fontWeight: 600,
                            opacity: loading ? 0.7 : 1,
                        }}
                    >
                        {loading ? 'Deleting…' : confirmLabel}
                    </button>
                </div>
            </div>
            <style>{`
                @keyframes confirmModalIn {
                    from { transform: scale(0.95); opacity: 0; }
                    to   { transform: scale(1);    opacity: 1; }
                }
            `}</style>
        </div>
    );
}
