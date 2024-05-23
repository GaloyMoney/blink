"use client"

import { useEffect, useState } from "react"

import styles from "./index.module.css"
import { type ExpirationLabelProps } from "./index.types"

function ExpirationLabel({ expirationDate }: ExpirationLabelProps) {
  const [seconds, setSeconds] = useState(0)

  const setRemainingSeconds = () => {
    const currentTime = new Date()
    const expirationTime = new Date(expirationDate * 1000)
    const elapsedTime = expirationTime.getTime() - currentTime.getTime()
    let remainingSeconds = Math.ceil(elapsedTime / 1000)
    if (remainingSeconds <= 0) {
      remainingSeconds = 0
    }
    setSeconds(remainingSeconds)
  }

  useEffect(() => {
    const interval = setInterval(() => setRemainingSeconds(), 1000)

    return () => clearInterval(interval)
  })

  return (
    <span className={styles.expirationLabel}>{formatInvoiceExpirationTime(seconds)}</span>
  )
}
export default ExpirationLabel

const formatInvoiceExpirationTime = (seconds: number): string => {
  if (seconds <= 0) {
    return "Expired"
  }

  if (seconds >= 3600) {
    const hours = Math.floor(seconds / 3600)
    return `Expires in ~${hours} Hour${hours > 1 ? "s" : ""}`
  }

  if (seconds >= 60) {
    const minutes = Math.floor(seconds / 60)
    return `Expires in ~${minutes} Minute${minutes > 1 ? "s" : ""}`
  }

  return `Expires in ${seconds} Second${seconds > 1 ? "s" : ""}`
}
