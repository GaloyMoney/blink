"use client"

import Image from "react-bootstrap/Image"

import styles from "./index.module.css"

function PrintButton() {
  return (
    <button className={styles.secondaryBtn} onClick={() => window.print()}>
      <Image src="/icons/print-icon.svg" alt="print icon" width="18" height="18" />
      Print Receipt
    </button>
  )
}

export default PrintButton
