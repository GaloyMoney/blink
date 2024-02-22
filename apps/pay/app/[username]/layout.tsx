import React from "react"

import { getClient } from "../ssr-client"

import { defaultCurrencyMetadata } from "../currency-metadata"

import UsernameLayoutContainer from "@/components/layouts/username-layout"
import { InvoiceProvider } from "@/context/invoice-context"
import {
  AccountDefaultWalletsDocument,
  AccountDefaultWalletsQuery,
} from "@/lib/graphql/generated"

type Props = {
  children: React.ReactNode
  params: {
    username: string
  }
}

export default async function UsernameLayout({ children, params }: Props) {
  const response = await getClient().query<AccountDefaultWalletsQuery>({
    query: AccountDefaultWalletsDocument,
    variables: { username: params.username },
  })

  const initialState = {
    currentAmount: "0",
    createdInvoice: false,
    walletCurrency: response.data.accountDefaultWallet.walletCurrency,
    walletId: response.data.accountDefaultWallet.id,
    username: params.username,
    pinnedToHomeScreenModalVisible: false,
    memo: "",
    displayCurrencyMetaData: defaultCurrencyMetadata,
  }

  return (
    <InvoiceProvider initialState={initialState}>
      <UsernameLayoutContainer username={params.username}>
        {children}
      </UsernameLayoutContainer>
    </InvoiceProvider>
  )
}
