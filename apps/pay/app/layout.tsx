import type { Metadata } from "next"
import { Inter_Tight } from "next/font/google"

// eslint-disable-next-line import/no-unassigned-import
import "./globals.css"

// eslint-disable-next-line import/no-unassigned-import
import "bootstrap/dist/css/bootstrap.css"

import Head from "next/head"
import Script from "next/script"

import { getServerSession } from "next-auth"

import { authOptions } from "./api/auth/[...nextauth]/auth"

import { ApolloWrapper } from "@/components/apollo-wrapper"
import { APP_DESCRIPTION } from "@/config/config"

import SessionProvider from "@/components/session-provider"

const inter = Inter_Tight({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Blink Cash Register",
  description: "Blink official lightning network node",
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  const token = session?.accessToken

  return (
    <html lang="en">
      <Head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content={APP_DESCRIPTION} />
        <meta name="theme-color" content="#536FF2" />
        <meta name="apple-mobile-web-app-status-bar" content="#536FF2" />
        <link rel="apple-touch-icon" href="/APPLE-ICON.png" />
        <link rel="icon" type="image/png" href="/APPLE-ICON.png" />
        <title>Blink Cash Register</title>
      </Head>
      <Script src="https://www.googletagmanager.com/gtag/js?id=UA-181044262-1"></Script>
      <Script id="google-analytics">
        {`
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());

      gtag('config', 'UA-181044262-1');
    `}
      </Script>
      <body className={inter.className}>
        <SessionProvider>
          <ApolloWrapper authToken={token}>{children}</ApolloWrapper>
        </SessionProvider>
      </body>
    </html>
  )
}
