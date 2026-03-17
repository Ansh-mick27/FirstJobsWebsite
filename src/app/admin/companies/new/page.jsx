'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, X, Check } from 'lucide-react';
import { getAdminToken } from '../../layout';

const INDUSTRIES = ['IT Services', 'Product', 'Consulting', 'BFSI', 'Core', 'Other'];

function generateSlugClient(name) {
    return name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-');
}

export default function NewCompanyPage() {
    const router = useRouter();
    const [form, setForm] = useState({
        name: '', industry: '', description: '',
        hiringStatus: 'Active',
        rounds: { oa: false, technical: false, hr: false },
        tags: [], logo: '',
    });
    const [tagInput, setTagInput] = useState('');
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [serverError, setServerError] = useState('');

    const slug = generateSlugClient(form.name);

    function set(key, value) {
        setForm(prev => ({ ...prev, [key]: value }));
        setErrors(prev => ({ ...prev, [key]: '' }));
    }

    function addTag(e) {
        if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
            e.preventDefault();
            const tag = tagInput.trim().toLowerCase().replace(/\s+/g, '-');
            if (!form.tags.includes(tag)) {
                set('tags', [...form.tags, tag]);
            }
            setTagInput('');
        }
    }

    function validate() {
        const errs = {};
        if (!form.name || form.name.trim().length < 2) errs.name = 'Name must be at least 2 characters';
        if (!form.industry) errs.industry = 'Select an industry';
        if (!form.description || form.description.trim().length < 20) errs.description = 'Description must be at least 20 characters';
        if (!form.rounds.oa && !form.rounds.technical && !form.rounds.hr) errs.rounds = 'Select at least one round';
        return errs;
    }

    async function handleSubmit(e) {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length) { setErrors(errs); return; }

        setSubmitting(true);
        setServerError('');
        try {
            const res = await fetch('/api/admin/companies', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-admin-key': getAdminToken() },
                body: JSON.stringify({ ...form, logo: form.logo || null }),
            });
            const data = await res.json();
            if (!res.ok) { setServerError(data.error || 'Failed to create company'); return; }
            router.push(`/admin/companies/${data.id}`);
        } catch (err) {
            setServerError('Network error. Try again.');
        } finally {
            setSubmitting(false);
        }
    }

    const inputStyle = (hasError) => ({
        width: '100%', padding: '0.8rem 1rem',
        background: 'var(--bg-elevated)',
        border: `1px solid ${hasError ? 'var(--danger)' : 'var(--border)'}`,
        borderRadius: '10px', color: 'var(--text-primary)', fontSize: '0.9rem',
    });

    const labelStyle = {
        display: 'block', fontSize: '0.8rem', fontWeight: 600,
        color: 'var(--text-secondary)', marginBottom: '0.4rem',
        textTransform: 'uppercase', letterSpacing: '0.04em',
    };

    const errorStyle = { color: 'var(--danger)', fontSize: '0.8rem', marginTop: '0.35rem' };

    return (
        <div style={{ padding: '2rem', maxWidth: '680px' }}>
            {/* Back */}
            <button onClick={() => router.push('/admin/companies')} style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.85rem',
                cursor: 'pointer', marginBottom: '1.5rem', padding: 0,
            }}>
                <ArrowLeft size={15} /> Back to Companies
            </button>

            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', marginBottom: '0.25rem', color: 'var(--text-primary)' }}>
                Add Company
            </h1>

            {form.name && (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.75rem' }}>
                    URL: <code style={{ color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>/companies/{slug}</code>
                </p>
            )}

            {serverError && (
                <div style={{ padding: '0.9rem 1rem', background: 'rgba(239,68,68,0.1)', border: '1px solid var(--danger)', borderRadius: '10px', color: 'var(--danger)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
                    {serverError}
                </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* Name */}
                <div>
                    <label style={labelStyle}>Company Name *</label>
                    <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Tata Consultancy Services" style={inputStyle(errors.name)} />
                    {errors.name && <p style={errorStyle}>{errors.name}</p>}
                </div>

                {/* Industry */}
                <div>
                    <label style={labelStyle}>Industry *</label>
                    <select value={form.industry} onChange={e => set('industry', e.target.value)} style={inputStyle(errors.industry)}>
                        <option value="">Select industry…</option>
                        {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                    </select>
                    {errors.industry && <p style={errorStyle}>{errors.industry}</p>}
                </div>

                {/* Description */}
                <div>
                    <label style={labelStyle}>Description *</label>
                    <textarea value={form.description} onChange={e => set('description', e.target.value)}
                        placeholder="Describe the company, its products, campus presence…"
                        rows={4} style={{ ...inputStyle(errors.description), resize: 'vertical' }} />
                    {errors.description && <p style={errorStyle}>{errors.description}</p>}
                </div>

                {/* Hiring Status */}
                <div>
                    <label style={labelStyle}>Hiring Status</label>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        {['Active', 'Inactive'].map(s => (
                            <button key={s} type="button" onClick={() => set('hiringStatus', s)} style={{
                                padding: '0.55rem 1.2rem',
                                background: form.hiringStatus === s ? (s === 'Active' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.12)') : 'var(--bg-elevated)',
                                border: `1px solid ${form.hiringStatus === s ? (s === 'Active' ? 'var(--success)' : 'var(--danger)') : 'var(--border)'}`,
                                borderRadius: '8px',
                                color: form.hiringStatus === s ? (s === 'Active' ? 'var(--success)' : 'var(--danger)') : 'var(--text-muted)',
                                fontWeight: 500, cursor: 'pointer', fontSize: '0.875rem',
                            }}>{s}</button>
                        ))}
                    </div>
                </div>

                {/* Rounds */}
                <div>
                    <label style={labelStyle}>Rounds Available *</label>
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                        {[['oa', 'OA'], ['technical', 'Technical'], ['hr', 'HR']].map(([key, label]) => (
                            <button key={key} type="button" onClick={() => set('rounds', { ...form.rounds, [key]: !form.rounds[key] })} style={{
                                display: 'flex', alignItems: 'center', gap: '0.4rem',
                                padding: '0.55rem 1.1rem',
                                background: form.rounds[key] ? 'var(--primary-subtle)' : 'var(--bg-elevated)',
                                border: `1px solid ${form.rounds[key] ? 'var(--primary)' : 'var(--border)'}`,
                                borderRadius: '8px',
                                color: form.rounds[key] ? 'var(--primary)' : 'var(--text-muted)',
                                cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500,
                            }}>
                                {form.rounds[key] ? <Check size={13} /> : null} {label}
                            </button>
                        ))}
                    </div>
                    {errors.rounds && <p style={errorStyle}>{errors.rounds}</p>}
                </div>

                {/* Tags */}
                <div>
                    <label style={labelStyle}>Tags</label>
                    <div style={{
                        display: 'flex', flexWrap: 'wrap', gap: '0.4rem', alignItems: 'center',
                        minHeight: '48px', padding: '0.5rem',
                        background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '10px',
                    }}>
                        {form.tags.map(t => (
                            <span key={t} style={{
                                display: 'flex', alignItems: 'center', gap: '0.3rem',
                                padding: '0.25rem 0.6rem',
                                background: 'var(--primary-subtle)', border: '1px solid var(--border-active)',
                                borderRadius: '6px', fontSize: '0.78rem', color: 'var(--primary)',
                            }}>
                                {t}
                                <button type="button" onClick={() => set('tags', form.tags.filter(x => x !== t))}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--primary)', display: 'flex' }}>
                                    <X size={11} />
                                </button>
                            </span>
                        ))}
                        <input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={addTag}
                            placeholder={form.tags.length ? '' : 'Type tag + Enter…'}
                            style={{ border: 'none', background: 'none', color: 'var(--text-primary)', fontSize: '0.875rem', flex: '1 1 120px', minWidth: '100px', outline: 'none' }} />
                    </div>
                </div>

                {/* Logo URL */}
                <div>
                    <label style={labelStyle}>Logo URL <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(optional)</span></label>
                    <input value={form.logo} onChange={e => set('logo', e.target.value)}
                        placeholder="https://..." style={inputStyle(false)} />
                </div>

                {/* Submit */}
                <div style={{ marginTop: '0.5rem' }}>
                    <button type="submit" disabled={submitting} style={{
                        padding: '0.85rem 2rem',
                        background: 'var(--primary)', color: '#fff', border: 'none',
                        borderRadius: '10px', fontSize: '1rem', fontWeight: 600, cursor: 'pointer',
                        opacity: submitting ? 0.7 : 1,
                    }}>
                        {submitting ? 'Creating…' : 'Create Company'}
                    </button>
                </div>
            </form>
        </div>
    );
}
