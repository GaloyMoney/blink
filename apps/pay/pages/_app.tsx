// Disable no-unassigned-import rule becuase we are importing css files
// eslint-disable-next-line
import "bootstrap/dist/css/bootstrap.min.css"
// eslint-disable-next-line
import "./index.css"
import Script from "next/script"
import { NextPage } from "next"
import dynamic from "next/dynamic"
import Head from "next/head"
import { useRouter } from "next/router"

import AppLayout from "../components/Layouts/AppLayout"
import { APP_DESCRIPTION } from "../config/config"

const GraphQLProvider = dynamic(() => import("../lib/graphql"), { ssr: false })

export default function Layout({
  Component,
  pageProps,
}: {
  Component: NextPage
  pageProps: Record<string, unknown>
}) {
  const { username } = useRouter().query
  return (
    <>
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
      <GraphQLProvider>
        <AppLayout username={username}>
          <Component {...pageProps} />
        </AppLayout>
      </GraphQLProvider>
    </>
  )
}
