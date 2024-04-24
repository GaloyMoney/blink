import React from "react"

import VoucherSecret from "./voucher-secret"

import { env } from "@/env"

const { NEXT_PUBLIC_VOUCHER_URL } = env

interface Params {
  params: {
    "voucher-secret": string
  }
}

// this page shows the LNURLw screen after success in fund transfer to escrow account
export default function Page({ params: { "voucher-secret": voucherSecret } }: Params) {
  return (
    <VoucherSecret voucherSecret={voucherSecret} voucherUrl={NEXT_PUBLIC_VOUCHER_URL} />
  )
}
