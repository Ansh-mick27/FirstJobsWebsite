'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Mail, Lock, AlertCircle, User, Hash, Infinity as InfinityIcon } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import styles from '../login/page.module.css';

const COLLEGE_DOMAIN = process.env.NEXT_PUBLIC_COLLEGE_EMAIL_DOMAIN;

export default function SignupPage() {
    const router = useRouter();
    const { signUp } = useAuth();
    const [name, setName] = useState('');
    const [rollNo, setRollNo] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSignup = async (e) => {
        e.preventDefault();
        setError('');

        if (!name || !email || !password) {
            setError('Please fill in all required fields.');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }

        // Validate college email domain
        if (COLLEGE_DOMAIN && !email.endsWith(`@${COLLEGE_DOMAIN}`)) {
            setError(`Only @${COLLEGE_DOMAIN} email addresses are allowed.`);
            return;
        }

        setLoading(true);
        try {
            await signUp(email, password, name, rollNo);
            router.push('/dashboard');
        } catch (err) {
            const msg = err?.code === 'auth/email-already-in-use'
                ? 'An account with this email already exists.'
                : err?.code === 'auth/weak-password'
                    ? 'Password is too weak. Use at least 6 characters.'
                    : err?.message || 'Signup failed. Please try again.';
            setError(msg);
        }
        setLoading(false);
    };

    return (
        <div className={styles.page}>
            <div className={styles.authBg} />

            <div className={styles.authContainer}>
                <div className={styles.logoWrapper}>
                    <Link href="/" className={styles.logo}>
                        <InfinityIcon size={28} className={styles.logoAccent} />
                        <span className={styles.logoText}>Paradox</span>
                    </Link>
                </div>

                <div className={styles.authCard}>
                    <h2>Create your account</h2>
                    <p>Start your journey to landing the perfect offer.</p>

                    <form onSubmit={handleSignup} className={styles.form}>
                        {error && (
                            <div className={styles.errorBox}>
                                <AlertCircle size={16} />
                                <span>{error}</span>
                            </div>
                        )}

                        <div className={styles.inputGroup}>
                            <label>Full Name</label>
                            <div className={styles.inputWrapper}>
                                <User size={18} className={styles.inputIcon} />
                                <input
                                    type="text"
                                    placeholder="John Doe"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className={`${styles.input} ${error && !name ? styles.inputError : ''}`}
                                    autoComplete="name"
                                />
                            </div>
                        </div>

                        <div className={styles.inputGroup}>
                            <label>Roll Number <span style={{ color: 'var(--text-muted)', fontSize: '0.8em' }}>(optional)</span></label>
                            <div className={styles.inputWrapper}>
                                <Hash size={18} className={styles.inputIcon} />
                                <input
                                    type="text"
                                    placeholder="e.g. 0801CS221001"
                                    value={rollNo}
                                    onChange={(e) => setRollNo(e.target.value)}
                                    className={styles.input}
                                />
                            </div>
                        </div>

                        <div className={styles.inputGroup}>
                            <label>
                                Email Address
                                {COLLEGE_DOMAIN && (
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8em', marginLeft: '6px' }}>
                                        (@{COLLEGE_DOMAIN} only)
                                    </span>
                                )}
                            </label>
                            <div className={styles.inputWrapper}>
                                <Mail size={18} className={styles.inputIcon} />
                                <input
                                    type="email"
                                    placeholder={COLLEGE_DOMAIN ? `student@${COLLEGE_DOMAIN}` : 'student@college.ac.in'}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className={`${styles.input} ${error && !email ? styles.inputError : ''}`}
                                    autoComplete="email"
                                />
                            </div>
                        </div>

                        <div className={styles.inputGroup}>
                            <label>Create Password</label>
                            <div className={styles.inputWrapper}>
                                <Lock size={18} className={styles.inputIcon} />
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className={`${styles.input} ${error && !password ? styles.inputError : ''}`}
                                    autoComplete="new-password"
                                />
                            </div>
                        </div>

                        <button type="submit" className={styles.submitBtn} disabled={loading}>
                            {loading ? 'Creating Account...' : (
                                <>Sign Up <ArrowRight size={18} /></>
                            )}
                        </button>
                    </form>

                    <div className={styles.authFooter}>
                        Already have an account? <Link href="/login">Sign in here</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
