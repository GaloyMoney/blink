import React from "react"
import { unstable_noStore as noStore } from "next/cache"

import ApolloWrapper from "./apollo"

import { env } from "@/env"

function ApolloServerWrapper({ children }: { children: React.ReactNode }) {
  noStore()
  const config = {
    coreGqlUrl: env.CORE_URL,
    voucherUrl: env.VOUCHER_URL,
  }
  return <ApolloWrapper config={config}>{children}</ApolloWrapper>
}

export default ApolloServerWrapper
