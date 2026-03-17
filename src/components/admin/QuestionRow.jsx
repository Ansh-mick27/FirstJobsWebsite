'use client';
import { Edit3, Trash2 } from 'lucide-react';

const typeBadgeColor = { mcq: '#6366f1', coding: 'var(--info)', subjective: 'var(--success)' };
const diffColor = { Easy: 'var(--success)', Medium: '#f59e0b', Hard: 'var(--danger)' };
const roundColor = { oa: '#a78bfa', technical: 'var(--info)', hr: 'var(--success)' };

/**
 * QuestionRow — compact question list item
 * Props:
 *   question: { id, text, type, round, difficulty, year, tags, roleId }
 *   roles?: { id, name }[]  (to resolve roleId → name)
 *   onEdit: () => void
 *   onDelete: () => void
 */
export default function QuestionRow({ question: q, roles = [], onEdit, onDelete }) {
    const roleName = q.roleId ? (roles.find(r => r.id === q.roleId)?.name || q.roleId) : null;

    const badge = (text, color, bg) => (
        <span style={{
            fontSize: '0.68rem', fontWeight: 600, padding: '2px 7px',
            borderRadius: '4px', background: bg, color, whiteSpace: 'nowrap',
        }}>{text}</span>
    );

    return (
        <div style={{
            display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
            padding: '0.9rem 1rem',
            borderBottom: '1px solid var(--border)',
            transition: 'background 0.12s',
        }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
            {/* Text */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                    fontSize: '0.875rem', color: 'var(--text-primary)',
                    lineHeight: 1.45, marginBottom: '0.4rem',
                    overflow: 'hidden', textOverflow: 'ellipsis',
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                }}>
                    {q.text}
                </p>
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    {badge(
                        q.round?.toUpperCase(),
                        roundColor[q.round] || 'var(--text-muted)',
                        `${roundColor[q.round] || 'var(--text-muted)'}22`
                    )}
                    {badge(
                        q.type?.toUpperCase(),
                        typeBadgeColor[q.type] || 'var(--text-muted)',
                        `${typeBadgeColor[q.type] || '#fff'}22`
                    )}
                    {badge(
                        q.difficulty,
                        diffColor[q.difficulty] || 'var(--text-muted)',
                        `${diffColor[q.difficulty] || '#fff'}18`
                    )}
                    {q.year && (
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{q.year}</span>
                    )}
                    {roleName && (
                        <span style={{
                            fontSize: '0.68rem', color: '#a78bfa',
                            background: 'rgba(124,58,237,0.12)', padding: '2px 6px',
                            borderRadius: '4px', border: '1px solid rgba(124,58,237,0.25)',
                        }}>
                            {roleName}
                        </span>
                    )}
                    {q.isReal && (
                        <span style={{ fontSize: '0.65rem', color: 'var(--success)', fontWeight: 600 }}>✓ PYQ</span>
                    )}
                </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.35rem', flexShrink: 0, marginTop: '2px' }}>
                <button
                    onClick={onEdit}
                    title="Edit"
                    style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: '30px', height: '30px',
                        background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                        borderRadius: '7px', color: 'var(--text-secondary)', cursor: 'pointer',
                        transition: 'all 0.12s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.color = 'var(--primary)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                >
                    <Edit3 size={12} />
                </button>
                <button
                    onClick={onDelete}
                    title="Delete"
                    style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: '30px', height: '30px',
                        background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                        borderRadius: '7px', color: 'var(--danger)', cursor: 'pointer',
                        transition: 'all 0.12s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--danger)'; e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-elevated)'; }}
                >
                    <Trash2 size={12} />
                </button>
            </div>
        </div>
    );
}
