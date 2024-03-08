"use client"
import { usePathname, useRouter } from "next/navigation"
import Image from "next/image"

import { SideBar } from "../sidebar"

import styles from "./app-layout.module.css"

type Props = {
  children: React.ReactPortal | React.ReactNode
  username: string
}

const UsernameLayoutContainer = ({ children, username }: Props) => {
  const router = useRouter()
  const pathName = usePathname()
  const navigateHome = () => {
    let pathname = "/"
    if (username) pathname = `/${username}`
    router.push(pathname)
    setTimeout(() => {
      window.location.reload()
    }, 200)
  }

  return (
    <div className={styles.mainContainer}>
      <nav className={styles.navBar}>
        <div className={styles.navHomeContent}>
          <button className={styles.navHome} onClick={navigateHome}>
            <Image src="/icons/blink-logo-icon.svg" alt="logo" width="50" height="50" />
          </button>
          {pathName === `/${username}` && (
            <h6 className={styles.username}>Pay {username}</h6>
          )}
          <SideBar username={username}></SideBar>
        </div>
      </nav>
      {children}
    </div>
  )
}

export default UsernameLayoutContainer
