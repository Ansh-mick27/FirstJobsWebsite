'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Search, Library, Building2 } from 'lucide-react';
import QuestionRow from '../../../components/admin/QuestionRow';
import ConfirmModal from '../../../components/admin/ConfirmModal';
import { getAdminToken } from '../layout';

const ROUNDS = ['oa', 'technical', 'hr'];
const TYPES = ['mcq', 'coding', 'subjective'];
const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

const chipStyle = (active) => ({
    padding: '0.3rem 0.75rem', fontSize: '0.78rem', cursor: 'pointer', borderRadius: '6px',
    background: active ? 'var(--primary-subtle)' : 'var(--bg-elevated)',
    border: `1px solid ${active ? 'var(--primary)' : 'var(--border)'}`,
    color: active ? 'var(--primary)' : 'var(--text-muted)',
    fontWeight: active ? 600 : 400, whiteSpace: 'nowrap', flexShrink: 0,
});

const inp = () => ({
    width: '100%', padding: '0.6rem 0.85rem',
    background: 'var(--bg-elevated)', border: '1px solid var(--border)',
    borderRadius: '8px', color: 'var(--text-primary)', fontSize: '0.875rem', boxSizing: 'border-box',
});

export default function QuestionsLibraryPage() {
    const [companies, setCompanies] = useState([]);
    const [questions, setQuestions] = useState([]);
    const [loadingCo, setLoadingCo] = useState(true);
    const [loadingQ, setLoadingQ] = useState(false);

    const [filterCompany, setFilterCompany] = useState('all');
    const [filterRound, setFilterRound] = useState('all');
    const [filterType, setFilterType] = useState('all');
    const [filterDiff, setFilterDiff] = useState('all');
    const [search, setSearch] = useState('');

    const [deleteQ, setDeleteQ] = useState(null);
    const [deletingQ, setDeletingQ] = useState(false);

    // Fetch companies list first
    useEffect(() => {
        async function load() {
            try {
                const res = await fetch('/api/admin/companies', { headers: { 'x-admin-key': getAdminToken() } });
                if (res.ok) setCompanies(await res.json());
            } finally { setLoadingCo(false); }
        }
        load();
    }, []);

    // Fetch questions whenever company filter changes
    const fetchQuestions = useCallback(async () => {
        setLoadingQ(true);
        try {
            const url = filterCompany === 'all'
                ? '/api/admin/questions'
                : `/api/admin/questions?companyId=${filterCompany}`;
            const res = await fetch(url, { headers: { 'x-admin-key': getAdminToken() } });
            if (res.ok) setQuestions(await res.json());
        } finally { setLoadingQ(false); }
    }, [filterCompany]);

    useEffect(() => { fetchQuestions(); }, [fetchQuestions]);

    // Delete
    async function deleteQuestion() {
        if (!deleteQ) return;
        setDeletingQ(true);
        await fetch(`/api/admin/questions/${deleteQ.id}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json', 'x-admin-key': getAdminToken() },
            body: JSON.stringify({ companyId: deleteQ.companyId }),
        });
        await fetchQuestions();
        setDeleteQ(null);
        setDeletingQ(false);
    }

    // Filter
    const filtered = questions.filter(q => {
        if (filterRound !== 'all' && q.round !== filterRound) return false;
        if (filterType !== 'all' && q.type !== filterType) return false;
        if (filterDiff !== 'all' && q.difficulty !== filterDiff) return false;
        if (search && !q.text?.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    });

    const companyMap = Object.fromEntries(companies.map(c => [c.id, c.name]));

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', fontFamily: 'var(--font-body)' }}>
            {/* Header */}
            <div style={{ padding: '1.25rem 2rem', borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                    <Library size={20} color="var(--primary)" />
                    <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        Questions Library
                    </h1>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', padding: '0.2rem 0.6rem', background: 'var(--bg-elevated)', borderRadius: '20px', border: '1px solid var(--border)' }}>
                        {questions.length} total
                    </span>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Browse and manage all questions across companies. To edit a question, navigate to its company.
                </p>
            </div>

            {/* Filters */}
            <div style={{ padding: '0.85rem 2rem', borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center', flexShrink: 0 }}>
                {/* Company dropdown */}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                    <Building2 size={13} style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                    <select value={filterCompany} onChange={e => setFilterCompany(e.target.value)} style={{ ...inp(), paddingLeft: '2rem', width: 'auto', minWidth: '160px' }}>
                        <option value="all">All Companies</option>
                        {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>

                <span style={{ width: '1px', height: '18px', background: 'var(--border)' }} />

                {['all', ...ROUNDS].map(r => <button key={r} onClick={() => setFilterRound(r)} style={chipStyle(filterRound === r)}>{r === 'all' ? 'Round: All' : r.toUpperCase()}</button>)}
                <span style={{ width: '1px', height: '18px', background: 'var(--border)' }} />
                {['all', ...TYPES].map(t => <button key={t} onClick={() => setFilterType(t)} style={chipStyle(filterType === t)}>{t === 'all' ? 'Type: All' : t.toUpperCase()}</button>)}
                <span style={{ width: '1px', height: '18px', background: 'var(--border)' }} />
                {['all', ...DIFFICULTIES].map(d => <button key={d} onClick={() => setFilterDiff(d)} style={chipStyle(filterDiff === d)}>{d === 'all' ? 'Diff: All' : d}</button>)}

                {/* Search */}
                <div style={{ position: 'relative', flex: '1 1 180px', minWidth: '150px', marginLeft: 'auto' }}>
                    <Search size={13} style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search questions…" style={{ ...inp(), paddingLeft: '2rem', padding: '0.5rem 0.85rem 0.5rem 2rem' }} />
                </div>

                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{filtered.length} of {questions.length}</span>
            </div>

            {/* Question list */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
                {loadingQ ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Loading questions…</div>
                ) : filtered.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                        {questions.length === 0
                            ? <>No questions yet. <Link href="/admin/companies" style={{ color: 'var(--primary)' }}>Add some via a company →</Link></>
                            : 'No questions match your filters.'}
                    </div>
                ) : (
                    filtered.map(q => {
                        const coName = companyMap[q.companyId] || q.companyId;
                        return (
                            <div key={q.id}>
                                {/* Company label row — group by company */}
                                <QuestionRow
                                    question={q}
                                    roles={[]}
                                    onEdit={() => window.open(`/admin/companies/${q.companyId}`, '_blank')}
                                    onDelete={() => setDeleteQ({ id: q.id, companyId: q.companyId, text: q.text })}
                                />
                                {/* Company chip visible via the QuestionRow tags area — optional: show company link */}
                            </div>
                        );
                    })
                )}
            </div>

            {/* Delete confirm */}
            <ConfirmModal
                open={!!deleteQ} onClose={() => setDeleteQ(null)} onConfirm={deleteQuestion}
                title="Delete question?"
                message="This will permanently delete the question. This cannot be undone."
                loading={deletingQ}
            />
        </div>
    );
}
