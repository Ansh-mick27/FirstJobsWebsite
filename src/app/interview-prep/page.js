'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Building2, MessageSquare, ChevronRight, Bookmark } from 'lucide-react';
import styles from './page.module.css';

export default function InterviewPrepPage() {
    const [companies, setCompanies] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/companies')
            .then(res => res.json())
            .then(data => {
                // Filter to only companies that have interview questions (or sort them to top)
                setCompanies(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const filteredCompanies = companies.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.industry.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div className="container">
                    <MessageSquare size={48} className={styles.headerIcon} />
                    <h1 className={styles.title}>Interview <span className={styles.accent}>Preparation</span></h1>
                    <p className={styles.subtitle}>Master your interviews with company-specific questions and AI-generated mock transcripts.</p>

                    <div className={styles.searchBar}>
                        <Search size={20} />
                        <input
                            type="text"
                            placeholder="Search companies to prepare for..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className={styles.searchInput}
                        />
                    </div>
                </div>
            </div>

            <div className="container">
                <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h2>Company-Specific Prep</h2>
                        <p>Select a company to view their interview questions and experiences.</p>
                    </div>

                    {loading ? (
                        <div className={styles.grid}>
                            {[...Array(8)].map((_, i) => (
                                <div key={i} className={`${styles.companyCard} ${styles.skeleton}`} />
                            ))}
                        </div>
                    ) : (
                        <div className={styles.grid}>
                            {filteredCompanies.map(company => (
                                <Link href={`/companies/${company.slug}?tab=interview`} key={company.id} className={styles.companyCard}>
                                    <div className={styles.companyInfo}>
                                        <div className={styles.logo}>
                                            {company.logo ? <img src={company.logo} alt={company.name} /> : <Building2 size={24} />}
                                        </div>
                                        <div>
                                            <h3>{company.name}</h3>
                                            <span>{company.industry}</span>
                                        </div>
                                    </div>
                                    <div className={styles.cardFooter}>
                                        <span className={styles.questionCount}>
                                            <MessageSquare size={14} />
                                            {company._count?.interviewQuestions || 'Auto-generated'} Q&A
                                        </span>
                                        <ChevronRight size={18} className={styles.arrow} />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}

                    {!loading && filteredCompanies.length === 0 && (
                        <div className={styles.empty}>
                            <Building2 size={48} />
                            <h3>No companies found</h3>
                            <p>Try a different search term.</p>
                        </div>
                    )}
                </div>

                <div className={styles.resourcesSection}>
                    <h2>Preparation Resources</h2>
                    <div className={styles.resourcesGrid}>
                        <div className={styles.resourceCard}>
                            <div className={styles.resourceIcon} style={{ background: '#dcfce7', color: '#16a34a' }}>
                                <Bookmark size={24} />
                            </div>
                            <h3>HR Interview Guide</h3>
                            <p>Top 50 HR questions with sample answers for freshers.</p>
                            <button disabled className={styles.comingSoon}>Coming Soon</button>
                        </div>
                        <div className={styles.resourceCard}>
                            <div className={styles.resourceIcon} style={{ background: '#e0e7ff', color: '#4f46e5' }}>
                                <MessageSquare size={24} />
                            </div>
                            <h3>Behavioral Questions</h3>
                            <p>Master the STAR method for answering situational questions.</p>
                            <button disabled className={styles.comingSoon}>Coming Soon</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
