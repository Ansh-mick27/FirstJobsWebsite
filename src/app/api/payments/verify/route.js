import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

/**
 * POST /api/payments/verify
 * Verifies Razorpay HMAC signature and activates subscription in Firestore.
 * Requires: Authorization: Bearer <Firebase ID token>
 * Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
 * Returns: { success: true }
 */
export async function POST(request) {
    try {
        const authHeader = request.headers.get('authorization');
        const idToken = authHeader?.split('Bearer ')[1];
        if (!idToken) {
            return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
        }

        const decoded = await adminAuth.verifyIdToken(idToken);
        const uid = decoded.uid;

        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await request.json();

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return NextResponse.json({ error: 'missing_fields' }, { status: 400 });
        }

        // Verify HMAC-SHA256 signature
        const body = `${razorpay_order_id}|${razorpay_payment_id}`;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body)
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            return NextResponse.json({ error: 'invalid_signature' }, { status: 400 });
        }

        // Activate subscription for 30 days
        const expiresAt = Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
        await adminDb.collection('users').doc(uid).update({
            'subscription.status': 'active',
            'subscription.expiresAt': expiresAt,
            'subscription.razorpayPaymentId': razorpay_payment_id,
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[POST /api/payments/verify]', error);
        return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
    }
}
