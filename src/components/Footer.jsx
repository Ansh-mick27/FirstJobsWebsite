import Link from 'next/link';
import { Github, Linkedin, Twitter, Mail } from 'lucide-react';
import styles from './Footer.module.css';

export default function Footer() {
    return (
        <footer className={styles.footer}>
            <div className={styles.container}>
                <div className={styles.grid}>
                    <div className={styles.brand}>
                        <div className={styles.logo}>
                            <img src="/logo.png" alt="FirstJobs" className={styles.logoImg} />
                        </div>
                        <p className={styles.description}>
                            AI-powered placement preparation platform. Prepare smarter with company-specific prep, quizzes, and interview practice.
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
                        <Link href="/quizzes">Quizzes</Link>
                        <Link href="/interview-prep">Interview Prep</Link>
                        <Link href="/papers">Previous Papers</Link>
                    </div>

                    <div className={styles.linkGroup}>
                        <h4>Categories</h4>
                        <Link href="/quizzes">Aptitude</Link>
                        <Link href="/quizzes">Logical Reasoning</Link>
                        <Link href="/quizzes">Verbal Ability</Link>
                        <Link href="/quizzes">Coding & DSA</Link>
                    </div>

                    <div className={styles.linkGroup}>
                        <h4>Resources</h4>
                        <Link href="/papers">TCS Papers</Link>
                        <Link href="/papers">Infosys Papers</Link>
                        <Link href="/papers">Wipro Papers</Link>
                        <Link href="/papers">Accenture Papers</Link>
                    </div>
                </div>

                <div className={styles.bottom}>
                    <p>&copy; {new Date().getFullYear()} FirstJobs. All rights reserved.</p>
                    <div className={styles.bottomLinks}>
                        <a href="#">Privacy Policy</a>
                        <a href="#">Terms of Service</a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
