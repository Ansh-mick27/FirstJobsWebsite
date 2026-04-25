'use client';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
    LayoutDashboard, Building2, Plus, Zap, LogOut,
    ChevronRight, Library, Loader2
} from 'lucide-react';

/**
 * Returns the stored admin API token from sessionStorage.
 * Use this in all admin pages/components instead of NEXT_PUBLIC_ADMIN_PASSWORD.
 */
export function getAdminToken() {
    if (typeof window === 'undefined') return '';
    return sessionStorage.getItem('admin_token') || '';
}

export default function AdminLayout({ children }) {
    const [authed, setAuthed] = useState(false);
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [checking, setChecking] = useState(true);
    const [loggingIn, setLoggingIn] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const token = sessionStorage.getItem('admin_token');
        if (token) setAuthed(true);
        setChecking(false);
    }, []);

    async function handleLogin(e) {
        e.preventDefault();
        setLoggingIn(true);
        setError('');
        try {
            const res = await fetch('/api/admin/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password }),
            });
            const data = await res.json();
            if (res.ok && data.token) {
                sessionStorage.setItem('admin_token', data.token);
                setAuthed(true);
                setPassword('');
            } else {
                setError(data.error || 'Incorrect password. Try again.');
                setPassword('');
            }
        } catch {
            setError('Could not connect to server. Please try again.');
        } finally {
            setLoggingIn(false);
        }
    }

    function handleLogout() {
        sessionStorage.removeItem('admin_token');
        setAuthed(false);
        router.push('/admin');
    }

    if (checking) return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Loader2 size={24} style={{ color: 'var(--text-muted)', animation: 'spin 1s linear infinite' }} />
        </div>
    );

    if (!authed) {
        return (
            <div style={{
                minHeight: '100vh',
                background: 'var(--bg-base)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'var(--font-body)',
                padding: '1.5rem',
            }}>
                <div style={{
                    width: '100%',
                    maxWidth: '420px',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '16px',
                    padding: '2.5rem',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
                        <div style={{
                            width: '42px', height: '42px',
                            background: 'var(--primary)',
                            borderRadius: '10px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <Zap size={22} color="#fff" />
                        </div>
                        <div>
                            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                                Paradox Admin
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Restricted access</div>
                        </div>
                    </div>

                    <form onSubmit={handleLogin}>
                        <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Admin Password
                        </label>
                        <input
                            id="admin-password"
                            type="password"
                            value={password}
                            onChange={(e) => { setPassword(e.target.value); setError(''); }}
                            placeholder="Enter admin password"
                            autoFocus
                            disabled={loggingIn}
                            style={{
                                width: '100%',
                                padding: '0.85rem 1rem',
                                background: 'var(--bg-elevated)',
                                border: `1px solid ${error ? 'var(--danger)' : 'var(--border)'}`,
                                borderRadius: '10px',
                                color: 'var(--text-primary)',
                                fontSize: '1rem',
                                marginBottom: error ? '0.5rem' : '1.25rem',
                                transition: 'border-color 0.2s',
                                boxSizing: 'border-box',
                                opacity: loggingIn ? 0.7 : 1,
                            }}
                        />
                        {error && (
                            <p style={{ color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>{error}</p>
                        )}
                        <button
                            type="submit"
                            disabled={loggingIn || !password}
                            style={{
                                width: '100%',
                                padding: '0.9rem',
                                background: 'var(--primary)',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '10px',
                                fontSize: '1rem',
                                fontWeight: 600,
                                cursor: loggingIn ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem',
                                opacity: (loggingIn || !password) ? 0.65 : 1,
                                transition: 'opacity 0.2s',
                            }}
                        >
                            {loggingIn ? (
                                <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Verifying…</>
                            ) : (
                                <>Enter Admin Panel <ChevronRight size={18} /></>
                            )}
                        </button>
                    </form>

                    <p style={{ marginTop: '1.5rem', fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                        Developer-only access. Direct URL required.
                    </p>
                </div>
                <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', fontFamily: 'var(--font-body)' }}>
            {/* Sidebar */}
            <aside style={{
                width: '240px',
                flexShrink: 0,
                background: 'var(--bg-surface)',
                borderRight: '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                position: 'sticky',
                top: 0,
                height: '100vh',
                overflowY: 'auto',
            }}>
                {/* Brand */}
                <div style={{ padding: '1.35rem 1.25rem 1.25rem', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <div style={{
                            width: '34px', height: '34px',
                            background: 'var(--primary)',
                            borderRadius: '8px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0,
                        }}>
                            <Zap size={18} color="#fff" />
                        </div>
                        <div>
                            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)', display: 'block' }}>
                                Paradox
                            </span>
                            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                                Admin Panel
                            </span>
                        </div>
                    </div>
                </div>

                {/* Nav */}
                <nav style={{ flex: 1, padding: '1rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
                    <NavSection label="Overview" />
                    <SidebarLink href="/admin" icon={<LayoutDashboard size={15} />} label="Dashboard" exact />

                    <NavSection label="Content" />
                    <SidebarLink href="/admin/companies" icon={<Building2 size={15} />} label="Companies" />
                    <SidebarLink href="/admin/companies/new" icon={<Plus size={15} />} label="Add Company" />
                    <SidebarLink href="/admin/questions" icon={<Library size={15} />} label="Questions Library" />
                </nav>

                {/* Logout */}
                <div style={{ padding: '1rem 0.75rem', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
                    <button
                        onClick={handleLogout}
                        style={{
                            width: '100%',
                            padding: '0.6rem 1rem',
                            background: 'transparent',
                            border: '1px solid var(--border)',
                            borderRadius: '8px',
                            color: 'var(--text-secondary)',
                            fontSize: '0.82rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            transition: 'all 0.2s',
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.borderColor = 'var(--danger)';
                            e.currentTarget.style.color = 'var(--danger)';
                            e.currentTarget.style.background = 'rgba(239,68,68,0.06)';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.borderColor = 'var(--border)';
                            e.currentTarget.style.color = 'var(--text-secondary)';
                            e.currentTarget.style.background = 'transparent';
                        }}
                    >
                        <LogOut size={14} /> Logout
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <main style={{ flex: 1, overflow: 'auto', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
                {children}
            </main>
        </div>
    );
}

function NavSection({ label }) {
    return (
        <div style={{
            fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)',
            textTransform: 'uppercase', letterSpacing: '0.09em',
            padding: '0.75rem 0.9rem 0.3rem',
        }}>
            {label}
        </div>
    );
}

function SidebarLink({ href, icon, label, exact }) {
    const pathname = usePathname();
    const active = exact
        ? pathname === href
        : pathname === href || pathname.startsWith(href + '/') || (href !== '/admin' && pathname.startsWith(href));

    return (
        <Link href={href} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            padding: '0.55rem 0.9rem',
            borderRadius: '8px',
            fontSize: '0.85rem',
            fontWeight: active ? 600 : 400,
            color: active ? 'var(--primary)' : 'var(--text-secondary)',
            background: active ? 'var(--primary-subtle)' : 'transparent',
            transition: 'all 0.12s',
            textDecoration: 'none',
        }}
            onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'var(--bg-elevated)'; e.currentTarget.style.color = 'var(--text-primary)'; } }}
            onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; } }}
        >
            <span style={{ display: 'flex', alignItems: 'center', opacity: active ? 1 : 0.75 }}>{icon}</span>
            {label}
        </Link>
    );
}


