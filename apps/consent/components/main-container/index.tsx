import React, { ReactNode } from "react"

interface MainContentProps {
  children: ReactNode
}

const MainContent: React.FC<MainContentProps> = ({ children }) => {
  return (
    <main className="min-h-screen flex items-start md:items-center justify-center p-1 md:p-4 bg-[var(--backgroundColor)]">
      {children}
    </main>
  )
}

export default MainContent
