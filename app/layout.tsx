import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: "%s | 경영한눈",
    default: "경영한눈",
  },
  description:
    "경영한눈은 중소사업자와 스타트업을 위한 종합 경영 관리 솔루션입니다. 급여, 회계, 세무 등 다양한 기능을 통해 사업 운영을 간편하게 지원합니다.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-background text-foreground font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
