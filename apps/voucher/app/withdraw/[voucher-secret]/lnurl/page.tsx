import React from "react"

import LnurlComponent from "./lnurl"

import { env } from "@/env"
const { NEXT_PUBLIC_VOUCHER_URL } = env

type Props = {
  params: {
    "voucher-secret": string
  }
}

export default function Page({ params: { "voucher-secret": voucherSecret } }: Props) {
  return (
    <LnurlComponent voucherSecret={voucherSecret} voucherUrl={NEXT_PUBLIC_VOUCHER_URL} />
  )
}
