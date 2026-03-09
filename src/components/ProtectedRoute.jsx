'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

/**
 * ProtectedRoute — redirects unauthenticated users to /login?next=<current-path>.
 * After login the user is sent back to the page they were trying to access.
 *
 * @example
 * export default function DashboardPage() {
 *   return <ProtectedRoute><Dashboard /></ProtectedRoute>;
 * }
 */
export default function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!loading && !user) {
            router.push(`/login?next=${encodeURIComponent(pathname)}`);
        }
    }, [user, loading, router, pathname]);

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
