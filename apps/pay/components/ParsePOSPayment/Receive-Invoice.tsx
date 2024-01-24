/* eslint-disable react-hooks/exhaustive-deps */
// TODO: remove eslint-disable, the logic likely needs to be reworked
import copy from "copy-to-clipboard"
import { useRouter } from "next/router"
import React, { useCallback } from "react"
import Image from "react-bootstrap/Image"
import OverlayTrigger from "react-bootstrap/OverlayTrigger"
import Tooltip from "react-bootstrap/Tooltip"
import { QRCode } from "react-qrcode-logo"
import { useScreenshot } from "use-react-screenshot"

import { USD_INVOICE_EXPIRE_INTERVAL, getClientSidePayDomain } from "../../config/config"
import useCreateInvoice from "../../hooks/use-Create-Invoice"
import { LnInvoiceObject } from "../../lib/graphql/index.types.d"
import useSatPrice from "../../lib/use-sat-price"
import { ACTION_TYPE } from "../../pages/_reducer"
import PaymentOutcome from "../PaymentOutcome"
import { Share } from "../Share"

import { safeAmount } from "../../utils/utils"

import styles from "./parse-payment.module.css"

interface Props {
  recipientWalletCurrency?: string
  walletId: string | undefined
  state: React.ComponentState
  dispatch: React.Dispatch<ACTION_TYPE>
}

const USD_MAX_INVOICE_TIME = 5 // minutes
const PROGRESS_BAR_MAX_WIDTH = 100 // percent

function ReceiveInvoice({ recipientWalletCurrency, walletId, state, dispatch }: Props) {
  const deviceDetails = window.navigator.userAgent
  const router = useRouter()
  const { username, amount, unit, sats, memo } = router.query

  const { usdToSats, satsToUsd } = useSatPrice()

  const [progress, setProgress] = React.useState(PROGRESS_BAR_MAX_WIDTH)
  const [seconds, setSeconds] = React.useState(0)
  const [minutes, setMinutes] = React.useState(USD_MAX_INVOICE_TIME)

  const [expiredInvoiceError, setExpiredInvoiceError] = React.useState<string>("")
  const [copied, setCopied] = React.useState<boolean>(false)
  const [shareState, setShareState] = React.useState<"not-set">()
  const [image, takeScreenShot] = useScreenshot()

  const qrImageRef = React.useRef(null)
  const getImage = () => takeScreenShot(qrImageRef.current)

  const shareUrl =
    !amount && !unit && !memo
      ? `https://${getClientSidePayDomain()}/${username}?amount=${
          state.currentAmount
        }&sats=${usdToSats(
          state.currentAmount,
        ).toFixed()}&currency=${recipientWalletCurrency}&unit=SAT&memo=""`
      : window.location.href

  const shareData = {
    title: `Pay ${username}`,
    text: `Use the link embedded below to pay ${username} some sats. Powered by: https://galoy.io`,
    url: shareUrl,
  }

  React.useEffect(() => {
    const timerStartTime = new Date()

    if (recipientWalletCurrency === "USD") {
      timerStartTime.setSeconds(timerStartTime.getSeconds() + USD_INVOICE_EXPIRE_INTERVAL) // default to five mins for USD invoice
    }

    const interval = setInterval(() => {
      const currentTime = new Date()
      const elapsedTime = timerStartTime.getTime() - currentTime.getTime()
      const remainingSeconds = Math.ceil(elapsedTime / 1000)

      if (remainingSeconds <= 0) {
        clearInterval(interval)
        if (recipientWalletCurrency !== "BTC") {
          setExpiredInvoiceError("Invoice has expired. Generate a new invoice!")
        }
      } else {
        setMinutes(Math.floor(remainingSeconds / 60))
        setSeconds(remainingSeconds % 60)
        setProgress(
          PROGRESS_BAR_MAX_WIDTH -
            (elapsedTime / (USD_INVOICE_EXPIRE_INTERVAL * 1000)) * 100,
        )
      }
    }, 1000)

    return () => clearInterval(interval)
    // we don't want to re-run it when any particular prop or state value changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const progressBarStyle = {
    width: `${progress}%`,
    backgroundColor: minutes < 1 ? "rgb(255, 0, 0)" : "rgba(83, 111, 242, 1)",
  }

  const { createInvoice, data, errorsMessage, loading, invoiceStatus } = useCreateInvoice(
    {
      recipientWalletCurrency,
    },
  )

  const paymentAmount = React.useMemo(() => {
    if (!router.query.sats || typeof router.query.sats !== "string") {
      alert("No sats amount provided")
      return
    }
    let amt = safeAmount(router.query.sats)
    if (recipientWalletCurrency === "USD") {
      const usdAmount = satsToUsd(Number(amt))
      if (isNaN(usdAmount)) return
      const cents = parseFloat(usdAmount.toFixed(2)) * 100
      amt = Number(cents.toFixed())
    }
    if (amt === null) return
    return safeAmount(amt).toString()
  }, [
    amount,
    unit,
    sats,
    usdToSats,
    satsToUsd,
    state.currentAmount,
    recipientWalletCurrency,
  ])

  React.useEffect(() => {
    if (!walletId || !Number(paymentAmount)) return

    let amt = paymentAmount
    if (recipientWalletCurrency === "USD") {
      if (!router.query.sats || typeof router.query.sats !== "string") {
        alert("No sats amount provided")
        return
      } else {
        const usdAmount = satsToUsd(Number(router.query.sats))
        if (isNaN(usdAmount)) return
        const cents = parseFloat(usdAmount.toFixed(2)) * 100
        amt = cents.toFixed()
        if (cents < 0.01) {
          setExpiredInvoiceError(
            `Amount is too small. Must be larger than ${usdToSats(0.01).toFixed()} sats`,
          )
          return
        }
      }
    }
    if (amt === null) return

    createInvoice({
      variables: {
        input: {
          recipientWalletId: walletId,
          amount: Number(amt),
          ...(memo ? { memo: memo.toString() } : {}),
        },
      },
    })
  }, [
    amount,
    walletId,
    paymentAmount,
    createInvoice,
    memo,
    recipientWalletCurrency === "USD" ? satsToUsd : null,
  ])

  const isMobileDevice = useCallback(() => {
    const mobileDevice = /android|iPhone|iPod|kindle|HMSCore|windows phone|ipad/i
    if (window.navigator.maxTouchPoints > 1 || mobileDevice.test(deviceDetails)) {
      return true
    }
    return false
  }, [deviceDetails])

  const isDesktopType = useCallback(() => {
    const desktopType = /Macintosh|linux|Windows|Ubuntu/i
    const type = deviceDetails.match(desktopType)
    return type?.[0]
  }, [deviceDetails])

  React.useEffect(() => {
    isMobileDevice()
    isDesktopType()
  }, [isDesktopType, isMobileDevice])

  const errorString: string | null = errorsMessage || null
  let invoice: LnInvoiceObject | undefined

  if (data) {
    if ("lnInvoiceCreateOnBehalfOfRecipient" in data) {
      const { lnInvoiceCreateOnBehalfOfRecipient: invoiceData } = data
      if (invoiceData.invoice) {
        invoice = invoiceData.invoice
      }
    }
    if ("lnUsdInvoiceCreateOnBehalfOfRecipient" in data) {
      const { lnUsdInvoiceCreateOnBehalfOfRecipient: invoiceData } = data
      if (invoiceData.invoice) {
        invoice = invoiceData.invoice
      }
    }
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

  if ((errorString && !loading) || expiredInvoiceError) {
    const invalidInvoiceError =
      recipientWalletCurrency === "USD" && Number(amount?.toString()) <= 0
        ? `Enter an amount greater than 1 cent (${usdToSats(0.01).toFixed()} sats)`
        : expiredInvoiceError ?? null
    return (
      <div className={styles.error}>
        <p>{errorString}</p>
        <p>{invalidInvoiceError}</p>
      </div>
    )
  }

  if (loading || invoiceStatus === "loading" || !invoice?.paymentRequest) {
    return (
      <div className={styles.loading}>
        <div className={styles.loader}></div>
      </div>
    )
  }

  return (
    <div className={styles.invoice_container}>
      {recipientWalletCurrency === "USD" && (
        <div className={styles.timer_container}>
          <p>{`${minutes}:${seconds}`}</p>
          <div className={styles.timer}>
            <span style={progressBarStyle}></span>
          </div>
          <p>{`${USD_MAX_INVOICE_TIME}:00`}</p>
        </div>
      )}
      <div>
        {data ? (
          <>
            <div
              data-testid="qrcode-container"
              ref={qrImageRef}
              aria-labelledby="QR code of lightning payment"
              onClick={copyInvoice}
            >
              <QRCode
                value={invoice?.paymentRequest}
                size={320}
                logoImage="/blink-qr-logo.png"
                logoWidth={100}
              />
            </div>

            <div className={styles.qr_clipboard}>
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
                  className={styles.share_btn}
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
          </>
        ) : null}
      </div>
      <PaymentOutcome
        paymentRequest={invoice?.paymentRequest}
        paymentAmount={paymentAmount}
        dispatch={dispatch}
      />
    </div>
  )
}

export default ReceiveInvoice
