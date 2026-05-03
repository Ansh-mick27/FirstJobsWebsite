'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, Zap, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.css';

const FEATURES = [
    'Unlimited AI mock interviews',
    'All companies & all round types',
    'Detailed feedback after every interview',
    'Question deduplication across sessions',
    'Valid for 30 days from payment',
];

function loadRazorpayScript() {
    return new Promise((resolve) => {
        if (window.Razorpay) return resolve();
        const s = document.createElement('script');
        s.src = 'https://checkout.razorpay.com/v1/checkout.js';
        s.async = true;
        s.onload = resolve;
        document.body.appendChild(s);
    });
}

export default function PricingPage() {
    const router = useRouter();
    const { user, profile, loading, isSubscribed } = useAuth();
    const [paying, setPaying] = useState(false);
    const [error, setError] = useState('');

    // Redirect logged-out users to login
    useEffect(() => {
        if (!loading && !user) {
            router.push('/login?next=/pricing');
        }
    }, [loading, user, router]);

    // Redirect already-subscribed users away from this page
    useEffect(() => {
        if (!loading && isSubscribed) {
            router.replace('/companies');
        }
    }, [loading, isSubscribed, router]);

    const handlePay = async () => {
        if (!user) return;
        setPaying(true);
        setError('');

        try {
            const idToken = await user.getIdToken();

            // 1. Create Razorpay order
            const orderRes = await fetch('/api/payments/create-order', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${idToken}` },
            });
            if (!orderRes.ok) throw new Error('Failed to create order');
            const { orderId, amount, currency } = await orderRes.json();

            // 2. Load Razorpay checkout script
            await loadRazorpayScript();

            // 3. Open payment modal
            const rzp = new window.Razorpay({
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                order_id: orderId,
                amount,
                currency,
                name: 'FirstJobs',
                description: 'Monthly Interview Access — ₹99',
                prefill: {
                    email: user.email,
                    name: profile?.name ?? '',
                },
                theme: { color: '#7c3aed' },
                handler: async (response) => {
                    // 4. Verify payment server-side
                    const verifyRes = await fetch('/api/payments/verify', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${idToken}`,
                        },
                        body: JSON.stringify({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                        }),
                    });

                    if (verifyRes.ok) {
                        // AuthContext onSnapshot will flip isSubscribed automatically.
                        // Navigate; by the time user interacts with /companies it's updated.
                        router.push('/companies');
                    } else {
                        setError(
                            `Payment verification failed. If money was deducted, contact support with payment ID: ${response.razorpay_payment_id}`
                        );
                        setPaying(false);
                    }
                },
                modal: {
                    ondismiss: () => setPaying(false),
                },
            });

            rzp.open();
        } catch (err) {
            console.error('[PricingPage] handlePay error:', err);
            setError('Something went wrong. Please try again.');
            setPaying(false);
        }
    };

    // Show nothing while auth state loads or redirect fires
    if (loading || isSubscribed) return null;

    return (
        <main className={styles.page}>
            <div className={styles.card}>
                <div className={styles.header}>
                    <div className={styles.badge}>Monthly Plan</div>
                    <h1 className={styles.title}>Unlock Full Access</h1>
                    <p className={styles.subtitle}>
                        Your free demo interview has been used. Subscribe to continue practising with unlimited AI mock interviews.
                    </p>
                </div>

                <div className={styles.priceRow}>
                    <span className={styles.currency}>₹</span>
                    <span className={styles.amount}>99</span>
                    <span className={styles.period}>/month</span>
                </div>

                <ul className={styles.featureList}>
                    {FEATURES.map((f) => (
                        <li key={f} className={styles.featureItem}>
                            <CheckCircle size={16} className={styles.featureIcon} />
                            {f}
                        </li>
                    ))}
                </ul>

                {error && (
                    <div className={styles.errorBox}>
                        <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                        {error}
                    </div>
                )}

                <button className={styles.btnPay} onClick={handlePay} disabled={paying}>
                    {paying ? (
                        <>
                            <span className={styles.spinner} />
                            Opening payment…
                        </>
                    ) : (
                        <>
                            <Zap size={18} />
                            Pay ₹99 via UPI / Card
                        </>
                    )}
                </button>

                <p className={styles.note}>
                    Secured by Razorpay · No autopay · Renew manually each month
                </p>
            </div>
        </main>
    );
}
