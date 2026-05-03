import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { adminAuth } from '@/lib/firebase-admin';

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * POST /api/payments/create-order
 * Creates a Razorpay order for the ₹99/month subscription.
 * Requires: Authorization: Bearer <Firebase ID token>
 * Returns: { orderId, amount, currency }
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

        const order = await razorpay.orders.create({
            amount: 9900, // ₹99 in paise
            currency: 'INR',
            receipt: uid.slice(0, 40), // Razorpay receipt max 40 chars
        });

        return NextResponse.json({
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
        });
    } catch (error) {
        console.error('[POST /api/payments/create-order]', error);
        return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
    }
}
