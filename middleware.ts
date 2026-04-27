import { NextRequest, NextResponse } from "next/server";

/* Routes that require a logged-in session */
const PROTECTED = ["/dashboard", "/generate", "/profile", "/admin"];

/* Routes that logged-in users should be bounced away from */
const AUTH_ONLY = ["/login", "/signup"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const session = req.cookies.get("session")?.value;

  const isProtected = PROTECTED.some((p) => pathname.startsWith(p));
  const isAuthPage = AUTH_ONLY.some((p) => pathname.startsWith(p));

  if (isProtected && !session) {
    const url = new URL("/login", req.url);
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthPage && session) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  /* Skip API routes, static files, and Next internals */
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
