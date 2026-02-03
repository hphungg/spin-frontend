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
  title: "SPIN Bot | AI Math Solver",
  description: "Ứng dụng giải toán thông minh sử dụng AI LLaMA với SPIN fine-tuning.",
  keywords: ["SPIN Bot", "giải toán", "AI", "toán học", "math solver", "LLaMA"],
  authors: [{ name: "SPIN Team" }],
  openGraph: {
    title: "SPIN Bot | AI Math Solver",
    description: "Ứng dụng giải toán thông minh sử dụng AI",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
