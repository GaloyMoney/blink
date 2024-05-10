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

type VoucherDetailsProps = {
  withdrawLink: {
    identifierCode: string
    voucherAmountInCents: number
    salesAmountInCents: number
    commissionPercentage: number
    voucherSecret: string
  }
  revealLNURL: boolean
  lnurl: string
  copyToClipboard: () => void
  sharePage: () => void
  handlePrint: () => void
  setRevealLNURL: (value: boolean) => void
}

export default function LnurlPage({ voucherSecret, voucherUrl }: Props) {
  const [revealLNURL, setRevealLNURL] = useState<boolean>(false)

  const { loading, error, data } = useGetWithdrawLinkQuery({
    variables: { voucherSecret },
    context: {
      endpoint: "SELF",
    },
  })
  const withdrawLink = data?.getWithdrawLink

  if (loading) {
    return <PageLoadingComponents />
  }
  if (error) {
    return <div>Error: {error.message}</div>
  }
  if (!withdrawLink) {
    return <div>No data</div>
  }

  const lnurl = encodeURLToLNURL(`${voucherUrl}/api/lnurlw/${withdrawLink.uniqueHash}`)

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

  return (
    <div className="top_page_container">
      {withdrawLink.status === Status.Paid ? (
        <FundsPaid />
      ) : (
        <VoucherDetails
          withdrawLink={withdrawLink}
          revealLNURL={revealLNURL}
          lnurl={lnurl}
          copyToClipboard={copyToClipboard}
          sharePage={sharePage}
          handlePrint={handlePrint}
          setRevealLNURL={setRevealLNURL}
        />
      )}
    </div>
  )
}

const VoucherDetails = ({
  withdrawLink,
  revealLNURL,
  lnurl,
  copyToClipboard,
  sharePage,
  handlePrint,
  setRevealLNURL,
}: VoucherDetailsProps) => {
  return (
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
              {withdrawLink.identifierCode}
            </span>
          </div>
          <div>
            <p>Value </p>
            <p data-testid="voucher-amount-detail" className="text-2xl font-bold">
              ${withdrawLink.voucherAmountInCents / 100}
            </p>
          </div>
          <div>
            Price{" "}
            <span className="font-bold">
              ${withdrawLink.salesAmountInCents / 100} USD
            </span>
          </div>
          <div>
            Commission{" "}
            <span className="font-bold">{withdrawLink.commissionPercentage}%</span>
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
            className={`flex flex-col gap-2 m-auto mt-4 ${revealLNURL ? "" : "blur-sm"}`}
          >
            <QRCode logoImage="/blink-logo.svg" size={300} value={lnurl} />
          </div>
        </div>
        <div className="flex justify-between mt-2 w-11/12 m-auto p-1">
          <IconButton icon="/copy.svg" alt="copy" onClick={copyToClipboard} text="Copy" />
          <IconButton icon="/share.svg" alt="share" onClick={sharePage} text="Share" />
        </div>

        <div
          className={`flex flex-col gap-1 mt-4 mb-2 bg-white border-2 w-2/3 m-auto rounded-lg p-1 ${
            revealLNURL ? "" : "blur-sm"
          }`}
        >
          <p className="text-center text-sm font-bold"> Voucher Code </p>
          <p className="font-bold text-2xl" data-testid="voucher-secret">
            {withdrawLink.voucherSecret}
          </p>
        </div>
      </div>
      <div className="flex flex-col justify-center align-middle gap-2 w-full m-auto mt-4">
        <Button onClick={() => window.open(`lightning:${lnurl}`)} className="w-36 m-auto">
          Open in Wallet
        </Button>
        <Link
          className="w-28 m-auto"
          href={`/withdraw/${withdrawLink.voucherSecret}/onchain`}
        >
          <Button className="w-28 m-auto bg-white text-black">Onchain</Button>
        </Link>
        <Button
          className="w-28 flex justify-center align-middle gap-2 m-auto bg-white text-black"
          onClick={handlePrint}
        >
          Print
          <Image src="/print.svg" alt="print" width={23} height={23} priority={true} />
        </Button>
      </div>
    </div>
  )
}

const IconButton = ({
  icon,
  alt,
  onClick,
  text,
}: {
  icon: string
  alt: string
  onClick: () => void
  text: string
}) => {
  return (
    <div onClick={onClick} className="flex justify-center align-middle gap-2">
      <Image src={icon} alt={alt} width={23} height={23} priority={true} />
      {text}
    </div>
  )
}
