"use client"

import React from "react"
import copy from "copy-to-clipboard"
import Image from "react-bootstrap/Image"
import { QRCode } from "react-qrcode-logo"
import Tooltip from "react-bootstrap/Tooltip"
import { useScreenshot } from "use-react-screenshot"
import OverlayTrigger from "react-bootstrap/OverlayTrigger"

import styles from "./index.module.css"

import { type InvoiceProps } from "./index.types"

import { Share } from "@/components/share"
import { decodeInvoice } from "@/components/utils"

export default function Invoice({ title, paymentRequest, status }: InvoiceProps) {
  const invoice = decodeInvoice(paymentRequest)
  if (!invoice) return

  const [seconds, setSeconds] = React.useState(0)
  const [minutes, setMinutes] = React.useState(0)

  React.useEffect(() => {
    if (!invoice.timeExpireDate) return
    const timerStartTime = new Date(invoice.timeExpireDate * 1000)

    const interval = setInterval(() => {
      const currentTime = new Date()
      const elapsedTime = timerStartTime.getTime() - currentTime.getTime()
      let remainingSeconds = Math.ceil(elapsedTime / 1000)

      if (remainingSeconds <= 0) {
        remainingSeconds = 0
        clearInterval(interval)
      }

      setMinutes(Math.floor(remainingSeconds / 60))
      setSeconds(remainingSeconds % 60)
    }, 1000)

    return () => clearInterval(interval)
  }, [paymentRequest])

  const [copied, setCopied] = React.useState<boolean>(false)
  const [shareState, setShareState] = React.useState<"not-set">()
  const [image, takeScreenShot] = useScreenshot()
  const qrImageRef = React.useRef(null)
  const getImage = () => takeScreenShot(qrImageRef.current)
  const shareData = {
    title,
    text: `Use the link embedded below to pay the invoice. Powered by: https://galoy.io`,
    url: typeof window !== "undefined" && window.location.href,
  }

  const copyInvoice = () => {
    if (!invoice?.paymentRequest) {
      return
    }
    copy(invoice.paymentRequest)
    setCopied(!copied)
    setTimeout(() => {
      setCopied(false)
    }, 3000)
  }

  return (
    <div className={styles.invoiceContainer}>
      <div className={styles.amountContainer}>
        <p>{invoice.satoshis} sats</p>
      </div>
      <div className={styles.timerContainer}>
        <p>Invoice Expires in {`${minutes} Minutes ${seconds} Seconds`}</p>
      </div>
      <div>
        <div
          data-testid="qrcode-container"
          ref={qrImageRef}
          aria-labelledby="QR code of lightning invoice"
          onClick={copyInvoice}
        >
          <QRCode
            value={paymentRequest}
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
            <button data-testid="copy-btn" title="Copy invoice" onClick={copyInvoice}>
              <Image
                src="/icons/copy-icon.svg"
                alt="copy icon"
                width="18px"
                height="18px"
              />
              {copied ? "Copied" : "Copy"}
            </button>
          </OverlayTrigger>

          <Share
            shareData={shareData}
            getImage={getImage}
            image={image}
            shareState={shareState}
          >
            <span
              data-testid="share-lbl"
              title="Share lightning invoice"
              className={styles.shareBtn}
              onClick={() => setShareState("not-set")}
            >
              <Image
                src="/icons/share-icon.svg"
                alt="share-icon"
                width="18px"
                height="18px"
              />
              Share
            </span>
          </Share>
        </div>
      </div>
    </div>
  )
}
