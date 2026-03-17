'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Building2, FileQuestion, Users, Plus, ArrowRight, Edit3, Library, TrendingUp, Zap } from 'lucide-react';
import { getAdminToken } from './layout';

export default function AdminDashboard() {
    const [stats, setStats] = useState({ companies: 0, questions: 0, students: 0 });
    const [recentCompanies, setRecentCompanies] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStats() {
            const token = getAdminToken();
            try {
                const res = await fetch('/api/admin/companies', {
                    headers: { 'x-admin-key': token },
                });
                const companies = await res.json();
                const totalQuestions = companies.reduce((sum, c) => sum + (c.questionCount || 0), 0);

                let students = 0;
                try {
                    const usersRes = await fetch('/api/admin/users-count', { headers: { 'x-admin-key': token } });
                    if (usersRes.ok) students = (await usersRes.json()).count || 0;
                } catch (_) { }

                setStats({ companies: companies.length, questions: totalQuestions, students });
                setRecentCompanies(companies.slice(0, 6));
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        fetchStats();
    }, []);

    const statCards = [
        { icon: <Building2 size={20} />, label: 'Companies', value: stats.companies, color: '#6366f1', bg: 'rgba(99,102,241,0.1)' },
        { icon: <FileQuestion size={20} />, label: 'Questions', value: stats.questions, color: 'var(--primary)', bg: 'rgba(255,45,85,0.1)' },
        { icon: <Users size={20} />, label: 'Students', value: stats.students, color: 'var(--success)', bg: 'rgba(16,185,129,0.1)' },
    ];

    const quickActions = [
        { href: '/admin/companies/new', icon: <Plus size={16} />, label: 'Add Company', desc: 'Create a new company profile', primary: true },
        { href: '/admin/companies', icon: <Building2 size={16} />, label: 'Manage Companies', desc: 'Edit company details & roles', primary: false },
        { href: '/admin/questions', icon: <Library size={16} />, label: 'Questions Library', desc: 'Browse all questions', primary: false },
    ];

    return (
        <div style={{ padding: '2rem', maxWidth: '980px' }}>

            {/* Header */}
            <div style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
                    <Zap size={20} color="var(--primary)" />
                    <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', color: 'var(--text-primary)', fontWeight: 800 }}>
                        Dashboard
                    </h1>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    PlacePrep content management — your central command.
                </p>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2.5rem' }}>
                {statCards.map(({ icon, label, value, color, bg }) => (
                    <div key={label} style={{
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border)',
                        borderRadius: '14px',
                        padding: '1.5rem',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '1rem',
                    }}>
                        <div style={{
                            width: '42px', height: '42px', borderRadius: '10px',
                            background: bg, color,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0,
                        }}>
                            {icon}
                        </div>
                        <div>
                            <div style={{ fontSize: '2rem', fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
                                {loading ? '—' : value.toLocaleString()}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>{label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Quick Actions */}
            <div style={{ marginBottom: '2.5rem' }}>
                <SectionLabel>Quick Actions</SectionLabel>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                    {quickActions.map(({ href, icon, label, desc, primary }) => (
                        <Link key={href} href={href} style={{
                            display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
                            padding: '1rem 1.1rem',
                            background: primary ? 'var(--primary)' : 'var(--bg-surface)',
                            border: `1px solid ${primary ? 'var(--primary)' : 'var(--border)'}`,
                            borderRadius: '12px',
                            textDecoration: 'none',
                            transition: 'all 0.15s',
                            color: primary ? '#fff' : 'var(--text-primary)',
                        }}
                            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            <div style={{
                                width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
                                background: primary ? 'rgba(255,255,255,0.2)' : 'var(--bg-elevated)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: primary ? '#fff' : 'var(--primary)',
                            }}>
                                {icon}
                            </div>
                            <div>
                                <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.2rem' }}>{label}</div>
                                <div style={{ fontSize: '0.75rem', opacity: primary ? 0.85 : 1, color: primary ? '#fff' : 'var(--text-muted)' }}>{desc}</div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Recent Companies */}
            <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <SectionLabel>Recent Companies</SectionLabel>
                    <Link href="/admin/companies" style={{ fontSize: '0.8rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.25rem', textDecoration: 'none' }}>
                        View all <ArrowRight size={13} />
                    </Link>
                </div>

                <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '14px', overflow: 'hidden' }}>
                    {loading ? (
                        <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Loading…</div>
                    ) : recentCompanies.length === 0 ? (
                        <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                            No companies yet. <Link href="/admin/companies/new" style={{ color: 'var(--primary)' }}>Add one →</Link>
                        </div>
                    ) : (
                        recentCompanies.map((c, i) => (
                            <div key={c.id} style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '0.9rem 1.25rem',
                                borderBottom: i < recentCompanies.length - 1 ? '1px solid var(--border)' : 'none',
                                transition: 'background 0.12s',
                            }}
                                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                                    {/* Logo placeholder */}
                                    <div style={{
                                        width: '36px', height: '36px', borderRadius: '8px', flexShrink: 0,
                                        background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        overflow: 'hidden',
                                    }}>
                                        {c.logo ? (
                                            <img src={c.logo} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                        ) : (
                                            <span style={{ fontSize: '0.95rem' }}>{c.name?.[0] || '?'}</span>
                                        )}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{c.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                                            {c.industry} · {c.questionCount || 0} questions
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <span style={{
                                        fontSize: '0.7rem', fontWeight: 600, padding: '2px 8px', borderRadius: '20px',
                                        color: c.hiringStatus === 'Active' ? 'var(--success)' : 'var(--text-muted)',
                                        background: c.hiringStatus === 'Active' ? 'rgba(16,185,129,0.12)' : 'var(--bg-elevated)',
                                        border: `1px solid ${c.hiringStatus === 'Active' ? 'rgba(16,185,129,0.25)' : 'var(--border)'}`,
                                    }}>
                                        {c.hiringStatus}
                                    </span>
                                    <Link href={`/admin/companies/${c.id}`} style={{
                                        display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                                        padding: '0.38rem 0.85rem',
                                        background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                                        borderRadius: '8px', fontSize: '0.78rem', color: 'var(--text-secondary)',
                                        textDecoration: 'none', transition: 'all 0.12s',
                                    }}
                                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.color = 'var(--primary)'; }}
                                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                                    >
                                        <Edit3 size={12} /> Edit
                                    </Link>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

function SectionLabel({ children }) {
    return (
        <div style={{
            fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)',
            textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.75rem',
        }}>
            {children}
        </div>
    );
}
