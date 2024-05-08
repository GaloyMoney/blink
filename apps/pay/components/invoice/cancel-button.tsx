"use client"

import { useRouter } from "next/navigation"

import styles from "./index.module.css"
import { type CancelInvoiceButtonProps } from "./index.types"

function CancelInvoiceButton({ returnUrl, type, children }: CancelInvoiceButtonProps) {
  const router = useRouter()

  const cancelHandler = () => {
    if (returnUrl) {
      router.push(returnUrl)
      return
    }
    window.history.back()
  }

  const className = type === "primary" ? styles.primaryBtn : styles.secondaryBtn

  return (
    <button className={className} onClick={cancelHandler}>
      {children}
    </button>
  )
}
export default CancelInvoiceButton
