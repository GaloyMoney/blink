"use client"
import { useRouter } from "next/navigation"
import Image from "next/image"

import { SideBar } from "../sidebar"

import styles from "./app-layout.module.css"

type Props = {
  children: React.ReactPortal | React.ReactNode
  username: string
}

const UsernameLayoutContainer = ({ children, username }: Props) => {
  const router = useRouter()

  const navigateHome = () => {
    let pathname = "/"
    if (username) pathname = `/${username}`
    router.push(pathname)
    setTimeout(() => {
      window.location.reload()
    }, 200)
  }

  return (
    <>
      <nav className={styles.nav_bar}>
        <button className={styles.nav_home} onClick={navigateHome}>
          <Image src="/icons/blink-logo-icon.svg" alt="logo" width="50" height="50" />
        </button>
        <SideBar username={username}></SideBar>
      </nav>
      <div className={styles.divider}></div>
      {children}
    </>
  )
}

export default UsernameLayoutContainer
