'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Building2, FileQuestion, Users, Plus, ArrowRight, Edit3, Zap } from 'lucide-react';

const ADMIN_KEY = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || '';

export default function AdminDashboard() {
    const [stats, setStats] = useState({ companies: 0, questions: 0, students: 0 });
    const [recentCompanies, setRecentCompanies] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStats() {
            try {
                const res = await fetch('/api/admin/companies', {
                    headers: { 'x-admin-key': ADMIN_KEY },
                });
                const companies = await res.json();
                const totalQuestions = companies.reduce((sum, c) => sum + (c.questionCount || 0), 0);

                // Students count
                let students = 0;
                try {
                    const usersRes = await fetch('/api/admin/users-count', { headers: { 'x-admin-key': ADMIN_KEY } });
                    if (usersRes.ok) students = (await usersRes.json()).count || 0;
                } catch (_) { }

                setStats({ companies: companies.length, questions: totalQuestions, students });
                // Recent = last 5 by name
                setRecentCompanies(companies.slice(0, 5));
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        fetchStats();
    }, []);

    const statCards = [
        { icon: <Building2 size={22} />, label: 'Companies', value: stats.companies, color: '#6366f1' },
        { icon: <FileQuestion size={22} />, label: 'Questions', value: stats.questions, color: 'var(--primary)' },
        { icon: <Users size={22} />, label: 'Students', value: stats.students, color: 'var(--success)' },
    ];

    return (
        <div style={{ padding: '2rem', maxWidth: '960px' }}>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                    ⚡ Dashboard
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Manage companies and questions for PlacePrep</p>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                {statCards.map(({ icon, label, value, color }) => (
                    <div key={label} style={{
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border)',
                        borderRadius: '12px',
                        padding: '1.5rem',
                    }}>
                        <div style={{ color, marginBottom: '0.75rem' }}>{icon}</div>
                        <div style={{ fontSize: '2rem', fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
                            {loading ? '—' : value.toLocaleString()}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{label}</div>
                    </div>
                ))}
            </div>

            {/* Quick actions */}
            <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.8rem' }}>
                    Quick Actions
                </h2>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <ActionBtn href="/admin/companies/new" icon={<Plus size={16} />} label="Add Company" primary />
                    <ActionBtn href="/admin/companies" icon={<Building2 size={16} />} label="Manage Companies" />
                </div>
            </div>

            {/* Recent companies */}
            <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <h2 style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Companies
                    </h2>
                    <Link href="/admin/companies" style={{ fontSize: '0.8rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        View all <ArrowRight size={14} />
                    </Link>
                </div>

                <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
                    {loading ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</div>
                    ) : recentCompanies.length === 0 ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                            No companies yet. <Link href="/admin/companies/new" style={{ color: 'var(--primary)' }}>Add one →</Link>
                        </div>
                    ) : (
                        recentCompanies.map((c, i) => (
                            <div key={c.id} style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '1rem 1.25rem',
                                borderBottom: i < recentCompanies.length - 1 ? '1px solid var(--border)' : 'none',
                            }}>
                                <div>
                                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem' }}>{c.name}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                                        {c.industry} · {c.questionCount || 0} questions · {c.hiringStatus}
                                    </div>
                                </div>
                                <Link href={`/admin/companies/${c.id}`} style={{
                                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                                    padding: '0.4rem 0.85rem',
                                    background: 'var(--bg-elevated)',
                                    border: '1px solid var(--border)',
                                    borderRadius: '8px',
                                    fontSize: '0.8rem',
                                    color: 'var(--text-secondary)',
                                    textDecoration: 'none',
                                    transition: 'all 0.15s',
                                }}>
                                    <Edit3 size={13} /> Edit
                                </Link>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

function ActionBtn({ href, icon, label, primary }) {
    return (
        <Link href={href} style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.7rem 1.25rem',
            background: primary ? 'var(--primary)' : 'var(--bg-elevated)',
            border: `1px solid ${primary ? 'var(--primary)' : 'var(--border)'}`,
            borderRadius: '10px',
            color: primary ? '#fff' : 'var(--text-secondary)',
            fontSize: '0.875rem',
            fontWeight: 600,
            textDecoration: 'none',
            transition: 'opacity 0.2s',
        }}>
            {icon}{label}
        </Link>
    );
}
