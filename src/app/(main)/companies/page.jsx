'use client';

import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { motion } from 'framer-motion';
import CompanyCard from '@/components/CompanyCard';
import styles from './page.module.css';

const ROUND_FILTERS = [
    { label: 'All', value: '' },
    { label: 'OA Round', value: 'oa' },
    { label: 'Technical', value: 'technical' },
    { label: 'HR Round', value: 'hr' },
];

export default function CompaniesPage() {
    const [activeFilter, setActiveFilter] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        async function fetchCompanies() {
            setLoading(true);
            setError('');
            try {
                const params = new URLSearchParams();
                if (searchQuery) params.set('search', searchQuery);
                if (activeFilter) params.set('round', activeFilter);
                const res = await fetch(`/api/companies?${params.toString()}`);
                if (!res.ok) throw new Error('Failed to fetch companies');
                const data = await res.json();
                setCompanies(data);
            } catch (err) {
                console.error('Failed to fetch companies:', err);
                setError('Failed to load companies. Please refresh the page.');
            }
            setLoading(false);
        }

        // Debounce search to avoid calling API on every keystroke
        const debounce = setTimeout(fetchCompanies, 300);
        return () => clearTimeout(debounce);
    }, [searchQuery, activeFilter]);

    return (
        <div className={styles.page}>
            <div className="container">

                {/* Header Section */}
                <div className={styles.header}>
                    <motion.h1
                        className={styles.title}
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        Pick Your Target
                    </motion.h1>
                    <motion.p
                        className={styles.subtitle}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1 }}
                    >
                        Browse companies and start preparing specifically for their exact interview process.
                    </motion.p>
                </div>

                {/* Search and Filter Section */}
                <motion.div
                    className={styles.controls}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <div className={styles.searchBar}>
                        <Search size={20} className={styles.searchIcon} />
                        <input
                            type="text"
                            placeholder="Search by company name or industry..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={styles.searchInput}
                        />
                    </div>

                    <div className={styles.filters}>
                        {ROUND_FILTERS.map((filter) => (
                            <button
                                key={filter.value}
                                className={`${styles.filterPill} ${activeFilter === filter.value ? styles.activePill : ''}`}
                                onClick={() => setActiveFilter(filter.value)}
                            >
                                {filter.label}
                            </button>
                        ))}
                    </div>
                </motion.div>

                {/* States */}
                {error && (
                    <div className={styles.errorMsg}>{error}</div>
                )}

                {loading ? (
                    <div className={styles.grid}>
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className={styles.skeletonCard} />
                        ))}
                    </div>
                ) : companies.length === 0 && !error ? (
                    <div className={styles.emptyState}>
                        <p>No companies found{searchQuery ? ` for "${searchQuery}"` : ''}.</p>
                        {(searchQuery || activeFilter) && (
                            <button
                                className={styles.clearBtn}
                                onClick={() => { setSearchQuery(''); setActiveFilter(''); }}
                            >
                                Clear filters
                            </button>
                        )}
                    </div>
                ) : (
                    /* Company Grid */
                    <motion.div
                        className={styles.grid}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                    >
                        {companies.map((company, i) => (
                            <motion.div
                                key={company.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.05 * i }}
                            >
                                <CompanyCard company={company} />
                            </motion.div>
                        ))}
                    </motion.div>
                )}

            </div>
        </div>
    );
}
