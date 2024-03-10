import React from "react"

import { ApolloQueryResult } from "@apollo/client"

import { apollo } from "../ssr-client"

import { defaultCurrencyMetadata } from "../currency-metadata"

import UsernameLayoutContainer from "@/components/layouts/username-layout"
import { InvoiceProvider } from "@/context/invoice-context"
import {
  AccountDefaultWalletsDocument,
  AccountDefaultWalletsQuery,
} from "@/lib/graphql/generated"
import ErrorMessage from "@/components/error"

type Props = {
  children: React.ReactNode
  params: {
    username: string
  }
}

export default async function UsernameLayout({ children, params }: Props) {
  let response: ApolloQueryResult<AccountDefaultWalletsQuery> | { errorMessage: string }
  try {
    response = await apollo
      .unauthorized()
      .getClient()
      .query<AccountDefaultWalletsQuery>({
        query: AccountDefaultWalletsDocument,
        variables: { username: params.username },
      })
  } catch (err) {
    console.error("error in username-layout.tsx", err)
    if (err instanceof Error) {
      response = { errorMessage: err.message }
    } else {
      console.error("Unknown error")
      response = { errorMessage: "An unknown error occurred" }
    }
  }

  if ("errorMessage" in response) {
    return <ErrorMessage errorMessage={response.errorMessage}></ErrorMessage>
  }

  const initialState = {
    currentAmount: "0",
    createdInvoice: false,
    walletCurrency: response?.data?.accountDefaultWallet.walletCurrency,
    walletId: response?.data?.accountDefaultWallet.id,
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
