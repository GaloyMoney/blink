"use client"
import React from "react"
import Link from "next/link"

import { useGetWithdrawLinkQuery, Status } from "@/lib/graphql/generated"
import Button from "@/components/button"
import LinkDetails from "@/components/link-details"
import InfoComponent from "@/components/info-component"
import FundsPaid from "@/components/funds-paid"
import PageLoadingComponent from "@/components/loading/page-loading-component"
import Heading from "@/components/heading"

// this page shows the LNURLw screen after success in fund transfer to escrow account
type Props = {
  voucherSecret: string
  voucherUrl: string
}

export default function VoucherSecret({ voucherSecret, voucherUrl }: Props) {
  const { loading, error, data } = useGetWithdrawLinkQuery({
    variables: { voucherSecret },
    context: {
      endpoint: "SELF",
    },
  })

  if (loading) {
    return <PageLoadingComponent />
  }
  if (error) {
    return <div>Error: {error.message}</div>
  }
  if (!data) {
    return <div>No data</div>
  }

  return (
    <div className="top_page_container">
      {data.getWithdrawLink?.status === Status.Paid ? (
        <>
          <FundsPaid />
        </>
      ) : (
        <>
          <Heading>Please Withdraw your funds</Heading>
          <LinkDetails withdrawLink={data.getWithdrawLink}></LinkDetails>
          <Link
            style={{ width: "90%" }}
            href={`${voucherUrl}/withdraw/${voucherSecret}/lnurl`}
          >
            <Button className="w-full">
              <span>LNURLw Link</span>{" "}
            </Button>
          </Link>

          <Link
            style={{ width: "90%" }}
            href={`${voucherUrl}/withdraw/${voucherSecret}/onchain`}
          >
            <Button className="w-full">
              <span>On Chain</span>{" "}
            </Button>
          </Link>

          <InfoComponent>
            You can withdraw funds from supported LNURL wallets or through on-chain
            transactions. However, please note that on-chain transactions will incur
            transaction fees.
          </InfoComponent>
        </>
      )}
    </div>
  )
}
