// eslint-disable-next-line import/no-unassigned-import
import "./globals.css"
import { Inter_Tight } from "next/font/google"

import Navigation from "@/components/nav-bar/navigation"
import ApolloWrapper from "@/config/apollo"
import SessionProvider from "@/components/session-provider"
import { env } from "@/env"
import { CurrencyProvider } from "@/context/currency-context"

const inter = Inter_Tight({ subsets: ["latin"], display: "auto" })

const getRuntimeEnv = async () => {
  "use server"
  return {
    CORE_URL: env.CORE_URL,
    VOUCHER_URL: env.VOUCHER_URL,
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const envVariables = await getRuntimeEnv()
  const coreGqlUrl = envVariables.CORE_URL
  const voucherUrl = envVariables.VOUCHER_URL

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
