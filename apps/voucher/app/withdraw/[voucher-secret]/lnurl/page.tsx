"use client"
import React, { useState } from "react"
import { QRCode } from "react-qrcode-logo"

import { gql } from "@apollo/client"

import styles from "./lnurl-page.module.css"

import { encodeURLToLNURL, formatSecretCode } from "@/utils/helpers"
import PageLoadingComponents from "@/components/loading/page-loading-component"
import { useGetWithdrawLinkQuery, Status } from "@/lib/graphql/generated"
import Button from "@/components/button"
import InfoComponent from "@/components/info-component"
import FundsPaid from "@/components/funds-paid"
import Heading from "@/components/heading"
import Bold from "@/components/bold"
import LinkDetails from "@/components/link-details"
import { getClientSideConfig } from "@/config/client-side-config"

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
    "voucher-secret": string
  }
}

export default function Page({ params: { "voucher-secret": voucherSecret } }: Props) {
  const [revealLNURL, setRevealLNURL] = useState<boolean>(false)

  const { loading, error, data } = useGetWithdrawLinkQuery({
    variables: { voucherSecret },
    context: {
      endpoint: "SELF",
    },
  })
  const WithdrawLink = data?.getWithdrawLink

  if (loading) {
    return <PageLoadingComponents />
  }
  if (error) {
    return <div>Error: {error.message}</div>
  }
  if (!WithdrawLink) {
    return <div>No data</div>
  }

  const lnurl = encodeURLToLNURL(
    `${getClientSideConfig().voucherUrl}/api/lnurlw/${WithdrawLink?.uniqueHash}`,
  )

  const url = `${getClientSideConfig().voucherUrl}/withdraw/${
    WithdrawLink.voucherSecret
  }?lightning=${lnurl}`
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
                  <p data-testid="voucher-secret">
                    {formatSecretCode(WithdrawLink?.voucherSecret)}
                  </p>
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
              data-testid="reveal-voucher-btn"
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
