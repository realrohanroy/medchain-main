import { NextResponse } from 'next/server';

/**
 * POST /api/auth/logout
 *
 * Clears the httpOnly medchain_session cookie server-side.
 * JavaScript cannot clear an httpOnly cookie via document.cookie,
 * so this route must be called on logout.
 */
export async function POST() {
    const response = NextResponse.json({ ok: true });
    response.cookies.set('medchain_session', '', {
        httpOnly: true,
        path: '/',
        sameSite: 'lax',
        maxAge: 0,
        secure: process.env.NODE_ENV === 'production',
    });
    return response;
}
