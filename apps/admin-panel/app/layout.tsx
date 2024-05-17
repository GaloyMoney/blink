// eslint-disable-next-line import/no-unassigned-import
import "./globals.css"

import { Metadata } from "next"

import SideBar from "../components/side-bar"

export const metadata: Metadata = {
  title: "Admin Panel",
  description: "Welcome to Galoy Admin Panel",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const year = new Date().getFullYear()
  return (
    <html lang="en">
      {/* <Script src="/gt.js" /> */}

      <body>
        <div className="flex h-screen bg-gray-50">
          <SideBar />
          <div className="flex flex-col flex-1 w-full">
            <main className="h-full overflow-y-auto">
              <div className="container grid mx-auto">{children}</div>
            </main>
          </div>
        </div>
        <footer className="w-full p-4 fixed bottom-0">
          <p className="text-center text-gray-500 text-xs">&copy;{year} Galoy Inc.</p>
        </footer>
      </body>
    </html>
  )
}
