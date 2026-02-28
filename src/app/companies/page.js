'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Building2, ArrowRight, Users, MapPin, ExternalLink } from 'lucide-react';
import styles from './page.module.css';

export default function CompaniesPage() {
    const [companies, setCompanies] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCompanies();
    }, []);

    async function fetchCompanies() {
        setLoading(true);
        const res = await fetch(`/api/companies?search=${search}`);
        const data = await res.json();
        setCompanies(data);
        setLoading(false);
    }

    useEffect(() => {
        const timer = setTimeout(fetchCompanies, 300);
        return () => clearTimeout(timer);
    }, [search]);

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div className="container">
                    <h1 className={styles.title}>Explore <span className={styles.accent}>Companies</span></h1>
                    <p className={styles.subtitle}>Browse 500+ companies hiring from campuses. Get AI-powered testimonials and interview prep.</p>
                    <div className={styles.searchBar}>
                        <Search size={20} />
                        <input
                            type="text"
                            placeholder="Search companies by name or industry..."
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
                            <div key={i} className={`${styles.card} ${styles.skeleton}`}>
                                <div className={styles.skeletonLogo} />
                                <div className={styles.skeletonText} />
                                <div className={styles.skeletonText} style={{ width: '60%' }} />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className={styles.grid}>
                        {companies.map((company) => (
                            <Link href={`/companies/${company.slug}`} key={company.id} className={styles.card}>
                                <div className={styles.cardTop}>
                                    <div className={styles.logo}>
                                        {company.logo ? (
                                            <img src={company.logo} alt={company.name} onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                                        ) : null}
                                        <div className={styles.logoFallback} style={{ display: company.logo ? 'none' : 'flex' }}>
                                            <Building2 size={24} />
                                        </div>
                                    </div>
                                    <span className={`${styles.badge} ${company.hiringStatus === 'Active' ? styles.badgeActive : ''}`}>
                                        {company.hiringStatus}
                                    </span>
                                </div>
                                <h3 className={styles.cardTitle}>{company.name}</h3>
                                <p className={styles.cardIndustry}>{company.industry}</p>
                                <p className={styles.cardDesc}>{company.description?.substring(0, 100)}...</p>
                                <div className={styles.cardFooter}>
                                    <span className={styles.cardStat}><Users size={14} /> {company.size || 'N/A'}</span>
                                    <span className={styles.cardLink}>View Details <ArrowRight size={14} /></span>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
                {!loading && companies.length === 0 && (
                    <div className={styles.empty}>
                        <Building2 size={48} />
                        <h3>No companies found</h3>
                        <p>Try a different search term.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
