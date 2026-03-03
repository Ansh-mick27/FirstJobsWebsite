'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
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
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                setUser(firebaseUser);
                const profileDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
                setProfile(profileDoc.exists() ? profileDoc.data() : null);
            } else {
                setUser(null);
                setProfile(null);
            }
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    return (
        <AuthContext.Provider value={{ user, profile, loading, signUp, signIn, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

/**
 * useAuth — hook to access auth context.
 * Must be used inside <AuthProvider>.
 */
export const useAuth = () => useContext(AuthContext);
