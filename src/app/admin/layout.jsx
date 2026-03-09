'use client';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, Building2, Plus, Zap, LogOut, ChevronRight } from 'lucide-react';

const ADMIN_PASSWORD =
    typeof window !== 'undefined'
        ? process.env.NEXT_PUBLIC_ADMIN_PASSWORD || ''
        : '';


export default function AdminLayout({ children }) {
    const [authed, setAuthed] = useState(false);
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [checking, setChecking] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const saved = sessionStorage.getItem('admin_authed');
        if (saved === 'true') setAuthed(true);
        setChecking(false);
    }, []);

    function handleLogin(e) {
        e.preventDefault();
        if (password === ADMIN_PASSWORD) {
            sessionStorage.setItem('admin_authed', 'true');
            setAuthed(true);
            setError('');
        } else {
            setError('Incorrect password. Try again.');
            setPassword('');
        }
    }

    function handleLogout() {
        sessionStorage.removeItem('admin_authed');
        setAuthed(false);
        router.push('/admin');
    }

    if (checking) return null;

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
                    {/* Logo */}
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
                                PlacePrep Admin
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
                            }}
                        />
                        {error && (
                            <p style={{ color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>{error}</p>
                        )}
                        <button
                            type="submit"
                            style={{
                                width: '100%',
                                padding: '0.9rem',
                                background: 'var(--primary)',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '10px',
                                fontSize: '1rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem',
                                transition: 'opacity 0.2s',
                            }}
                            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                        >
                            Enter Admin Panel <ChevronRight size={18} />
                        </button>
                    </form>

                    <p style={{ marginTop: '1.5rem', fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                        This panel is for developers only. Direct URL access required.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', fontFamily: 'var(--font-body)' }}>
            {/* Sidebar */}
            <aside style={{
                width: '220px',
                flexShrink: 0,
                background: 'var(--bg-surface)',
                borderRight: '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                position: 'sticky',
                top: 0,
                height: '100vh',
                padding: '1.5rem 0',
            }}>
                {/* Brand */}
                <div style={{ padding: '0 1.25rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <div style={{
                            width: '34px', height: '34px',
                            background: 'var(--primary)',
                            borderRadius: '8px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <Zap size={18} color="#fff" />
                        </div>
                        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>
                            Admin
                        </span>
                    </div>
                </div>

                {/* Nav links */}
                <nav style={{ flex: 1, padding: '1rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <SidebarLink href="/admin" icon={<LayoutDashboard size={16} />} label="Dashboard" />
                    <SidebarLink href="/admin/companies" icon={<Building2 size={16} />} label="Companies" />
                    <SidebarLink href="/admin/companies/new" icon={<Plus size={16} />} label="Add Company" />
                </nav>

                {/* Logout */}
                <div style={{ padding: '1rem 0.75rem', borderTop: '1px solid var(--border)' }}>
                    <button
                        onClick={handleLogout}
                        style={{
                            width: '100%',
                            padding: '0.65rem 1rem',
                            background: 'transparent',
                            border: '1px solid var(--border)',
                            borderRadius: '8px',
                            color: 'var(--text-secondary)',
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            transition: 'all 0.2s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--danger)'; e.currentTarget.style.color = 'var(--danger)'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                    >
                        <LogOut size={14} /> Logout
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <main style={{ flex: 1, overflow: 'auto', minHeight: '100vh' }}>
                {children}
            </main>
        </div>
    );
}

function SidebarLink({ href, icon, label }) {
    const pathname = usePathname();
    const active =
        href === '/admin'
            ? pathname === '/admin'
            : pathname.startsWith(href);

    return (
        <Link href={href} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            padding: '0.6rem 0.9rem',
            borderRadius: '8px',
            fontSize: '0.875rem',
            fontWeight: active ? 600 : 400,
            color: active ? 'var(--primary)' : 'var(--text-secondary)',
            background: active ? 'var(--primary-subtle)' : 'transparent',
            transition: 'all 0.15s',
            textDecoration: 'none',
        }}>
            {icon}
            {label}
        </Link>
    );
}

