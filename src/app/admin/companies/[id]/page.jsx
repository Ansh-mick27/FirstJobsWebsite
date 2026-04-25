'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Building2, FileQuestion, BookOpen, Users2, AlertCircle } from 'lucide-react';

import TabBar from '../../../../components/admin/TabBar';
import ProfileTab from './tabs/ProfileTab';
import RolesTab from './tabs/RolesTab';
import SyllabusTab from './tabs/SyllabusTab';
import QuestionsTab from './tabs/QuestionsTab';
import { getAdminToken } from '../../layout';

const TABS = [
    { id: 'profile',   label: 'Profile',   icon: <Building2 size={13} /> },
    { id: 'roles',     label: 'Roles',     icon: <Users2 size={13} /> },
    { id: 'syllabus',  label: 'Syllabus',  icon: <BookOpen size={13} /> },
    { id: 'questions', label: 'Questions', icon: <FileQuestion size={13} /> },
];

function emptyForm() {
    return {
        name: '', industry: 'IT Services', description: '', hiringStatus: 'Active',
        rounds: { oa: false, technical: true, hr: true }, tags: [], logo: '',
    };
}

export default function CompanyEditorPage() {
    const { id } = useParams();
    const router = useRouter();
    const isNew = id === 'new';

    const [tab, setTab] = useState('profile');
    const [loading, setLoading] = useState(!isNew);
    const [company, setCompany] = useState(null);
    const [notFound, setNotFound] = useState(false);

    // ── Profile form
    const [form, setFormRaw] = useState(emptyForm());
    const [saving, setSaving] = useState(false);
    const [saveMsg, setSaveMsg] = useState('');

    function setFormField(key, val) { setFormRaw(p => ({ ...p, [key]: val })); }

    // ── Roles
    const [roles, setRoles] = useState([]);
    const [rolesLoading, setRolesLoading] = useState(false);

    // ── Syllabus
    const [syllabus, setSyllabus] = useState(null);
    const [syllSaving, setSyllSaving] = useState(false);
    const [syllMsg, setSyllMsg] = useState('');

    // ── Questions
    const [questions, setQuestions] = useState([]);
    const [qLoading, setQLoading] = useState(false);

    // ─── Fetch company
    useEffect(() => {
        if (isNew) return;
        async function load() {
            setLoading(true);
            try {
                const res = await fetch(`/api/admin/companies/${id}`, { headers: { 'x-admin-key': getAdminToken() } });
                if (!res.ok) { setNotFound(true); setLoading(false); return; }
                const data = await res.json();
                setCompany(data);
                setFormRaw({
                    name: data.name || '',
                    industry: data.industry || 'IT Services',
                    description: data.description || '',
                    hiringStatus: data.hiringStatus || 'Active',
                    rounds: data.rounds || { oa: false, technical: true, hr: true },
                    tags: data.tags || [],
                    logo: data.logo || '',
                });
                setSyllabus(data.syllabus?.topics?.length > 0 ? data.syllabus : null);
            } finally { setLoading(false); }
        }
        load();
    }, [id, isNew]);

    // ─── Fetch roles
    const fetchRoles = useCallback(async () => {
        if (isNew) return;
        setRolesLoading(true);
        try {
            const res = await fetch(`/api/admin/companies/${id}/roles`, { headers: { 'x-admin-key': getAdminToken() } });
            if (res.ok) setRoles(await res.json());
        } finally { setRolesLoading(false); }
    }, [id, isNew]);

    // ─── Fetch questions
    const fetchQuestions = useCallback(async () => {
        if (isNew) return;
        setQLoading(true);
        try {
            const res = await fetch(`/api/admin/questions?companyId=${id}`, { headers: { 'x-admin-key': getAdminToken() } });
            if (res.ok) setQuestions(await res.json());
        } finally { setQLoading(false); }
    }, [id, isNew]);

    // Lazy-load roles/questions on tab switch
    useEffect(() => {
        if ((tab === 'roles' || tab === 'syllabus') && roles.length === 0 && !isNew) fetchRoles();
        if (tab === 'questions' && questions.length === 0 && !isNew) fetchQuestions();
    }, [tab]);

    // ─── Save profile
    async function onSaveProfile(e) {
        e?.preventDefault();
        if (!form.name.trim()) { setSaveMsg('Company name is required.'); return; }
        setSaving(true); setSaveMsg('');
        try {
            if (isNew) {
                const res = await fetch('/api/admin/companies', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'x-admin-key': getAdminToken() },
                    body: JSON.stringify(form),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Failed to create company');
                router.push(`/admin/companies/${data.id}`);
            } else {
                const res = await fetch(`/api/admin/companies/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'x-admin-key': getAdminToken() },
                    body: JSON.stringify(form),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Failed to save');
                setCompany(prev => ({ ...prev, ...form }));
                setSaveMsg('Saved ✓');
                setTimeout(() => setSaveMsg(''), 2500);
            }
        } catch (err) {
            setSaveMsg('Error: ' + err.message);
        } finally { setSaving(false); }
    }

    // ─── Save syllabus
    async function onSaveSyllabus() {
        if (!syllabus) return;
        setSyllSaving(true); setSyllMsg('');
        try {
            const topics = syllabus.topics.filter(t => t.name?.trim());
            const res = await fetch(`/api/admin/companies/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'x-admin-key': getAdminToken() },
                body: JSON.stringify({ syllabus: { overview: syllabus.overview, topics } }),
            });
            if (!res.ok) throw new Error('Failed to save');
            setSyllMsg('Saved ✓');
            setTimeout(() => setSyllMsg(''), 2500);
        } catch { setSyllMsg('Error saving.'); }
        finally { setSyllSaving(false); }
    }

    // ─── Tab badge counts (lazy)
    const tabsWithBadges = TABS.map(t => {
        if (t.id === 'roles') return { ...t, badge: roles.length || undefined };
        if (t.id === 'questions') return { ...t, badge: questions.length || undefined };
        return t;
    });

    // ─── Render states
    if (loading) {
        return (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                Loading company…
            </div>
        );
    }

    if (notFound) {
        return (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', color: 'var(--text-muted)', padding: '2rem' }}>
                <AlertCircle size={36} />
                <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>Company not found</h2>
                <Link href="/admin/companies" style={{ color: 'var(--primary)', textDecoration: 'none', fontSize: '0.875rem' }}>← Back to Companies</Link>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
            {/* Page header */}
            <div style={{
                padding: '1rem 1.75rem',
                borderBottom: '1px solid var(--border)',
                background: 'var(--bg-surface)',
                display: 'flex', alignItems: 'center', gap: '0.9rem',
                flexShrink: 0,
            }}>
                <Link href="/admin/companies" title="Back to Companies" style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: '32px', height: '32px',
                    background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                    borderRadius: '8px', color: 'var(--text-secondary)', textDecoration: 'none',
                    transition: 'all 0.12s', flexShrink: 0,
                }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.color = 'var(--primary)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                >
                    <ArrowLeft size={15} />
                </Link>

                <div style={{ flex: 1, minWidth: 0 }}>
                    <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {isNew ? 'Add New Company' : (form.name || company?.name || 'Company Editor')}
                    </h1>
                    {!isNew && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '1px' }}>
                            ID: <code style={{ color: 'var(--primary)', fontSize: '0.68rem' }}>{id}</code>
                        </div>
                    )}
                </div>

                {!isNew && (
                    <span style={{
                        fontSize: '0.72rem', fontWeight: 700, padding: '0.25rem 0.7rem', borderRadius: '20px',
                        background: company?.hiringStatus === 'Active' ? 'rgba(16,185,129,0.12)' : 'var(--bg-elevated)',
                        color: company?.hiringStatus === 'Active' ? 'var(--success)' : 'var(--text-muted)',
                        border: `1px solid ${company?.hiringStatus === 'Active' ? 'rgba(16,185,129,0.25)' : 'var(--border)'}`,
                    }}>
                        {company?.hiringStatus || 'Unknown'}
                    </span>
                )}
            </div>

            {/* Tab bar */}
            {!isNew && (
                <TabBar tabs={tabsWithBadges} active={tab} onChange={setTab} />
            )}

            {/* Tab content */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                {(isNew || tab === 'profile') && (
                    <ProfileTab
                        form={form}
                        setFormField={setFormField}
                        saving={saving}
                        saveMsg={saveMsg}
                        onSave={onSaveProfile}
                    />
                )}
                {!isNew && tab === 'roles' && (
                    <RolesTab
                        companyId={id}
                        roles={roles}
                        rolesLoading={rolesLoading}
                        fetchRoles={fetchRoles}
                    />
                )}
                {!isNew && tab === 'syllabus' && (
                    <SyllabusTab
                        companyId={id}
                        companyName={form.name || company?.name || ''}
                        roles={roles}
                        setRoles={setRoles}
                        rolesLoading={rolesLoading}
                    />
                )}
                {!isNew && tab === 'questions' && (
                    <QuestionsTab
                        companyId={id}
                        company={company}
                        questions={questions}
                        qLoading={qLoading}
                        fetchQuestions={fetchQuestions}
                        roles={roles}
                    />
                )}
            </div>
        </div>
    );
}
