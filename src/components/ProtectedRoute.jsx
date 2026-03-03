'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

/**
 * ProtectedRoute — redirects unauthenticated users to /login.
 * Use this to wrap any page that requires sign-in.
 *
 * @example
 * export default function DashboardPage() {
 *   return <ProtectedRoute><Dashboard /></ProtectedRoute>;
 * }
 */
export default function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100vh',
                background: '#080B14',
                color: '#F1F5F9',
                fontSize: '1rem',
                fontFamily: 'DM Sans, sans-serif',
            }}>
                Loading…
            </div>
        );
    }

    if (!user) return null;

    return children;
}
