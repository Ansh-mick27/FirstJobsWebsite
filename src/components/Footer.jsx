'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Github, Linkedin, Twitter, Mail, Infinity as InfinityIcon } from 'lucide-react';
import styles from './Footer.module.css';

// Paths where the footer should be hidden (immersive full-screen experiences)
const HIDDEN_ON = ['/test/', '/interview/', '/companies/'];

export default function Footer() {
    const pathname = usePathname();

    // Hide footer on all immersive pages (test engine, AI interview)
    const isHidden = pathname === '/' || HIDDEN_ON.some(prefix => pathname?.startsWith(prefix));
    if (isHidden) return null;

    return (
        <footer className={styles.footer}>
            <div className={styles.container}>
                <div className={styles.grid}>
                    <div className={styles.brand}>
                        <Link href="/" className={styles.logo}>
                            <InfinityIcon size={22} className={styles.logoAccent} />
                            <span className={styles.logoText}>Paradox</span>
                        </Link>
                        <p className={styles.description}>
                            Level up your career with company-specific prep, real PYQs, and AI-powered mock interviews. Prepare smarter, not harder.
                        </p>
                        <div className={styles.socials}>
                            <a href="#" aria-label="GitHub"><Github size={18} /></a>
                            <a href="#" aria-label="LinkedIn"><Linkedin size={18} /></a>
                            <a href="#" aria-label="Twitter"><Twitter size={18} /></a>
                            <a href="#" aria-label="Email"><Mail size={18} /></a>
                        </div>
                    </div>

                    <div className={styles.linkGroup}>
                        <h4>Platform</h4>
                        <Link href="/companies">Companies</Link>
                        <Link href="/dashboard">Dashboard</Link>
                        <Link href="/login">Login</Link>
                    </div>

                    <div className={styles.linkGroup}>
                        <h4>Practice</h4>
                        <Link href="/companies">Mock Tests</Link>
                        <Link href="/companies">AI Interviews</Link>
                        <Link href="/companies">Study Materials</Link>
                    </div>

                    <div className={styles.linkGroup}>
                        <h4>Legal</h4>
                        <Link href="#">Privacy Policy</Link>
                        <Link href="#">Terms of Service</Link>
                    </div>
                </div>

                <div className={styles.bottom}>
                    <p>&copy; {new Date().getFullYear()} Paradox. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}
