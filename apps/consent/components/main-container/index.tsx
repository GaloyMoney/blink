import React, { ReactNode } from "react"

import styles from "./main-content.module.css"

interface MainContentProps {
  children: ReactNode
}

const MainContent: React.FC<MainContentProps> = ({ children }) => {
  return <main className={styles.mainContent}>{children}</main>
}

export default MainContent
