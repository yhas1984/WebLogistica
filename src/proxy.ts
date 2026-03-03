// ============================================================
// Middleware: Subdomain Detection + Supabase Auth
// ============================================================

import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export default async function proxy(request: NextRequest) {
    const response = NextResponse.next();

    // ── Subdomain Detection ──────────────────────────────
    const hostname = request.headers.get('host') || '';
    const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || 'localhost:3000';

    // Extract subdomain: "venezuela.app.com" → "venezuela"
    let subdomain = '';
    if (hostname !== appDomain && hostname.endsWith(appDomain)) {
        subdomain = hostname.replace(`.${appDomain}`, '');
    }

    // Also support query param for local dev: ?subdomain=venezuela
    if (!subdomain) {
        subdomain = request.nextUrl.searchParams.get('subdomain') || '';
    }

    if (subdomain) {
        response.headers.set('x-subdomain', subdomain);
    }

    // ── Supabase Auth Session Refresh ────────────────────
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        response.cookies.set(name, value, options);
                    });
                },
            },
        }
    );

    // Refresh the session (important for SSR)
    await supabase.auth.getUser();

    return response;
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
