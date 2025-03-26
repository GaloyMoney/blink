// eslint-disable-next-line import/no-unassigned-import
import "./globals.css"
// eslint-disable-next-line import/no-unassigned-import
import "react-toastify/dist/ReactToastify.css"
import Script from "next/script"
import type { Metadata } from "next"
import { Inter_Tight } from "next/font/google"

import Theme from "@/components/next-themes-provider"
import ToastProvider from "@/components/toast-provider"

const inter = Inter_Tight({ subsets: ["latin"] })
export const metadata: Metadata = {
  title: "Blink Consent",
  description: "OAuth2 Client For Blink.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <Script src="/gt.js" />
      <body className={inter.className}>
        <ToastProvider />
        <Theme>{children}</Theme>
      </body>
    </html>
  )
}
