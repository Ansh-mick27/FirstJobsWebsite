import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';

const ALLOWED_DOMAIN = process.env.NEXT_PUBLIC_COLLEGE_EMAIL_DOMAIN;

/**
 * Register a new college student.
 * Validates email domain, creates Firebase Auth user, then writes Firestore profile.
 *
 * @param {string} email    - Must end with @{ALLOWED_DOMAIN}
 * @param {string} password
 * @param {string} name     - Full name
 * @param {string} rollNo   - College roll number
 * @returns {Promise<import('firebase/auth').User>}
 */
export async function signUp(email, password, name, rollNo) {
    // 1. Validate college email domain
    if (ALLOWED_DOMAIN && !email.endsWith(`@${ALLOWED_DOMAIN}`)) {
        throw new Error(`Only @${ALLOWED_DOMAIN} email addresses are allowed to register.`);
    }

    // 2. Create Firebase Auth account
    const { user } = await createUserWithEmailAndPassword(auth, email, password);

    // 3. Create Firestore user profile document
    await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email,
        name,
        rollNo,
        createdAt: serverTimestamp(),
        lastActive: serverTimestamp(),
        subscription: { status: 'free', expiresAt: null, razorpayPaymentId: null },
        demo: { hasUsed: false, companySlug: null },
    });

    return user;
}

/**
 * Sign in with email + password.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<import('firebase/auth').User>}
 */
export async function signIn(email, password) {
    const { user } = await signInWithEmailAndPassword(auth, email, password);
    return user;
}

/**
 * Sign the current user out.
 * @returns {Promise<void>}
 */
export async function signOut() {
    await firebaseSignOut(auth);
}
