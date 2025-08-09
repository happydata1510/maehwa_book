import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/teachers")) {
    const auth = req.cookies.get("teacher_auth")?.value;
    if (auth !== "1") {
      const url = req.nextUrl.clone();
      url.pathname = "/teachers-login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/teachers/:path*"],
};

