import { redirect } from "next/navigation"
import type { Metadata } from "next"
import { getServerSession } from "next-auth"

// eslint-disable-next-line import/no-unassigned-import
import "./globals.css"

import { authOptions } from "./api/auth/[...nextauth]/route"

import Header from "@/components/header"
import SessionProvider from "@/components/session-provider"
import Sidebar from "@/components/side-bar"

import ThemeRegistry from "@/theme/theme-registry"

export const metadata: Metadata = {
  title: "Galoy Dashboard",
  description: "Interact with your Galoy App",
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session || !session?.userData || !session?.accessToken) {
    redirect("/api/auth/signin")
  }
  return (
    <html lang="en">
      <body>
        <ThemeRegistry>
          <SessionProvider session={session}>
            {session?.sub ? (
              <div style={{ display: "flex", minHeight: "100vh" }}>
                <Sidebar />
                <div style={{ flexGrow: 1, overflow: "auto" }}>
                  <Header />
                  {children}
                </div>
              </div>
            ) : (
              <>{children}</>
            )}
          </SessionProvider>
        </ThemeRegistry>
      </body>
    </html>
  )
}
