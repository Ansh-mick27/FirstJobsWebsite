'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Plus, Search, Edit3, Trash2 } from 'lucide-react';
import { getAdminToken } from '../layout';


export default function CompaniesPage() {
    const [companies, setCompanies] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [deleteModal, setDeleteModal] = useState(null); // { id, name, questionCount }
    const [deleting, setDeleting] = useState(false);

    const fetchCompanies = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/companies', { headers: { 'x-admin-key': getAdminToken() } });
            const data = await res.json();
            setCompanies(Array.isArray(data) ? data : []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchCompanies(); }, [fetchCompanies]);

    const filtered = companies.filter(c =>
        c.name?.toLowerCase().includes(search.toLowerCase()) ||
        c.industry?.toLowerCase().includes(search.toLowerCase())
    );

    async function handleDelete() {
        if (!deleteModal) return;
        setDeleting(true);
        try {
            await fetch(`/api/admin/companies/${deleteModal.id}`, {
                method: 'DELETE',
                headers: { 'x-admin-key': getAdminToken() },
            });
            setCompanies(prev => prev.filter(c => c.id !== deleteModal.id));
            setDeleteModal(null);
        } catch (err) { console.error(err); }
        finally { setDeleting(false); }
    }

    return (
        <div style={{ padding: '2rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem' }}>
                <div>
                    <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', color: 'var(--text-primary)', marginBottom: '0.2rem' }}>Companies</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{companies.length} total</p>
                </div>
                <Link href="/admin/companies/new" style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                    padding: '0.65rem 1.1rem',
                    background: 'var(--primary)', color: '#fff',
                    borderRadius: '10px', fontSize: '0.875rem', fontWeight: 600,
                    textDecoration: 'none',
                }}>
                    <Plus size={16} /> Add Company
                </Link>
            </div>

            {/* Search */}
            <div style={{ position: 'relative', marginBottom: '1.25rem', maxWidth: '380px' }}>
                <Search size={15} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search companies…"
                    style={{
                        width: '100%', paddingLeft: '2.5rem', padding: '0.7rem 1rem 0.7rem 2.3rem',
                        background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                        borderRadius: '10px', color: 'var(--text-primary)', fontSize: '0.875rem',
                    }}
                />
            </div>

            {/* Table */}
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
                {/* Table header */}
                <div style={{
                    display: 'grid', gridTemplateColumns: '2fr 1fr 120px 100px 80px 120px',
                    padding: '0.75rem 1.25rem',
                    background: 'var(--bg-elevated)',
                    borderBottom: '1px solid var(--border)',
                    fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em',
                }}>
                    <span>Name</span><span>Industry</span><span>Rounds</span><span>Questions</span><span>Status</span><span>Actions</span>
                </div>

                {loading ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</div>
                ) : filtered.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        {search ? 'No companies match your search.' : <span>No companies yet. <Link href="/admin/companies/new" style={{ color: 'var(--primary)' }}>Add one →</Link></span>}
                    </div>
                ) : filtered.map((c, i) => (
                    <div key={c.id} style={{
                        display: 'grid', gridTemplateColumns: '2fr 1fr 120px 100px 80px 120px',
                        padding: '0.9rem 1.25rem',
                        alignItems: 'center',
                        borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none',
                    }}>
                        <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{c.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>/companies/{c.slug}</div>
                        </div>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{c.industry}</span>
                        <div style={{ display: 'flex', gap: '4px' }}>
                            {['oa', 'technical', 'hr'].map(r => (
                                <span key={r} title={r.toUpperCase()} style={{
                                    width: '8px', height: '8px', borderRadius: '50%',
                                    background: c.rounds?.[r] ? 'var(--primary)' : 'var(--border)',
                                    display: 'inline-block',
                                }} />
                            ))}
                        </div>
                        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{c.questionCount || 0}</span>
                        <span style={{
                            fontSize: '0.75rem', fontWeight: 600,
                            color: c.hiringStatus === 'Active' ? 'var(--success)' : 'var(--text-muted)',
                        }}>{c.hiringStatus}</span>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                            <Link href={`/admin/companies/${c.id}`} title="Edit" style={{
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                width: '32px', height: '32px',
                                background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                                borderRadius: '7px', color: 'var(--text-secondary)', textDecoration: 'none',
                            }}><Edit3 size={13} /></Link>
                            <button onClick={() => setDeleteModal({ id: c.id, name: c.name, questionCount: c.questionCount || 0 })}
                                title="Delete" style={{
                                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                    width: '32px', height: '32px',
                                    background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                                    borderRadius: '7px', color: 'var(--danger)', cursor: 'pointer',
                                }}><Trash2 size={13} /></button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Delete confirmation modal */}
            {deleteModal && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
                }} onClick={() => setDeleteModal(null)}>
                    <div style={{
                        background: 'var(--bg-surface)', border: '1px solid var(--border)',
                        borderRadius: '16px', padding: '2rem', maxWidth: '400px', width: '90%',
                    }} onClick={e => e.stopPropagation()}>
                        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
                            Delete {deleteModal.name}?
                        </h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                            This will also permanently delete <strong style={{ color: 'var(--danger)' }}>{deleteModal.questionCount} questions</strong>. This cannot be undone.
                        </p>
                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                            <button onClick={() => setDeleteModal(null)} style={{
                                padding: '0.6rem 1.2rem', background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                                borderRadius: '8px', color: 'var(--text-secondary)', cursor: 'pointer',
                            }}>Cancel</button>
                            <button onClick={handleDelete} disabled={deleting} style={{
                                padding: '0.6rem 1.2rem', background: 'var(--danger)', border: 'none',
                                borderRadius: '8px', color: '#fff', cursor: 'pointer', fontWeight: 600,
                            }}>{deleting ? 'Deleting…' : 'Delete'}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
