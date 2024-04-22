import type { Metadata } from "next"
import { Inter_Tight } from "next/font/google"
import "./globals.css"

const inter = Inter_Tight({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Maps",
  description: "Merchant map for Blink",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
