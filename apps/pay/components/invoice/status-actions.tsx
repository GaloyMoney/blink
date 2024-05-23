"use client"

import Image from "react-bootstrap/Image"

import styles from "./index.module.css"
import PrintButton from "./print-button"
import ReturnInvoiceButton from "./return-button"
import { type StatusActionsProps } from "./index.types"

import { useInvoiceStatusContext } from "@/context/invoice-status-context"

function StatusActions({ returnUrl }: StatusActionsProps) {
  const { invoice, status } = useInvoiceStatusContext()

  const showPaidActions = invoice && status === "PAID"
  const showPendingActions = invoice && status === "PENDING"
  if (showPaidActions) {
    return (
      <div className={styles.statusActionsContainer}>
        <PrintButton />
        <ReturnInvoiceButton returnUrl={returnUrl} type="primary">
          Return to merchant
        </ReturnInvoiceButton>
      </div>
    )
  }

  if (showPendingActions) {
    return (
      <div className={styles.statusActionsContainer}>
        <ReturnInvoiceButton returnUrl={returnUrl} type="secondary">
          <Image src="/icons/close.svg" alt="Back" width="20" height="20"></Image>
          Cancel
        </ReturnInvoiceButton>
      </div>
    )
  }

  return (
    <div className={styles.statusActionsContainer}>
      <ReturnInvoiceButton returnUrl={returnUrl} type="secondary">
        <Image src="/icons/caret-left.svg" alt="Back" width="20" height="20"></Image>
        Back
      </ReturnInvoiceButton>
    </div>
  )
}

export default StatusActions
