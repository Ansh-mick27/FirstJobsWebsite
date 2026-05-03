import { NextResponse } from 'next/server';

export function proxy(request) {
    const { pathname } = request.nextUrl;

    // Admin routes skip all protection headers
    if (pathname.startsWith('/admin')) {
        return NextResponse.next();
    }

    const response = NextResponse.next();

    // Prevent embedding in iframes
    response.headers.set('X-Frame-Options', 'DENY');

    // Prevent MIME-type sniffing
    response.headers.set('X-Content-Type-Options', 'nosniff');

    // Minimal referrer leakage
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Lock down permission APIs (microphone allowed for interview)
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(self), geolocation=()');

    // Content Security Policy
    // Notes:
    //   - 'unsafe-inline' + 'unsafe-eval' required by Next.js 16 and Monaco Editor
    //   - blob: in worker-src required for Monaco web workers
    //   - blob: in media-src required for audio recording in interviews
    //   - wss: in connect-src required for the interview WebSocket server
    //   - Firebase endpoints in connect-src required for auth and Firestore
    response.headers.set(
        'Content-Security-Policy',
        [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://fonts.gstatic.com",
            "font-src 'self' https://fonts.gstatic.com",
            "img-src 'self' data: blob: https://firebasestorage.googleapis.com https://lh3.googleusercontent.com",
            "connect-src 'self' wss: https://*.googleapis.com https://*.google.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://firestore.googleapis.com",
            "frame-ancestors 'none'",
            "media-src 'self' blob:",
            "worker-src 'self' blob:",
        ].join('; ')
    );

    return response;
}

export const config = {
    matcher: [
        // Match all routes except Next.js internals and static assets
        '/((?!_next/static|_next/image|favicon.ico|icon.svg).*)',
    ],
};
