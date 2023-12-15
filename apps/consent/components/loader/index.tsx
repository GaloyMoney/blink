import React from "react"

import styles from "./loader.module.css"

interface loaderProps {
  size?: string
}

export default function loader({ size = "38px" }: loaderProps) {
  return (
    <span
      style={{
        width: size,
        height: size,
      }}
      className={styles.loader}
    ></span>
  )
}
