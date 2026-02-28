'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FileText, Search, Building2, Calendar, FileType, ArrowRight } from 'lucide-react';
import styles from './page.module.css';

export default function PapersPage() {
    const [papers, setPapers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetch('/api/papers')
            .then(res => res.json())
            .then(data => { setPapers(data); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    const filteredPapers = papers.filter(p =>
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.company.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div className="container">
                    <FileText size={48} className={styles.headerIcon} />
                    <h1 className={styles.title}>Previous Year <span className={styles.accent}>Papers</span></h1>
                    <p className={styles.subtitle}>Practice with real test papers from top companies to understand their exam patterns.</p>

                    <div className={styles.searchBar}>
                        <Search size={20} />
                        <input
                            type="text"
                            placeholder="Search by company or topic..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className={styles.searchInput}
                        />
                    </div>
                </div>
            </div>

            <div className="container">
                {loading ? (
                    <div className={styles.grid}>
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className={`${styles.paperCard} ${styles.skeleton}`} />
                        ))}
                    </div>
                ) : (
                    <div className={styles.grid}>
                        {filteredPapers.map(paper => (
                            <Link href={`/papers/${paper.id}`} key={paper.id} className={styles.paperCard}>
                                <div className={styles.cardHeader}>
                                    <div className={styles.logo}>
                                        {paper.company.logo ? <img src={paper.company.logo} alt={paper.company.name} /> : <Building2 size={24} />}
                                    </div>
                                    <span className={styles.yearBadge}>{paper.year}</span>
                                </div>
                                <h3>{paper.title}</h3>
                                <p className={styles.companyName}>{paper.company.name}</p>

                                <div className={styles.meta}>
                                    <span><FileType size={14} /> {paper.type}</span>
                                    <span><FileText size={14} /> View Paper</span>
                                </div>

                                <div className={styles.solveBtn}>
                                    Solve Paper <ArrowRight size={16} />
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {!loading && filteredPapers.length === 0 && (
                    <div className={styles.empty}>
                        <FileText size={48} />
                        <h3>No papers found</h3>
                        <p>Try adjusting your search criteria.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
