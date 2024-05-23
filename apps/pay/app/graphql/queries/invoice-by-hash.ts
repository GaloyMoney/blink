import { gql } from "@apollo/client"

import { apollo } from "@/app/ssr-client"
import {
  LnInvoicePaymentStatusByHashDocument,
  LnInvoicePaymentStatusByHashQuery,
} from "@/lib/graphql/generated"

gql`
  query LnInvoicePaymentStatusByHash($input: LnInvoicePaymentStatusByHashInput!) {
    lnInvoicePaymentStatusByHash(input: $input) {
      paymentHash
      paymentRequest
      status
    }
  }
`

export type InvoiceStatus =
  LnInvoicePaymentStatusByHashQuery["lnInvoicePaymentStatusByHash"]

export async function fetchInvoiceByHash({
  hash,
}: {
  hash: string
}): Promise<InvoiceStatus | Error> {
  try {
    const response = await apollo
      .unauthenticated()
      .getClient()
      .query<LnInvoicePaymentStatusByHashQuery>({
        query: LnInvoicePaymentStatusByHashDocument,
        variables: { input: { paymentHash: hash } },
      })

    return response?.data?.lnInvoicePaymentStatusByHash
  } catch (err) {
    if (err instanceof Error) return err
    return new Error("FetchInvoice unknown error")
  }
}
