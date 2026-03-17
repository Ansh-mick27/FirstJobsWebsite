'use client';
import { useState } from 'react';
import { Save, BookOpen } from 'lucide-react';

const IMPORTANCE = ['must', 'good', 'optional'];
const importanceColor = { must: 'var(--danger)', good: '#f59e0b', optional: 'var(--text-muted)' };

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

export default function SyllabusTab({ companyId, syllabus, setSyllabus, onSave, saving, saveMsg }) {

    function initSyllabus() {
        setSyllabus({ overview: '', topics: [newTopic()] });
    }

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
                i === tIdx ? { ...t, subtopics: [...t.subtopics, { name: '', importance: 'must', note: '' }] } : t
            );
            return { ...prev, topics };
        });
    }
    function deleteSubtopic(tIdx, sIdx) {
        setSyllabus(prev => {
            const topics = prev.topics.map((t, i) =>
                i === tIdx ? { ...t, subtopics: t.subtopics.filter((_, j) => j !== sIdx) } : t
            );
            return { ...prev, topics };
        });
    }

    if (!syllabus) {
        return (
            <div style={{ padding: '2rem' }}>
                <EmptyState
                    icon={<BookOpen size={32} />}
                    title="No company-wide syllabus yet"
                    desc="Create a syllabus to show students what to study across all roles."
                    actionLabel="+ Create Syllabus"
                    onAction={initSyllabus}
                />
            </div>
        );
    }

    return (
        <div style={{ padding: '2rem', maxWidth: '800px' }}>
            {/* Header actions */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem' }}>
                <div>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
                        Company Syllabus
                    </h2>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Visible to students on the company overview page. Applies to all roles.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    {saveMsg && <span style={{ fontSize: '0.82rem', color: saveMsg.startsWith('Error') ? 'var(--danger)' : 'var(--success)' }}>{saveMsg}</span>}
                    <button onClick={onSave} disabled={saving} style={{
                        display: 'flex', alignItems: 'center', gap: '0.4rem',
                        padding: '0.65rem 1.25rem', background: 'var(--primary)', color: '#fff',
                        border: 'none', borderRadius: '9px', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer',
                        opacity: saving ? 0.7 : 1,
                    }}>
                        <Save size={14} /> {saving ? 'Saving…' : 'Save Syllabus'}
                    </button>
                </div>
            </div>

            {/* Overview */}
            <div style={{ marginBottom: '1.5rem' }}>
                <Label>Overview (shown to students)</Label>
                <textarea
                    value={syllabus.overview}
                    onChange={e => setSyllabus(p => ({ ...p, overview: e.target.value }))}
                    rows={3} placeholder="Brief description of what the selection process looks like…"
                    style={{ ...inp(), resize: 'vertical' }}
                />
            </div>

            {/* Topics */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1rem' }}>
                {syllabus.topics.map((topic, tIdx) => (
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
                                {topic.subtopics.map((sub, sIdx) => (
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
