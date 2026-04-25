'use client';
import { Plus } from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────
const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

// Mock-test rounds
const TEST_ROUNDS = [
    { value: 'oa', label: 'Verbal/Aptitude' },
    { value: 'technical', label: 'Technical' },
];
// Interview rounds  
const INTERVIEW_ROUNDS = [
    { value: 'technical', label: 'Technical' },
    { value: 'hr', label: 'HR' },
    { value: 'managerial', label: 'Managerial' },
];

// Available types per round (for mock test)
function getAvailableTypes(round) {
    if (round === 'oa') return [{ value: 'mcq', label: 'MCQ' }]; // OA = MCQ only
    if (round === 'technical') return [{ value: 'mcq', label: 'MCQ' }, { value: 'coding', label: 'Coding' }];
    return [{ value: 'mcq', label: 'MCQ' }];
}

const inp = () => ({
    width: '100%', padding: '0.65rem 0.85rem',
    background: 'var(--bg-elevated)', border: '1px solid var(--border)',
    borderRadius: '8px', color: 'var(--text-primary)', fontSize: '0.875rem', boxSizing: 'border-box',
    fontFamily: 'inherit',
});
const Label = ({ children }) => (
    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {children}
    </label>
);

/**
 * QuestionForm — context-aware based on category:
 *  category = 'test'      → Mock Test (OA or Technical round, MCQ/Coding types)
 *  category = 'interview' → AI Interview (Technical/HR/Managerial rounds, Subjective type only)
 */
export default function QuestionForm({ question: q, onChange, roles, onSave, onCancel, saving, error, category = 'test' }) {
    const isInterview = category === 'interview';
    const rounds = isInterview ? INTERVIEW_ROUNDS : TEST_ROUNDS;
    const availableTypes = isInterview ? [{ value: 'subjective', label: 'Subjective' }] : getAvailableTypes(q.round);

    // When round changes in test mode, auto-correct type if it becomes invalid
    function handleRoundChange(newRound) {
        onChange('round', newRound);
        if (!isInterview) {
            const validTypes = getAvailableTypes(newRound).map(t => t.value);
            if (!validTypes.includes(q.type)) {
                onChange('type', validTypes[0]);
            }
        }
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Row 1: Round + Type (or just Round for interview) + Difficulty */}
            <div style={{ display: 'grid', gridTemplateColumns: isInterview ? '1fr 1fr' : '1fr 1fr 1fr', gap: '0.65rem' }}>
                <div>
                    <Label>Round *</Label>
                    <select value={q.round} onChange={e => handleRoundChange(e.target.value)} style={inp()}>
                        {rounds.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                </div>
                {/* In interview mode, type is always subjective — don't show a selector */}
                {!isInterview && (
                    <div>
                        <Label>Type *</Label>
                        {availableTypes.length === 1 ? (
                            // Single type available — show as read-only badge instead of dropdown
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

            {/* Row 2: Year + Role + PYQ checkbox */}
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
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                            <Label>Test Cases</Label>
                            <button type="button" onClick={() => onChange('testCases', [...(q.testCases || []), { input: '', output: '', isHidden: false }])} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.78rem' }}>
                                + Add Test Case
                            </button>
                        </div>
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
                    <div>
                        <Label>Starter Code (Python)</Label>
                        <textarea value={q.starterCode?.python || ''} onChange={e => onChange('starterCode', { ...q.starterCode, python: e.target.value })} rows={3} placeholder={'def solution(...):\n    pass'} style={{ ...inp(), fontFamily: 'monospace', fontSize: '0.8rem', resize: 'vertical' }} />
                    </div>
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

            {/* Error */}
            {error && <p style={{ color: 'var(--danger)', fontSize: '0.82rem' }}>{error}</p>}

            {/* Footer */}
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
