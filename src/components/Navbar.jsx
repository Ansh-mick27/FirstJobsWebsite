'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Briefcase } from 'lucide-react';
import styles from './Navbar.module.css';

const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/companies', label: 'Companies' },
    { href: '/quizzes', label: 'Quizzes' },
    { href: '/interview-prep', label: 'Interview Prep' },
    { href: '/papers', label: 'Papers' },
];

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();

    return (
        <nav className={styles.navbar}>
            <div className={styles.container}>
                <Link href="/" className={styles.logo}>
                    <img src="/logo.png" alt="FirstJobs" className={styles.logoImg} />
                </Link>

                <div className={`${styles.navLinks} ${isOpen ? styles.active : ''}`}>
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`${styles.navLink} ${pathname === link.href ? styles.activeLink : ''}`}
                            onClick={() => setIsOpen(false)}
                        >
                            {link.label}
                        </Link>
                    ))}
                    <Link href="/companies" className={styles.ctaButton} onClick={() => setIsOpen(false)}>
                        <Briefcase size={16} />
                        Get Started
                    </Link>
                </div>

                <button className={styles.menuBtn} onClick={() => setIsOpen(!isOpen)} aria-label="Toggle menu">
                    {isOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>
        </nav>
    );
}
