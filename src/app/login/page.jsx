'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Mail, Lock, AlertCircle, Infinity as InfinityIcon } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.css';

export default function LoginPage() {
    const router = useRouter();
    const { signIn } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');

        if (!email || !password) {
            setError('Please fill in all fields.');
            return;
        }

        setLoading(true);
        try {
            await signIn(email, password);
            router.push('/dashboard');
        } catch (err) {
            const msg = err?.code === 'auth/invalid-credential' || err?.code === 'auth/wrong-password' || err?.code === 'auth/user-not-found'
                ? 'Invalid email or password. Please try again.'
                : err?.code === 'auth/too-many-requests'
                    ? 'Too many failed attempts. Please try again later.'
                    : err?.message || 'Login failed. Please try again.';
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
                    <h2>Welcome back</h2>
                    <p>Sign in to access your Paradox dashboard.</p>

                    <form onSubmit={handleLogin} className={styles.form}>
                        {error && (
                            <div className={styles.errorBox}>
                                <AlertCircle size={16} />
                                <span>{error}</span>
                            </div>
                        )}

                        <div className={styles.inputGroup}>
                            <label>Email Address</label>
                            <div className={styles.inputWrapper}>
                                <Mail size={18} className={styles.inputIcon} />
                                <input
                                    type="email"
                                    placeholder="student@college.ac.in"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className={`${styles.input} ${error ? styles.inputError : ''}`}
                                    autoComplete="email"
                                />
                            </div>
                        </div>

                        <div className={styles.inputGroup}>
                            <label>Password</label>
                            <div className={styles.inputWrapper}>
                                <Lock size={18} className={styles.inputIcon} />
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className={`${styles.input} ${error ? styles.inputError : ''}`}
                                    autoComplete="current-password"
                                />
                            </div>
                        </div>

                        <button type="submit" className={styles.submitBtn} disabled={loading}>
                            {loading ? 'Authenticating...' : (
                                <>Sign In <ArrowRight size={18} /></>
                            )}
                        </button>
                    </form>

                    <div className={styles.authFooter}>
                        Don&apos;t have an account? <Link href="/signup">Sign up here</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
