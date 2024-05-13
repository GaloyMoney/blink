import React from "react"

import VoucherSecret from "./voucher-secret"

import { env } from "@/env"

interface Params {
  params: {
    "voucher-secret": string
  }
}

// this page shows the LNURLw screen after success in fund transfer to escrow account
export default function Page({ params: { "voucher-secret": voucherSecret } }: Params) {
  const voucherUrl = env.VOUCHER_URL
  return <VoucherSecret voucherSecret={voucherSecret} voucherUrl={voucherUrl} />
}
