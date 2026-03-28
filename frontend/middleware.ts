import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedPrefixes = [
  "/dashboard",
  "/onboarding",
  "/applications",
  "/universities",
  "/activities",
  "/calendar",
  "/tasks",
  "/community",
  "/documents",
  "/essays",
  "/common-app",
  "/settings",
];

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isProtected = protectedPrefixes.some((prefix) => pathname.startsWith(prefix));

  if (!isProtected) return NextResponse.next();

  const session = request.cookies.get("enroll_session")?.value;
  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/onboarding/:path*",
    "/applications/:path*",
    "/universities/:path*",
    "/activities/:path*",
    "/calendar/:path*",
    "/tasks/:path*",
    "/community/:path*",
    "/documents/:path*",
    "/essays/:path*",
    "/common-app/:path*",
    "/settings/:path*",
  ],
};
