'use client';
import { useState, useCallback } from 'react';
import { Plus, Upload, Sparkles, Search, FileText, Wand2 } from 'lucide-react';
import SlideOver from '../../../../../components/admin/SlideOver';
import QuestionRow from '../../../../../components/admin/QuestionRow';
import ConfirmModal from '../../../../../components/admin/ConfirmModal';
import QuestionForm from '../QuestionForm';
import { getAdminToken } from '../../../layout';

const CURRENT_YEAR = new Date().getFullYear();

// ─── Category config ──────────────────────────────────────────────────────────
const CATEGORIES = [
    { key: 'test', label: 'Mock Test', icon: '📝' },
    { key: 'interview', label: 'Interview', icon: '🎙️' },
];

// Rounds per category
const CATEGORY_ROUNDS = {
    test: ['oa', 'technical'],
    interview: ['technical', 'hr', 'managerial'],
};

const ROUND_LABELS = {
    oa: 'Verbal/Aptitude',
    technical: 'Technical',
    hr: 'HR',
    managerial: 'Managerial',
};

const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

// ─── Default empty question per category ─────────────────────────────────────
function emptyQuestion(companyId, category, round) {
    const isInterview = category === 'interview';
    const defaultRound = round || (isInterview ? 'technical' : 'oa');
    const defaultType = isInterview ? 'subjective' : (defaultRound === 'oa' ? 'mcq' : 'mcq');
    return {
        companyId,
        text: '', type: defaultType, round: defaultRound, roleId: '',
        year: CURRENT_YEAR, difficulty: 'Medium', tags: [], isReal: true,
        options: defaultType === 'mcq' ? ['', '', '', ''] : null,
        correctAnswer: defaultType === 'mcq' ? 0 : null,
        explanation: '',
        starterCode: { python: '', cpp: '', java: '', javascript: '' },
        solution: '', testCases: [{ input: '', output: '', isHidden: false }],
    };
}

const Label = ({ children }) => (
    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {children}
    </label>
);
const inp = () => ({
    width: '100%', padding: '0.7rem 0.85rem',
    background: 'var(--bg-elevated)', border: '1px solid var(--border)',
    borderRadius: '8px', color: 'var(--text-primary)', fontSize: '0.875rem', boxSizing: 'border-box',
    fontFamily: 'inherit',
});

// ─── AI Preview List ─────────────────────────────────────────────────────────
function PreviewList({ questions, onToggle, onSaveSelected, saving }) {
    const selectedCount = questions.filter(q => q.selected).length;
    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Preview ({selectedCount} of {questions.length} selected)
                </span>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <button onClick={() => questions.forEach((_, i) => onToggle(i, true))} style={{ fontSize: '0.75rem', background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer' }}>All</button>
                    <button onClick={() => questions.forEach((_, i) => onToggle(i, false))} style={{ fontSize: '0.75rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>None</button>
                    <button
                        onClick={onSaveSelected}
                        disabled={saving || selectedCount === 0}
                        style={{ padding: '0.4rem 0.85rem', background: 'var(--success)', color: '#fff', border: 'none', borderRadius: '7px', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer', opacity: (saving || selectedCount === 0) ? 0.6 : 1 }}
                    >
                        {saving ? 'Saving…' : `Save ${selectedCount}`}
                    </button>
                </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '380px', overflowY: 'auto' }}>
                {questions.map((q, i) => (
                    <div
                        key={i}
                        onClick={() => onToggle(i)}
                        style={{ background: 'var(--bg-elevated)', border: `1px solid ${q.selected ? 'var(--primary)' : 'var(--border)'}`, borderRadius: '9px', padding: '0.85rem', cursor: 'pointer', opacity: q.selected ? 1 : 0.45, transition: 'all 0.1s' }}
                    >
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                            <input type="checkbox" checked={q.selected} onChange={() => onToggle(i)} onClick={e => e.stopPropagation()} style={{ marginTop: '3px', accentColor: 'var(--primary)', flexShrink: 0 }} />
                            <div>
                                <p style={{ fontSize: '0.855rem', color: 'var(--text-primary)', lineHeight: 1.45, margin: 0 }}>
                                    {q.text?.length > 160 ? q.text.slice(0, 160) + '…' : q.text}
                                </p>
                                <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: '0.68rem', padding: '1px 6px', borderRadius: '4px', background: 'rgba(255,45,85,0.1)', color: 'var(--primary)', border: '1px solid rgba(255,45,85,0.2)' }}>
                                        {ROUND_LABELS[q.round] || q.round}
                                    </span>
                                    <span style={{ fontSize: '0.68rem', padding: '1px 6px', borderRadius: '4px', background: 'var(--bg-base)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                                        {q.type?.toUpperCase()}
                                    </span>
                                    {q.difficulty && (
                                        <span style={{ fontSize: '0.68rem', padding: '1px 6px', borderRadius: '4px', background: 'var(--bg-base)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                                            {q.difficulty}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function QuestionsTab({ companyId, company, questions, qLoading, fetchQuestions, roles }) {
    // ── Category ──
    const [category, setCategory] = useState('test'); // 'test' | 'interview'

    // ── Drawer ──
    const [drawer, setDrawer] = useState(null); // { mode:'add'|'edit', question }
    const [drawerSaving, setDrawerSaving] = useState(false);
    const [drawerError, setDrawerError] = useState('');

    // ── Delete ──
    const [deleteQ, setDeleteQ] = useState(null);
    const [deletingQ, setDeletingQ] = useState(false);

    // ── Filters ──
    const [filterRound, setFilterRound] = useState('all');
    const [filterDiff, setFilterDiff] = useState('all');
    const [filterRole, setFilterRole] = useState('all');
    const [search, setSearch] = useState('');

    // ── AI Generate panel ──
    const [aiOpen, setAiOpen] = useState(false);
    const [aiForm, setAiForm] = useState({ round: 'oa', type: 'mcq', difficulty: 'Medium', count: 5, seedQuestions: '' });
    const [aiLoading, setAiLoading] = useState(false);
    const [aiPreview, setAiPreview] = useState([]);
    const [aiSaving, setAiSaving] = useState(false);
    const [aiError, setAiError] = useState('');

    // ── Import panel (tabs: json | natural) ──
    const [importOpen, setImportOpen] = useState(false);
    const [importTab, setImportTab] = useState('natural'); // 'natural' | 'json'
    // Natural language tab state
    const [nlRound, setNlRound] = useState('oa');
    const [nlText, setNlText] = useState('');
    const [nlLoading, setNlLoading] = useState(false);
    const [nlPreview, setNlPreview] = useState([]);
    const [nlSaving, setNlSaving] = useState(false);
    const [nlError, setNlError] = useState('');
    // JSON tab state
    const [jsonText, setJsonText] = useState('');
    const [jsonPreview, setJsonPreview] = useState(null);
    const [jsonSaving, setJsonSaving] = useState(false);

    // ── Category change → reset filters & adjust AI form defaults ──
    function switchCategory(cat) {
        setCategory(cat);
        setFilterRound('all');
        const defaultRound = cat === 'interview' ? 'technical' : 'oa';
        const defaultType = cat === 'interview' ? 'subjective' : 'mcq';
        setAiForm(p => ({ ...p, round: defaultRound, type: defaultType }));
        setNlRound(defaultRound);
    }

    // ── Filter questions by active category + filters ──
    // KEY: type is the canonical separator:
    //   Mock Test  → mcq | coding
    //   Interview  → subjective
    // (round 'technical' appears in both, so we can't rely on round alone)
    const categoryRounds = CATEGORY_ROUNDS[category];
    const TEST_TYPES = ['mcq', 'coding'];
    const isInCategory = (q) => {
        if (category === 'test') return TEST_TYPES.includes(q.type) && categoryRounds.includes(q.round);
        return q.type === 'subjective' && categoryRounds.includes(q.round);
    };
    const filtered = questions.filter(q => {
        if (!isInCategory(q)) return false;
        if (filterRound !== 'all' && q.round !== filterRound) return false;
        if (filterDiff !== 'all' && q.difficulty !== filterDiff) return false;
        if (filterRole !== 'all' && q.roleId !== filterRole) return false;
        if (search && !q.text?.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    });
    // Questions belonging to this category (for empty-state check)
    const categoryQuestions = questions.filter(isInCategory);

    // ── Question save ──
    async function saveQuestion(q) {
        if (!q.text.trim()) { setDrawerError('Question text is required'); return; }
        if (q.type === 'mcq' && (q.options || []).some(o => !o.trim())) { setDrawerError('All 4 MCQ options required'); return; }
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

    // ── AI generation ──
    // Derive available type options based on ai round + category
    const aiRoundTypes = category === 'interview'
        ? [{ value: 'subjective', label: 'Subjective' }]
        : aiForm.round === 'oa'
            ? [{ value: 'mcq', label: 'MCQ' }]
            : [{ value: 'mcq', label: 'MCQ' }, { value: 'coding', label: 'Coding' }];

    async function generateQuestions() {
        setAiLoading(true); setAiError(''); setAiPreview([]);
        try {
            const seeds = aiForm.seedQuestions.trim().split('\n').filter(Boolean);
            // Pass existing question texts for deduplication
            // Filter by both round AND category type to avoid cross-contamination
            const existingTexts = questions
                .filter(q => q.round === aiForm.round && (category === 'interview' ? q.type === 'subjective' : TEST_TYPES.includes(q.type)))
                .map(q => q.text)
                .filter(Boolean);
            const res = await fetch('/api/admin/generate-questions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-admin-key': getAdminToken() },
                body: JSON.stringify({
                    companyId, companyName: company?.name,
                    ...aiForm,
                    count: parseInt(aiForm.count),
                    seedQuestions: seeds,
                    existingQuestions: existingTexts,
                }),
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

    // ── Natural Language Import ──
    async function parseNaturalLanguage() {
        if (!nlText.trim()) return;
        setNlLoading(true); setNlError(''); setNlPreview([]);
        try {
            const res = await fetch('/api/admin/parse-questions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-admin-key': getAdminToken() },
                body: JSON.stringify({
                    raw: nlText, round: nlRound,
                    category, companyId, companyName: company?.name,
                }),
            });
            const data = await res.json();
            if (!res.ok) { setNlError(data.error || 'Parsing failed'); return; }
            setNlPreview(data.questions.map((q, i) => ({ ...q, _idx: i, selected: true })));
        } catch (e) { setNlError(e.message); }
        finally { setNlLoading(false); }
    }

    async function saveNlSelected() {
        const toSave = nlPreview.filter(q => q.selected);
        if (!toSave.length) return;
        setNlSaving(true);
        await Promise.all(toSave.map(q =>
            fetch('/api/admin/questions', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-key': getAdminToken() }, body: JSON.stringify({ companyId, ...q }) })
        ));
        await fetchQuestions();
        setNlPreview([]); setImportOpen(false); setNlText('');
        setNlSaving(false);
    }

    // ── JSON Bulk Import ──
    function parseJson() {
        try {
            const arr = JSON.parse(jsonText);
            if (!Array.isArray(arr)) throw new Error('Must be a JSON array');
            const valid = [], errors = [];
            arr.forEach((q, i) => {
                const missing = ['text', 'type', 'round', 'difficulty'].filter(f => !q[f]);
                if (missing.length) errors.push({ index: i, msg: `Missing: ${missing.join(', ')}` });
                else valid.push(q);
            });
            setJsonPreview({ valid, errors });
        } catch (e) { setJsonPreview({ parseError: e.message, valid: [], errors: [] }); }
    }

    async function importJson() {
        if (!jsonPreview?.valid?.length) return;
        setJsonSaving(true);
        await Promise.all(jsonPreview.valid.map(q =>
            fetch('/api/admin/questions', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-key': getAdminToken() }, body: JSON.stringify({ companyId, ...q }) })
        ));
        await fetchQuestions();
        setImportOpen(false); setJsonText(''); setJsonPreview(null);
        setJsonSaving(false);
    }

    function closeImport() {
        setImportOpen(false);
        setNlText(''); setNlPreview([]); setNlError('');
        setJsonText(''); setJsonPreview(null);
    }

    // ── Chip style ──
    const chip = (active) => ({
        padding: '0.35rem 0.8rem', fontSize: '0.78rem', cursor: 'pointer', borderRadius: '6px',
        background: active ? 'var(--primary-subtle)' : 'var(--bg-elevated)',
        border: `1px solid ${active ? 'var(--primary)' : 'var(--border)'}`,
        color: active ? 'var(--primary)' : 'var(--text-muted)',
        fontWeight: active ? 600 : 400, whiteSpace: 'nowrap',
    });

    // ── AI form round change: enforce valid type ──
    function handleAiRoundChange(newRound) {
        const validTypes = category === 'interview' ? ['subjective'] : newRound === 'oa' ? ['mcq'] : ['mcq', 'coding'];
        const newType = validTypes.includes(aiForm.type) ? aiForm.type : validTypes[0];
        setAiForm(p => ({ ...p, round: newRound, type: newType }));
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

            {/* ── Category tabs ── */}
            <div style={{ padding: '0.9rem 1.75rem 0', borderBottom: '1px solid var(--border)', display: 'flex', gap: '0', flexShrink: 0 }}>
                {CATEGORIES.map(cat => (
                    <button
                        key={cat.key}
                        onClick={() => switchCategory(cat.key)}
                        style={{
                            padding: '0.55rem 1.2rem', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer',
                            background: 'none', border: 'none',
                            borderBottom: category === cat.key ? '2px solid var(--primary)' : '2px solid transparent',
                            color: category === cat.key ? 'var(--primary)' : 'var(--text-muted)',
                            display: 'flex', alignItems: 'center', gap: '0.4rem',
                            transition: 'all 0.15s', marginBottom: '-1px',
                        }}
                    >
                        {cat.icon} {cat.label}
                    </button>
                ))}
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', paddingBottom: '0.5rem', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {filtered.length} questions
                    </span>
                </div>
            </div>

            {/* ── Toolbar ── */}
            <div style={{ padding: '0.85rem 1.75rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', flexShrink: 0 }}>
                {/* Search */}
                <div style={{ position: 'relative', flex: '1 1 200px', minWidth: '160px' }}>
                    <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search questions…" style={{ ...inp(), paddingLeft: '2.1rem', padding: '0.5rem 0.85rem 0.5rem 2.1rem' }} />
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: '0.5rem', marginLeft: 'auto' }}>
                    <button onClick={() => setImportOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.9rem', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-secondary)', fontSize: '0.82rem', cursor: 'pointer', fontWeight: 500 }}>
                        <Upload size={13} /> Import
                    </button>
                    <button onClick={() => { setAiForm(p => ({ ...p, round: category === 'interview' ? 'technical' : 'oa', type: category === 'interview' ? 'subjective' : 'mcq' })); setAiOpen(true); }} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.9rem', background: 'linear-gradient(135deg, #7c3aed, #a855f7)', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '0.82rem', cursor: 'pointer', fontWeight: 600 }}>
                        <Sparkles size={13} /> AI Generate
                    </button>
                    <button
                        onClick={() => { setDrawer({ mode: 'add', question: emptyQuestion(companyId, category) }); setDrawerError(''); }}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', background: 'var(--primary)', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '0.82rem', cursor: 'pointer', fontWeight: 600 }}
                    >
                        <Plus size={13} /> Add Question
                    </button>
                </div>
            </div>

            {/* ── Filter chips ── */}
            <div style={{ padding: '0.65rem 1.75rem', borderBottom: '1px solid var(--border)', display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center', flexShrink: 0, minHeight: '44px' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginRight: '0.2rem', textTransform: 'uppercase', fontWeight: 600 }}>Round:</span>
                <button onClick={() => setFilterRound('all')} style={chip(filterRound === 'all')}>All</button>
                {categoryRounds.map(r => (
                    <button key={r} onClick={() => setFilterRound(r)} style={chip(filterRound === r)}>
                        {ROUND_LABELS[r]}
                    </button>
                ))}
                <span style={{ width: '1px', height: '18px', background: 'var(--border)', margin: '0 0.2rem' }} />
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginRight: '0.2rem', textTransform: 'uppercase', fontWeight: 600 }}>Difficulty:</span>
                <button onClick={() => setFilterDiff('all')} style={chip(filterDiff === 'all')}>All</button>
                {DIFFICULTIES.map(d => <button key={d} onClick={() => setFilterDiff(d)} style={chip(filterDiff === d)}>{d}</button>)}
                {roles?.length > 0 && <>
                    <span style={{ width: '1px', height: '18px', background: 'var(--border)', margin: '0 0.2rem' }} />
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginRight: '0.2rem', textTransform: 'uppercase', fontWeight: 600 }}>Role:</span>
                    <button onClick={() => setFilterRole('all')} style={chip(filterRole === 'all')}>All</button>
                    {roles.map(r => <button key={r.id} onClick={() => setFilterRole(r.id)} style={chip(filterRole === r.id)}>{r.name}</button>)}
                </>}
            </div>

            {/* ── Question list ── */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
                {qLoading ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</div>
                ) : filtered.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                        {categoryQuestions.length === 0
                            ? `No ${category === 'test' ? 'Mock Test' : 'Interview'} questions yet. Add one or generate with AI.`
                            : 'No questions match your filters.'}
                    </div>
                ) : (
                    filtered.map(q => (
                        <QuestionRow
                            key={q.id}
                            question={{ ...q, _roundLabel: ROUND_LABELS[q.round] || q.round }}
                            roles={roles}
                            roundLabel={ROUND_LABELS[q.round] || q.round}
                            onEdit={() => {
                                setDrawer({
                                    mode: 'edit',
                                    question: {
                                        ...q, companyId,
                                        options: q.options || ['', '', '', ''],
                                        starterCode: q.starterCode || { python: '', cpp: '', java: '', javascript: '' },
                                        testCases: q.testCases || [{ input: '', output: '', isHidden: false }],
                                    },
                                });
                                setDrawerError('');
                            }}
                            onDelete={() => setDeleteQ({ id: q.id, text: q.text })}
                        />
                    ))
                )}
            </div>

            {/* ═══ Add/Edit SlideOver ═══ */}
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
                        category={category}
                    />
                )}
            </SlideOver>

            {/* ═══ AI Generate SlideOver ═══ */}
            <SlideOver open={aiOpen} onClose={() => { setAiOpen(false); setAiPreview([]); setAiError(''); }} title="Generate Questions with AI" width="600px">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                    {/* Context info */}
                    <div style={{ padding: '0.65rem 0.85rem', background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.25)', borderRadius: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        🤖 Generating for: <strong>{category === 'test' ? 'Mock Test' : 'Interview'}</strong> — {company?.name}
                        {categoryQuestions.length > 0 && <span style={{ marginLeft: '0.5rem', color: 'var(--text-muted)' }}>· {categoryQuestions.length} existing {category === 'test' ? 'test' : 'interview'} questions will be excluded</span>}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        {/* Round */}
                        <div>
                            <Label>Round</Label>
                            <select value={aiForm.round} onChange={e => handleAiRoundChange(e.target.value)} style={inp()}>
                                {(category === 'interview' ? ['technical', 'hr', 'managerial'] : ['oa', 'technical']).map(r => (
                                    <option key={r} value={r}>{ROUND_LABELS[r]}</option>
                                ))}
                            </select>
                        </div>
                        {/* Type */}
                        <div>
                            <Label>Question Type</Label>
                            {aiRoundTypes.length === 1 ? (
                                <div style={{ ...inp(), display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)' }}>
                                    <span style={{ padding: '2px 8px', background: 'var(--primary-subtle)', border: '1px solid var(--primary)', borderRadius: '5px', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 600 }}>
                                        {aiRoundTypes[0].label}
                                    </span>
                                    <span style={{ fontSize: '0.72rem' }}>only</span>
                                </div>
                            ) : (
                                <select value={aiForm.type} onChange={e => setAiForm(p => ({ ...p, type: e.target.value }))} style={inp()}>
                                    {aiRoundTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                </select>
                            )}
                        </div>
                        {/* Difficulty */}
                        <div>
                            <Label>Difficulty</Label>
                            <select value={aiForm.difficulty} onChange={e => setAiForm(p => ({ ...p, difficulty: e.target.value }))} style={inp()}>
                                {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>
                        {/* Count */}
                        <div>
                            <Label>Count (1–20)</Label>
                            <input type="number" min={1} max={20} value={aiForm.count} onChange={e => setAiForm(p => ({ ...p, count: Math.min(20, Math.max(1, parseInt(e.target.value) || 1)) }))} style={inp()} />
                        </div>
                    </div>

                    <div>
                        <Label>Seed Questions — optional style guide</Label>
                        <textarea
                            value={aiForm.seedQuestions}
                            onChange={e => setAiForm(p => ({ ...p, seedQuestions: e.target.value }))}
                            rows={3}
                            placeholder="Paste 2–4 real questions to guide the style, topics, and difficulty…"
                            style={{ ...inp(), resize: 'vertical' }}
                        />
                    </div>

                    {aiError && <p style={{ color: 'var(--danger)', fontSize: '0.82rem', margin: 0 }}>{aiError}</p>}

                    <button onClick={generateQuestions} disabled={aiLoading} style={{ padding: '0.65rem 1.25rem', background: 'linear-gradient(135deg, #7c3aed, #a855f7)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', opacity: aiLoading ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                        <Sparkles size={15} /> {aiLoading ? 'Generating…' : `Generate ${aiForm.count} Questions`}
                    </button>

                    {aiPreview.length > 0 && (
                        <PreviewList
                            questions={aiPreview}
                            onToggle={(i, force) => setAiPreview(p => p.map((x, j) => j === i ? { ...x, selected: force !== undefined ? force : !x.selected } : x))}
                            onSaveSelected={saveAiSelected}
                            saving={aiSaving}
                        />
                    )}
                </div>
            </SlideOver>

            {/* ═══ Import SlideOver ═══ */}
            <SlideOver open={importOpen} onClose={closeImport} title="Import Questions" width="600px">
                {/* Tab switcher */}
                <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '1.25rem' }}>
                    {[
                        { key: 'natural', label: '✍️ Natural Language', icon: null },
                        { key: 'json', label: '{ } JSON Import', icon: null },
                    ].map(t => (
                        <button
                            key={t.key}
                            onClick={() => setImportTab(t.key)}
                            style={{
                                padding: '0.55rem 1rem', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
                                background: 'none', border: 'none',
                                borderBottom: importTab === t.key ? '2px solid var(--primary)' : '2px solid transparent',
                                color: importTab === t.key ? 'var(--primary)' : 'var(--text-muted)',
                                marginBottom: '-1px',
                            }}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* Natural Language Tab */}
                {importTab === 'natural' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ padding: '0.65rem 0.85rem', background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                            <strong>✍️ Type questions naturally</strong> — paste them however you like. The AI will convert them into structured format.<br />
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                                Examples: MCQs with lettered options, plain questions, questions with answers marked…
                            </span>
                        </div>

                        <div>
                            <Label>Round</Label>
                            <select value={nlRound} onChange={e => setNlRound(e.target.value)} style={inp()}>
                                {(category === 'interview' ? ['technical', 'hr', 'managerial'] : ['oa', 'technical']).map(r => (
                                    <option key={r} value={r}>{ROUND_LABELS[r]}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <Label>Your Questions</Label>
                            <textarea
                                value={nlText}
                                onChange={e => { setNlText(e.target.value); setNlPreview([]); setNlError(''); }}
                                rows={9}
                                placeholder={`Type or paste your questions here. Examples:\n\nWhat is a deadlock?\na) Both processes wait forever\nb) Memory overflow\nc) CPU spike\nd) None  [Answer: a]\n\nExplain the OSI model.\n\nWhat is the output of: print(2**10)?`}
                                style={{ ...inp(), resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6 }}
                            />
                        </div>

                        {nlError && <p style={{ color: 'var(--danger)', fontSize: '0.82rem', margin: 0 }}>{nlError}</p>}

                        <button
                            onClick={parseNaturalLanguage}
                            disabled={nlLoading || !nlText.trim()}
                            style={{ padding: '0.65rem 1.25rem', background: 'linear-gradient(135deg, #059669, #10b981)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', opacity: (nlLoading || !nlText.trim()) ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}
                        >
                            <Wand2 size={15} /> {nlLoading ? 'Converting…' : 'Convert with AI'}
                        </button>

                        {nlPreview.length > 0 && (
                            <PreviewList
                                questions={nlPreview}
                                onToggle={(i, force) => setNlPreview(p => p.map((x, j) => j === i ? { ...x, selected: force !== undefined ? force : !x.selected } : x))}
                                onSaveSelected={saveNlSelected}
                                saving={nlSaving}
                            />
                        )}
                    </div>
                )}

                {/* JSON Tab */}
                {importTab === 'json' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.55, margin: 0 }}>
                            Paste a JSON array of questions. Each must have <code style={{ color: 'var(--primary)' }}>text</code>, <code style={{ color: 'var(--primary)' }}>type</code>, <code style={{ color: 'var(--primary)' }}>round</code>, <code style={{ color: 'var(--primary)' }}>difficulty</code>.
                        </p>
                        <textarea
                            value={jsonText}
                            onChange={e => { setJsonText(e.target.value); setJsonPreview(null); }}
                            rows={12}
                            placeholder={'[\n  {\n    "text": "What is...",\n    "type": "mcq",\n    "round": "technical",\n    "difficulty": "Medium",\n    "options": ["A","B","C","D"],\n    "correctAnswer": 0\n  }\n]'}
                            style={{ ...inp(), fontFamily: 'monospace', fontSize: '0.8rem', resize: 'vertical' }}
                        />
                        <button onClick={parseJson} style={{ padding: '0.65rem 1.25rem', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)', fontWeight: 600, cursor: 'pointer' }}>
                            Validate JSON
                        </button>
                        {jsonPreview && (
                            <div>
                                {jsonPreview.parseError && <p style={{ color: 'var(--danger)', fontSize: '0.82rem' }}>Parse error: {jsonPreview.parseError}</p>}
                                {!jsonPreview.parseError && (
                                    <>
                                        <p style={{ fontSize: '0.82rem', color: 'var(--success)', marginBottom: '0.35rem' }}>✓ {jsonPreview.valid.length} valid questions</p>
                                        {jsonPreview.errors.map((e, i) => <p key={i} style={{ fontSize: '0.78rem', color: 'var(--danger)' }}>Row {e.index}: {e.msg}</p>)}
                                        {jsonPreview.valid.length > 0 && (
                                            <button onClick={importJson} disabled={jsonSaving} style={{ marginTop: '0.75rem', padding: '0.65rem 1.25rem', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
                                                {jsonSaving ? 'Importing…' : `Import ${jsonPreview.valid.length} Questions`}
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </SlideOver>

            {/* ═══ Delete confirm ═══ */}
            <ConfirmModal
                open={!!deleteQ} onClose={() => setDeleteQ(null)} onConfirm={deleteQuestion}
                title="Delete question?"
                message={<span>This will permanently delete the question. This cannot be undone.</span>}
                loading={deletingQ}
            />
        </div>
    );
}
