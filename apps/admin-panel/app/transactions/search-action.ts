"use server"

import { redirect } from "next/navigation"

import {
  LightningInvoiceDocument,
  LightningInvoiceQuery,
  LightningInvoiceQueryVariables,
  LightningPaymentDocument,
  LightningPaymentQuery,
  LightningPaymentQueryVariables,
  TransactionByIdDocument,
  TransactionByIdQuery,
  TransactionByIdQueryVariables,
  TransactionsByHashDocument,
  TransactionsByHashQuery,
  TransactionsByHashQueryVariables,
} from "../../generated"
import { getClient } from "../graphql-rsc"

const isValidHash = (hash: string) => hash && hash.match(/^[a-f0-9]{64}$/i)
const isValidTxId = (id: string) => id && id.match(/^[0-9a-fA-F]{24}$/i)

export const transactionSearch = async (_prevState: unknown, formData: FormData) => {
  "use server"

  const search = formData.get("search") as string

  if (!search) {
    throw new Error("Please enter a value")
  }

  if (isValidHash(search)) {
    let tx: unknown | undefined

    try {
      const data = await getClient().query<
        TransactionsByHashQuery,
        TransactionsByHashQueryVariables
      >({
        query: TransactionsByHashDocument,
        variables: { hash: search },
      })

      tx =
        data.data?.transactionsByHash &&
        data.data?.transactionsByHash.length > 0 &&
        data.data?.transactionsByHash[0]
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error"
      return { message: `Failed to fetch: ${message}` }
    }

    if (tx) {
      redirect(`/transactions/hash/${search}`)
    }

    try {
      const data = await getClient().query<
        LightningPaymentQuery,
        LightningPaymentQueryVariables
      >({
        query: LightningPaymentDocument,
        variables: { hash: search },
      })

      tx = data.data?.lightningPayment
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error"
      return { message: `Failed to fetch: ${message}` }
    }

    if (tx) {
      redirect(`/transactions/payment/${search}`)
    }

    let invoice: unknown | undefined

    try {
      const data = await getClient().query<
        LightningInvoiceQuery,
        LightningInvoiceQueryVariables
      >({
        query: LightningInvoiceDocument,
        variables: { hash: search },
      })

      invoice = data.data.lightningInvoice
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error"
      return { message: `Failed to fetch: ${message}` }
    }

    if (invoice) {
      redirect(`/transactions/invoice/${search}`)
    }
  }

  if (isValidTxId(search)) {
    let txid: string | undefined

    try {
      const data = await getClient().query<
        TransactionByIdQuery,
        TransactionByIdQueryVariables
      >({
        query: TransactionByIdDocument,
        variables: { id: search },
      })

      txid = data.data?.transactionById?.id
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error"
      return { message: `Failed to fetch: ${message}` }
    }
    if (txid) {
      redirect(`/transactions/id/${txid}`)
    }
  }

  return { message: "Please enter a valid txid or hash" }
}
