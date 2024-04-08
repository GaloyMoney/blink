import "./globals.css"
import { Inter_Tight } from "next/font/google"

import Navigation from "@/components/NavBar/Navigation"
import ApolloWrapper from "@/config/apollo"
import SessionProvider from "@/components/session-provider"
import { getServerSession } from "next-auth"
import { authOptions } from "./api/auth/[...nextauth]/auth"
import { redirect } from "next/navigation"

const inter = Inter_Tight({ subsets: ["latin"], display: "auto" })

export  default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session || !session?.userData || !session?.accessToken) {
    redirect("/api/auth/signin")
  }

  return (
    <SessionProvider>
      <ApolloWrapper>
        <html lang="en">
          <body className={inter.className}>
            <Navigation />
            {children}
          </body>
        </html>
      </ApolloWrapper>
    </SessionProvider>
  )
}
