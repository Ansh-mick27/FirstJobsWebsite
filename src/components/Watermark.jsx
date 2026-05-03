'use client';

import styles from './Watermark.module.css';

export default function Watermark({ email = '', repeat = 20, opacity = 0.035 }) {
    if (!email) return null;

    return (
        <div className={styles.root} aria-hidden="true" style={{ '--wm-opacity': opacity }}>
            {Array.from({ length: repeat }).map((_, i) => (
                <span key={i} className={styles.text}>{email}</span>
            ))}
        </div>
    );
}
