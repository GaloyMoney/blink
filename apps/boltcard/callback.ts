import express from "express"

import { gql, GraphQLClient } from "graphql-request"

import { boltcardRouter } from "./router"
import { fetchByCardId, fetchByK1 } from "./knex"
import { apiUrl } from "./config"

type GetUsdWalletIdQuery = {
  readonly __typename: "Query"
  readonly me?: {
    readonly __typename: "User"
    readonly defaultAccount: {
      readonly __typename: "ConsumerAccount"
      readonly id: string
      readonly defaultWalletId: string
      readonly wallets: ReadonlyArray<
        | {
            readonly __typename: "BTCWallet"
            readonly id: string
            readonly walletCurrency: WalletCurrency
            readonly balance: number
          }
        | {
            readonly __typename: "UsdWallet"
            readonly id: string
            readonly walletCurrency: WalletCurrency
            readonly balance: number
          }
      >
    }
  } | null
}

type LnInvoicePaymentSendMutation = {
  readonly __typename: "Mutation"
  readonly lnInvoicePaymentSend: {
    readonly __typename: "PaymentSendPayload"
    readonly status?: string | null
    readonly errors: ReadonlyArray<{
      readonly __typename: "GraphQLApplicationError"
      readonly message: string
    }>
  }
}

const getUsdWalletIdQuery = gql`
  query getUsdWalletId {
    me {
      defaultAccount {
        id
        defaultWalletId
        wallets {
          id
          walletCurrency
          balance
        }
      }
    }
  }
`

const lnInvoicePaymentSendMutation = gql`
  mutation lnInvoicePaymentSend($input: LnInvoicePaymentInput!) {
    lnInvoicePaymentSend(input: $input) {
      errors {
        message
      }
      status
    }
  }
`

boltcardRouter.get("/callback", async (req: express.Request, res: express.Response) => {
  const k1 = req?.query?.k1
  const pr = req?.query?.pr

  console.log({ k1, pr })

  if (!k1 || !pr) {
    res.status(400).send({ status: "ERROR", reason: "missing k1 or pr" })
    return
  }

  if (typeof k1 !== "string" || typeof pr !== "string") {
    res.status(400).send({ status: "ERROR", reason: "invalid k1 or pr" })
    return
  }

  const payment = await fetchByK1(k1)
  const { cardId } = payment

  const card = await fetchByCardId(cardId)

  const graphQLClient = new GraphQLClient(apiUrl, {
    headers: {
      authorization: `Bearer ${card.token}`,
    },
  })

  let data: GetUsdWalletIdQuery
  try {
    data = await graphQLClient.request<GetUsdWalletIdQuery>(getUsdWalletIdQuery)
  } catch (error) {
    console.error(error)
    res.status(400).send({ status: "ERROR", reason: "issue fetching walletId" })
    return
  }

  const wallets = data.me?.defaultAccount.wallets

  if (!wallets) {
    res.status(400).send({ status: "ERROR", reason: "no wallets found" })
    return
  }

  const usdWallet = wallets.find((wallet) => wallet.walletCurrency === "USD")
  const usdWalletId = usdWallet?.id

  console.log({ usdWallet, wallets })

  if (!usdWalletId) {
    res.status(400).send({ status: "ERROR", reason: "no usd wallet found" })
    return
  }

  let result: LnInvoicePaymentSendMutation
  try {
    result = await graphQLClient.request<LnInvoicePaymentSendMutation>({
      document: lnInvoicePaymentSendMutation,
      variables: { input: { walletId: usdWalletId, paymentRequest: pr } },
    })
  } catch (error) {
    console.error(error)
    res.status(400).send({ status: "ERROR", reason: "payment failed" })
    return
  }

  if (result.lnInvoicePaymentSend.status === "SUCCESS") {
    res.json({ status: "OK" })
  } else {
    res.status(400).send({
      status: "ERROR",
      reason: `payment failed: ${result.lnInvoicePaymentSend.errors[0].message}`,
    })
  }
})

const callback = "dummy"
export { callback }
