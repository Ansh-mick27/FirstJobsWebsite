"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, LogOut, LayoutDashboard, Infinity as InfinityIcon } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import styles from './Navbar.module.css';

const publicNavLinks = [
    { href: '/', label: 'Home' },
    { href: '/companies', label: 'Companies' },
];

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const pathname = usePathname();
    const router = useRouter();
    const { user, profile, loading, signOut } = useAuth();

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleSignOut = async () => {
        try {
            await signOut();
            router.push('/');
        } catch (err) {
            console.error('Sign out failed:', err);
        }
        setIsOpen(false);
    };

    const displayName = profile?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'User';

    const HIDDEN_ON = ['/test/', '/interview/'];
    const isHidden = pathname === '/' || HIDDEN_ON.some(p => pathname.startsWith(p));
    if (isHidden) return null;

    return (
        <nav className={`${styles.navbar} ${scrolled ? styles.scrolled : ''}`}>
            <div className={styles.container}>
                <Link href="/" className={styles.logo}>
                    <InfinityIcon size={28} className={styles.logoAccent} />
                    <span className={styles.logoText}>Paradox</span>
                </Link>

                <div className={`${styles.navLinks} ${isOpen ? styles.active : ''}`}>
                    {publicNavLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`${styles.navLink} ${pathname === link.href ? styles.activeLink : ''}`}
                            onClick={() => setIsOpen(false)}
                        >
                            {link.label}
                        </Link>
                    ))}

                    {!loading && user ? (
                        <>
                            <Link
                                href="/dashboard"
                                className={`${styles.navLink} ${pathname === '/dashboard' ? styles.activeLink : ''}`}
                                onClick={() => setIsOpen(false)}
                            >
                                <LayoutDashboard size={16} />
                                {displayName}
                            </Link>
                            <button className={styles.logoutBtn} onClick={handleSignOut}>
                                <LogOut size={16} />
                                Logout
                            </button>
                        </>
                    ) : !loading ? (
                        <Link href="/login" className={styles.ctaButton} onClick={() => setIsOpen(false)}>
                            Get Started
                        </Link>
                    ) : null}
                </div>

                <button className={styles.menuBtn} onClick={() => setIsOpen(!isOpen)} aria-label="Toggle menu">
                    {isOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>
        </nav>
    );
}
