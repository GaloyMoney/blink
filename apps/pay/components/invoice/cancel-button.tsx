"use client"

import Image from "react-bootstrap/Image"
import { useRouter } from "next/navigation"

import styles from "./index.module.css"
import { type CancelInvoiceButtonProps } from "./index.types"

function CancelInvoiceButton({ returnUrl }: CancelInvoiceButtonProps) {
  const router = useRouter()

  const cancelHandler = () => {
    if (returnUrl) {
      router.push(returnUrl)
      return
    }
    window.history.back()
  }

  return (
    <button data-testid="pay-btn" className={styles.secondaryBtn} onClick={cancelHandler}>
      <Image src="/icons/close.svg" alt="Back" width="20" height="20"></Image>
      Cancel
    </button>
  )
}
export default CancelInvoiceButton
