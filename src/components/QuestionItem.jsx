'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import styles from './QuestionItem.module.css';

export default function QuestionItem({ question }) {
    const [isOpen, setIsOpen] = useState(false);
    const { user } = useAuth();
    const userEmail = user?.email || 'unknown@example.com';

    // ─── Disable right-click over question content ───────────────────────────────
    const handleContextMenu = (e) => {
        e.preventDefault();
        return false;
    };

    // ─── Block copy/select shortcuts ─────────────────────────────────────────────
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && ['c', 'C', 'a', 'A', 'x', 'X', 'p', 'P'].includes(e.key)) {
                e.preventDefault();
                return false;
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <div className={styles.container}>
            <button
                className={`${styles.header} ${isOpen ? styles.active : ''}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className={styles.titleGroup}>
                    <span className={styles.number}>#{question.id || 'Q'}</span>
                    <h4 className={styles.title}>{question.title}</h4>
                </div>
                <div className={styles.tags}>
                    {question.difficulty && (
                        <span className={`${styles.tag} ${styles[`diff${question.difficulty}`]}`}>
                            {question.difficulty}
                        </span>
                    )}
                    {isOpen ? <ChevronUp size={18} className={styles.icon} /> : <ChevronDown size={18} className={styles.icon} />}
                </div>
            </button>

            {isOpen && (
                <div
                    className={styles.content}
                    onContextMenu={handleContextMenu}
                >
                    {/* Watermark grid */}
                    <div className={styles.watermarkContainer} aria-hidden="true">
                        {Array.from({ length: 16 }).map((_, i) => (
                            <div key={i} className={styles.watermarkText}>{userEmail}</div>
                        ))}
                    </div>

                    <div className={styles.protectedText}>
                        <p>{question.description}</p>
                        {question.code && (
                            <pre className={styles.codeBlock}>
                                <code>{question.code}</code>
                            </pre>
                        )}
                        {question.solution && (
                            <div className={styles.solutionBox}>
                                <h5>Solution:</h5>
                                <p>{question.solution}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
