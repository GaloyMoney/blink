"use client"
import React, { useState } from "react"
import { QRCode } from "react-qrcode-logo"

import { gql } from "@apollo/client"

import Image from "next/image"

import Link from "next/link"

import { encodeURLToLNURL } from "@/utils/helpers"
import PageLoadingComponents from "@/components/loading/page-loading-component"
import { useGetWithdrawLinkQuery, Status } from "@/lib/graphql/generated"
import Button from "@/components/button"
import FundsPaid from "@/components/funds-paid"

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
  voucherSecret: string
  voucherUrl: string
}

export default function LnurlComponent({ voucherSecret, voucherUrl }: Props) {
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

  const lnurl = encodeURLToLNURL(`${voucherUrl}/api/lnurlw/${WithdrawLink?.uniqueHash}`)

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
        <FundsPaid />
      ) : (
        <>
          <div className="text-center text-green-600 font-bold text-ld">ACTIVE</div>
          <div
            style={{
              backgroundImage: "url(/background/green-voucher-pattern.svg)",
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              width: "90%",
              margin: "0 auto",
              borderRadius: "1rem",
              padding: "1rem",
              boxShadow:
                "rgba(0, 0, 0, 0.02) 0px 1px 3px 0px, rgba(27, 31, 35, 0.15) 0px 0px 0px 1px",
            }}
          >
            <div className="flex flex-col justify-center align-middle text-md text-center">
              <div className="flex flex-col gap-2 text-left">
                <div>
                  Voucher{" "}
                  <span data-testid="voucher-id-code-detail" className="font-bold">
                    {WithdrawLink.identifierCode}
                  </span>
                </div>
                <div>
                  <p>Value </p>
                  <p data-testid="voucher-amount-detail" className="text-2xl font-bold">
                    ${WithdrawLink.voucherAmountInCents / 100}
                  </p>
                </div>
                <div>
                  Price{" "}
                  <span className="font-bold">
                    ${WithdrawLink.salesAmountInCents / 100} USD
                  </span>
                </div>
                <div>
                  Commission{" "}
                  <span className="font-bold">{WithdrawLink.commissionPercentage}%</span>
                </div>
              </div>
              <div className="relative m-auto">
                {!revealLNURL && (
                  <button
                    data-testid="reveal-voucher-btn"
                    onClick={() => setRevealLNURL(true)}
                    className="bg-white text-black rounded-full shadow-lg p-2 w-1/3 m-auto absolute z-20 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                  >
                    Reveal
                  </button>
                )}
                <div
                  className={`flex flex-col gap-2 m-auto mt-4 ${
                    revealLNURL ? "" : "blur-sm"
                  }`}
                >
                  <QRCode logoImage="/blink-logo.svg" size={300} value={lnurl} />
                </div>
              </div>
              <div className="w-full flex justify-center justify-between mt-2 w-10/12 m-auto p-2">
                <div
                  onClick={copyToClipboard}
                  className="flex justify-center align-middle gap-2"
                >
                  <Image
                    src="/copy.svg"
                    alt="copy"
                    width={23}
                    height={23}
                    priority={true}
                  />
                  Copy
                </div>
                <div
                  onClick={() => sharePage()}
                  className="flex justify-center align-middle gap-2"
                >
                  <Image
                    src="/share.svg"
                    alt="share"
                    width={23}
                    height={23}
                    priority={true}
                  />
                  Share
                </div>
              </div>

              <div
                className={`flex flex-col gap-1 mt-4 mb-2 bg-white border-2 w-2/3 m-auto rounded-lg p-1 ${
                  revealLNURL ? "" : "blur-sm"
                }`}
              >
                <p className="text-center text-sm font-bold"> Voucher Code </p>
                <p className="font-bold text-2xl" data-testid="voucher-secret">
                  {WithdrawLink?.voucherSecret}
                </p>
              </div>
            </div>
            <div className="flex flex-col justify-center align-middle gap-2 w-full m-auto mt-4">
              <Button
                onClick={() => window.open(`lightning:${lnurl}`)}
                className="w-36 m-auto"
              >
                Open in Wallet
              </Button>
              <Link
                className="w-28 m-auto"
                href={`/withdraw/${WithdrawLink.voucherSecret}/onchain`}
              >
                <Button className="w-28 m-auto bg-white text-black">Onchain</Button>
              </Link>
              <Button
                className="w-28 flex justify-center align-middle gap-2 m-auto bg-white text-black"
                onClick={handlePrint}
              >
                Print
                <Image
                  src="/print.svg"
                  alt="print"
                  width={23}
                  height={23}
                  priority={true}
                />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
