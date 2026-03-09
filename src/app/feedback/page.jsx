'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { MessageSquare, Send, CheckCircle, AlertCircle, ChevronLeft } from 'lucide-react';
import styles from './page.module.css';

const CATEGORIES = ['Bug Report', 'Feature Request', 'Content Issue', 'General Feedback'];

export default function FeedbackPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();

    const [category, setCategory] = useState('General Feedback');
    const [message, setMessage] = useState('');
    const [status, setStatus] = useState('idle'); // 'idle' | 'submitting' | 'success' | 'error'
    const [errorMsg, setErrorMsg] = useState('');

    // Auth guard
    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login?next=/feedback');
        }
    }, [authLoading, user, router]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!message.trim()) return;
        setStatus('submitting');
        setErrorMsg('');

        try {
            const token = user ? await user.getIdToken() : null;
            const res = await fetch('/api/feedback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({ category, message }),
            });

            if (!res.ok) throw new Error('Submission failed');
            setStatus('success');
            setMessage('');
        } catch {
            setStatus('error');
            setErrorMsg('Something went wrong. Please try again.');
        }
    };

    if (authLoading) {
        return (
            <div className={styles.loadingScreen}>
                <div className={styles.spinner} />
            </div>
        );
    }
    if (!user) return null;

    return (
        <div className={styles.page}>
            <div className={styles.container}>
                <button className={styles.btnBack} onClick={() => router.back()}>
                    <ChevronLeft size={16} /> Back
                </button>

                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <div className={styles.iconWrap}>
                            <MessageSquare size={28} />
                        </div>
                        <div>
                            <h1 className={styles.title}>Send Feedback</h1>
                            <p className={styles.subtitle}>Let us know what you think — bugs, ideas, or general thoughts.</p>
                        </div>
                    </div>

                    {status === 'success' ? (
                        <div className={styles.successBox}>
                            <CheckCircle size={40} className={styles.successIcon} />
                            <h2>Thanks for your feedback!</h2>
                            <p>We read every submission and use it to make PlacePrep better.</p>
                            <button className={styles.btnPrimary} onClick={() => setStatus('idle')}>
                                Send More Feedback
                            </button>
                            <button className={styles.btnSecondary} onClick={() => router.push('/companies')}>
                                Back to Companies
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className={styles.form}>
                            <div className={styles.field}>
                                <label className={styles.label}>Category</label>
                                <div className={styles.pillGroup}>
                                    {CATEGORIES.map(cat => (
                                        <button
                                            key={cat}
                                            type="button"
                                            className={`${styles.pill} ${category === cat ? styles.pillActive : ''}`}
                                            onClick={() => setCategory(cat)}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className={styles.field}>
                                <label className={styles.label}>Message</label>
                                <textarea
                                    className={styles.textarea}
                                    placeholder="Describe the bug, feature idea, or your experience…"
                                    value={message}
                                    onChange={e => setMessage(e.target.value)}
                                    rows={6}
                                    required
                                />
                                <span className={styles.charCount}>{message.length} chars</span>
                            </div>

                            {status === 'error' && (
                                <div className={styles.errorBox}>
                                    <AlertCircle size={16} />
                                    <span>{errorMsg}</span>
                                </div>
                            )}

                            <button
                                type="submit"
                                className={styles.btnSubmit}
                                disabled={status === 'submitting' || !message.trim()}
                            >
                                {status === 'submitting' ? 'Sending…' : (
                                    <><Send size={16} /> Submit Feedback</>
                                )}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
