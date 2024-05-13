import React from "react"

import LnurlComponent from "./lnurl"

import { env } from "@/env"

type Props = {
  params: {
    "voucher-secret": string
  }
}

export default function Page({ params: { "voucher-secret": voucherSecret } }: Props) {
  const voucherUrl = env.VOUCHER_URL
  return <LnurlComponent voucherSecret={voucherSecret} voucherUrl={voucherUrl} />
}
