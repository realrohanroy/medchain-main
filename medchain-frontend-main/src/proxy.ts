import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// Routes that require authentication
const protectedRoutes = ['/dashboard', '/analytics', '/records', '/upload-record', '/access', '/settings', '/audit', '/activity'];

// Routes that are strictly public (like login/landing)
const publicOnlyRoutes = ['/login'];

/**
 * Decode the medchain_session httpOnly cookie and return the JWT payload.
 * Returns null if the cookie is absent, invalid, or expired.
 */
async function getSessionPayload(request: NextRequest): Promise<{ role?: string; user_id?: string } | null> {
    const token = request.cookies.get('medchain_session')?.value;
    if (!token) return null;

    const secret = process.env.JWT_SECRET;
    if (!secret) {
        // Misconfiguration — treat as unauthenticated rather than crashing.
        console.error('[proxy] JWT_SECRET env var is not set. Cannot verify session cookie.');
        return null;
    }

    try {
        const { payload } = await jwtVerify(token, new TextEncoder().encode(secret), {
            algorithms: ['HS256'],
        });
        return payload as { role?: string; user_id?: string };
    } catch {
        // Token is forged, expired, or tampered with — treat as unauthenticated.
        return null;
    }
}

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
    const isPublicOnlyRoute = publicOnlyRoutes.some(route => pathname.startsWith(route));

    // Only verify session for routes that actually need it.
    if (!isProtectedRoute && !isPublicOnlyRoute) {
        return NextResponse.next();
    }

    const sessionPayload = await getSessionPayload(request);

    // If trying to access a protected route without a valid session, redirect to login.
    if (isProtectedRoute && !sessionPayload) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(loginUrl);
    }

    // If already authenticated and trying to access the login page, redirect to dashboard.
    if (isPublicOnlyRoute && sessionPayload) {
        const role = sessionPayload.role === 'DOCTOR' ? 'doctor' : 'patient';
        return NextResponse.redirect(new URL(`/dashboard/${role}`, request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};
