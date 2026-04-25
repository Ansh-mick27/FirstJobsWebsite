'use client';
import { useState, useEffect } from 'react';
import { Save, BookOpen, Sparkles, Loader } from 'lucide-react';
import { getAdminToken } from '../../../layout';

const IMPORTANCE = ['must', 'good', 'optional'];

const inp = () => ({
    width: '100%', padding: '0.72rem 0.9rem',
    background: 'var(--bg-elevated)', border: '1px solid var(--border)',
    borderRadius: '8px', color: 'var(--text-primary)', fontSize: '0.875rem', boxSizing: 'border-box',
});

const Label = ({ children }) => (
    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {children}
    </label>
);

function newTopic() {
    return { id: Date.now().toString(), name: '', icon: '📌', prepHours: 10, importance: 'must', subtopics: [{ name: '', importance: 'must', note: '' }] };
}

function SyllabusEditor({ syllabus, setSyllabus }) {
    function updateTopic(idx, key, val) {
        setSyllabus(prev => {
            const topics = prev.topics.map((t, i) => i === idx ? { ...t, [key]: val } : t);
            return { ...prev, topics };
        });
    }
    function deleteTopic(idx) {
        setSyllabus(prev => ({ ...prev, topics: prev.topics.filter((_, i) => i !== idx) }));
    }
    function addTopic() {
        setSyllabus(prev => ({ ...prev, topics: [...prev.topics, newTopic()] }));
    }
    function updateSubtopic(tIdx, sIdx, key, val) {
        setSyllabus(prev => {
            const topics = prev.topics.map((t, i) => {
                if (i !== tIdx) return t;
                const subtopics = t.subtopics.map((s, j) => j === sIdx ? { ...s, [key]: val } : s);
                return { ...t, subtopics };
            });
            return { ...prev, topics };
        });
    }
    function addSubtopic(tIdx) {
        setSyllabus(prev => {
            const topics = prev.topics.map((t, i) =>
                i === tIdx ? { ...t, subtopics: [...(t.subtopics || []), { name: '', importance: 'must', note: '' }] } : t
            );
            return { ...prev, topics };
        });
    }
    function deleteSubtopic(tIdx, sIdx) {
        setSyllabus(prev => {
            const topics = prev.topics.map((t, i) =>
                i === tIdx ? { ...t, subtopics: (t.subtopics || []).filter((_, j) => j !== sIdx) } : t
            );
            return { ...prev, topics };
        });
    }

    return (
        <div>
            {/* Topics */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1rem' }}>
                {(syllabus.topics || []).map((topic, tIdx) => (
                    <div key={topic.id || tIdx} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.25rem' }}>
                        {/* Topic header */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 100px auto', gap: '0.6rem', marginBottom: '0.75rem', alignItems: 'end' }}>
                            <div>
                                <Label>Topic Name *</Label>
                                <input value={topic.name} onChange={e => updateTopic(tIdx, 'name', e.target.value)} placeholder="e.g. Data Structures" style={inp()} />
                            </div>
                            <div>
                                <Label>Icon</Label>
                                <input value={topic.icon} onChange={e => updateTopic(tIdx, 'icon', e.target.value)} style={{ ...inp(), textAlign: 'center' }} />
                            </div>
                            <div>
                                <Label>Hrs</Label>
                                <input type="number" min={1} value={topic.prepHours} onChange={e => updateTopic(tIdx, 'prepHours', parseInt(e.target.value) || 1)} style={inp()} />
                            </div>
                            <div>
                                <Label>Importance</Label>
                                <select value={topic.importance} onChange={e => updateTopic(tIdx, 'importance', e.target.value)} style={inp()}>
                                    {IMPORTANCE.map(i => <option key={i} value={i}>{i}</option>)}
                                </select>
                            </div>
                            <button onClick={() => deleteTopic(tIdx)} style={{
                                marginTop: '1.3rem', background: 'none', border: '1px solid rgba(239,68,68,0.3)',
                                borderRadius: '7px', color: 'var(--danger)', padding: '0.4rem 0.6rem', cursor: 'pointer', fontSize: '0.75rem',
                            }}>✕</button>
                        </div>

                        {/* Subtopics */}
                        <div style={{ marginBottom: '0.6rem' }}>
                            <Label>Subtopics</Label>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                {(topic.subtopics || []).map((sub, sIdx) => (
                                    <div key={sIdx} style={{ display: 'grid', gridTemplateColumns: '2fr 100px 2fr auto', gap: '0.4rem', alignItems: 'center' }}>
                                        <input value={sub.name} onChange={e => updateSubtopic(tIdx, sIdx, 'name', e.target.value)} placeholder="Subtopic name" style={{ ...inp(), fontSize: '0.82rem' }} />
                                        <select value={sub.importance} onChange={e => updateSubtopic(tIdx, sIdx, 'importance', e.target.value)} style={{ ...inp(), fontSize: '0.78rem' }}>
                                            {IMPORTANCE.map(i => <option key={i} value={i}>{i}</option>)}
                                        </select>
                                        <input value={sub.note || ''} onChange={e => updateSubtopic(tIdx, sIdx, 'note', e.target.value)} placeholder="💡 Tip (optional)" style={{ ...inp(), fontSize: '0.78rem' }} />
                                        <button onClick={() => deleteSubtopic(tIdx, sIdx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', fontSize: '1rem' }}>✕</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <button onClick={() => addSubtopic(tIdx)} style={{ fontSize: '0.78rem', background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: 0 }}>
                            + Add Subtopic
                        </button>
                    </div>
                ))}
            </div>

            <button onClick={addTopic} style={{
                width: '100%', padding: '0.7rem', background: 'var(--bg-elevated)',
                border: '1px dashed var(--border)', borderRadius: '10px',
                color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.875rem',
            }}>
                + Add Topic
            </button>
        </div>
    );
}

// ── Per-role syllabus panel ──────────────────────────────────────────────────
function RoleSyllabusPanel({ companyId, companyName, role, setRoles }) {
    const [syllabus, setSyllabus] = useState(null);
    const [loaded, setLoaded] = useState(false);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState('');
    const [generating, setGenerating] = useState(false);
    const [genError, setGenError] = useState('');

    // Load role's existing syllabus once
    useEffect(() => {
        if (loaded) return;
        setLoaded(true);
        if (role.syllabus?.topics?.length > 0) {
            setSyllabus({ overview: role.syllabus.overview || '', topics: role.syllabus.topics });
        }
    }, [role, loaded]);

    function initSyllabus() {
        setSyllabus({ overview: '', topics: [newTopic()] });
    }

    async function handleGenerate() {
        setGenerating(true); setGenError('');
        try {
            const res = await fetch('/api/admin/generate-syllabus', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-admin-key': getAdminToken() },
                body: JSON.stringify({
                    companyName: companyName || companyId,
                    roleName: role.name,
                    roundTypes: role.roundTypes || [],
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Generation failed');
            setSyllabus({ overview: data.overview || '', topics: data.topics || [] });
        } catch (err) {
            setGenError(err.message || 'AI generation failed. Try again.');
        }
        setGenerating(false);
    }

    async function saveSyllabus() {
        if (!syllabus) return;
        setSaving(true); setMsg('');
        try {
            const topics = syllabus.topics.filter(t => t.name?.trim());
            const res = await fetch(`/api/admin/companies/${companyId}/roles/${role.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'x-admin-key': getAdminToken() },
                body: JSON.stringify({ syllabus: { overview: syllabus.overview || '', topics } }),
            });
            if (res.ok) {
                setMsg('Saved ✓');
                if (setRoles) {
                    setRoles(prev => prev.map(r => r.id === role.id ? { ...r, syllabus: { overview: syllabus.overview || '', topics } } : r));
                }
            } else {
                setMsg('Error saving.');
            }
        } catch { setMsg('Error saving.'); }
        setSaving(false);
        setTimeout(() => setMsg(''), 2500);
    }

    const AiBtn = ({ label = 'AI Generate' }) => (
        <button
            type="button"
            onClick={handleGenerate}
            disabled={generating}
            title="Auto-generate a full syllabus using AI"
            style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.55rem 1rem',
                background: generating ? 'var(--bg-elevated)' : 'linear-gradient(135deg, #7c3aed, #a855f7)',
                color: generating ? 'var(--text-muted)' : '#fff',
                border: generating ? '1px solid var(--border)' : '1px solid transparent',
                borderRadius: '8px', fontWeight: 600, fontSize: '0.82rem',
                cursor: generating ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s', flexShrink: 0,
            }}
        >
            {generating
                ? <><Loader size={13} style={{ animation: 'spin 1s linear infinite' }} /> Generating…</>
                : <><Sparkles size={13} /> {label}</>
            }
        </button>
    );

    if (!syllabus) {
        return (
            <div style={{ textAlign: 'center', padding: '3rem 2rem', maxWidth: '420px', margin: '0 auto' }}>
                <div style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}><BookOpen size={32} /></div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>No syllabus for {role.name} yet</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem', lineHeight: 1.55 }}>Generate a full syllabus instantly with AI, or start from scratch.</p>
                <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <AiBtn label="✨ Generate with AI" />
                    <button onClick={initSyllabus} style={{
                        padding: '0.55rem 1.1rem', background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                        borderRadius: '8px', color: 'var(--text-secondary)', fontSize: '0.82rem', cursor: 'pointer',
                    }}>Start Blank</button>
                </div>
                {genError && <p style={{ fontSize: '0.78rem', color: 'var(--danger)', marginTop: '0.75rem' }}>⚠ {genError}</p>}
            </div>
        );
    }

    return (
        <div>
            {/* Row: overview + AI regenerate */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <div style={{ flex: 1 }}>
                    <Label>Overview (optional, role-specific note)</Label>
                    <textarea
                        value={syllabus.overview || ''}
                        onChange={e => setSyllabus(p => ({ ...p, overview: e.target.value }))}
                        rows={2} placeholder={`e.g. Focus areas for ${role.name} interview round…`}
                        style={{ ...inp(), resize: 'vertical' }}
                    />
                </div>
                <div style={{ marginTop: '1.5rem', flexShrink: 0 }}>
                    <AiBtn label="Regenerate" />
                </div>
            </div>
            {genError && <p style={{ fontSize: '0.78rem', color: 'var(--danger)', marginBottom: '0.75rem' }}>⚠ {genError}</p>}
            <SyllabusEditor syllabus={syllabus} setSyllabus={setSyllabus} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button onClick={saveSyllabus} disabled={saving} style={{
                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                    padding: '0.65rem 1.25rem', background: 'var(--primary)', color: '#fff',
                    border: 'none', borderRadius: '9px', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer',
                    opacity: saving ? 0.7 : 1,
                }}>
                    <Save size={14} /> {saving ? 'Saving…' : `Save ${role.name} Syllabus`}
                </button>
                {msg && <span style={{ fontSize: '0.82rem', color: msg.startsWith('Error') ? 'var(--danger)' : 'var(--success)' }}>{msg}</span>}
            </div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}

// ── Main SyllabusTab ─────────────────────────────────────────────────────────
export default function SyllabusTab({ companyId, companyName, roles = [], rolesLoading, setRoles }) {
    const [scope, setScope] = useState(null);

    // Default to the first role if none is selected and roles exist
    useEffect(() => {
        if (!scope && roles?.length > 0) {
            setScope(roles[0].id);
        }
    }, [roles, scope]);

    const activeRole = roles.find(r => r.id === scope) || null;

    return (
        <div style={{ padding: '2rem', maxWidth: '800px' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <div>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
                        Syllabus
                    </h2>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Manage study topics for the whole company or per role.
                    </p>
                </div>
            </div>

            {/* Scope selector */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1.75rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                {rolesLoading && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', alignSelf: 'center' }}>Loading roles…</span>}
                {!rolesLoading && roles.map(role => (
                    <button
                        key={role.id}
                        onClick={() => setScope(role.id)}
                        style={{
                            padding: '0.35rem 0.9rem', borderRadius: '999px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
                            background: scope === role.id ? 'var(--primary)' : 'var(--bg-elevated)',
                            color: scope === role.id ? '#fff' : 'var(--text-secondary)',
                            border: `1px solid ${scope === role.id ? 'var(--primary)' : 'var(--border)'}`,
                        }}
                    >
                        {role.name}
                    </button>
                ))}
                {!rolesLoading && roles.length === 0 && (
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', alignSelf: 'center' }}>
                        No roles defined yet — add them in the Roles tab.
                    </span>
                )}
            </div>

            {/* Panel */}
            {activeRole ? (
                <RoleSyllabusPanel
                    key={activeRole.id}
                    companyId={companyId}
                    companyName={companyName}
                    role={activeRole}
                    setRoles={setRoles}
                />
            ) : !rolesLoading ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No roles available. Please create a role first.
                </div>
            ) : null}
        </div>
    );
}

function EmptyState({ icon, title, desc, actionLabel, onAction }) {
    return (
        <div style={{ textAlign: 'center', padding: '3rem 2rem', maxWidth: '420px', margin: '0 auto' }}>
            <div style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>{icon}</div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>{title}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem', lineHeight: 1.55 }}>{desc}</p>
            <button onClick={onAction} style={{
                padding: '0.7rem 1.5rem', background: 'var(--primary)', color: '#fff',
                border: 'none', borderRadius: '9px', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem',
            }}>
                {actionLabel}
            </button>
        </div>
    );
}
