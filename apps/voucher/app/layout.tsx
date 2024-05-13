// eslint-disable-next-line import/no-unassigned-import
import "./globals.css"
import { Inter_Tight } from "next/font/google"

import Navigation from "@/components/nav-bar/navigation"
import ApolloWrapper from "@/config/apollo"
import SessionProvider from "@/components/session-provider"
import { env } from "@/env"
import { CurrencyProvider } from "@/context/currency-context"

const { NEXT_PUBLIC_CORE_URL, NEXT_PUBLIC_VOUCHER_URL } = env

const inter = Inter_Tight({ subsets: ["latin"], display: "auto" })

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const coreGqlUrl = NEXT_PUBLIC_CORE_URL
  const voucherUrl = NEXT_PUBLIC_VOUCHER_URL

  return (
    <SessionProvider>
      <ApolloWrapper
        config={{
          coreGqlUrl,
          voucherUrl,
        }}
      >
        <CurrencyProvider>
          <html lang="en">
            <body className={inter.className}>
              <Navigation />
              {children}
            </body>
          </html>
        </CurrencyProvider>
      </ApolloWrapper>
    </SessionProvider>
  )
}
