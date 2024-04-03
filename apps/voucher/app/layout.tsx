"use client"
import "./globals.css"
import { Inter_Tight } from "next/font/google"
import Navigation from "@/components/NavBar/Navigation"
import ApolloWrapper from "@/config/apollo"
const inter = Inter_Tight({ subsets: ["latin"], display: "auto" })

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ApolloWrapper>
      <html lang="en">
        <body className={inter.className}>
          <Navigation />
          {children}
        </body>
      </html>
    </ApolloWrapper>
  )
}
