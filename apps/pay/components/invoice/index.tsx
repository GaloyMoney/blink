"use client"

import React, { useState, useEffect, useRef } from "react"
import copy from "copy-to-clipboard"
import Image from "react-bootstrap/Image"
import { QRCode } from "react-qrcode-logo"
import Tooltip from "react-bootstrap/Tooltip"
import { useScreenshot } from "use-react-screenshot"
import OverlayTrigger from "react-bootstrap/OverlayTrigger"

import styles from "./index.module.css"

import { type InvoiceProps } from "./index.types"

import Receipt from "./receipt"

import { Share } from "@/components/share"
import { decodeInvoice } from "@/components/utils"

export default function Invoice({ title, paymentRequest, status }: InvoiceProps) {
  const [seconds, setSeconds] = useState(0)
  const [copied, setCopied] = useState(false)
  const [shareState, setShareState] = useState<"not-set">()
  const [errorMessage, setErrorMessage] = useState<string | undefined>()
  const [image, takeScreenShot] = useScreenshot()
  const qrImageRef = useRef(null)

  const invoice = decodeInvoice(paymentRequest)
  const memo =
    invoice?.tags?.find((t) => t.tagName === "description")?.data?.toString() || ""

  if (!invoice || !invoice.satoshis) {
    setErrorMessage("Invalid invoice.")
  }

  useEffect(() => {
    if (!invoice || !invoice.timeExpireDate || status === "PAID") {
      return
    }

    if (status === "EXPIRED") {
      setErrorMessage("Invoice has expired.")
      return
    }

    const timerStartTime = new Date(invoice.timeExpireDate * 1000)
    const interval = setInterval(() => {
      const currentTime = new Date()
      const elapsedTime = timerStartTime.getTime() - currentTime.getTime()
      let remainingSeconds = Math.ceil(elapsedTime / 1000)
      if (remainingSeconds <= 0) {
        remainingSeconds = 0
        setErrorMessage("Invoice has expired.")
        clearInterval(interval)
      }
      setSeconds(remainingSeconds)
    }, 1000)

    return () => clearInterval(interval)
  }, [status, invoice])

  const copyInvoice = () => {
    if (!invoice?.paymentRequest) {
      return
    }
    copy(invoice.paymentRequest)
    setCopied(true)
    setTimeout(() => {
      setCopied(false)
    }, 3000)
  }

  const getImage = () => takeScreenShot(qrImageRef.current)
  const shareData = {
    title,
    text: `Use the link embedded below to pay the invoice. Powered by: https://galoy.io`,
    url: typeof window !== "undefined" ? window.location.href : "",
  }

  const handleShareClick = () => {
    setShareState("not-set")
  }

  if (errorMessage || !invoice || !invoice.satoshis) {
    return (
      <div className={styles.error}>
        <Image src="/icons/cancel-icon.svg" alt="success icon" width="104" height="104" />
        <p>{errorMessage || "Invalid Invoice"}</p>
      </div>
    )
  }

  return (
    <div>
      <div className={styles.invoiceContainer}>
        <div className={styles.amountContainer}>
          <p>{invoice.satoshis} sats</p>
        </div>
        <div className={styles.timerContainer}>
          <p>{memo}</p>
        </div>
        <div>
          {status === "PAID" && (
            <div className={styles.successContainer}>
              <div aria-labelledby="Payment successful">
                <Image
                  data-testid="success-icon"
                  src="/icons/success-icon.svg"
                  alt="success icon"
                  width="104"
                  height="104"
                />
                <p className={styles.text}>The invoice has been paid</p>
              </div>
            </div>
          )}

          {status === "PENDING" && (
            <>
              <div
                data-testid="qrcode-container"
                ref={qrImageRef}
                aria-labelledby="QR code of lightning invoice"
                onClick={copyInvoice}
              >
                <QRCode
                  value={invoice.paymentRequest}
                  size={350}
                  logoImage="/blink-qr-logo.png"
                  logoWidth={100}
                />
              </div>

              <div className={styles.qrClipboard}>
                <OverlayTrigger
                  show={copied}
                  placement="right"
                  overlay={<Tooltip id="copy">Copied!</Tooltip>}
                >
                  {() => (
                    // Using the function form of OverlayTrigger avoids a React.findDOMNode warning
                    <button
                      data-testid="copy-btn"
                      title="Copy invoice"
                      onClick={copyInvoice}
                    >
                      <Image
                        src="/icons/copy-icon.svg"
                        alt="copy icon"
                        width="18px"
                        height="18px"
                      />
                      {copied ? "Copied" : "Copy"}
                    </button>
                  )}
                </OverlayTrigger>
                <span className={styles.expirationLabel}>
                  {formatInvoiceExpirationTime(seconds)}
                </span>
                <Share
                  shareData={shareData}
                  getImage={getImage}
                  image={image}
                  shareState={shareState}
                  onInteraction={handleShareClick}
                >
                  <Image
                    src="/icons/share-icon.svg"
                    alt="share-icon"
                    width="18px"
                    height="18px"
                  />
                  Share
                </Share>
              </div>
            </>
          )}
        </div>
      </div>
      {status === "PAID" && <Receipt invoice={invoice} status={status} />}
    </div>
  )
}

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
