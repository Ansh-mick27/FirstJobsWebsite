import Link from 'next/link';
import { Github, Linkedin, Twitter, Mail } from 'lucide-react';
import styles from './Footer.module.css';

export default function Footer() {
    return (
        <footer className={styles.footer}>
            <div className={styles.container}>
                <div className={styles.grid}>
                    <div className={styles.brand}>
                        <Link href="/" className={styles.logo}>
                            <span className={styles.logoAccent}>⚡</span>
                            <span className={styles.logoText}>PlacePrep</span>
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
                    <p>&copy; {new Date().getFullYear()} PlacePrep. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}
