'use client';
import { useState, useCallback } from 'react';
import { Plus, Upload, Sparkles, Search } from 'lucide-react';
import SlideOver from '../../../../../components/admin/SlideOver';
import QuestionRow from '../../../../../components/admin/QuestionRow';
import ConfirmModal from '../../../../../components/admin/ConfirmModal';
import QuestionForm from '../QuestionForm';
import { getAdminToken } from '../../../layout';

const CURRENT_YEAR = new Date().getFullYear();

function emptyQuestion(companyId) {
    return {
        companyId, text: '', type: 'mcq', round: 'technical', roleId: '',
        year: CURRENT_YEAR, difficulty: 'Medium', tags: [], isReal: true,
        options: ['', '', '', ''], correctAnswer: 0, explanation: '',
        starterCode: { python: '', cpp: '', java: '', javascript: '' },
        solution: '', testCases: [{ input: '', output: '', isHidden: false }],
    };
}

const ROUNDS = ['oa', 'technical', 'hr'];
const TYPES = ['mcq', 'coding', 'subjective'];
const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

const Label = ({ children }) => (
    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {children}
    </label>
);
const inp = () => ({
    width: '100%', padding: '0.7rem 0.85rem',
    background: 'var(--bg-elevated)', border: '1px solid var(--border)',
    borderRadius: '8px', color: 'var(--text-primary)', fontSize: '0.875rem', boxSizing: 'border-box',
});

export default function QuestionsTab({ companyId, company, questions, qLoading, fetchQuestions, roles }) {
    // Drawer state
    const [drawer, setDrawer] = useState(null); // { mode:'add'|'edit', question }
    const [drawerSaving, setDrawerSaving] = useState(false);
    const [drawerError, setDrawerError] = useState('');

    // Delete confirm
    const [deleteQ, setDeleteQ] = useState(null);
    const [deletingQ, setDeletingQ] = useState(false);

    // Filters
    const [filterRound, setFilterRound] = useState('all');
    const [filterType, setFilterType] = useState('all');
    const [filterDiff, setFilterDiff] = useState('all');
    const [filterRole, setFilterRole] = useState('all');
    const [search, setSearch] = useState('');

    // AI panel
    const [aiOpen, setAiOpen] = useState(false);
    const [aiForm, setAiForm] = useState({ round: 'technical', type: 'mcq', difficulty: 'Medium', count: 5, seedQuestions: '' });
    const [aiLoading, setAiLoading] = useState(false);
    const [aiPreview, setAiPreview] = useState([]);
    const [aiSaving, setAiSaving] = useState(false);
    const [aiError, setAiError] = useState('');

    // Bulk import
    const [bulkOpen, setBulkOpen] = useState(false);
    const [bulkJson, setBulkJson] = useState('');
    const [bulkPreview, setBulkPreview] = useState(null);
    const [bulkSaving, setBulkSaving] = useState(false);

    // Filtered
    const filtered = questions.filter(q => {
        if (filterRound !== 'all' && q.round !== filterRound) return false;
        if (filterType !== 'all' && q.type !== filterType) return false;
        if (filterDiff !== 'all' && q.difficulty !== filterDiff) return false;
        if (filterRole !== 'all' && q.roleId !== filterRole) return false;
        if (search && !q.text?.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    });

    // Question save
    async function saveQuestion(q) {
        if (!q.text.trim()) { setDrawerError('Question text is required'); return; }
        if (q.type === 'mcq' && q.options.some(o => !o.trim())) { setDrawerError('All 4 MCQ options required'); return; }
        setDrawerSaving(true); setDrawerError('');
        try {
            const body = {
                companyId, text: q.text, type: q.type, round: q.round, roleId: q.roleId || null,
                year: parseInt(q.year) || CURRENT_YEAR, difficulty: q.difficulty, tags: q.tags, isReal: q.isReal,
                options: q.type === 'mcq' ? q.options : null,
                correctAnswer: q.type === 'mcq' ? q.correctAnswer : null,
                explanation: q.type !== 'coding' ? q.explanation : null,
                starterCode: q.type === 'coding' ? q.starterCode : null,
                solution: q.type === 'coding' ? q.solution : null,
                testCases: q.type === 'coding' ? q.testCases : null,
            };
            let res;
            if (drawer.mode === 'add') {
                res = await fetch('/api/admin/questions', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-key': getAdminToken() }, body: JSON.stringify(body) });
            } else {
                res = await fetch(`/api/admin/questions/${q.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'x-admin-key': getAdminToken() }, body: JSON.stringify(body) });
            }
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                setDrawerError(errData.error || 'Failed to save question');
                return;
            }
            await fetchQuestions();
            setDrawer(null);
        } catch { setDrawerError('Network error — please try again.'); }
        finally { setDrawerSaving(false); }
    }

    async function deleteQuestion() {
        if (!deleteQ) return;
        setDeletingQ(true);
        await fetch(`/api/admin/questions/${deleteQ.id}`, {
            method: 'DELETE', headers: { 'Content-Type': 'application/json', 'x-admin-key': getAdminToken() },
            body: JSON.stringify({ companyId }),
        });
        await fetchQuestions();
        setDeleteQ(null);
        setDeletingQ(false);
    }

    // AI generation
    async function generateQuestions() {
        setAiLoading(true); setAiError(''); setAiPreview([]);
        try {
            const seeds = aiForm.seedQuestions.trim().split('\n').filter(Boolean);
            const res = await fetch('/api/admin/generate-questions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-admin-key': getAdminToken() },
                body: JSON.stringify({ companyId, companyName: company?.name, ...aiForm, count: parseInt(aiForm.count), seedQuestions: seeds }),
            });
            const data = await res.json();
            if (!res.ok) { setAiError(data.error || 'Generation failed'); return; }
            setAiPreview(data.questions.map((q, i) => ({ ...q, _idx: i, selected: true })));
        } catch (e) { setAiError(e.message); }
        finally { setAiLoading(false); }
    }

    async function saveAiSelected() {
        const toSave = aiPreview.filter(q => q.selected);
        if (!toSave.length) return;
        setAiSaving(true);
        await Promise.all(toSave.map(q =>
            fetch('/api/admin/questions', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-key': getAdminToken() }, body: JSON.stringify({ companyId, ...q }) })
        ));
        await fetchQuestions();
        setAiPreview([]); setAiOpen(false);
        setAiSaving(false);
    }

    // Bulk
    function parseBulk() {
        try {
            const arr = JSON.parse(bulkJson);
            if (!Array.isArray(arr)) throw new Error('Must be a JSON array');
            const valid = [], errors = [];
            arr.forEach((q, i) => {
                const missing = ['text', 'type', 'round', 'difficulty'].filter(f => !q[f]);
                if (missing.length) errors.push({ index: i, msg: `Missing: ${missing.join(', ')}` });
                else valid.push(q);
            });
            setBulkPreview({ valid, errors });
        } catch (e) { setBulkPreview({ parseError: e.message, valid: [], errors: [] }); }
    }

    async function importBulk() {
        if (!bulkPreview?.valid?.length) return;
        setBulkSaving(true);
        await Promise.all(bulkPreview.valid.map(q =>
            fetch('/api/admin/questions', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-key': getAdminToken() }, body: JSON.stringify({ companyId, ...q }) })
        ));
        await fetchQuestions();
        setBulkOpen(false); setBulkJson(''); setBulkPreview(null);
        setBulkSaving(false);
    }

    const chipStyle = (active) => ({
        padding: '0.35rem 0.8rem', fontSize: '0.78rem', cursor: 'pointer', borderRadius: '6px',
        background: active ? 'var(--primary-subtle)' : 'var(--bg-elevated)',
        border: `1px solid ${active ? 'var(--primary)' : 'var(--border)'}`,
        color: active ? 'var(--primary)' : 'var(--text-muted)',
        fontWeight: active ? 600 : 400, whiteSpace: 'nowrap',
    });

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Toolbar */}
            <div style={{ padding: '1.1rem 1.75rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', flexShrink: 0 }}>
                {/* Search */}
                <div style={{ position: 'relative', flex: '1 1 200px', minWidth: '160px' }}>
                    <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search questions…" style={{ ...inp(), paddingLeft: '2.1rem', padding: '0.55rem 0.85rem 0.55rem 2.1rem' }} />
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: '0.5rem', marginLeft: 'auto' }}>
                    <button onClick={() => setBulkOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 0.9rem', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-secondary)', fontSize: '0.82rem', cursor: 'pointer', fontWeight: 500 }}>
                        <Upload size={13} /> Bulk Import
                    </button>
                    <button onClick={() => setAiOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 0.9rem', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-secondary)', fontSize: '0.82rem', cursor: 'pointer', fontWeight: 500 }}>
                        <Sparkles size={13} /> AI Generate
                    </button>
                    <button onClick={() => { setDrawer({ mode: 'add', question: emptyQuestion(companyId) }); setDrawerError(''); }} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 1rem', background: 'var(--primary)', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '0.82rem', cursor: 'pointer', fontWeight: 600 }}>
                        <Plus size={13} /> Add Question
                    </button>
                </div>
            </div>

            {/* Filter chips */}
            <div style={{ padding: '0.75rem 1.75rem', borderBottom: '1px solid var(--border)', display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginRight: '0.25rem', textTransform: 'uppercase', fontWeight: 600 }}>Round:</span>
                {['all', ...ROUNDS].map(r => <button key={r} onClick={() => setFilterRound(r)} style={chipStyle(filterRound === r)}>{r === 'all' ? 'All' : r.toUpperCase()}</button>)}
                <span style={{ width: '1px', height: '18px', background: 'var(--border)', margin: '0 0.25rem' }} />
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginRight: '0.25rem', textTransform: 'uppercase', fontWeight: 600 }}>Type:</span>
                {['all', ...TYPES].map(t => <button key={t} onClick={() => setFilterType(t)} style={chipStyle(filterType === t)}>{t === 'all' ? 'All' : t.toUpperCase()}</button>)}
                <span style={{ width: '1px', height: '18px', background: 'var(--border)', margin: '0 0.25rem' }} />
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginRight: '0.25rem', textTransform: 'uppercase', fontWeight: 600 }}>Diff:</span>
                {['all', ...DIFFICULTIES].map(d => <button key={d} onClick={() => setFilterDiff(d)} style={chipStyle(filterDiff === d)}>{d === 'all' ? 'All' : d}</button>)}
                {roles.length > 0 && <>
                    <span style={{ width: '1px', height: '18px', background: 'var(--border)', margin: '0 0.25rem' }} />
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginRight: '0.25rem', textTransform: 'uppercase', fontWeight: 600 }}>Role:</span>
                    <button onClick={() => setFilterRole('all')} style={chipStyle(filterRole === 'all')}>All</button>
                    {roles.map(r => <button key={r.id} onClick={() => setFilterRole(r.id)} style={chipStyle(filterRole === r.id)}>{r.name}</button>)}
                </>}
                <span style={{ marginLeft: 'auto', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {filtered.length} of {questions.length}
                </span>
            </div>

            {/* Question list */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
                {qLoading ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</div>
                ) : filtered.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                        {questions.length === 0 ? 'No questions yet. Click + Add Question to get started.' : 'No questions match your filters.'}
                    </div>
                ) : (
                    filtered.map(q => (
                        <QuestionRow
                            key={q.id}
                            question={q}
                            roles={roles}
                            onEdit={() => { setDrawer({ mode: 'edit', question: { ...q, companyId, options: q.options || ['', '', '', ''], starterCode: q.starterCode || { python: '', cpp: '', java: '', javascript: '' }, testCases: q.testCases || [{ input: '', output: '', isHidden: false }] } }); setDrawerError(''); }}
                            onDelete={() => setDeleteQ({ id: q.id, text: q.text })}
                        />
                    ))
                )}
            </div>

            {/* Add/Edit Question SlideOver */}
            <SlideOver open={!!drawer} onClose={() => setDrawer(null)} title={drawer?.mode === 'add' ? 'Add Question' : 'Edit Question'} width="600px">
                {drawer && (
                    <QuestionForm
                        question={drawer.question}
                        onChange={(key, val) => setDrawer(p => ({ ...p, question: { ...p.question, [key]: val } }))}
                        roles={roles}
                        onSave={() => saveQuestion(drawer.question)}
                        onCancel={() => setDrawer(null)}
                        saving={drawerSaving}
                        error={drawerError}
                    />
                )}
            </SlideOver>

            {/* AI Generate SlideOver */}
            <SlideOver open={aiOpen} onClose={() => { setAiOpen(false); setAiPreview([]); setAiError(''); }} title="Generate Questions with AI" width="580px">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        {[{ key: 'round', label: 'Round', opts: ROUNDS }, { key: 'type', label: 'Type', opts: TYPES }, { key: 'difficulty', label: 'Difficulty', opts: DIFFICULTIES }].map(({ key, label, opts }) => (
                            <div key={key}>
                                <Label>{label}</Label>
                                <select value={aiForm[key]} onChange={e => setAiForm(p => ({ ...p, [key]: e.target.value }))} style={inp()}>
                                    {opts.map(o => <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
                                </select>
                            </div>
                        ))}
                        <div>
                            <Label>Count (max 10)</Label>
                            <input type="number" min={1} max={10} value={aiForm.count} onChange={e => setAiForm(p => ({ ...p, count: e.target.value }))} style={inp()} />
                        </div>
                    </div>
                    <div>
                        <Label>Seed Questions (real PYQs, one per line — optional)</Label>
                        <textarea value={aiForm.seedQuestions} onChange={e => setAiForm(p => ({ ...p, seedQuestions: e.target.value }))} rows={4} placeholder="Paste 3–5 real questions here to guide the AI style…" style={{ ...inp(), resize: 'vertical' }} />
                    </div>
                    {aiError && <p style={{ color: 'var(--danger)', fontSize: '0.82rem' }}>{aiError}</p>}
                    <button onClick={generateQuestions} disabled={aiLoading} style={{ padding: '0.65rem 1.25rem', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', opacity: aiLoading ? 0.7 : 1 }}>
                        {aiLoading ? 'Generating…' : '🤖 Generate Preview'}
                    </button>

                    {aiPreview.length > 0 && (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Preview ({aiPreview.filter(q => q.selected).length} selected)</span>
                                <button onClick={saveAiSelected} disabled={aiSaving || !aiPreview.some(q => q.selected)} style={{ padding: '0.45rem 1rem', background: 'var(--success)', color: '#fff', border: 'none', borderRadius: '7px', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}>
                                    {aiSaving ? 'Saving…' : `Save Selected (${aiPreview.filter(q => q.selected).length})`}
                                </button>
                            </div>
                            {aiPreview.map((q, i) => (
                                <div key={i} style={{ background: 'var(--bg-elevated)', border: `1px solid ${q.selected ? 'var(--primary)' : 'var(--border)'}`, borderRadius: '9px', padding: '0.85rem', marginBottom: '0.5rem', opacity: q.selected ? 1 : 0.5 }}>
                                    <label style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', cursor: 'pointer' }}>
                                        <input type="checkbox" checked={q.selected} onChange={() => setAiPreview(p => p.map((x, j) => j === i ? { ...x, selected: !x.selected } : x))} style={{ marginTop: '3px', accentColor: 'var(--primary)' }} />
                                        <span style={{ fontSize: '0.855rem', color: 'var(--text-primary)', lineHeight: 1.45 }}>{q.text.length > 150 ? q.text.slice(0, 150) + '…' : q.text}</span>
                                    </label>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </SlideOver>

            {/* Bulk Import SlideOver */}
            <SlideOver open={bulkOpen} onClose={() => { setBulkOpen(false); setBulkJson(''); setBulkPreview(null); }} title="Bulk Import Questions" width="560px">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>
                        Paste a JSON array of questions. Each must have <code style={{ color: 'var(--primary)' }}>text</code>, <code style={{ color: 'var(--primary)' }}>type</code>, <code style={{ color: 'var(--primary)' }}>round</code>, <code style={{ color: 'var(--primary)' }}>difficulty</code>.
                    </p>
                    <textarea value={bulkJson} onChange={e => { setBulkJson(e.target.value); setBulkPreview(null); }} rows={10} placeholder={'[\n  {\n    "text": "What is...",\n    "type": "mcq",\n    "round": "technical",\n    "difficulty": "Medium",\n    "options": ["A","B","C","D"],\n    "correctAnswer": 0\n  }\n]'} style={{ ...inp(), fontFamily: 'monospace', fontSize: '0.8rem', resize: 'vertical' }} />
                    <button onClick={parseBulk} style={{ padding: '0.65rem 1.25rem', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)', fontWeight: 600, cursor: 'pointer' }}>
                        Validate JSON
                    </button>
                    {bulkPreview && (
                        <div>
                            {bulkPreview.parseError && <p style={{ color: 'var(--danger)', fontSize: '0.82rem' }}>Parse error: {bulkPreview.parseError}</p>}
                            {!bulkPreview.parseError && (
                                <>
                                    <p style={{ fontSize: '0.82rem', color: 'var(--success)', marginBottom: '0.35rem' }}>✓ {bulkPreview.valid.length} valid questions</p>
                                    {bulkPreview.errors.map((e, i) => <p key={i} style={{ fontSize: '0.78rem', color: 'var(--danger)' }}>Row {e.index}: {e.msg}</p>)}
                                    {bulkPreview.valid.length > 0 && (
                                        <button onClick={importBulk} disabled={bulkSaving} style={{ marginTop: '0.75rem', padding: '0.65rem 1.25rem', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
                                            {bulkSaving ? 'Importing…' : `Import ${bulkPreview.valid.length} Questions`}
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </div>
            </SlideOver>

            {/* Delete confirm */}
            <ConfirmModal
                open={!!deleteQ} onClose={() => setDeleteQ(null)} onConfirm={deleteQuestion}
                title={`Delete question?`}
                message={<span>This will permanently delete the question. This cannot be undone.</span>}
                loading={deletingQ}
            />
        </div>
    );
}
