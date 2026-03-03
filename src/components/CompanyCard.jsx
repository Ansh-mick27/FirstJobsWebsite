import Link from 'next/link';
import styles from './CompanyCard.module.css';

export default function CompanyCard({ company }) {
    // Default mock data if no company provided
    const data = company || {
        name: 'Google',
        slug: 'google',
        industry: 'Technology',
        roles: ['SWE', 'SRE', 'Data'],
        status: 'Active',
        rounds: ['OA', 'Tech', 'HR']
    };

    const initialLetter = data.name.charAt(0).toUpperCase();

    return (
        <Link href={`/companies/${data.slug}`} className={styles.card}>
            <div className={styles.header}>
                <div className={styles.logoBox}>
                    {initialLetter}
                </div>
                <div className={styles.tags}>
                    <span className={`${styles.statusLabel} ${data.status === 'Active' ? styles.active : ''}`}>
                        {data.status}
                    </span>
                </div>
            </div>

            <div className={styles.content}>
                <h3 className={styles.name}>{data.name}</h3>
                <p className={styles.industry}>{data.industry}</p>

                <div className={styles.rounds}>
                    {data.rounds.map((round) => (
                        <div key={round} className={styles.roundItem} title={round}>
                            <div className={styles.roundDot}></div>
                            <span className={styles.roundText}>{round}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className={styles.footer}>
                <span className={styles.prepareText}>
                    Prepare <span className={styles.arrow}>→</span>
                </span>
            </div>
        </Link>
    );
}
