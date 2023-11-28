import "bootstrap/dist/css/bootstrap.min.css"
import "./index.css"

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
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=UA-181044262-1"
        ></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());

      gtag('config', 'UA-181044262-1');
    `,
          }}
        />
        <title>Blink Cash Register</title>
      </Head>
      <GraphQLProvider>
        <AppLayout username={username}>
          <Component {...pageProps} />
        </AppLayout>
      </GraphQLProvider>
    </>
  )
}
