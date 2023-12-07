// eslint-disable-next-line import/no-unassigned-import
import "./globals.css"
// eslint-disable-next-line import/no-unassigned-import
import "@galoy/galoy-components/tailwind.css"
// eslint-disable-next-line import/no-unassigned-import
import "react-toastify/dist/ReactToastify.css"
import Script from "next/script"
import type { Metadata } from "next"
import { Inter_Tight } from "next/font/google"
import { ToastContainer } from "react-toastify"

import Theme from "../components/next-themes-provider"

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
        <ToastContainer
          position="top-center"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
        <Theme>{children}</Theme>
      </body>
    </html>
  )
}
