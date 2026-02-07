import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedPrefixes = [
  "/dashboard",
  "/onboarding",
  "/applications",
  "/tasks",
  "/documents",
  "/common-app",
  "/settings",
];

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isProtected = protectedPrefixes.some((prefix) => pathname.startsWith(prefix));

  if (!isProtected) return NextResponse.next();

  const token = request.cookies.get("enroll_token")?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/onboarding/:path*", "/applications/:path*", "/tasks/:path*", "/documents/:path*", "/common-app/:path*", "/settings/:path*"],
};
