import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { env, isSupabaseConfigured } from "@/lib/env";
import { detectLocale, LOCALE_COOKIE } from "@/lib/i18n/config";

const PROTECTED_PREFIXES = ["/dashboard", "/history", "/audit", "/settings"];
const AUTH_ROUTES = ["/login", "/signup"];

/**
 * First visit: no locale cookie yet → detect from Accept-Language and pin it,
 * so SSR renders the right language immediately and the choice persists.
 */
function withLocale(request: NextRequest, response: NextResponse) {
  if (!request.cookies.get(LOCALE_COOKIE)) {
    response.cookies.set(LOCALE_COOKIE, detectLocale(request.headers.get("accept-language")), {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  }
  return response;
}

/**
 * Refreshes the Supabase session on every request and enforces auth for
 * protected routes. Shared by the root proxy.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  if (!isSupabaseConfigured()) return withLocale(request, response);

  const supabase = createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // Important: do not run code between createServerClient and getUser().
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (!user && PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return withLocale(request, NextResponse.redirect(url));
  }

  if (user && AUTH_ROUTES.some((p) => pathname.startsWith(p))) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return withLocale(request, NextResponse.redirect(url));
  }

  return withLocale(request, response);
}
