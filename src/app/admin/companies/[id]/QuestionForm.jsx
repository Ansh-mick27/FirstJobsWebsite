'use client';
import { useState } from 'react';
import { generateStarterCode } from '@/lib/codeHarness';

// ─── Constants ────────────────────────────────────────────────────────────────
const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

const TEST_ROUNDS = [
    { value: 'oa', label: 'Verbal/Aptitude' },
    { value: 'technical', label: 'Technical' },
];
const INTERVIEW_ROUNDS = [
    { value: 'technical', label: 'Technical' },
    { value: 'hr', label: 'HR' },
    { value: 'managerial', label: 'Managerial' },
];

const PARAM_TYPES = [
    'int', 'long', 'float', 'double', 'string', 'bool', 'char',
    'int[]', 'long[]', 'float[]', 'double[]', 'string[]', 'bool[]', 'char[]',
    'int[][]', 'string[][]',
];

const PREVIEW_LANGS = [
    { value: 'javascript', label: 'JavaScript' },
    { value: 'python',     label: 'Python' },
    { value: 'cpp',        label: 'C++' },
    { value: 'java',       label: 'Java' },
];

function getAvailableTypes(round) {
    if (round === 'oa') return [{ value: 'mcq', label: 'MCQ' }];
    if (round === 'technical') return [{ value: 'mcq', label: 'MCQ' }, { value: 'coding', label: 'Coding' }];
    return [{ value: 'mcq', label: 'MCQ' }];
}

// ─── Style helpers ────────────────────────────────────────────────────────────
const inp = (extra = {}) => ({
    width: '100%', padding: '0.65rem 0.85rem',
    background: 'var(--bg-elevated)', border: '1px solid var(--border)',
    borderRadius: '8px', color: 'var(--text-primary)', fontSize: '0.875rem', boxSizing: 'border-box',
    fontFamily: 'inherit', ...extra,
});

const Label = ({ children }) => (
    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {children}
    </label>
);

const SectionBox = ({ children }) => (
    <div style={{ border: '1px solid var(--border)', borderRadius: '10px', padding: '0.85rem', background: 'var(--bg-subtle, var(--bg-elevated))', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        {children}
    </div>
);

// ─── Function Signature sub-editor ───────────────────────────────────────────
function FunctionSignatureEditor({ sig, onChange: onSigChange }) {
    const [previewLang, setPreviewLang] = useState('javascript');

    const updateField = (field, value) => onSigChange({ ...sig, [field]: value });

    const updateParam = (i, field, value) => {
        const params = sig.params.map((p, idx) => idx === i ? { ...p, [field]: value } : p);
        onSigChange({ ...sig, params });
    };

    const addParam = () => onSigChange({
        ...sig,
        params: [...sig.params, { name: '', type: 'int' }],
    });

    const removeParam = (i) => onSigChange({
        ...sig,
        params: sig.params.filter((_, idx) => idx !== i),
    });

    const preview = sig.name?.trim() ? generateStarterCode(previewLang, sig) : null;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <SectionBox>
                {/* Name + Return type */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    <div>
                        <Label>Function Name</Label>
                        <input
                            value={sig.name}
                            onChange={e => updateField('name', e.target.value)}
                            placeholder="e.g. twoSum"
                            style={inp({ fontFamily: 'monospace' })}
                        />
                    </div>
                    <div>
                        <Label>Return Type</Label>
                        <select value={sig.returnType} onChange={e => updateField('returnType', e.target.value)} style={inp()}>
                            {PARAM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                </div>

                {/* Parameters */}
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                        <Label>Parameters</Label>
                        <button
                            type="button"
                            onClick={addParam}
                            style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.78rem', padding: 0 }}
                        >
                            + Add Parameter
                        </button>
                    </div>

                    {sig.params.length === 0 && (
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>No parameters — click "Add Parameter" to add one.</p>
                    )}

                    {sig.params.map((p, i) => (
                        <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '0.4rem', marginBottom: '0.35rem', alignItems: 'center' }}>
                            <input
                                value={p.name}
                                onChange={e => updateParam(i, 'name', e.target.value)}
                                placeholder="param name"
                                style={inp({ fontFamily: 'monospace', fontSize: '0.82rem' })}
                            />
                            <select value={p.type} onChange={e => updateParam(i, 'type', e.target.value)} style={inp({ fontSize: '0.82rem' })}>
                                {PARAM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                            <button
                                type="button"
                                onClick={() => removeParam(i)}
                                style={{ background: 'none', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '5px', color: 'var(--danger)', padding: '0.3rem 0.55rem', cursor: 'pointer', fontSize: '0.82rem' }}
                            >
                                ✕
                            </button>
                        </div>
                    ))}
                </div>
            </SectionBox>

            {/* Live starter code preview */}
            {preview && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                        <Label>Starter Code Preview</Label>
                        <select
                            value={previewLang}
                            onChange={e => setPreviewLang(e.target.value)}
                            style={{ ...inp({ width: 'auto', padding: '0.25rem 0.6rem', fontSize: '0.75rem' }) }}
                        >
                            {PREVIEW_LANGS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                        </select>
                    </div>
                    <pre style={{
                        margin: 0, padding: '0.75rem', borderRadius: '8px',
                        background: '#1e1e1e', color: '#d4d4d4',
                        fontFamily: 'monospace', fontSize: '0.78rem',
                        lineHeight: 1.6, overflowX: 'auto', whiteSpace: 'pre',
                        border: '1px solid rgba(255,255,255,0.06)',
                    }}>
                        {preview}
                    </pre>
                </div>
            )}
        </div>
    );
}

// ─── Main form ────────────────────────────────────────────────────────────────
export default function QuestionForm({ question: q, onChange, roles, onSave, onCancel, saving, error, category = 'test' }) {
    const isInterview = category === 'interview';
    const rounds = isInterview ? INTERVIEW_ROUNDS : TEST_ROUNDS;
    const availableTypes = isInterview ? [{ value: 'subjective', label: 'Subjective' }] : getAvailableTypes(q.round);

    function handleRoundChange(newRound) {
        onChange('round', newRound);
        if (!isInterview) {
            const validTypes = getAvailableTypes(newRound).map(t => t.value);
            if (!validTypes.includes(q.type)) onChange('type', validTypes[0]);
        }
    }

    // Normalised sig — always a valid object so sub-editor never crashes
    const sig = {
        name: q.functionSignature?.name ?? '',
        params: q.functionSignature?.params ?? [],
        returnType: q.functionSignature?.returnType ?? 'int',
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Row 1: Round + Type + Difficulty */}
            <div style={{ display: 'grid', gridTemplateColumns: isInterview ? '1fr 1fr' : '1fr 1fr 1fr', gap: '0.65rem' }}>
                <div>
                    <Label>Round *</Label>
                    <select value={q.round} onChange={e => handleRoundChange(e.target.value)} style={inp()}>
                        {rounds.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                </div>
                {!isInterview && (
                    <div>
                        <Label>Type *</Label>
                        {availableTypes.length === 1 ? (
                            <div style={{ ...inp(), display: 'flex', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.82rem', gap: '0.4rem' }}>
                                <span style={{ padding: '2px 8px', background: 'var(--primary-subtle)', border: '1px solid var(--primary)', borderRadius: '5px', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 600 }}>
                                    {availableTypes[0].label}
                                </span>
                                <span style={{ fontSize: '0.72rem' }}>only</span>
                            </div>
                        ) : (
                            <select value={q.type} onChange={e => onChange('type', e.target.value)} style={inp()}>
                                {availableTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                            </select>
                        )}
                    </div>
                )}
                <div>
                    <Label>Difficulty *</Label>
                    <select value={q.difficulty} onChange={e => onChange('difficulty', e.target.value)} style={inp()}>
                        {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                </div>
            </div>

            {/* Row 2: Year + Role + PYQ */}
            <div style={{ display: 'grid', gridTemplateColumns: roles?.length > 0 ? '1fr 1fr 1fr' : '1fr 1fr', gap: '0.65rem' }}>
                <div>
                    <Label>Year</Label>
                    <input type="number" value={q.year} onChange={e => onChange('year', e.target.value)} style={inp()} />
                </div>
                {roles?.length > 0 && (
                    <div>
                        <Label>Role (optional)</Label>
                        <select value={q.roleId || ''} onChange={e => onChange('roleId', e.target.value)} style={inp()}>
                            <option value="">All roles</option>
                            {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                        </select>
                    </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', paddingBottom: '4px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                        <input type="checkbox" checked={q.isReal || false} onChange={e => onChange('isReal', e.target.checked)} style={{ accentColor: 'var(--primary)', width: '14px', height: '14px' }} />
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>PYQ (real question)</span>
                    </label>
                </div>
            </div>

            {/* Question text */}
            <div>
                <Label>Question Text *</Label>
                <textarea value={q.text} onChange={e => onChange('text', e.target.value)} rows={4} placeholder="Enter the full question text…" style={{ ...inp(), resize: 'vertical' }} />
            </div>

            {/* MCQ options */}
            {q.type === 'mcq' && (
                <div>
                    <Label>Options * (select correct)</Label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        {(q.options || ['', '', '', '']).map((opt, i) => (
                            <div key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <input type="radio" name="correct" checked={q.correctAnswer === i} onChange={() => onChange('correctAnswer', i)} style={{ accentColor: 'var(--primary)', width: '14px', height: '14px', flexShrink: 0 }} />
                                <input value={opt} onChange={e => { const opts = [...(q.options || ['', '', '', ''])]; opts[i] = e.target.value; onChange('options', opts); }} placeholder={`Option ${String.fromCharCode(65 + i)}`} style={{ ...inp(), flex: 1 }} />
                            </div>
                        ))}
                    </div>
                    <div style={{ marginTop: '0.75rem' }}>
                        <Label>Explanation (optional)</Label>
                        <textarea value={q.explanation || ''} onChange={e => onChange('explanation', e.target.value)} rows={2} placeholder="Why is this the correct answer?" style={{ ...inp(), resize: 'vertical', marginTop: '0.35rem' }} />
                    </div>
                </div>
            )}

            {/* Coding fields */}
            {q.type === 'coding' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

                    {/* Function Signature */}
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                            <Label>Function Signature</Label>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                Defines how the test harness calls your solution
                            </span>
                        </div>
                        <FunctionSignatureEditor
                            sig={sig}
                            onChange={newSig => onChange('functionSignature', newSig)}
                        />
                    </div>

                    {/* Test Cases */}
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                            <Label>Test Cases</Label>
                            <button
                                type="button"
                                onClick={() => onChange('testCases', [...(q.testCases || []), { input: '', output: '', isHidden: false }])}
                                style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.78rem' }}
                            >
                                + Add Test Case
                            </button>
                        </div>
                        {sig.name?.trim() && (
                            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '0 0 0.5rem', lineHeight: 1.4 }}>
                                Input format: one argument per line; arrays as space-separated values on one line; 2-D arrays preceded by a row-count line.
                            </p>
                        )}
                        {(q.testCases || []).map((tc, i) => (
                            <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 2fr auto auto', gap: '0.4rem', alignItems: 'center', marginBottom: '0.35rem' }}>
                                <input value={tc.input} onChange={e => { const t = [...q.testCases]; t[i] = { ...t[i], input: e.target.value }; onChange('testCases', t); }} placeholder="Input" style={{ ...inp(), fontFamily: 'monospace', fontSize: '0.8rem' }} />
                                <input value={tc.output} onChange={e => { const t = [...q.testCases]; t[i] = { ...t[i], output: e.target.value }; onChange('testCases', t); }} placeholder="Expected output" style={{ ...inp(), fontFamily: 'monospace', fontSize: '0.8rem' }} />
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer', whiteSpace: 'nowrap', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                    <input type="checkbox" checked={tc.isHidden} onChange={e => { const t = [...q.testCases]; t[i] = { ...t[i], isHidden: e.target.checked }; onChange('testCases', t); }} style={{ accentColor: 'var(--primary)' }} /> Hidden
                                </label>
                                <button type="button" onClick={() => onChange('testCases', q.testCases.filter((_, j) => j !== i))} style={{ background: 'none', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '5px', color: 'var(--danger)', padding: '0.3rem 0.5rem', cursor: 'pointer' }}>✕</button>
                            </div>
                        ))}
                    </div>

                    {/* Starter Code override */}
                    <div>
                        <Label>Starter Code Override (Python) — optional</Label>
                        <textarea
                            value={q.starterCode?.python || ''}
                            onChange={e => onChange('starterCode', { ...q.starterCode, python: e.target.value })}
                            rows={3}
                            placeholder={sig.name ? generateStarterCode('python', sig) : 'def solution(...):\n    pass'}
                            style={{ ...inp(), fontFamily: 'monospace', fontSize: '0.8rem', resize: 'vertical' }}
                        />
                        {sig.name?.trim() && (
                            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>
                                Leave blank to use the auto-generated stub from the function signature above.
                            </p>
                        )}
                    </div>

                    {/* Model Solution */}
                    <div>
                        <Label>Model Solution</Label>
                        <textarea value={q.solution || ''} onChange={e => onChange('solution', e.target.value)} rows={3} placeholder="Full solution with explanation…" style={{ ...inp(), resize: 'vertical' }} />
                    </div>
                </div>
            )}

            {/* Subjective (interview) */}
            {q.type === 'subjective' && (
                <div>
                    <Label>Model Answer / Key Points</Label>
                    <textarea value={q.explanation || ''} onChange={e => onChange('explanation', e.target.value)} rows={4} placeholder="What a great answer looks like — key points, structure, examples…" style={{ ...inp(), resize: 'vertical' }} />
                </div>
            )}

            {error && <p style={{ color: 'var(--danger)', fontSize: '0.82rem' }}>{error}</p>}

            <div style={{ display: 'flex', gap: '0.65rem', paddingTop: '0.25rem' }}>
                <button type="button" onClick={onSave} disabled={saving} style={{
                    flex: 1, padding: '0.72rem', background: 'var(--primary)', color: '#fff',
                    border: 'none', borderRadius: '9px', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer',
                    opacity: saving ? 0.7 : 1,
                }}>
                    {saving ? 'Saving…' : 'Save Question'}
                </button>
                <button type="button" onClick={onCancel} style={{
                    padding: '0.72rem 1.1rem', background: 'none', border: '1px solid var(--border)',
                    borderRadius: '9px', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.875rem',
                }}>
                    Cancel
                </button>
            </div>
        </div>
    );
}
