'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Brain, Clock, HelpCircle, ArrowRight, LayoutTemplate } from 'lucide-react';
import { motion } from 'framer-motion';
import AntigravityCard from '@/components/AntigravityCard';
import styles from './page.module.css';

const difficultyColors = {
    Easy: 'var(--color-success)',
    Medium: 'var(--color-warning)',
    Hard: 'var(--color-error)'
};

export default function QuizzesPage() {
    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [category, setCategory] = useState('');

    const categories = ['All', 'Aptitude', 'Logical Reasoning', 'Verbal Ability', 'Coding', 'General Knowledge', 'Company-Specific'];

    useEffect(() => {
        fetchQuizzes();
    }, [category]);

    async function fetchQuizzes() {
        setLoading(true);
        const url = category && category !== 'All' ? `/api/quizzes?category=${encodeURIComponent(category)}` : '/api/quizzes';
        const res = await fetch(url);
        const data = await res.json();
        setQuizzes(data);
        setLoading(false);
    }

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div className="container">
                    <Brain size={48} className={styles.headerIcon} />
                    <h1 className={styles.title}>Practice <span className={styles.accent}>Quizzes</span></h1>
                    <p className={styles.subtitle}>Test your skills with our curated quizzes. Get AI-generated questions tailored to your needs.</p>
                </div>
            </div>

            <div className="container">
                <div className={styles.filters}>
                    {categories.map(c => (
                        <button
                            key={c}
                            className={`${styles.filterBtn} ${category === c || (!category && c === 'All') ? styles.activeFilter : ''}`}
                            onClick={() => setCategory(c === 'All' ? '' : c)}
                        >
                            {c}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className={styles.grid}>
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className={`${styles.card} ${styles.skeleton}`}>
                                <div className={styles.skeletonText} style={{ height: '24px', width: '80%' }} />
                                <div className={styles.skeletonText} style={{ width: '40%' }} />
                                <div className={styles.skeletonText} style={{ width: '60%' }} />
                            </div>
                        ))}
                    </div>
                ) : (
                    <motion.div
                        className={styles.grid}
                        initial="hidden"
                        animate="visible"
                        variants={{
                            hidden: { opacity: 0 },
                            visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
                        }}
                    >
                        {quizzes.map((quiz) => (
                            <motion.div
                                key={quiz.id}
                                variants={{
                                    hidden: { opacity: 0, y: 30 },
                                    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
                                }}
                            >
                                <AntigravityCard className={styles.card}>
                                    <div className={styles.cardHeader}>
                                        <span className={styles.categoryBadge}>{quiz.category}</span>
                                        <span
                                            className={styles.diffBadge}
                                            style={{ color: difficultyColors[quiz.difficulty], backgroundColor: `${difficultyColors[quiz.difficulty]}15` }}
                                        >
                                            {quiz.difficulty}
                                        </span>
                                    </div>
                                    <h3>{quiz.title}</h3>
                                    {quiz.company && <p className={styles.companyName}>For {quiz.company.name}</p>}

                                    <div className={styles.quizMeta}>
                                        <span><HelpCircle size={16} /> {quiz._count?.questions || 0} Questions</span>
                                        <span><Clock size={16} /> {quiz._count?.questions ? quiz._count.questions * 2 : 0} Mins</span>
                                    </div>

                                    <Link href={`/quizzes/${quiz.id}`} className={styles.startBtn}>
                                        Start Quiz <ArrowRight size={16} />
                                    </Link>
                                </AntigravityCard>
                            </motion.div>
                        ))}
                    </motion.div>
                )}

                {!loading && quizzes.length === 0 && (
                    <div className={styles.empty}>
                        <LayoutTemplate size={48} />
                        <h3>No quizzes found</h3>
                        <p>Try selecting a different category.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
