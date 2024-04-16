"use client"
import React, { useState } from "react"
import { QRCode } from "react-qrcode-logo"

import styles from "./LnurlPage.module.css"

import { encodeURLToLNURL, formatSecretCode } from "@/utils/helpers"
import PageLoadingComponents from "@/components/Loading/PageLoadingComponent"
import { useGetWithdrawLinkQuery, Status } from "@/lib/graphql/generated"
import { env } from "@/env"
import Button from "@/components/Button/Button"
import InfoComponent from "@/components/InfoComponent/InfoComponent"
import FundsPaid from "@/components/FundsPaid"
import Heading from "@/components/Heading"
import Bold from "@/components/Bold"
import LinkDetails from "@/components/LinkDetails/LinkDetails"
import useRealtimePrice from "@/hooks/useRealTimePrice"
import { DEFAULT_CURRENCY } from "@/config/appConfig"
import { gql } from "@apollo/client"
const { NEXT_PUBLIC_LOCAL_URL } = env

gql`
  query GetWithdrawLink($voucherSecret: String) {
    getWithdrawLink(voucherSecret: $voucherSecret) {
      commissionPercentage
      createdAt
      id
      identifierCode
      paidAt
      salesAmountInCents
      status
      uniqueHash
      userId
      voucherAmountInCents
      voucherSecret
    }
  }
`
type Props = {
  params: {
    voucherSecret: string
  }
}

export default function Page({ params: { voucherSecret } }: Props) {
  const [revealLNURL, setRevealLNURL] = useState<boolean>(false)
  const storedCurrency =
    typeof window !== "undefined" ? localStorage.getItem("currency") : null
  const [currency, setCurrency] = useState(
    storedCurrency ? JSON.parse(storedCurrency) : DEFAULT_CURRENCY,
  )

  const { centsToCurrency, hasLoaded } = useRealtimePrice(currency.id)
  const { loading, error, data } = useGetWithdrawLinkQuery({
    variables: { voucherSecret },
    context: {
      endpoint: "SELF",
    },
  })
  const WithdrawLink = data?.getWithdrawLink

  if (loading || !hasLoaded.current) {
    return <PageLoadingComponents />
  }
  if (error) {
    return <div>Error: {error.message}</div>
  }
  if (!WithdrawLink) {
    return <div>No data</div>
  }

  const lnurl = encodeURLToLNURL(
    `${NEXT_PUBLIC_LOCAL_URL}/api/lnurlw/${WithdrawLink?.uniqueHash}`,
  )

  const url = `${NEXT_PUBLIC_LOCAL_URL}/withdraw/${WithdrawLink.voucherSecret}?lightning=${lnurl}`
  const copyToClipboard = () => {
    navigator.clipboard.writeText(lnurl)
  }

  const sharePage = () => {
    if (navigator.share) {
      navigator.share({
        title: document.title,
        url: window.location.href,
      })
    }
  }

  const handlePrint = () => {
    setRevealLNURL(true)
    setTimeout(() => {
      window.print()
    }, 100)
  }

  if (!WithdrawLink) {
    return null
  }

  return (
    <div className="top_page_container">
      {WithdrawLink?.status === Status.Paid ? (
        <FundsPaid></FundsPaid>
      ) : (
        <>
          <Heading>
            {" "}
            Voucher <Bold>{WithdrawLink?.identifierCode}</Bold> created Successfully{" "}
          </Heading>
          <Bold
            style={{
              textAlign: "center",
              width: "90%",
            }}
          >
            Please collect ${WithdrawLink.salesAmountInCents / 100} USD before sharing
            with the customer
          </Bold>
          <LinkDetails withdrawLink={WithdrawLink}></LinkDetails>
          {revealLNURL ? (
            <>
              {" "}
              <div className={`${styles.LNURL_container} print_this`}>
                <Heading>LNURL fund withdraw</Heading>
                <p>scan to redeem</p>
                <QRCode size={300} value={url} />
                <p>or visit voucher.blink.sv and redeem with </p>
                <div className={styles.voucher_container}>
                  <p> VOUCHER CODE </p>
                  <p>{formatSecretCode(WithdrawLink?.voucherSecret)} </p>
                </div>
              </div>
              <Button
                style={{
                  width: "90%",
                }}
                onClick={copyToClipboard}
              >
                Copy LNURL
              </Button>
            </>
          ) : null}
          {!revealLNURL ? (
            <Button
              style={{
                width: "90%",
              }}
              onClick={() => setRevealLNURL(true)}
            >
              Reveal Voucher
            </Button>
          ) : null}
          <Button
            style={{
              width: "90%",
            }}
            onClick={() => sharePage()}
          >
            Share Voucher
          </Button>
          <Button
            style={{
              width: "90%",
            }}
            onClick={handlePrint}
          >
            Print Voucher
          </Button>
          <InfoComponent>
            To redeem instantly for zero fees Download App at blink.sv and scan above QR
            with Blink
          </InfoComponent>{" "}
          <InfoComponent>
            {`To redeem later or onChain visit voucher.blink.sv and enter the voucher
            secret, If you can't withdraw links from LNURL, you can scan this QR code with
            a regular QR scanner. After scanning, visit the URL and choose the "onChain"
            option.`}
          </InfoComponent>
        </>
      )}
    </div>
  )
}
