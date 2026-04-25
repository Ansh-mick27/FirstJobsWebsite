'use client';
import { useState } from 'react';
import { Check, Save, X, Sparkles, Loader } from 'lucide-react';
import { getAdminToken } from '../../../layout';

const INDUSTRIES = ['IT Services', 'Product', 'Consulting', 'BFSI', 'Core', 'Other'];

function generateSlug(name = '') {
    return name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-');
}

const inp = (err) => ({
    width: '100%', padding: '0.75rem 0.9rem',
    background: 'var(--bg-elevated)', border: `1px solid ${err ? 'var(--danger)' : 'var(--border)'}`,
    borderRadius: '8px', color: 'var(--text-primary)', fontSize: '0.875rem', boxSizing: 'border-box',
});
const Label = ({ children }) => (
    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {children}
    </label>
);

export default function ProfileTab({ form, setFormField, saving, saveMsg, onSave }) {
    const [tagInput, setTagInput] = useState('');
    const [generating, setGenerating] = useState(false);
    const [genError, setGenError] = useState('');

    function addTag(e) {
        if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
            e.preventDefault();
            const t = tagInput.trim().toLowerCase().replace(/\s+/g, '-');
            if (!form.tags.includes(t)) setFormField('tags', [...form.tags, t]);
            setTagInput('');
        }
    }

    async function handleGenerate() {
        if (!form.name.trim()) { setGenError('Enter a company name first.'); return; }
        setGenerating(true); setGenError('');
        try {
            const res = await fetch('/api/admin/generate-company-profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-admin-key': getAdminToken() },
                body: JSON.stringify({ companyName: form.name.trim() }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Generation failed');
            if (data.industry) setFormField('industry', data.industry);
            if (data.description) setFormField('description', data.description);
            if (data.tags?.length) setFormField('tags', data.tags);
            if (data.rounds) setFormField('rounds', data.rounds);
        } catch (err) {
            setGenError(err.message || 'AI generation failed. Try again.');
        }
        setGenerating(false);
    }

    return (
        <div style={{ padding: '2rem', maxWidth: '680px' }}>
            <form onSubmit={onSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* Name + AI button */}
                <div>
                    <Label>Company Name *</Label>
                    <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                            <input
                                value={form.name}
                                onChange={e => { setFormField('name', e.target.value); setGenError(''); }}
                                placeholder="e.g. Infosys, Google, Zomato"
                                style={inp(false)}
                            />
                            {form.name && (
                                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                                    Slug: <code style={{ color: 'var(--primary)' }}>{generateSlug(form.name)}</code>
                                </p>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={handleGenerate}
                            disabled={generating || !form.name.trim()}
                            title="Auto-fill fields using AI"
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.4rem',
                                padding: '0.72rem 1rem', whiteSpace: 'nowrap',
                                background: generating ? 'var(--bg-elevated)' : 'linear-gradient(135deg, #7c3aed, #a855f7)',
                                color: generating ? 'var(--text-muted)' : '#fff',
                                border: generating ? '1px solid var(--border)' : '1px solid transparent',
                                borderRadius: '8px', fontWeight: 600, fontSize: '0.82rem',
                                cursor: generating || !form.name.trim() ? 'not-allowed' : 'pointer',
                                opacity: !form.name.trim() ? 0.5 : 1,
                                transition: 'all 0.15s',
                                flexShrink: 0,
                            }}
                        >
                            {generating
                                ? <><Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> Generating…</>
                                : <><Sparkles size={14} /> AI Autofill</>
                            }
                        </button>
                    </div>
                    {genError && (
                        <p style={{ fontSize: '0.78rem', color: 'var(--danger)', marginTop: '0.4rem' }}>⚠ {genError}</p>
                    )}
                </div>

                {/* Industry */}
                <div>
                    <Label>Industry *</Label>
                    <select value={form.industry} onChange={e => setFormField('industry', e.target.value)} style={inp(false)}>
                        {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                    </select>
                </div>

                {/* Description */}
                <div>
                    <Label>Description</Label>
                    <textarea
                        value={form.description} onChange={e => setFormField('description', e.target.value)}
                        rows={4} style={{ ...inp(false), resize: 'vertical' }}
                    />
                </div>

                {/* Logo */}
                <div>
                    <Label>Logo URL</Label>
                    <input value={form.logo || ''} onChange={e => setFormField('logo', e.target.value)} placeholder="https://…" style={inp(false)} />
                    {form.logo && (
                        <img src={form.logo} alt="logo preview" style={{ height: '40px', marginTop: '0.5rem', borderRadius: '6px', objectFit: 'contain' }} />
                    )}
                </div>

                {/* Hiring Status */}
                <div>
                    <Label>Hiring Status</Label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {['Active', 'Inactive'].map(s => (
                            <button key={s} type="button" onClick={() => setFormField('hiringStatus', s)} style={{
                                padding: '0.45rem 1.1rem', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 500, borderRadius: '7px',
                                background: form.hiringStatus === s ? (s === 'Active' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.12)') : 'var(--bg-elevated)',
                                border: `1px solid ${form.hiringStatus === s ? (s === 'Active' ? 'var(--success)' : 'var(--danger)') : 'var(--border)'}`,
                                color: form.hiringStatus === s ? (s === 'Active' ? 'var(--success)' : 'var(--danger)') : 'var(--text-muted)',
                            }}>{s}</button>
                        ))}
                    </div>
                </div>

                {/* Rounds */}
                <div>
                    <Label>Interview Rounds</Label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {[['oa', 'Verbal/Aptitude'], ['technical', 'Technical'], ['hr', 'HR']].map(([k, l]) => (
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

                {/* Tags */}
                <div>
                    <Label>Tags</Label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', alignItems: 'center', minHeight: '44px', padding: '0.45rem 0.6rem', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px' }}>
                        {form.tags.map(t => (
                            <span key={t} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.2rem 0.5rem', background: 'var(--primary-subtle)', border: '1px solid var(--border)', borderRadius: '5px', fontSize: '0.75rem', color: 'var(--primary)' }}>
                                {t}
                                <button type="button" onClick={() => setFormField('tags', form.tags.filter(x => x !== t))} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--primary)', display: 'flex' }}>
                                    <X size={9} />
                                </button>
                            </span>
                        ))}
                        <input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={addTag}
                            placeholder={form.tags.length ? '' : 'Add tag + Enter…'}
                            style={{ border: 'none', background: 'none', color: 'var(--text-primary)', fontSize: '0.8rem', flex: '1 1 80px', minWidth: '60px', outline: 'none' }} />
                    </div>
                </div>

                {/* Save */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingTop: '0.5rem' }}>
                    <button type="submit" disabled={saving} style={{
                        display: 'flex', alignItems: 'center', gap: '0.4rem',
                        padding: '0.75rem 1.5rem', background: 'var(--primary)', color: '#fff',
                        border: 'none', borderRadius: '9px', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer',
                        opacity: saving ? 0.7 : 1,
                    }}>
                        <Save size={14} /> {saving ? 'Saving…' : 'Save Changes'}
                    </button>
                    {saveMsg && (
                        <span style={{ fontSize: '0.875rem', color: saveMsg.startsWith('Error') ? 'var(--danger)' : 'var(--success)' }}>
                            {saveMsg}
                        </span>
                    )}
                </div>
            </form>

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}
