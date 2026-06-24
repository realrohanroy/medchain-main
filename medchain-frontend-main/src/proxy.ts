import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that require authentication
const protectedRoutes = ['/dashboard', '/analytics', '/records', '/upload-record', '/access', '/settings', '/audit', '/activity'];

// Routes that are strictly public (like login/landing)
const publicOnlyRoutes = ['/login'];

export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // In a real production app with Web3, you'd use IronSession or NextAuth with SIWE
    // This is a placeholder standard architecture for token-based route protection
    const authToken = request.cookies.get('auth_token')?.value;

    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
    const isPublicOnlyRoute = publicOnlyRoutes.some(route => pathname.startsWith(route));

    // If trying to access protected route without token, redirect to login
    if (isProtectedRoute && !authToken) {
        // Note: For a pure Web3 frontend this might be handled via HOC instead,
        // but a SaaS requires server-side checks to prevent flashing.

        // --- TEMPORARILY COMMENTED OUT FOR PROTOTYPE ---
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(loginUrl);
    }

    // If already logged in and trying to access login page, redirect to dashboard
    if (isPublicOnlyRoute && authToken) {
        const role = authToken.includes('doctor') ? 'doctor' : 'patient';
        return NextResponse.redirect(new URL(`/dashboard/${role}`, request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};
