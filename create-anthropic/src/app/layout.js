import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "원고 제작 도구",
  description: "담가 원고 생성 및 중복 점검 도구",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="min-h-screen bg-gray-50">
          <header className="border-b border-gray-200 bg-white">
            <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4">
              <Link href="/damga" className="text-lg font-bold text-gray-900">
                원고제작
              </Link>
              <nav className="flex items-center gap-4 text-sm font-medium text-gray-700">
                <Link href="/damga" className="rounded px-2 py-1 hover:bg-gray-100">
                  담가
                </Link>
                <Link href="/duplicate-check" className="rounded px-2 py-1 hover:bg-gray-100">
                  중복 점검
                </Link>
                <Link href="/basic" className="rounded px-2 py-1 hover:bg-gray-100">
                  수기 원고
                </Link>
              </nav>
            </div>
          </header>
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
