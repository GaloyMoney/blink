import React from "react"

import styles from "./loading-component.module.css"
export default function LoadingComponent() {
  return (
    <div className={styles.full_page}>
      <span className={styles.loader}></span>
    </div>
  )
}
