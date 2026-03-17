'use client';
import { useState, useCallback } from 'react';
import { Plus, Edit3, Trash2, ChevronDown, ChevronUp, Check, Save, BookOpen } from 'lucide-react';
import ConfirmModal from '../../../../../components/admin/ConfirmModal';
import { getAdminToken } from '../../../layout';

const ROLE_ROUND_OPTIONS = [
    { value: 'oa', label: 'Online Assessment' },
    { value: 'technical', label: 'Technical' },
    { value: 'hr', label: 'HR' },
    { value: 'managerial', label: 'Managerial' },
];

const inp = () => ({
    width: '100%', padding: '0.65rem 0.85rem',
    background: 'var(--bg-surface)', border: '1px solid var(--border)',
    borderRadius: '8px', color: 'var(--text-primary)', fontSize: '0.85rem', boxSizing: 'border-box',
});

const Label = ({ children }) => (
    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {children}
    </label>
);

function RoundChips({ selected, onChange }) {
    return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {ROLE_ROUND_OPTIONS.map(opt => {
                const on = selected.includes(opt.value);
                return (
                    <button key={opt.value} type="button" onClick={() => onChange(opt.value)} style={{
                        display: 'flex', alignItems: 'center', gap: '0.3rem',
                        padding: '0.3rem 0.75rem', fontSize: '0.78rem', cursor: 'pointer', borderRadius: '6px',
                        background: on ? 'var(--primary-subtle)' : 'var(--bg-elevated)',
                        border: `1px solid ${on ? 'var(--primary)' : 'var(--border)'}`,
                        color: on ? 'var(--primary)' : 'var(--text-muted)',
                    }}>
                        {on && <Check size={10} />} {opt.label}
                    </button>
                );
            })}
        </div>
    );
}

export default function RolesTab({ companyId, roles, rolesLoading, fetchRoles }) {
    const [addOpen, setAddOpen] = useState(false);
    const [addForm, setAddForm] = useState({ name: '', roundTypes: [], description: '' });
    const [adding, setAdding] = useState(false);

    const [editId, setEditId] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [editSaving, setEditSaving] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null); // { id, name }

    const [expandedId, setExpandedId] = useState(null);
    const [syllabusMap, setSyllabusMap] = useState({});

    function getSyl(roleId) { return syllabusMap[roleId] || { topics: [], saving: false, msg: '' }; }
    function setSyl(roleId, upd) { setSyllabusMap(p => ({ ...p, [roleId]: { ...getSyl(roleId), ...upd } })); }

    function toggleExpand(role) {
        if (expandedId === role.id) { setExpandedId(null); return; }
        if (!syllabusMap[role.id]) {
            const topics = role.syllabus?.topics?.length > 0
                ? [...role.syllabus.topics]
                : [{ name: '', description: '', studyHours: '' }];
            setSyl(role.id, { topics, saving: false, msg: '' });
        }
        setExpandedId(role.id);
    }

    async function addRole() {
        if (!addForm.name.trim()) return;
        setAdding(true);
        await fetch(`/api/admin/companies/${companyId}/roles`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-admin-key': getAdminToken() },
            body: JSON.stringify(addForm),
        });
        setAddForm({ name: '', roundTypes: [], description: '' });
        setAddOpen(false);
        setAdding(false);
        fetchRoles();
    }

    async function saveEdit(id) {
        setEditSaving(true);
        await fetch(`/api/admin/companies/${companyId}/roles/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'x-admin-key': getAdminToken() },
            body: JSON.stringify(editForm),
        });
        setEditId(null);
        setEditSaving(false);
        fetchRoles();
    }

    async function deleteRole(id) {
        setDeletingId(id);
        await fetch(`/api/admin/companies/${companyId}/roles/${id}`, {
            method: 'DELETE', headers: { 'x-admin-key': getAdminToken() },
        });
        setDeletingId(null);
        setDeleteConfirm(null);
        fetchRoles();
    }

    async function saveSyllabus(roleId) {
        const syl = getSyl(roleId);
        const topics = syl.topics.filter(t => t.name.trim());
        setSyl(roleId, { saving: true, msg: '' });
        const res = await fetch(`/api/admin/companies/${companyId}/roles/${roleId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'x-admin-key': getAdminToken() },
            body: JSON.stringify({ syllabus: { topics } }),
        });
        setSyl(roleId, { saving: false, msg: res.ok ? 'Saved ✓' : 'Error saving.' });
        setTimeout(() => setSyl(roleId, { msg: '' }), 2500);
    }

    return (
        <>
        <div style={{ padding: '2rem', maxWidth: '820px' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <div>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '0.2rem' }}>Job Roles</h2>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Each role can have its own hiring rounds and syllabus.</p>
                </div>
                <button onClick={() => setAddOpen(o => !o)} style={{
                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                    padding: '0.65rem 1.1rem', background: 'var(--primary)', color: '#fff',
                    border: 'none', borderRadius: '9px', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer',
                }}>
                    <Plus size={15} /> Add Role
                </button>
            </div>

            {/* Add form */}
            {addOpen && (
                <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--primary)', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>New Role</h3>
                    <div>
                        <Label>Role Name *</Label>
                        <input value={addForm.name} onChange={e => setAddForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Software Engineer, BDE, Data Analyst" style={inp()} />
                    </div>
                    <div>
                        <Label>Hiring Rounds</Label>
                        <RoundChips selected={addForm.roundTypes} onChange={rt => setAddForm(p => ({ ...p, roundTypes: p.roundTypes.includes(rt) ? p.roundTypes.filter(r => r !== rt) : [...p.roundTypes, rt] }))} />
                    </div>
                    <div>
                        <Label>Description (optional)</Label>
                        <input value={addForm.description} onChange={e => setAddForm(p => ({ ...p, description: e.target.value }))} placeholder="Brief note…" style={inp()} />
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={addRole} disabled={adding || !addForm.name.trim()} style={{
                            padding: '0.55rem 1.1rem', background: 'var(--primary)', color: '#fff',
                            border: 'none', borderRadius: '7px', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer', opacity: adding ? 0.65 : 1,
                        }}>
                            {adding ? 'Adding…' : 'Add Role'}
                        </button>
                        <button onClick={() => setAddOpen(false)} style={{
                            padding: '0.55rem 1rem', background: 'none', border: '1px solid var(--border)',
                            borderRadius: '7px', color: 'var(--text-muted)', fontSize: '0.82rem', cursor: 'pointer',
                        }}>Cancel</button>
                    </div>
                </div>
            )}

            {/* Roles list */}
            {rolesLoading ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Loading roles…</p>
            ) : roles.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 2rem', color: 'var(--text-muted)', border: '1px dashed var(--border)', borderRadius: '12px' }}>
                    <p style={{ fontSize: '0.875rem' }}>No job roles yet. Click <strong>Add Role</strong> to get started.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {roles.map(role => {
                        const isExp = expandedId === role.id;
                        const isEdit = editId === role.id;
                        const syl = getSyl(role.id);

                        return (
                            <div key={role.id} style={{
                                background: 'var(--bg-surface)', border: `1px solid ${isExp ? 'rgba(255,45,85,0.35)' : 'var(--border)'}`,
                                borderRadius: '12px', overflow: 'hidden', transition: 'border-color 0.2s',
                            }}>
                                {/* Card header */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.9rem 1.1rem' }}>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        {isEdit ? (
                                            <input value={editForm.name || ''} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} style={{ ...inp(), fontSize: '0.875rem' }} />
                                        ) : (
                                            <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{role.name}</span>
                                        )}
                                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '5px' }}>
                                            {(isEdit ? editForm.roundTypes : role.roundTypes || []).map(rt => (
                                                <span key={rt} style={{ fontSize: '0.68rem', padding: '2px 7px', borderRadius: '4px', background: 'rgba(255,45,85,0.12)', color: 'var(--primary)', border: '1px solid rgba(255,45,85,0.25)' }}>
                                                    {rt.toUpperCase()}
                                                </span>
                                            ))}
                                            {(isEdit ? editForm.roundTypes : role.roundTypes || []).length === 0 && (
                                                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>No rounds set</span>
                                            )}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.35rem', flexShrink: 0 }}>
                                        {isEdit ? (
                                            <>
                                                <button onClick={() => saveEdit(role.id)} disabled={editSaving} style={{ padding: '0.35rem 0.85rem', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}>
                                                    {editSaving ? '…' : '✓ Save'}
                                                </button>
                                                <button onClick={() => setEditId(null)} style={{ padding: '0.35rem 0.75rem', background: 'none', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-muted)', fontSize: '0.78rem', cursor: 'pointer' }}>Cancel</button>
                                            </>
                                        ) : (
                                            <>
                                                <button onClick={() => { setEditId(role.id); setEditForm({ name: role.name, roundTypes: role.roundTypes || [], description: role.description || '' }); setExpandedId(role.id); }} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-muted)', padding: '0.3rem 0.55rem', cursor: 'pointer' }}>
                                                    <Edit3 size={13} />
                                                </button>
                                                <button onClick={() => setDeleteConfirm({ id: role.id, name: role.name })} disabled={deletingId === role.id} style={{ background: 'none', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '6px', color: 'var(--danger)', padding: '0.3rem 0.55rem', cursor: 'pointer', opacity: deletingId === role.id ? 0.5 : 1 }}>
                                                    <Trash2 size={13} />
                                                </button>
                                            </>
                                        )}
                                        <button onClick={() => !isEdit && toggleExpand(role)} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-muted)', padding: '0.3rem 0.55rem', cursor: 'pointer' }}>
                                            {isExp ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                                        </button>
                                    </div>
                                </div>

                                {/* Expanded syllabus area */}
                                {isExp && (
                                    <div style={{ borderTop: '1px solid var(--border)', padding: '1rem 1.1rem 1.1rem' }}>
                                        {isEdit && (
                                            <div style={{ marginBottom: '1rem' }}>
                                                <Label>Hiring Rounds</Label>
                                                <RoundChips selected={editForm.roundTypes || []} onChange={rt => setEditForm(p => ({ ...p, roundTypes: p.roundTypes.includes(rt) ? p.roundTypes.filter(r => r !== rt) : [...p.roundTypes, rt] }))} />
                                                <div style={{ marginTop: '0.75rem' }}>
                                                    <Label>Description</Label>
                                                    <input value={editForm.description || ''} onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))} style={inp()} />
                                                </div>
                                            </div>
                                        )}

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                            <BookOpen size={14} style={{ color: 'var(--primary)' }} />
                                            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>Syllabus for {role.name}</span>
                                        </div>

                                        {/* Topic rows */}
                                        {syl.topics.map((topic, idx) => (
                                            <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 3fr 60px auto', gap: '0.4rem', marginBottom: '0.45rem', alignItems: 'center' }}>
                                                {idx === 0 && <>
                                                    <span style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Topic</span>
                                                    <span style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Description</span>
                                                    <span style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Hrs</span>
                                                    <span />
                                                </>}
                                                <input value={topic.name} onChange={e => setSyl(role.id, { topics: syl.topics.map((t, i) => i === idx ? { ...t, name: e.target.value } : t) })} placeholder="e.g. Data Structures" style={{ ...inp(), fontSize: '0.8rem' }} />
                                                <input value={topic.description || ''} onChange={e => setSyl(role.id, { topics: syl.topics.map((t, i) => i === idx ? { ...t, description: e.target.value } : t) })} placeholder="What to cover…" style={{ ...inp(), fontSize: '0.8rem' }} />
                                                <input type="number" min="0" value={topic.studyHours || ''} onChange={e => setSyl(role.id, { topics: syl.topics.map((t, i) => i === idx ? { ...t, studyHours: e.target.value } : t) })} placeholder="0" style={{ ...inp(), fontSize: '0.8rem' }} />
                                                <button onClick={() => setSyl(role.id, { topics: syl.topics.filter((_, i) => i !== idx) })} style={{ background: 'none', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '5px', color: 'var(--danger)', padding: '0.35rem 0.5rem', cursor: 'pointer' }}>✕</button>
                                            </div>
                                        ))}

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
                                            <button onClick={() => setSyl(role.id, { topics: [...syl.topics, { name: '', description: '', studyHours: '' }] })} style={{ fontSize: '0.78rem', background: 'none', border: '1px dashed var(--border)', borderRadius: '6px', color: 'var(--primary)', padding: '0.35rem 0.75rem', cursor: 'pointer' }}>
                                                + Add Topic
                                            </button>
                                            <button onClick={() => saveSyllabus(role.id)} disabled={syl.saving} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.4rem 0.9rem', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer', opacity: syl.saving ? 0.65 : 1 }}>
                                                <Save size={12} /> {syl.saving ? 'Saving…' : 'Save Syllabus'}
                                            </button>
                                            {syl.msg && <span style={{ fontSize: '0.78rem', color: syl.msg.startsWith('Error') ? 'var(--danger)' : 'var(--success)' }}>{syl.msg}</span>}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
        <ConfirmModal
            open={!!deleteConfirm}
            onClose={() => setDeleteConfirm(null)}
            onConfirm={() => deleteRole(deleteConfirm?.id)}
            title="Delete role?"
            message={`This will permanently delete the "${deleteConfirm?.name}" role and its syllabus. Questions tagged to this role will remain but lose their role association.`}
            loading={!!deletingId}
        />
        </>
    );
}
