'use client';
import { useState } from 'react';
import { Plus, Edit3, Trash2, Check } from 'lucide-react';
import ConfirmModal from '../../../../../components/admin/ConfirmModal';
import { getAdminToken } from '../../../layout';

const ROLE_ROUND_OPTIONS = [
    { value: 'oa', label: 'Verbal/Aptitude' },
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
    const [addForm, setAddForm] = useState({ name: '', roundTypes: [] });
    const [adding, setAdding] = useState(false);

    const [editId, setEditId] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [editSaving, setEditSaving] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    async function addRole() {
        if (!addForm.name.trim()) return;
        setAdding(true);
        await fetch(`/api/admin/companies/${companyId}/roles`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-admin-key': getAdminToken() },
            body: JSON.stringify(addForm),
        });
        setAddForm({ name: '', roundTypes: [] });
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

    return (
        <>
        <div style={{ padding: '2rem', maxWidth: '820px' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <div>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '0.2rem' }}>Job Roles</h2>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Define roles and their hiring rounds. Manage syllabi separately in the Syllabus tab.</p>
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
                        const isEdit = editId === role.id;

                        return (
                            <div key={role.id} style={{
                                background: 'var(--bg-surface)', border: '1px solid var(--border)',
                                borderRadius: '12px', overflow: 'hidden',
                            }}>
                                {/* Card */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.9rem 1.1rem' }}>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        {isEdit ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                                                <div>
                                                    <Label>Role Name</Label>
                                                    <input value={editForm.name || ''} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} style={{ ...inp(), fontSize: '0.875rem' }} />
                                                </div>
                                                <div>
                                                    <Label>Hiring Rounds</Label>
                                                    <RoundChips selected={editForm.roundTypes || []} onChange={rt => setEditForm(p => ({ ...p, roundTypes: p.roundTypes.includes(rt) ? p.roundTypes.filter(r => r !== rt) : [...p.roundTypes, rt] }))} />
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{role.name}</span>
                                                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '5px' }}>
                                                    {(role.roundTypes || []).map(rt => (
                                                        <span key={rt} style={{ fontSize: '0.68rem', padding: '2px 7px', borderRadius: '4px', background: 'rgba(255,45,85,0.12)', color: 'var(--primary)', border: '1px solid rgba(255,45,85,0.25)' }}>
                                                            {rt === 'oa' ? 'VERBAL/APTITUDE' : rt.toUpperCase()}
                                                        </span>
                                                    ))}
                                                    {(role.roundTypes || []).length === 0 && (
                                                        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>No rounds set</span>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.35rem', flexShrink: 0, alignSelf: 'flex-start', marginTop: '2px' }}>
                                        {isEdit ? (
                                            <>
                                                <button onClick={() => saveEdit(role.id)} disabled={editSaving} style={{ padding: '0.35rem 0.85rem', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}>
                                                    {editSaving ? '…' : '✓ Save'}
                                                </button>
                                                <button onClick={() => setEditId(null)} style={{ padding: '0.35rem 0.75rem', background: 'none', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-muted)', fontSize: '0.78rem', cursor: 'pointer' }}>Cancel</button>
                                            </>
                                        ) : (
                                            <>
                                                <button onClick={() => { setEditId(role.id); setEditForm({ name: role.name, roundTypes: role.roundTypes || [] }); }} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-muted)', padding: '0.3rem 0.55rem', cursor: 'pointer' }}>
                                                    <Edit3 size={13} />
                                                </button>
                                                <button onClick={() => setDeleteConfirm({ id: role.id, name: role.name })} disabled={deletingId === role.id} style={{ background: 'none', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '6px', color: 'var(--danger)', padding: '0.3rem 0.55rem', cursor: 'pointer', opacity: deletingId === role.id ? 0.5 : 1 }}>
                                                    <Trash2 size={13} />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
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
            message={`This will permanently delete the "${deleteConfirm?.name}" role. Questions tagged to this role will remain but lose their role association.`}
            loading={!!deletingId}
        />
        </>
    );
}
