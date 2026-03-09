'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
    ArrowLeft, Save, Plus, Trash2, Edit3, Star, X, Check,
    ChevronDown, ChevronUp, Sparkles, Upload, AlertTriangle,
    BookOpen
} from 'lucide-react';

const ADMIN_KEY = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || '';

const INDUSTRIES = ['IT Services', 'Product', 'Consulting', 'BFSI', 'Core', 'Other'];
const ROUNDS = ['oa', 'technical', 'hr'];
const TYPES = ['mcq', 'coding', 'subjective'];
const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];
const CURRENT_YEAR = new Date().getFullYear();

function generateSlugClient(name = '') {
    return name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-');
}

// ─── Input / Label helpers ───────────────────────────────────────────────────
const inputStyle = (err) => ({
    width: '100%', padding: '0.72rem 0.9rem',
    background: 'var(--bg-elevated)', border: `1px solid ${err ? 'var(--danger)' : 'var(--border)'}`,
    borderRadius: '8px', color: 'var(--text-primary)', fontSize: '0.875rem',
});
const Label = ({ children }) => (
    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {children}
    </label>
);

// ─── Empty question template ──────────────────────────────────────────────────
const emptyQuestion = (companyId) => ({
    companyId, text: '', type: 'mcq', round: 'technical',
    roleId: '',  // '' = all roles
    year: CURRENT_YEAR, difficulty: 'Medium', tags: [],
    isReal: true,
    options: ['', '', '', ''], correctAnswer: 0, explanation: '',
    starterCode: { python: '', cpp: '', java: '', javascript: '' },
    solution: '', testCases: [{ input: '', output: '', isHidden: false }],
});

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CompanyEditPage() {
    const router = useRouter();
    const params = useParams();
    const companyId = params.id;

    // Company form state
    const [company, setCompany] = useState(null);
    const [form, setForm] = useState(null);
    const [tagInput, setTagInput] = useState('');
    const [saving, setSaving] = useState(false);
    const [saveMsg, setSaveMsg] = useState('');

    // Questions state
    const [questions, setQuestions] = useState([]);
    const [qLoading, setQLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all');

    // Question drawer
    const [drawer, setDrawer] = useState(null); // null | { mode: 'add'|'edit', question }
    const [drawerSaving, setDrawerSaving] = useState(false);
    const [drawerError, setDrawerError] = useState('');
    const [drawerTagInput, setDrawerTagInput] = useState('');

    // Delete confirmation
    const [deleteQ, setDeleteQ] = useState(null); // { id, text }
    const [deletingQ, setDeletingQ] = useState(false);

    // AI generation
    const [aiPanel, setAiPanel] = useState(false);
    const [aiForm, setAiForm] = useState({ round: 'technical', type: 'mcq', difficulty: 'Medium', count: 5, seedQuestions: '' });
    const [aiLoading, setAiLoading] = useState(false);
    const [aiPreview, setAiPreview] = useState([]); // { ...question, selected, editMode }
    const [aiSaving, setAiSaving] = useState(false);
    const [aiError, setAiError] = useState('');

    // Study material (syllabus)
    const [syllabus, setSyllabus] = useState(null);
    const [syllabusOpen, setSyllabusOpen] = useState(false);
    const [syllabusMsg, setSyllabusMsg] = useState('');
    const [savingSyllabus, setSavingSyllabus] = useState(false);
    // JSON import
    const [jsonImportOpen, setJsonImportOpen] = useState(false);
    const [jsonImportText, setJsonImportText] = useState('');
    const [jsonImportError, setJsonImportError] = useState('');
    const [schemaHintOpen, setSchemaHintOpen] = useState(false);

    // Bulk import
    const [bulkModal, setBulkModal] = useState(false);
    const [bulkJson, setBulkJson] = useState('');
    const [bulkPreview, setBulkPreview] = useState(null); // { valid, errors }
    const [bulkSaving, setBulkSaving] = useState(false);

    // Job Roles
    const [roles, setRoles] = useState([]);
    const [rolesLoading, setRolesLoading] = useState(true);
    const [roleForm, setRoleForm] = useState({ name: '', roundTypes: [], description: '' });
    const [roleAdding, setRoleAdding] = useState(false);
    const [roleAddOpen, setRoleAddOpen] = useState(false);
    const [roleEditId, setRoleEditId] = useState(null);
    const [roleEditForm, setRoleEditForm] = useState({});
    const [roleSaving, setRoleSaving] = useState(false);
    const [roleDeleting, setRoleDeleting] = useState(null);

    const ROLE_ROUND_OPTIONS = [
        { value: 'oa', label: 'Online Assessment (OA)' },
        { value: 'technical', label: 'Technical' },
        { value: 'hr', label: 'HR' },
        { value: 'managerial', label: 'Managerial' },
    ];

    // ── Fetch company ──────────────────────────────────────────────────────────
    useEffect(() => {
        async function load() {
            const res = await fetch(`/api/admin/companies/${companyId}`, { headers: { 'x-admin-key': ADMIN_KEY } });
            const data = await res.json();
            setCompany(data);
            setForm({ name: data.name, industry: data.industry, description: data.description, hiringStatus: data.hiringStatus, rounds: { ...data.rounds }, tags: [...(data.tags || [])], logo: data.logo || '' });
            // Load existing syllabus (stored under companySyllabus key in the company doc)
            if (data.syllabus) setSyllabus(data.syllabus);
        }
        load();
    }, [companyId]);

    // ── Fetch questions ────────────────────────────────────────────────────────
    const fetchQuestions = useCallback(async () => {
        setQLoading(true);
        try {
            const res = await fetch(`/api/admin/questions?companyId=${companyId}`, { headers: { 'x-admin-key': ADMIN_KEY } });
            const data = await res.json();
            setQuestions(Array.isArray(data) ? data : []);
        } catch (_) { }
        finally { setQLoading(false); }
    }, [companyId]);

    useEffect(() => { fetchQuestions(); }, [fetchQuestions]);

    // ── Fetch roles ────────────────────────────────────────────────────────────
    const fetchRoles = useCallback(async () => {
        setRolesLoading(true);
        try {
            const res = await fetch(`/api/admin/companies/${companyId}/roles`, { headers: { 'x-admin-key': ADMIN_KEY } });
            const data = await res.json();
            setRoles(Array.isArray(data) ? data : []);
        } catch (_) { }
        finally { setRolesLoading(false); }
    }, [companyId]);

    useEffect(() => { fetchRoles(); }, [fetchRoles]);

    async function addRole() {
        if (!roleForm.name.trim()) return;
        setRoleAdding(true);
        try {
            await fetch(`/api/admin/companies/${companyId}/roles`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-admin-key': ADMIN_KEY },
                body: JSON.stringify(roleForm),
            });
            setRoleForm({ name: '', roundTypes: [], description: '' });
            setRoleAddOpen(false);
            fetchRoles();
        } catch (_) { }
        finally { setRoleAdding(false); }
    }

    async function saveRoleEdit(id) {
        setRoleSaving(true);
        try {
            await fetch(`/api/admin/companies/${companyId}/roles/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'x-admin-key': ADMIN_KEY },
                body: JSON.stringify(roleEditForm),
            });
            setRoleEditId(null);
            fetchRoles();
        } catch (_) { }
        finally { setRoleSaving(false); }
    }

    async function deleteRole(id) {
        if (!confirm('Delete this role?')) return;
        setRoleDeleting(id);
        try {
            await fetch(`/api/admin/companies/${companyId}/roles/${id}`, {
                method: 'DELETE',
                headers: { 'x-admin-key': ADMIN_KEY },
            });
            fetchRoles();
        } catch (_) { }
        finally { setRoleDeleting(null); }
    }

    function toggleRoleRoundType(rt) {
        setRoleForm(prev => ({
            ...prev,
            roundTypes: prev.roundTypes.includes(rt)
                ? prev.roundTypes.filter(r => r !== rt)
                : [...prev.roundTypes, rt],
        }));
    }

    function toggleEditRoleRoundType(rt) {
        setRoleEditForm(prev => ({
            ...prev,
            roundTypes: prev.roundTypes.includes(rt)
                ? prev.roundTypes.filter(r => r !== rt)
                : [...prev.roundTypes, rt],
        }));
    }

    // ── Per-role syllabus helpers ─────────────────────────────────────────────
    const [expandedRoleId, setExpandedRoleId] = useState(null);
    // roleSyllabusMap: { [roleId]: { topics: [], msg: '', saving: false } }
    const [roleSyllabusMap, setRoleSyllabusMap] = useState({});

    function getRoleSyllabus(roleId) {
        return roleSyllabusMap[roleId] || { topics: [], msg: '', saving: false };
    }
    function setRoleSyllabusField(roleId, updates) {
        setRoleSyllabusMap(prev => ({
            ...prev,
            [roleId]: { ...getRoleSyllabus(roleId), ...updates },
        }));
    }

    // When a role card is expanded, populate its syllabus from the roles array
    function expandRole(role) {
        const already = roleSyllabusMap[role.id];
        if (!already) {
            const topics = role.syllabus?.topics ?? [];
            setRoleSyllabusField(role.id, {
                topics: topics.length > 0 ? [...topics] : [{ name: '', description: '', studyHours: '' }],
                msg: '', saving: false,
            });
        }
        setExpandedRoleId(prev => prev === role.id ? null : role.id);
    }

    function addRoleTopic(roleId) {
        const rs = getRoleSyllabus(roleId);
        setRoleSyllabusField(roleId, { topics: [...rs.topics, { name: '', description: '', studyHours: '' }] });
    }
    function removeRoleTopic(roleId, idx) {
        const rs = getRoleSyllabus(roleId);
        setRoleSyllabusField(roleId, { topics: rs.topics.filter((_, i) => i !== idx) });
    }
    function setRoleTopic(roleId, idx, field, val) {
        const rs = getRoleSyllabus(roleId);
        const updated = rs.topics.map((t, i) => i === idx ? { ...t, [field]: val } : t);
        setRoleSyllabusField(roleId, { topics: updated });
    }

    async function saveRoleSyllabus(roleId) {
        const rs = getRoleSyllabus(roleId);
        const topics = rs.topics.filter(t => t.name.trim());
        setRoleSyllabusField(roleId, { saving: true, msg: '' });
        try {
            const res = await fetch(`/api/admin/companies/${companyId}/roles/${roleId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'x-admin-key': ADMIN_KEY },
                body: JSON.stringify({ syllabus: { topics } }),
            });
            if (!res.ok) { setRoleSyllabusField(roleId, { msg: 'Error saving.' }); return; }
            // Update local role in array
            setRoles(prev => prev.map(r => r.id === roleId ? { ...r, syllabus: { topics } } : r));
            setRoleSyllabusField(roleId, { msg: 'Saved ✓', saving: false });
            setTimeout(() => setRoleSyllabusField(roleId, { msg: '' }), 2500);
        } catch { setRoleSyllabusField(roleId, { msg: 'Network error', saving: false }); }
    }

    // ── Company save ───────────────────────────────────────────────────────────
    async function saveCompany(e) {
        e.preventDefault();
        setSaving(true); setSaveMsg('');
        try {
            const res = await fetch(`/api/admin/companies/${companyId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'x-admin-key': ADMIN_KEY },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (!res.ok) { setSaveMsg('Error: ' + data.error); return; }
            setSaveMsg('Saved ✓');
            setTimeout(() => setSaveMsg(''), 2500);
        } catch (_) { setSaveMsg('Network error'); }
        finally { setSaving(false); }
    }

    function setFormField(key, val) { setForm(prev => ({ ...prev, [key]: val })); }
    function addTag(e) {
        if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
            e.preventDefault();
            const t = tagInput.trim().toLowerCase().replace(/\s+/g, '-');
            if (!form.tags.includes(t)) setFormField('tags', [...form.tags, t]);
            setTagInput('');
        }
    }

    // ── Question helpers ───────────────────────────────────────────────────────
    const tabQuestions = activeTab === 'all' ? questions : questions.filter(q => q.round === activeTab);

    function openAddDrawer() {
        setDrawer({ mode: 'add', question: emptyQuestion(companyId) });
        setDrawerError(''); setDrawerTagInput('');
    }
    function openEditDrawer(q) {
        setDrawer({ mode: 'edit', question: { ...q, companyId, options: q.options || ['', '', '', ''], starterCode: q.starterCode || { python: '', cpp: '', java: '', javascript: '' }, testCases: q.testCases || [{ input: '', output: '', isHidden: false }] } });
        setDrawerError(''); setDrawerTagInput('');
    }
    function setDrawerField(key, val) { setDrawer(prev => ({ ...prev, question: { ...prev.question, [key]: val } })); }

    function addDrawerTag(e) {
        if ((e.key === 'Enter' || e.key === ',') && drawerTagInput.trim()) {
            e.preventDefault();
            const t = drawerTagInput.trim().toLowerCase().replace(/\s+/g, '-');
            if (!drawer.question.tags.includes(t)) setDrawerField('tags', [...drawer.question.tags, t]);
            setDrawerTagInput('');
        }
    }

    async function saveQuestion() {
        const q = drawer.question;
        if (!q.text.trim()) { setDrawerError('Question text is required'); return; }
        if (q.type === 'mcq' && q.options.some(o => !o.trim())) { setDrawerError('All 4 MCQ options are required'); return; }

        setDrawerSaving(true); setDrawerError('');
        try {
            const body = {
                companyId,
                text: q.text, type: q.type, round: q.round,
                year: parseInt(q.year) || CURRENT_YEAR,
                difficulty: q.difficulty, tags: q.tags, isReal: q.isReal,
                options: q.type === 'mcq' ? q.options : null,
                correctAnswer: q.type === 'mcq' ? q.correctAnswer : null,
                explanation: q.type === 'mcq' || q.type === 'subjective' ? q.explanation : null,
                starterCode: q.type === 'coding' ? q.starterCode : null,
                solution: q.type === 'coding' ? q.solution : null,
                testCases: q.type === 'coding' ? q.testCases : null,
            };

            if (drawer.mode === 'add') {
                await fetch('/api/admin/questions', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-key': ADMIN_KEY }, body: JSON.stringify(body) });
            } else {
                await fetch(`/api/admin/questions/${q.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'x-admin-key': ADMIN_KEY }, body: JSON.stringify(body) });
            }

            await fetchQuestions();
            setDrawer(null);
        } catch (_) { setDrawerError('Failed to save question'); }
        finally { setDrawerSaving(false); }
    }

    async function deleteQuestion() {
        if (!deleteQ) return;
        setDeletingQ(true);
        try {
            await fetch(`/api/admin/questions/${deleteQ.id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json', 'x-admin-key': ADMIN_KEY },
                body: JSON.stringify({ companyId }),
            });
            await fetchQuestions();
            setDeleteQ(null);
        } catch (_) { } finally { setDeletingQ(false); }
    }

    // ── AI generation ──────────────────────────────────────────────────────────
    async function generateQuestions() {
        setAiLoading(true); setAiError(''); setAiPreview([]);
        try {
            const seeds = aiForm.seedQuestions.trim().split('\n').filter(Boolean);
            const res = await fetch('/api/admin/generate-questions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-admin-key': ADMIN_KEY },
                body: JSON.stringify({ companyId, companyName: company?.name, ...aiForm, count: parseInt(aiForm.count), seedQuestions: seeds }),
            });
            const data = await res.json();
            if (!res.ok) { setAiError(data.error || 'Generation failed'); return; }
            setAiPreview(data.questions.map((q, i) => ({ ...q, _idx: i, selected: true, editMode: false })));
        } catch (e) { setAiError(e.message); }
        finally { setAiLoading(false); }
    }

    async function saveAiSelected() {
        const toSave = aiPreview.filter(q => q.selected);
        if (!toSave.length) return;
        setAiSaving(true);
        try {
            await Promise.all(toSave.map(q =>
                fetch('/api/admin/questions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'x-admin-key': ADMIN_KEY },
                    body: JSON.stringify({ companyId, ...q }),
                })
            ));
            await fetchQuestions();
            setAiPreview([]); setAiPanel(false);
        } catch (_) { } finally { setAiSaving(false); }
    }

    // ── Bulk import ────────────────────────────────────────────────────────────
    function parseBulk() {
        try {
            const arr = JSON.parse(bulkJson);
            if (!Array.isArray(arr)) throw new Error('Must be a JSON array');
            const valid = [], errors = [];
            arr.forEach((q, i) => {
                const missing = [];
                if (!q.text) missing.push('text');
                if (!q.type) missing.push('type');
                if (!q.round) missing.push('round');
                if (!q.difficulty) missing.push('difficulty');
                if (missing.length) errors.push({ index: i, msg: `Missing: ${missing.join(', ')}` });
                else valid.push(q);
            });
            setBulkPreview({ valid, errors });
        } catch (e) {
            setBulkPreview({ parseError: e.message, valid: [], errors: [] });
        }
    }

    async function importBulk() {
        if (!bulkPreview?.valid?.length) return;
        setBulkSaving(true);
        try {
            await Promise.all(bulkPreview.valid.map(q =>
                fetch('/api/admin/questions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'x-admin-key': ADMIN_KEY },
                    body: JSON.stringify({ companyId, ...q }),
                })
            ));
            await fetchQuestions();
            setBulkModal(false); setBulkJson(''); setBulkPreview(null);
        } catch (_) { } finally { setBulkSaving(false); }
    }

    // ── JSON syllabus import validation ────────────────────────────────
    function validateAndImportSyllabus() {
        setJsonImportError('');
        let parsed;
        try {
            parsed = JSON.parse(jsonImportText);
        } catch (e) {
            setJsonImportError('Invalid JSON: ' + e.message);
            return;
        }
        // Validate top-level shape
        if (typeof parsed.overview !== 'string') {
            setJsonImportError('Missing or invalid "overview" field (must be a string).');
            return;
        }
        if (!Array.isArray(parsed.topics) || parsed.topics.length === 0) {
            setJsonImportError('Missing or empty "topics" array.');
            return;
        }
        for (let i = 0; i < parsed.topics.length; i++) {
            const t = parsed.topics[i];
            if (!t.name) { setJsonImportError(`Topic[${i}]: missing "name".`); return; }
            if (!['must', 'good', 'optional'].includes(t.importance)) {
                setJsonImportError(`Topic[${i}]: "importance" must be must | good | optional.`); return;
            }
            if (!Array.isArray(t.subtopics)) {
                setJsonImportError(`Topic[${i}]: "subtopics" must be an array.`); return;
            }
            for (let j = 0; j < t.subtopics.length; j++) {
                const s = t.subtopics[j];
                if (!s.name) { setJsonImportError(`Topic[${i}].subtopics[${j}]: missing "name".`); return; }
                if (!['must', 'good', 'optional'].includes(s.importance)) {
                    setJsonImportError(`Topic[${i}].subtopics[${j}]: "importance" must be must | good | optional.`); return;
                }
            }
        }
        // Ensure each topic has a unique id
        const enriched = {
            ...parsed,
            topics: parsed.topics.map((t, i) => ({
                icon: '📌', prepHours: 10, ...t,
                id: t.id || `topic_${i}_${Date.now()}`,
            }))
        };
        setSyllabus(enriched);
        setSyllabusOpen(true);
        setJsonImportOpen(false);
        setJsonImportText('');
        setSyllabusMsg('JSON imported — review and click Save Syllabus.');
        setTimeout(() => setSyllabusMsg(''), 4000);
    }

    // ── Syllabus helpers ──────────────────────────────────────────────────
    const IMPORTANCE = ['must', 'good', 'optional'];

    function initSyllabus() {
        setSyllabus({
            overview: '',
            topics: [newTopic()],
        });
        setSyllabusOpen(true);
    }

    function newTopic() {
        return { id: Date.now().toString(), name: '', icon: '📌', prepHours: 10, importance: 'must', subtopics: [{ name: '', importance: 'must', note: '' }] };
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

    async function saveSyllabus() {
        setSavingSyllabus(true); setSyllabusMsg('');
        try {
            const res = await fetch(`/api/admin/companies/${companyId}/syllabus`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'x-admin-key': ADMIN_KEY },
                body: JSON.stringify({ syllabus }),
            });
            if (!res.ok) { setSyllabusMsg('Error saving'); return; }
            setSyllabusMsg('Saved ✓');
            setTimeout(() => setSyllabusMsg(''), 2500);
        } catch (_) { setSyllabusMsg('Network error'); }
        finally { setSavingSyllabus(false); }
    }

    if (!form) return (
        <div style={{ padding: '3rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
            Loading…
        </div>
    );

    const typeBadgeColor = { mcq: '#6366f1', coding: 'var(--info)', subjective: 'var(--success)' };
    const diffColor = { Easy: 'var(--success)', Medium: '#f59e0b', Hard: 'var(--danger)' };

    return (
        <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>

            {/* ── LEFT: Company Edit Form ─────────────────────────────────────────── */}
            <div style={{ width: '38%', overflowY: 'auto', padding: '1.75rem', borderRight: '1px solid var(--border)' }}>
                <button onClick={() => router.push('/admin/companies')} style={{
                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                    background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.8rem', cursor: 'pointer', marginBottom: '1.25rem', padding: 0,
                }}>
                    <ArrowLeft size={14} /> Companies
                </button>

                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', color: 'var(--text-primary)', marginBottom: '1.25rem' }}>
                    Edit Company
                </h2>

                <form onSubmit={saveCompany} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <Label>Company Name *</Label>
                        <input value={form.name} onChange={e => setFormField('name', e.target.value)} style={inputStyle(false)} />
                        {form.name && <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>Slug: <code style={{ color: 'var(--primary)' }}>{generateSlugClient(form.name)}</code></p>}
                    </div>

                    <div>
                        <Label>Industry *</Label>
                        <select value={form.industry} onChange={e => setFormField('industry', e.target.value)} style={inputStyle(false)}>
                            {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                        </select>
                    </div>

                    <div>
                        <Label>Description *</Label>
                        <textarea value={form.description} onChange={e => setFormField('description', e.target.value)}
                            rows={4} style={{ ...inputStyle(false), resize: 'vertical' }} />
                    </div>

                    <div>
                        <Label>Hiring Status</Label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {['Active', 'Inactive'].map(s => (
                                <button key={s} type="button" onClick={() => setFormField('hiringStatus', s)} style={{
                                    padding: '0.45rem 1rem', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 500,
                                    background: form.hiringStatus === s ? (s === 'Active' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.12)') : 'var(--bg-elevated)',
                                    border: `1px solid ${form.hiringStatus === s ? (s === 'Active' ? 'var(--success)' : 'var(--danger)') : 'var(--border)'}`,
                                    color: form.hiringStatus === s ? (s === 'Active' ? 'var(--success)' : 'var(--danger)') : 'var(--text-muted)',
                                    borderRadius: '7px',
                                }}>{s}</button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <Label>Rounds</Label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {[['oa', 'OA'], ['technical', 'Technical'], ['hr', 'HR']].map(([k, l]) => (
                                <button key={k} type="button" onClick={() => setFormField('rounds', { ...form.rounds, [k]: !form.rounds[k] })} style={{
                                    display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.45rem 0.85rem',
                                    cursor: 'pointer', fontSize: '0.8rem', borderRadius: '7px',
                                    background: form.rounds[k] ? 'var(--primary-subtle)' : 'var(--bg-elevated)',
                                    border: `1px solid ${form.rounds[k] ? 'var(--primary)' : 'var(--border)'}`,
                                    color: form.rounds[k] ? 'var(--primary)' : 'var(--text-muted)',
                                }}>
                                    {form.rounds[k] && <Check size={11} />} {l}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <Label>Tags</Label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', alignItems: 'center', minHeight: '42px', padding: '0.4rem', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px' }}>
                            {form.tags.map(t => (
                                <span key={t} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.2rem 0.5rem', background: 'var(--primary-subtle)', border: '1px solid var(--border-active)', borderRadius: '5px', fontSize: '0.75rem', color: 'var(--primary)' }}>
                                    {t}
                                    <button type="button" onClick={() => setFormField('tags', form.tags.filter(x => x !== t))} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--primary)', display: 'flex' }}><X size={9} /></button>
                                </span>
                            ))}
                            <input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={addTag}
                                placeholder={form.tags.length ? '' : 'Tag + Enter…'}
                                style={{ border: 'none', background: 'none', color: 'var(--text-primary)', fontSize: '0.8rem', flex: '1 1 80px', minWidth: '60px', outline: 'none' }} />
                        </div>
                    </div>

                    <div>
                        <Label>Logo URL</Label>
                        <input value={form.logo} onChange={e => setFormField('logo', e.target.value)} placeholder="https://…" style={inputStyle(false)} />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.25rem' }}>
                        <button type="submit" disabled={saving} style={{
                            display: 'flex', alignItems: 'center', gap: '0.4rem',
                            padding: '0.7rem 1.4rem', background: 'var(--primary)', color: '#fff',
                            border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer',
                            opacity: saving ? 0.7 : 1,
                        }}>
                            <Save size={14} /> {saving ? 'Saving…' : 'Save Changes'}
                        </button>
                        {saveMsg && <span style={{ fontSize: '0.85rem', color: saveMsg.startsWith('Error') ? 'var(--danger)' : 'var(--success)' }}>{saveMsg}</span>}
                    </div>
                </form>

                {/* ── Job Roles Section ───────────────────────────────────── */}
                <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                        <span style={{ fontSize: '1rem' }}>👔</span>
                        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', color: 'var(--text-primary)', flex: 1 }}>Job Roles</h3>
                        <button
                            onClick={() => { setRoleAddOpen(o => !o); setRoleForm({ name: '', roundTypes: [], description: '' }); }}
                            style={{ fontSize: '0.78rem', background: 'var(--primary)', border: 'none', borderRadius: '6px', color: '#fff', padding: '0.3rem 0.75rem', cursor: 'pointer', fontWeight: 600 }}
                        >+ Add Role</button>
                    </div>

                    {/* ── Add Role Form ── */}
                    {roleAddOpen && (
                        <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '10px', padding: '1rem', marginBottom: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                            <div>
                                <Label>Role Name</Label>
                                <input value={roleForm.name} onChange={e => setRoleForm(prev => ({ ...prev, name: e.target.value }))} placeholder="e.g. Java Developer, BDE, SDE-2" style={inputStyle(false)} />
                            </div>
                            <div>
                                <Label>Hiring Rounds for This Role</Label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.35rem' }}>
                                    {ROLE_ROUND_OPTIONS.map(opt => (
                                        <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                            <input type="checkbox" checked={roleForm.roundTypes.includes(opt.value)} onChange={() => toggleRoleRoundType(opt.value)} style={{ accentColor: 'var(--primary)', width: '14px', height: '14px' }} />
                                            {opt.label}
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <Label>Description (optional)</Label>
                                <input value={roleForm.description} onChange={e => setRoleForm(prev => ({ ...prev, description: e.target.value }))} placeholder="Brief note about this role…" style={inputStyle(false)} />
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button onClick={addRole} disabled={roleAdding || !roleForm.name.trim()} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.55rem 1rem', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '7px', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', opacity: roleAdding ? 0.6 : 1 }}>
                                    <Check size={13} /> {roleAdding ? 'Adding…' : 'Add Role'}
                                </button>
                                <button onClick={() => setRoleAddOpen(false)} style={{ padding: '0.55rem 0.9rem', background: 'none', border: '1px solid var(--border)', borderRadius: '7px', color: 'var(--text-muted)', fontSize: '0.8rem', cursor: 'pointer' }}>Cancel</button>
                            </div>
                        </div>
                    )}

                    {/* ── Roles List (expandable cards) ── */}
                    {rolesLoading ? (
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Loading roles…</p>
                    ) : roles.length === 0 ? (
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No job roles yet. Click <strong>+ Add Role</strong> to define positions this company hires for, each with their own rounds and syllabus.</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {roles.map(role => {
                                const isExpanded = expandedRoleId === role.id;
                                const isEditingThis = roleEditId === role.id;
                                const rs = getRoleSyllabus(role.id);
                                return (
                                    <div key={role.id} style={{ background: 'var(--bg-elevated)', border: `1px solid ${isExpanded ? 'rgba(124,58,237,0.45)' : 'var(--border)'}`, borderRadius: '10px', overflow: 'hidden', transition: 'border-color 0.2s' }}>

                                        {/* Card Header */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', cursor: 'pointer' }} onClick={() => !isEditingThis && expandRole(role)}>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                {isEditingThis ? (
                                                    <input value={roleEditForm.name || ''} onChange={e => setRoleEditForm(p => ({ ...p, name: e.target.value }))} style={{ ...inputStyle(false), padding: '0.45rem 0.7rem', fontSize: '0.85rem' }} onClick={e => e.stopPropagation()} />
                                                ) : (
                                                    <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{role.name}</span>
                                                )}
                                                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '4px' }}>
                                                    {(isEditingThis ? (roleEditForm.roundTypes || []) : (role.roundTypes || [])).map(rt => (
                                                        <span key={rt} style={{ fontSize: '0.68rem', padding: '2px 7px', borderRadius: '4px', background: 'rgba(124,58,237,0.15)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.3)' }}>{rt.toUpperCase()}</span>
                                                    ))}
                                                    {((isEditingThis ? roleEditForm.roundTypes : role.roundTypes) || []).length === 0 && <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>No rounds configured</span>}
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.3rem', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                                                {isEditingThis ? (
                                                    <>
                                                        <button onClick={() => saveRoleEdit(role.id)} disabled={roleSaving} style={{ padding: '0.35rem 0.8rem', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.76rem', fontWeight: 600, cursor: 'pointer', opacity: roleSaving ? 0.6 : 1 }}>{roleSaving ? '…' : '✓ Save'}</button>
                                                        <button onClick={() => setRoleEditId(null)} style={{ padding: '0.35rem 0.7rem', background: 'none', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-muted)', fontSize: '0.76rem', cursor: 'pointer' }}>Cancel</button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button onClick={() => { setRoleEditId(role.id); setRoleEditForm({ name: role.name, roundTypes: role.roundTypes || [], description: role.description || '' }); setExpandedRoleId(role.id); }} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '5px', color: 'var(--text-muted)', padding: '0.28rem 0.55rem', cursor: 'pointer', fontSize: '0.76rem' }}><Edit3 size={12} /></button>
                                                        <button onClick={() => deleteRole(role.id)} disabled={roleDeleting === role.id} style={{ background: 'none', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '5px', color: 'var(--danger)', padding: '0.28rem 0.55rem', cursor: 'pointer', fontSize: '0.76rem', opacity: roleDeleting === role.id ? 0.5 : 1 }}><Trash2 size={12} /></button>
                                                    </>
                                                )}
                                                <button onClick={() => !isEditingThis && expandRole(role)} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '5px', color: 'var(--text-muted)', padding: '0.28rem 0.55rem', cursor: 'pointer' }}>
                                                    {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Expanded body */}
                                        {isExpanded && (
                                            <div style={{ borderTop: '1px solid var(--border)', padding: '0.85rem 1rem 1rem' }}>

                                                {/* ── Edit rounds & description while expanded */}
                                                {isEditingThis && (
                                                    <div style={{ marginBottom: '1rem' }}>
                                                        <Label>Hiring Rounds</Label>
                                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.3rem', marginBottom: '0.6rem' }}>
                                                            {ROLE_ROUND_OPTIONS.map(opt => (
                                                                <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                                                    <input type="checkbox" checked={(roleEditForm.roundTypes || []).includes(opt.value)} onChange={() => toggleEditRoleRoundType(opt.value)} style={{ accentColor: 'var(--primary)', width: '14px', height: '14px' }} />
                                                                    {opt.label}
                                                                </label>
                                                            ))}
                                                        </div>
                                                        <Label>Description</Label>
                                                        <input value={roleEditForm.description || ''} onChange={e => setRoleEditForm(p => ({ ...p, description: e.target.value }))} placeholder="Brief description…" style={{ ...inputStyle(false), marginTop: '0.3rem' }} />
                                                    </div>
                                                )}

                                                {/* ── Per-role Syllabus Editor */}
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
                                                    <BookOpen size={14} style={{ color: 'var(--primary)' }} />
                                                    <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.82rem', color: 'var(--text-primary)', fontWeight: 600 }}>Syllabus Topics for {role.name}</span>
                                                </div>

                                                {(rs.topics || []).map((topic, idx) => (
                                                    <div key={idx} style={{ display: 'flex', gap: '0.4rem', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                                        <div style={{ flex: 2 }}>
                                                            {idx === 0 && <Label>Topic Name</Label>}
                                                            <input value={topic.name} onChange={e => setRoleTopic(role.id, idx, 'name', e.target.value)} placeholder="e.g. Data Structures" style={{ ...inputStyle(false), fontSize: '0.8rem', padding: '0.5rem 0.65rem' }} />
                                                        </div>
                                                        <div style={{ flex: 3 }}>
                                                            {idx === 0 && <Label>Description</Label>}
                                                            <input value={topic.description || ''} onChange={e => setRoleTopic(role.id, idx, 'description', e.target.value)} placeholder="What to cover…" style={{ ...inputStyle(false), fontSize: '0.8rem', padding: '0.5rem 0.65rem' }} />
                                                        </div>
                                                        <div style={{ width: '62px' }}>
                                                            {idx === 0 && <Label>Hrs</Label>}
                                                            <input type="number" min="0" value={topic.studyHours || ''} onChange={e => setRoleTopic(role.id, idx, 'studyHours', e.target.value)} placeholder="0" style={{ ...inputStyle(false), fontSize: '0.8rem', padding: '0.5rem 0.65rem' }} />
                                                        </div>
                                                        <div style={{ paddingTop: idx === 0 ? '1.25rem' : 0 }}>
                                                            <button onClick={() => removeRoleTopic(role.id, idx)} style={{ background: 'none', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '5px', color: 'var(--danger)', padding: '0.38rem 0.55rem', cursor: 'pointer' }}><Trash2 size={11} /></button>
                                                        </div>
                                                    </div>
                                                ))}

                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.4rem' }}>
                                                    <button onClick={() => addRoleTopic(role.id)} style={{ fontSize: '0.78rem', background: 'none', border: '1px dashed var(--border)', borderRadius: '6px', color: 'var(--primary)', padding: '0.4rem 0.8rem', cursor: 'pointer' }}>+ Add Topic</button>
                                                    <button onClick={() => saveRoleSyllabus(role.id)} disabled={rs.saving} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.45rem 0.9rem', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer', opacity: rs.saving ? 0.65 : 1 }}>
                                                        <Save size={12} /> {rs.saving ? 'Saving…' : 'Save Syllabus'}
                                                    </button>
                                                    {rs.msg && <span style={{ fontSize: '0.78rem', color: rs.msg.startsWith('Error') || rs.msg === 'Network error' ? 'var(--danger)' : 'var(--success)' }}>{rs.msg}</span>}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* ── Study Material / Syllabus Section ────────────────────── */}
                <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                        <BookOpen size={16} style={{ color: 'var(--primary)' }} />
                        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', color: 'var(--text-primary)', flex: 1 }}>
                            Study Material Syllabus
                        </h3>
                        {syllabus ? (
                            <button onClick={() => setSyllabusOpen(o => !o)} style={{
                                fontSize: '0.78rem', background: 'none', border: '1px solid var(--border)',
                                borderRadius: '6px', color: 'var(--text-muted)', padding: '0.3rem 0.65rem', cursor: 'pointer',
                            }}>
                                {syllabusOpen ? 'Collapse' : 'Edit Syllabus'}
                            </button>
                        ) : (
                            <button onClick={initSyllabus} style={{
                                fontSize: '0.78rem', background: 'var(--primary)', border: 'none',
                                borderRadius: '6px', color: '#fff', padding: '0.3rem 0.75rem', cursor: 'pointer', fontWeight: 600,
                            }}>
                                + Create Syllabus
                            </button>
                        )}
                        <button onClick={() => { setJsonImportOpen(true); setJsonImportError(''); }} style={{
                            fontSize: '0.78rem', background: 'none', border: '1px solid var(--border)',
                            borderRadius: '6px', color: 'var(--text-muted)', padding: '0.3rem 0.65rem', cursor: 'pointer',
                        }}>
                            📥 Import JSON
                        </button>
                    </div>

                    {!syllabus && (
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            No syllabus yet. Click <strong>+ Create Syllabus</strong> to build the study guide students will see.
                        </p>
                    )}

                    {syllabus && syllabusOpen && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                            {/* Overview */}
                            <div>
                                <Label>Overview (shown to students)</Label>
                                <textarea
                                    value={syllabus.overview}
                                    onChange={e => setSyllabus(p => ({ ...p, overview: e.target.value }))}
                                    rows={3} placeholder="Brief description of what the selection process looks like…"
                                    style={{ ...inputStyle(false), resize: 'vertical' }}
                                />
                            </div>

                            {/* Topics */}
                            {syllabus.topics.map((topic, tIdx) => (
                                <div key={tIdx} style={{
                                    background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                                    borderRadius: '10px', padding: '1rem',
                                }}>
                                    {/* Topic header row */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '0.5rem', marginBottom: '0.75rem', alignItems: 'end' }}>
                                        <div>
                                            <Label>Topic Name *</Label>
                                            <input value={topic.name} onChange={e => updateTopic(tIdx, 'name', e.target.value)}
                                                placeholder="e.g. Data Structures" style={inputStyle(false)} />
                                        </div>
                                        <div>
                                            <Label>Icon (emoji)</Label>
                                            <input value={topic.icon} onChange={e => updateTopic(tIdx, 'icon', e.target.value)}
                                                placeholder="💻" style={{ ...inputStyle(false), textAlign: 'center' }} />
                                        </div>
                                        <div>
                                            <Label>Prep Hours</Label>
                                            <input type="number" min={1} value={topic.prepHours}
                                                onChange={e => updateTopic(tIdx, 'prepHours', parseInt(e.target.value) || 1)}
                                                style={inputStyle(false)} />
                                        </div>
                                        <button onClick={() => deleteTopic(tIdx)} style={{
                                            background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)',
                                            padding: '0.4rem', marginTop: '1.1rem', display: 'flex',
                                        }}><Trash2 size={14} /></button>
                                    </div>

                                    <div style={{ marginBottom: '0.75rem' }}>
                                        <Label>Topic Importance</Label>
                                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                                            {IMPORTANCE.map(imp => (
                                                <button key={imp} type="button"
                                                    onClick={() => updateTopic(tIdx, 'importance', imp)}
                                                    style={{
                                                        padding: '0.3rem 0.7rem', fontSize: '0.75rem', cursor: 'pointer', borderRadius: '6px',
                                                        background: topic.importance === imp ? 'var(--primary-subtle)' : 'var(--bg-surface)',
                                                        border: `1px solid ${topic.importance === imp ? 'var(--primary)' : 'var(--border)'}`,
                                                        color: topic.importance === imp ? 'var(--primary)' : 'var(--text-muted)',
                                                    }}>{imp}</button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Subtopics */}
                                    <Label>Subtopics</Label>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '0.5rem' }}>
                                        {topic.subtopics.map((sub, sIdx) => (
                                            <div key={sIdx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.5fr auto', gap: '0.4rem', alignItems: 'center' }}>
                                                <input value={sub.name} onChange={e => updateSubtopic(tIdx, sIdx, 'name', e.target.value)}
                                                    placeholder="Subtopic name" style={{ ...inputStyle(false), fontSize: '0.8rem' }} />
                                                <select value={sub.importance} onChange={e => updateSubtopic(tIdx, sIdx, 'importance', e.target.value)}
                                                    style={{ ...inputStyle(false), fontSize: '0.78rem' }}>
                                                    {IMPORTANCE.map(i => <option key={i} value={i}>{i}</option>)}
                                                </select>
                                                <input value={sub.note || ''} onChange={e => updateSubtopic(tIdx, sIdx, 'note', e.target.value)}
                                                    placeholder="💡 Tip (optional)" style={{ ...inputStyle(false), fontSize: '0.78rem' }} />
                                                <button onClick={() => deleteSubtopic(tIdx, sIdx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', display: 'flex' }}>
                                                    <X size={13} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    <button onClick={() => addSubtopic(tIdx)} style={{
                                        fontSize: '0.78rem', background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: 0,
                                    }}>+ Add Subtopic</button>
                                </div>
                            ))}

                            <button onClick={addTopic} style={{
                                padding: '0.55rem', background: 'var(--bg-elevated)', border: '1px dashed var(--border)',
                                borderRadius: '8px', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500,
                            }}>+ Add Topic</button>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <button onClick={saveSyllabus} disabled={savingSyllabus} style={{
                                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                                    padding: '0.65rem 1.25rem', background: 'var(--primary)', color: '#fff',
                                    border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
                                    opacity: savingSyllabus ? 0.7 : 1,
                                }}>
                                    <Save size={13} /> {savingSyllabus ? 'Saving…' : 'Save Syllabus'}
                                </button>
                                <button onClick={() => { setJsonImportOpen(true); setJsonImportError(''); }} style={{
                                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                                    padding: '0.65rem 1rem', background: 'var(--bg-elevated)', color: 'var(--text-secondary)',
                                    border: '1px solid var(--border)', borderRadius: '8px', fontWeight: 500, fontSize: '0.85rem', cursor: 'pointer',
                                }}>
                                    📥 Import JSON
                                </button>
                                {syllabusMsg && <span style={{ fontSize: '0.82rem', color: syllabusMsg.startsWith('Error') ? 'var(--danger)' : 'var(--success)' }}>{syllabusMsg}</span>}
                            </div>
                        </div>
                    )}

                    {syllabus && !syllabusOpen && (
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {syllabus.topics?.length || 0} topic{syllabus.topics?.length !== 1 ? 's' : ''} defined. Click <strong>Edit Syllabus</strong> to update.
                        </p>
                    )}
                </div>
            </div>

            {/* ── RIGHT: Questions Manager ────────────────────────────────────────── */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                {/* Header */}
                <div style={{ padding: '1.25rem 1.75rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                        Questions <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontFamily: 'var(--font-body)', fontWeight: 400 }}>({questions.length})</span>
                    </h2>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <IconBtn icon={<Upload size={14} />} label="Bulk Import" onClick={() => setBulkModal(true)} />
                        <IconBtn icon={<Sparkles size={14} />} label="Generate" onClick={() => setAiPanel(p => !p)} primary={aiPanel} />
                        <IconBtn icon={<Plus size={14} />} label="Add Question" onClick={openAddDrawer} primary />
                    </div>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '0', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
                    {['all', 'oa', 'technical', 'hr'].map(tab => {
                        const count = tab === 'all' ? questions.length : questions.filter(q => q.round === tab).length;
                        return (
                            <button key={tab} onClick={() => setActiveTab(tab)} style={{
                                padding: '0.75rem 1.25rem', background: 'none', border: 'none', cursor: 'pointer',
                                fontSize: '0.85rem', fontWeight: activeTab === tab ? 600 : 400,
                                color: activeTab === tab ? 'var(--primary)' : 'var(--text-muted)',
                                borderBottom: `2px solid ${activeTab === tab ? 'var(--primary)' : 'transparent'}`,
                                transition: 'all 0.15s',
                            }}>
                                {tab.toUpperCase()} <span style={{ opacity: 0.6 }}>({count})</span>
                            </button>
                        );
                    })}
                </div>

                {/* AI Panel */}
                {aiPanel && (
                    <div style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)', padding: '1.25rem 1.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                            <Sparkles size={16} style={{ color: 'var(--primary)' }} />
                            <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>Generate Questions with AI</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: '0.75rem' }}>
                            {[
                                { key: 'round', label: 'Round', opts: ROUNDS },
                                { key: 'type', label: 'Type', opts: TYPES },
                                { key: 'difficulty', label: 'Difficulty', opts: DIFFICULTIES },
                            ].map(({ key, label, opts }) => (
                                <div key={key}>
                                    <Label>{label}</Label>
                                    <select value={aiForm[key]} onChange={e => setAiForm(p => ({ ...p, [key]: e.target.value }))} style={inputStyle(false)}>
                                        {opts.map(o => <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
                                    </select>
                                </div>
                            ))}
                            <div>
                                <Label>Count (max 10)</Label>
                                <input type="number" min={1} max={10} value={aiForm.count} onChange={e => setAiForm(p => ({ ...p, count: e.target.value }))} style={inputStyle(false)} />
                            </div>
                        </div>
                        <div style={{ marginBottom: '0.75rem' }}>
                            <Label>Seed Questions (real PYQs — one per line, optional)</Label>
                            <textarea value={aiForm.seedQuestions} onChange={e => setAiForm(p => ({ ...p, seedQuestions: e.target.value }))}
                                rows={3} placeholder="Paste 3–5 real questions here to guide the AI's style…"
                                style={{ ...inputStyle(false), resize: 'vertical' }} />
                        </div>
                        {aiError && <p style={{ color: 'var(--danger)', fontSize: '0.82rem', marginBottom: '0.75rem' }}>{aiError}</p>}
                        <button onClick={generateQuestions} disabled={aiLoading} style={{
                            padding: '0.6rem 1.25rem', background: 'var(--primary)', color: '#fff',
                            border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer',
                            opacity: aiLoading ? 0.7 : 1,
                        }}>
                            {aiLoading ? 'Generating…' : '🤖 Generate Preview'}
                        </button>

                        {/* AI Preview */}
                        {aiPreview.length > 0 && (
                            <div style={{ marginTop: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                                        Preview ({aiPreview.filter(q => q.selected).length} selected)
                                    </span>
                                    <button onClick={saveAiSelected} disabled={aiSaving || !aiPreview.some(q => q.selected)} style={{
                                        padding: '0.5rem 1rem', background: 'var(--success)', color: '#fff',
                                        border: 'none', borderRadius: '7px', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer',
                                        opacity: aiSaving ? 0.7 : 1,
                                    }}>
                                        {aiSaving ? 'Saving…' : `Save Selected (${aiPreview.filter(q => q.selected).length})`}
                                    </button>
                                </div>
                                {aiPreview.map((q, i) => (
                                    <div key={i} style={{
                                        background: 'var(--bg-surface)', border: `1px solid ${q.selected ? 'var(--primary-subtle)' : 'var(--border)'}`,
                                        borderRadius: '10px', padding: '0.9rem', marginBottom: '0.5rem',
                                        opacity: q.selected ? 1 : 0.5,
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                                            <input type="checkbox" checked={q.selected} onChange={() => setAiPreview(p => p.map((x, j) => j === i ? { ...x, selected: !x.selected } : x))}
                                                style={{ marginTop: '3px', accentColor: 'var(--primary)' }} />
                                            <div style={{ flex: 1 }}>
                                                {q.editMode ? (
                                                    <div>
                                                        <textarea value={q.text} onChange={e => setAiPreview(p => p.map((x, j) => j === i ? { ...x, text: e.target.value } : x))}
                                                            rows={3} style={{ ...inputStyle(false), marginBottom: '0.4rem', resize: 'vertical', width: '100%' }} />
                                                        <button onClick={() => setAiPreview(p => p.map((x, j) => j === i ? { ...x, editMode: false } : x))}
                                                            style={{ padding: '0.35rem 0.75rem', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.78rem' }}>
                                                            Done editing
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                                                            {q.text.length > 120 ? q.text.slice(0, 120) + '…' : q.text}
                                                        </p>
                                                        <button onClick={() => setAiPreview(p => p.map((x, j) => j === i ? { ...x, editMode: true } : x))}
                                                            style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.78rem', cursor: 'pointer', padding: 0 }}>
                                                            ✏️ Edit
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Question list */}
                <div style={{ flex: 1, padding: '0' }}>
                    {qLoading ? (
                        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading questions…</div>
                    ) : tabQuestions.length === 0 ? (
                        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                            No questions in this tab yet.
                            <button onClick={openAddDrawer} style={{ display: 'block', margin: '0.75rem auto 0', padding: '0.5rem 1rem', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}>
                                + Add Question
                            </button>
                        </div>
                    ) : tabQuestions.map((q, i) => (
                        <div key={q.id} style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '0.85rem 1.75rem',
                            borderBottom: i < tabQuestions.length - 1 ? '1px solid var(--border)' : 'none',
                        }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.3rem', flexWrap: 'wrap' }}>
                                    <span style={{ padding: '2px 7px', borderRadius: '5px', fontSize: '0.7rem', fontWeight: 700, background: `${typeBadgeColor[q.type]}22`, color: typeBadgeColor[q.type], textTransform: 'uppercase' }}>{q.type}</span>
                                    <span style={{ padding: '2px 7px', borderRadius: '5px', fontSize: '0.7rem', background: 'var(--bg-elevated)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{q.round}</span>
                                    <span style={{ fontSize: '0.7rem', color: diffColor[q.difficulty], fontWeight: 600 }}>{q.difficulty}</span>
                                    {q.isReal && <Star size={11} style={{ color: '#f59e0b' }} title="Real PYQ" />}
                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{q.year}</span>
                                    {q.roleId && roles.length > 0 && (() => {
                                        const role = roles.find(r => r.id === q.roleId);
                                        return role ? (
                                            <span style={{ padding: '2px 7px', borderRadius: '5px', fontSize: '0.68rem', background: 'rgba(99,102,241,0.12)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.25)' }}>{role.name}</span>
                                        ) : null;
                                    })()}
                                </div>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>
                                    {q.text?.slice(0, 80)}{q.text?.length > 80 ? '…' : ''}
                                </p>
                            </div>
                            <div style={{ display: 'flex', gap: '0.4rem', marginLeft: '0.75rem', flexShrink: 0 }}>
                                <button onClick={() => openEditDrawer(q)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '7px', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                    <Edit3 size={13} />
                                </button>
                                <button onClick={() => setDeleteQ({ id: q.id, text: q.text })} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '7px', color: 'var(--danger)', cursor: 'pointer' }}>
                                    <Trash2 size={13} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Question Drawer ─────────────────────────────────────────────────── */}
            {drawer && (
                <>
                    <div onClick={() => setDrawer(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 998 }} />
                    <div style={{
                        position: 'fixed', top: 0, right: 0, bottom: 0, width: '520px',
                        background: 'var(--bg-surface)', borderLeft: '1px solid var(--border)',
                        zIndex: 999, overflowY: 'auto', padding: '1.75rem',
                        display: 'flex', flexDirection: 'column', gap: '1rem',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                                {drawer.mode === 'add' ? 'Add Question' : 'Edit Question'}
                            </h3>
                            <button onClick={() => setDrawer(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}><X size={20} /></button>
                        </div>

                        {/* Common fields */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                            <div>
                                <Label>Type *</Label>
                                <select value={drawer.question.type} onChange={e => {
                                    const t = e.target.value;
                                    setDrawerField('type', t);
                                    setDrawerField('options', t === 'mcq' ? ['', '', '', ''] : null);
                                    setDrawerField('correctAnswer', t === 'mcq' ? 0 : null);
                                }} style={inputStyle(false)}>
                                    {TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                                </select>
                            </div>
                            <div>
                                <Label>Round *</Label>
                                <select value={drawer.question.round} onChange={e => setDrawerField('round', e.target.value)} style={inputStyle(false)}>
                                    {ROUNDS.map(r => <option key={r} value={r}>{r.toUpperCase()}</option>)}
                                </select>
                            </div>
                            <div>
                                <Label>Role</Label>
                                <select value={drawer.question.roleId || ''} onChange={e => setDrawerField('roleId', e.target.value)} style={inputStyle(false)}>
                                    <option value=''>All Roles</option>
                                    {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <Label>Difficulty *</Label>
                                <select value={drawer.question.difficulty} onChange={e => setDrawerField('difficulty', e.target.value)} style={inputStyle(false)}>
                                    {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>
                            <div>
                                <Label>Year</Label>
                                <input type="number" value={drawer.question.year} onChange={e => setDrawerField('year', e.target.value)} style={inputStyle(false)} />
                            </div>
                        </div>

                        {/* Is Real PYQ */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                <input type="checkbox" checked={drawer.question.isReal} onChange={e => setDrawerField('isReal', e.target.checked)}
                                    style={{ accentColor: 'var(--primary)', width: '15px', height: '15px' }} />
                                <Star size={14} style={{ color: '#f59e0b' }} /> Real PYQ (show ⭐ badge to students)
                            </label>
                        </div>

                        {/* Tags */}
                        <div>
                            <Label>Tags</Label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', alignItems: 'center', minHeight: '40px', padding: '0.4rem', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px' }}>
                                {drawer.question.tags.map(t => (
                                    <span key={t} style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', padding: '0.18rem 0.45rem', background: 'var(--primary-subtle)', border: '1px solid var(--border-active)', borderRadius: '5px', fontSize: '0.72rem', color: 'var(--primary)' }}>
                                        {t} <button type="button" onClick={() => setDrawerField('tags', drawer.question.tags.filter(x => x !== t))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', display: 'flex', padding: 0 }}><X size={9} /></button>
                                    </span>
                                ))}
                                <input value={drawerTagInput} onChange={e => setDrawerTagInput(e.target.value)} onKeyDown={addDrawerTag}
                                    placeholder="Tag + Enter…"
                                    style={{ border: 'none', background: 'none', color: 'var(--text-primary)', fontSize: '0.8rem', flex: '1 1 80px', minWidth: '50px', outline: 'none' }} />
                            </div>
                        </div>

                        {/* Question Text */}
                        <div>
                            <Label>Question Text *</Label>
                            <textarea value={drawer.question.text} onChange={e => setDrawerField('text', e.target.value)} rows={4}
                                placeholder="Write the question (markdown supported)…"
                                style={{ ...inputStyle(false), resize: 'vertical' }} />
                        </div>

                        {/* ── MCQ Fields ────── */}
                        {drawer.question.type === 'mcq' && (
                            <>
                                {['A', 'B', 'C', 'D'].map((letter, idx) => (
                                    <div key={idx}>
                                        <Label>Option {letter} *</Label>
                                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                            <input type="radio" name="correctAnswer" checked={drawer.question.correctAnswer === idx}
                                                onChange={() => setDrawerField('correctAnswer', idx)}
                                                style={{ accentColor: 'var(--primary)', flexShrink: 0 }} title="Mark as correct" />
                                            <input value={drawer.question.options?.[idx] || ''} onChange={e => {
                                                const opts = [...(drawer.question.options || ['', '', '', ''])];
                                                opts[idx] = e.target.value;
                                                setDrawerField('options', opts);
                                            }} style={inputStyle(false)} />
                                        </div>
                                    </div>
                                ))}
                                <div>
                                    <Label>Explanation</Label>
                                    <textarea value={drawer.question.explanation || ''} onChange={e => setDrawerField('explanation', e.target.value)} rows={2} style={{ ...inputStyle(false), resize: 'vertical' }} />
                                </div>
                            </>
                        )}

                        {/* ── Coding Fields ──── */}
                        {drawer.question.type === 'coding' && (
                            <>
                                <div>
                                    <Label>Solution (Python)</Label>
                                    <textarea value={drawer.question.solution || ''} onChange={e => setDrawerField('solution', e.target.value)} rows={5}
                                        style={{ ...inputStyle(false), resize: 'vertical', fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }} />
                                </div>
                                <div>
                                    <Label>Test Cases</Label>
                                    {(drawer.question.testCases || []).map((tc, idx) => (
                                        <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto auto', gap: '0.4rem', marginBottom: '0.4rem', alignItems: 'center' }}>
                                            <input placeholder="Input" value={tc.input} onChange={e => {
                                                const tcs = [...drawer.question.testCases];
                                                tcs[idx] = { ...tcs[idx], input: e.target.value };
                                                setDrawerField('testCases', tcs);
                                            }} style={{ ...inputStyle(false), fontSize: '0.78rem' }} />
                                            <input placeholder="Expected output" value={tc.output} onChange={e => {
                                                const tcs = [...drawer.question.testCases];
                                                tcs[idx] = { ...tcs[idx], output: e.target.value };
                                                setDrawerField('testCases', tcs);
                                            }} style={{ ...inputStyle(false), fontSize: '0.78rem' }} />
                                            <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem', whiteSpace: 'nowrap' }}>
                                                <input type="checkbox" checked={tc.isHidden} onChange={e => {
                                                    const tcs = [...drawer.question.testCases];
                                                    tcs[idx] = { ...tcs[idx], isHidden: e.target.checked };
                                                    setDrawerField('testCases', tcs);
                                                }} /> Hidden
                                            </label>
                                            <button type="button" onClick={() => setDrawerField('testCases', drawer.question.testCases.filter((_, j) => j !== idx))}
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', display: 'flex' }}>
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))}
                                    <button type="button" onClick={() => setDrawerField('testCases', [...(drawer.question.testCases || []), { input: '', output: '', isHidden: false }])}
                                        style={{ fontSize: '0.8rem', color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                                        + Add Test Case
                                    </button>
                                </div>
                            </>
                        )}

                        {/* ── Subjective Fields ─ */}
                        {drawer.question.type === 'subjective' && (
                            <div>
                                <Label>Ideal Answer / Key Points</Label>
                                <textarea value={drawer.question.explanation || ''} onChange={e => setDrawerField('explanation', e.target.value)} rows={4}
                                    placeholder="Key points the candidate should cover…"
                                    style={{ ...inputStyle(false), resize: 'vertical' }} />
                            </div>
                        )}

                        {drawerError && <p style={{ color: 'var(--danger)', fontSize: '0.82rem' }}>{drawerError}</p>}

                        <button onClick={saveQuestion} disabled={drawerSaving} style={{
                            padding: '0.8rem', background: 'var(--primary)', color: '#fff',
                            border: 'none', borderRadius: '10px', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer',
                            marginTop: 'auto', opacity: drawerSaving ? 0.7 : 1,
                        }}>
                            {drawerSaving ? 'Saving…' : (drawer.mode === 'add' ? 'Add Question' : 'Save Question')}
                        </button>
                    </div>
                </>
            )}

            {/* ── Delete Question Modal ───────────────────────────────────────────── */}
            {deleteQ && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setDeleteQ(null)}>
                    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '2rem', maxWidth: '380px', width: '90%' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: 'var(--danger)' }}>
                            <AlertTriangle size={18} />
                            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--text-primary)' }}>Delete Question?</h3>
                        </div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                            "{deleteQ.text?.slice(0, 80)}…" — This cannot be undone.
                        </p>
                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                            <button onClick={() => setDeleteQ(null)} style={{ padding: '0.55rem 1.1rem', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-secondary)', cursor: 'pointer' }}>Cancel</button>
                            <button onClick={deleteQuestion} disabled={deletingQ} style={{ padding: '0.55rem 1.1rem', background: 'var(--danger)', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 600, cursor: 'pointer', opacity: deletingQ ? 0.7 : 1 }}>
                                {deletingQ ? 'Deleting…' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Bulk Import Modal ───────────────────────────────────────────────── */}
            {bulkModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setBulkModal(false)}>
                    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '2rem', maxWidth: '580px', width: '95%', maxHeight: '80vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--text-primary)' }}>Bulk Import Questions</h3>
                            <button onClick={() => setBulkModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}><X size={20} /></button>
                        </div>

                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                            Paste a JSON array of questions. Required fields: <code style={{ color: 'var(--primary)' }}>text, type, round, difficulty</code>
                        </p>

                        <textarea
                            value={bulkJson}
                            onChange={e => { setBulkJson(e.target.value); setBulkPreview(null); }}
                            placeholder={'[\n  {\n    "text": "What is polymorphism?",\n    "type": "mcq",\n    "round": "technical",\n    "difficulty": "Easy",\n    "isReal": true,\n    "options": ["One form","Many forms","No form","Two forms"],\n    "correctAnswer": 1,\n    "tags": ["oops"],\n    "year": 2024\n  }\n]'}
                            rows={10}
                            style={{ ...inputStyle(false), fontFamily: 'var(--font-mono)', fontSize: '0.78rem', resize: 'vertical', width: '100%', marginBottom: '0.75rem' }}
                        />

                        <button onClick={parseBulk} style={{ padding: '0.6rem 1.2rem', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem', marginBottom: '1rem' }}>
                            Validate JSON
                        </button>

                        {bulkPreview && (
                            <div style={{ marginBottom: '1rem' }}>
                                {bulkPreview.parseError && (
                                    <p style={{ color: 'var(--danger)', fontSize: '0.82rem' }}>Parse error: {bulkPreview.parseError}</p>
                                )}
                                {!bulkPreview.parseError && (
                                    <>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--success)', marginBottom: '0.5rem' }}>
                                            ✓ {bulkPreview.valid.length} valid questions ready to import
                                        </p>
                                        {bulkPreview.errors.map(e => (
                                            <p key={e.index} style={{ fontSize: '0.78rem', color: 'var(--danger)', marginBottom: '0.25rem' }}>Row {e.index + 1}: {e.msg}</p>
                                        ))}
                                        {bulkPreview.valid.length > 0 && (
                                            <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden', marginTop: '0.75rem' }}>
                                                {bulkPreview.valid.slice(0, 5).map((q, i) => (
                                                    <div key={i} style={{ padding: '0.6rem 0.9rem', borderBottom: i < Math.min(bulkPreview.valid.length - 1, 4) ? '1px solid var(--border)' : 'none', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                                        <strong style={{ color: typeBadgeColor[q.type] }}>{q.type}</strong> · {q.round} · {q.text?.slice(0, 60)}
                                                    </div>
                                                ))}
                                                {bulkPreview.valid.length > 5 && (
                                                    <div style={{ padding: '0.5rem 0.9rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>+{bulkPreview.valid.length - 5} more…</div>
                                                )}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                            <button onClick={() => setBulkModal(false)} style={{ padding: '0.6rem 1.2rem', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-secondary)', cursor: 'pointer' }}>Cancel</button>
                            <button onClick={importBulk} disabled={!bulkPreview?.valid?.length || bulkSaving} style={{
                                padding: '0.6rem 1.2rem', background: 'var(--primary)', color: '#fff',
                                border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer',
                                opacity: (!bulkPreview?.valid?.length || bulkSaving) ? 0.5 : 1,
                            }}>
                                {bulkSaving ? 'Importing…' : `Import ${bulkPreview?.valid?.length || 0} Questions`}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── JSON Syllabus Import Modal ─────────────────────────────────── */}
            {jsonImportOpen && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 1200, padding: '1rem',
                }}>
                    <div style={{
                        background: 'var(--bg-surface)', border: '1px solid var(--border)',
                        borderRadius: '14px', padding: '1.75rem', width: '100%', maxWidth: '680px',
                        maxHeight: '88vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem',
                    }}>
                        {/* Header */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                                📥 Import Syllabus from JSON
                            </h3>
                            <button onClick={() => setJsonImportOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
                                <X size={20} />
                            </button>
                        </div>

                        {/* Schema hint toggle */}
                        <div>
                            <button onClick={() => setSchemaHintOpen(o => !o)} style={{
                                background: 'none', border: 'none', color: 'var(--primary)',
                                fontSize: '0.8rem', cursor: 'pointer', padding: 0, fontWeight: 500,
                            }}>
                                {schemaHintOpen ? '▼' : '▶'} View expected JSON schema
                            </button>
                            {schemaHintOpen && (
                                <pre style={{
                                    marginTop: '0.75rem', padding: '1rem',
                                    background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                                    borderRadius: '8px', fontSize: '0.72rem', color: 'var(--text-secondary)',
                                    overflowX: 'auto', lineHeight: 1.6,
                                }}>{`{
  "overview": "Brief description of the company's hiring process...",
  "topics": [
    {
      "name": "Data Structures",
      "icon": "🧠",
      "prepHours": 20,
      "importance": "must",        // must | good | optional
      "subtopics": [
        {
          "name": "Arrays & Strings",
          "importance": "must",    // must | good | optional
          "note": "💡 Focus on sliding window"   // optional tip
        }
      ]
    }
  ]
}`}</pre>
                            )}
                        </div>

                        {/* Textarea */}
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                                Paste JSON below
                            </label>
                            <textarea
                                value={jsonImportText}
                                onChange={e => { setJsonImportText(e.target.value); setJsonImportError(''); }}
                                rows={12}
                                placeholder={'{\n  "overview": "...",\n  "topics": [...]\n}'}
                                spellCheck={false}
                                style={{
                                    width: '100%', padding: '0.75rem',
                                    background: 'var(--bg-elevated)', border: `1px solid ${jsonImportError ? 'var(--danger)' : 'var(--border)'}`,
                                    borderRadius: '8px', color: 'var(--text-primary)', fontSize: '0.8rem',
                                    fontFamily: 'monospace', resize: 'vertical', lineHeight: 1.5, boxSizing: 'border-box',
                                }}
                            />
                            {jsonImportError && (
                                <p style={{ marginTop: '0.4rem', fontSize: '0.8rem', color: 'var(--danger)' }}>
                                    ⚠️ {jsonImportError}
                                </p>
                            )}
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                            <button onClick={() => { setJsonImportOpen(false); setJsonImportText(''); setJsonImportError(''); }} style={{
                                padding: '0.6rem 1.2rem', background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                                borderRadius: '8px', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.875rem',
                            }}>
                                Cancel
                            </button>
                            <button onClick={validateAndImportSyllabus} disabled={!jsonImportText.trim()} style={{
                                padding: '0.6rem 1.25rem', background: 'var(--primary)', color: '#fff',
                                border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer',
                                opacity: !jsonImportText.trim() ? 0.5 : 1,
                            }}>
                                ✓ Load into Editor
                            </button>
                        </div>

                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                            This will load the JSON into the editor. You still need to click <strong>Save Syllabus</strong> to save to Firestore.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}

// Small icon button helper
function IconBtn({ icon, label, onClick, primary }) {
    return (
        <button onClick={onClick} style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
            padding: '0.5rem 0.9rem',
            background: primary ? 'var(--primary)' : 'var(--bg-elevated)',
            border: `1px solid ${primary ? 'var(--primary)' : 'var(--border)'}`,
            borderRadius: '8px', color: primary ? '#fff' : 'var(--text-secondary)',
            fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', transition: 'opacity 0.15s',
        }}>
            {icon} {label}
        </button>
    );
}
