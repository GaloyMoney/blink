import React from "react"

import styles from "./loading-component.module.css"

const LoadingComponent = () => {
  return (
    <div className={styles.loading}>
      <div className={styles.loader}></div>
    </div>
  )
}

export default LoadingComponent
