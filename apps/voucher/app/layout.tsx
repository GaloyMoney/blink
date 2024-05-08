// eslint-disable-next-line import/no-unassigned-import
import "./globals.css"
import { Inter_Tight } from "next/font/google"

import Navigation from "@/components/nav-bar/navigation"
import ApolloWrapper from "@/config/apollo"
import SessionProvider from "@/components/session-provider"
import { env } from "@/env"

const { NEXT_PUBLIC_CORE_URL, NEXT_PUBLIC_VOUCHER_URL } = env

const inter = Inter_Tight({ subsets: ["latin"], display: "auto" })

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ApolloWrapper
        config={{
          coreGqlUrl: NEXT_PUBLIC_CORE_URL,
          voucherUrl: NEXT_PUBLIC_VOUCHER_URL,
        }}
      >
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
