import copy from "copy-to-clipboard"
import { useState } from "react"
import { Card } from "react-bootstrap"
import OverlayTrigger from "react-bootstrap/OverlayTrigger"
import Tooltip from "react-bootstrap/Tooltip"
import Lottie from "react-lottie"
import { QRCode } from "react-qrcode-logo"

import { useLnInvoicePaymentStatusSubscription } from "../lib/graphql/generated"

import animationData from "./success-animation.json"

export default function Invoice({
  paymentRequest,
  onPaymentSuccess,
}: {
  paymentRequest: string
  onPaymentSuccess?: () => void
}) {
  const [showCopied, setShowCopied] = useState(false)

  const { loading, data, error } = useLnInvoicePaymentStatusSubscription({
    variables: {
      input: { paymentRequest },
    },
    onSubscriptionData: ({ subscriptionData }) => {
      if (subscriptionData?.data?.lnInvoicePaymentStatus?.status === "PAID") {
        onPaymentSuccess && onPaymentSuccess()
      }
    },
  })

  const copyInvoice = () => {
    copy(paymentRequest)
    setShowCopied(true)
    setTimeout(() => {
      setShowCopied(false)
    }, 3000)
  }

  if (error) {
    console.error(error)
    return <div className="error">{error.message}</div>
  }

  if (loading) {
    return (
      <Card.Body className="qr-code-container">
        <small>Scan using a Lightning-supported wallet</small>

        <OverlayTrigger
          show={showCopied}
          placement="top"
          overlay={<Tooltip id="copy">Copied!</Tooltip>}
        >
          <div onClick={copyInvoice}>
            <QRCode
              value={`${paymentRequest}`}
              size={320}
              logoImage="/blink-qr-logo.png"
              logoWidth={100}
            />
          </div>
        </OverlayTrigger>
        <p>
          Click on the QR code to copy <br /> or{" "}
          <a href={`lightning:${paymentRequest}`}>Open with wallet</a>
        </p>
        <p>Waiting for payment confirmation...</p>
      </Card.Body>
    )
  }

  if (data) {
    const { errors, status } = data.lnInvoicePaymentStatus
    if (errors.length > 0) {
      console.error(errors)
      return <div className="error">{errors[0].message}</div>
    }
    if (status === "PAID") {
      return (
        <div>
          <Lottie
            options={{ animationData: animationData, loop: false }}
            height="150"
            width="150"
          ></Lottie>
        </div>
      )
    }
  }

  return <div className="error">Something went wrong</div>
}
