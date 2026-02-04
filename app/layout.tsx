import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
})

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
})

export const metadata: Metadata = {
    title: "SPIN ",
    description:
        "Ứng dụng giải toán thông minh.",
    keywords: [
        "SPIN",
        "giải toán",
        "AI",
        "toán học",
        "math solver",
        "LLaMA",
    ],
    authors: [{ name: "SPIN Team" }],
    openGraph: {
        title: "SPIN",
        description: "Ứng dụng giải toán thông minh.",
        type: "website",
    },
}

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <html lang="vi">
            <body
                className={`${geistSans.variable} ${geistMono.variable} antialiased`}
            >
                {children}
            </body>
        </html>
    )
}
