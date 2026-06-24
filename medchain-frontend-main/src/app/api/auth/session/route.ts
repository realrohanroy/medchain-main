import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * POST /api/auth/session
 *
 * Called client-side immediately after a successful Django login.
 * Verifies the Django-issued access JWT, then sets a real httpOnly cookie
 * (`medchain_session`) containing the same token so the edge middleware can
 * cryptographically verify every subsequent request without touching localStorage.
 *
 * Body: { access: string, refresh: string, role: string }
 */
export async function POST(request: NextRequest) {
    if (!JWT_SECRET) {
        console.error(
            '[api/auth/session] JWT_SECRET env var is not set. ' +
            'Add JWT_SECRET to .env.local (must match Django SECRET_KEY).'
        );
        return NextResponse.json(
            { error: 'Server misconfiguration: JWT_SECRET is not set.' },
            { status: 500 }
        );
    }

    let body: { access?: string; refresh?: string; role?: string };
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
    }

    const { access } = body;
    if (!access) {
        return NextResponse.json({ error: 'Missing access token.' }, { status: 400 });
    }

    // Verify the Django-issued JWT using the shared HS256 secret.
    // This confirms the token is genuine, unexpired, and not tampered with.
    try {
        const secret = new TextEncoder().encode(JWT_SECRET);
        await jwtVerify(access, secret, {
            algorithms: ['HS256'],
        });
    } catch (err) {
        console.warn('[api/auth/session] JWT verification failed:', err);
        return NextResponse.json(
            { error: 'Invalid or expired access token.' },
            { status: 401 }
        );
    }

    // Cookie lifetime matches Django's ACCESS_TOKEN_LIFETIME (60 minutes).
    const maxAgeSeconds = 60 * 60;
    const isProduction = process.env.NODE_ENV === 'production';

    const response = NextResponse.json({ ok: true });
    response.cookies.set('medchain_session', access, {
        httpOnly: true,
        path: '/',
        sameSite: 'lax',
        maxAge: maxAgeSeconds,
        // Secure flag only in production — localhost doesn't use HTTPS.
        secure: isProduction,
    });

    return response;
}
