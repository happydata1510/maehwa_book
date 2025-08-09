import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono, Jua, Noto_Sans_KR } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const notoSansKr = Noto_Sans_KR({ variable: "--font-noto-sans-kr", subsets: ["latin"], weight: ["400", "700"] });
const jua = Jua({ variable: "--font-jua", subsets: ["latin"], weight: "400" });

export const metadata: Metadata = {
  title: "매화유치원 책대장",
  description: "읽은 책을 빠르게 기록하고 뱃지를 모아요",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} ${notoSansKr.variable} ${jua.variable} antialiased min-h-screen bg-gradient-to-b from-pink-50 to-white text-gray-900`}
      >
        <nav className="border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
          <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl leading-none">🌸</span>
              <span className="font-bold text-lg" style={{ fontFamily: "var(--font-jua)" }}>책대장</span>
            </Link>
            <div className="flex gap-4 text-sm">
              <Link href="/list" className="text-gray-600 hover:text-gray-900">목록</Link>
            <Link href="/stats" className="text-gray-600 hover:text-gray-900">통계</Link>
              <Link href="/recommend" className="text-gray-600 hover:text-gray-900">추천</Link>
            <Link href="/teachers" className="text-gray-600 hover:text-gray-900">교사용</Link>
            </div>
          </div>
        </nav>
        <main className="pb-12" style={{ fontFamily: "var(--font-noto-sans-kr)" }}>{children}</main>
      </body>
    </html>
  );
}
