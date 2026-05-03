'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { signUp, signIn, signOut } from '@/lib/auth-helpers';

const AuthContext = createContext(null);

/**
 * AuthProvider — wraps the entire app and exposes auth state.
 * Provides: user (Firebase Auth), profile (Firestore doc), loading, signUp, signIn, signOut.
 */
export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let unsubFirestore = null;

        const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
            // Clean up any previous Firestore listener before setting up a new one
            if (unsubFirestore) {
                unsubFirestore();
                unsubFirestore = null;
            }

            if (firebaseUser) {
                setUser(firebaseUser);
                // Real-time listener so profile updates immediately after payment
                unsubFirestore = onSnapshot(
                    doc(db, 'users', firebaseUser.uid),
                    (snap) => {
                        setProfile(snap.exists() ? snap.data() : null);
                        setLoading(false);
                    },
                    (err) => {
                        console.error('Profile listener error:', err);
                        setProfile(null);
                        setLoading(false);
                    }
                );
            } else {
                setUser(null);
                setProfile(null);
                setLoading(false);
            }
        });

        return () => {
            unsubAuth();
            if (unsubFirestore) unsubFirestore();
        };
    }, []);

    const isSubscribed =
        profile?.subscription?.status === 'active' &&
        profile?.subscription?.expiresAt?.toDate() > new Date();

    const demoUsed = profile?.demo?.hasUsed ?? false;

    return (
        <AuthContext.Provider value={{ user, profile, loading, isSubscribed, demoUsed, signUp, signIn, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

/**
 * useAuth — hook to access auth context.
 * Must be used inside <AuthProvider>.
 */
export const useAuth = () => useContext(AuthContext);
