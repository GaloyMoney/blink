"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"

import styles from "./app-layout.module.css"

type Props = {
  children: React.ReactPortal | React.ReactNode
}

const CheckoutLayoutContainer = ({ children }: Props) => {
  const router = useRouter()
  const navigateHome = () => {
    router.push("/")
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
          <h6 className={styles.username}>Pay Invoice</h6>
        </div>
      </nav>
      {children}
    </div>
  )
}

export default CheckoutLayoutContainer
