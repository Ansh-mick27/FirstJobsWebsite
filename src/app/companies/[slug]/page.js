'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Building2, Star, MessageSquare, HelpCircle, FileText, ArrowLeft, Globe, Users, Sparkles, Loader2 } from 'lucide-react';
import styles from './page.module.css';

export default function CompanyDetailPage() {
    const { slug } = useParams();
    const [company, setCompany] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        fetch(`/api/companies/${slug}`)
            .then(res => res.json())
            .then(data => { setCompany(data); setLoading(false); })
            .catch(() => setLoading(false));
    }, [slug]);

    if (loading) return (
        <div className={styles.loading}>
            <Loader2 size={32} className={styles.spinner} />
            <p>Loading company details & generating AI content...</p>
        </div>
    );

    if (!company) return (
        <div className={styles.loading}>
            <h2>Company not found</h2>
            <Link href="/companies" className={styles.backLink}><ArrowLeft size={16} /> Back to Companies</Link>
        </div>
    );

    const tabs = [
        { id: 'overview', label: 'Overview', icon: <Building2 size={16} /> },
        { id: 'testimonials', label: `Testimonials (${company.testimonials?.length || 0})`, icon: <Star size={16} /> },
        { id: 'interview', label: `Interview Q&A (${company.interviewQuestions?.length || 0})`, icon: <HelpCircle size={16} /> },
        { id: 'papers', label: `Papers (${company.papers?.length || 0})`, icon: <FileText size={16} /> },
    ];

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div className="container">
                    <Link href="/companies" className={styles.backLink}><ArrowLeft size={16} /> All Companies</Link>
                    <div className={styles.companyHeader}>
                        <div className={styles.logo}>
                            {company.logo ? <img src={company.logo} alt={company.name} /> : <Building2 size={32} />}
                        </div>
                        <div>
                            <h1>{company.name}</h1>
                            <p className={styles.industry}>{company.industry} · {company.size}</p>
                        </div>
                        {company.website && (
                            <a href={company.website} target="_blank" rel="noopener" className={styles.websiteBtn}>
                                <Globe size={16} /> Visit Website
                            </a>
                        )}
                    </div>
                </div>
            </div>

            <div className="container">
                <div className={styles.tabs}>
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            className={`${styles.tab} ${activeTab === tab.id ? styles.activeTab : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>

                <div className={styles.content}>
                    {activeTab === 'overview' && (
                        <div className={styles.overview}>
                            <p className={styles.description}>{company.description}</p>
                            <div className={styles.statsGrid}>
                                <div className={styles.statCard}>
                                    <Star size={20} />
                                    <span>{company.testimonials?.length || 0}</span>
                                    <label>Testimonials</label>
                                </div>
                                <div className={styles.statCard}>
                                    <HelpCircle size={20} />
                                    <span>{company.interviewQuestions?.length || 0}</span>
                                    <label>Interview Q&A</label>
                                </div>
                                <div className={styles.statCard}>
                                    <FileText size={20} />
                                    <span>{company.papers?.length || 0}</span>
                                    <label>Papers</label>
                                </div>
                                <div className={styles.statCard}>
                                    <Users size={20} />
                                    <span>{company.size}</span>
                                    <label>Employees</label>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'testimonials' && (
                        <div>
                            {company.testimonials?.length > 0 && (
                                <div className={styles.aiBadge}><Sparkles size={14} /> AI-Generated Testimonials</div>
                            )}
                            <div className={styles.testimonialList}>
                                {company.testimonials?.map((t, i) => (
                                    <div key={i} className={styles.testimonialCard}>
                                        <div className={styles.testimonialHeader}>
                                            <div className={styles.avatar}>{t.name?.[0]}</div>
                                            <div>
                                                <strong>{t.name}</strong>
                                                <span>{t.role}</span>
                                            </div>
                                            <div className={styles.stars}>
                                                {[...Array(t.rating || 5)].map((_, j) => <Star key={j} size={14} fill="#f59e0b" color="#f59e0b" />)}
                                            </div>
                                        </div>
                                        <p>{t.content}</p>
                                    </div>
                                ))}
                            </div>
                            {company.testimonials?.length === 0 && <p className={styles.emptyMsg}>No testimonials yet. They will be generated automatically.</p>}
                        </div>
                    )}

                    {activeTab === 'interview' && (
                        <div className={styles.questionList}>
                            {company.interviewQuestions?.map((q, i) => (
                                <details key={i} className={styles.questionItem}>
                                    <summary>
                                        <span className={`${styles.diffBadge} ${styles[`diff${q.difficulty}`]}`}>{q.difficulty}</span>
                                        <span className={styles.catBadge}>{q.category}</span>
                                        {q.question}
                                    </summary>
                                    <div className={styles.answer}>{q.answer}</div>
                                </details>
                            ))}
                            {company.interviewQuestions?.length === 0 && <p className={styles.emptyMsg}>No interview questions yet.</p>}
                        </div>
                    )}

                    {activeTab === 'papers' && (
                        <div className={styles.paperList}>
                            {company.papers?.map((p, i) => (
                                <Link href={`/papers/${p.id}`} key={i} className={styles.paperCard}>
                                    <FileText size={20} />
                                    <div>
                                        <h4>{p.title}</h4>
                                        <span>{p.year} · {p.type}</span>
                                    </div>
                                </Link>
                            ))}
                            {company.papers?.length === 0 && <p className={styles.emptyMsg}>No papers available for this company.</p>}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
