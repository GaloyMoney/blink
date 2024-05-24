// eslint-disable-next-line import/no-unassigned-import
import "./globals.css"
import { Inter_Tight } from "next/font/google"

import Navigation from "@/components/nav-bar/navigation"
import SessionProvider from "@/components/session-provider"
import { CurrencyProvider } from "@/context/currency-context"
import ApolloServerWrapper from "@/config/apollo-rsc-wrapper"

const inter = Inter_Tight({ subsets: ["latin"], display: "auto" })

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ApolloServerWrapper>
          <CurrencyProvider>
            <SessionProvider>
              <Navigation />
              {children}
            </SessionProvider>
          </CurrencyProvider>
        </ApolloServerWrapper>
      </body>
    </html>
  )
}
