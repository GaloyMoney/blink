"use client"

import copy from "copy-to-clipboard"
import Image from "react-bootstrap/Image"
import { QRCode } from "react-qrcode-logo"
import Tooltip from "react-bootstrap/Tooltip"
import { useScreenshot } from "use-react-screenshot"
import React, { useState, useEffect, useRef } from "react"
import OverlayTrigger from "react-bootstrap/OverlayTrigger"

import Receipt from "./receipt"
import styles from "./index.module.css"
import ExpirationLabel from "./expiration-label"
import { type InvoiceProps } from "./index.types"

import { useInvoiceStatusContext } from "@/context/invoice-status-context"
import { Share } from "@/components/share"

export default function Invoice({ title }: InvoiceProps) {
  const { invoice, status } = useInvoiceStatusContext()
  const [copied, setCopied] = useState(false)
  const [shareState, setShareState] = useState<"not-set">()
  const [errorMessage, setErrorMessage] = useState<string | undefined>()
  const [image, takeScreenShot] = useScreenshot()
  const qrImageRef = useRef(null)

  if (!invoice || !invoice.satoshis) {
    setErrorMessage("Invalid invoice.")
  }

  useEffect(() => {
    if (status === "EXPIRED") {
      setErrorMessage("Invoice has expired.")
    }
  }, [status])

  if (errorMessage || !invoice || !invoice.satoshis) {
    return (
      <div className={styles.error}>
        <Image src="/icons/cancel-icon.svg" alt="success icon" width="104" height="104" />
        <p>{errorMessage || "Invalid Invoice"}</p>
      </div>
    )
  }

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

  const handleShareClick = () => setShareState("not-set")
  const getImage = () => takeScreenShot(qrImageRef.current)
  const shareData = {
    title,
    text: `Use the link embedded below to pay the invoice. Powered by: https://galoy.io`,
    url: typeof window !== "undefined" ? window.location.href : "",
  }

  return (
    <div>
      <div className={styles.invoiceContainer}>
        <div className={styles.amountContainer}>
          <p>{invoice.satoshis} sats</p>
        </div>
        <div className={styles.timerContainer}>
          <p>{invoice.memo}</p>
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
                <ExpirationLabel expirationDate={invoice.timeExpireDate || 0} />
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
