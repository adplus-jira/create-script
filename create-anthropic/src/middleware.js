import { NextResponse } from "next/server";

export function middleware(request) {
  const { pathname } = request.nextUrl;

  if (pathname === "/") {
    return NextResponse.redirect(new URL("/damga", request.url));
  }

  if (pathname === "/new") {
    return NextResponse.redirect(new URL("/damga", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/new"],
};
