import {
  LightningInvoiceDocument,
  LightningInvoiceQuery,
  LightningInvoiceQueryVariables,
} from "../../../../generated"

import LnInvoice from "../../../../components/transactions/ln-invoice"
import { getClient } from "../../../graphql-rsc"

export default async function InvoiceDetails({ params }: { params: { id: string } }) {
  const id = params.id

  const data = await getClient().query<
    LightningInvoiceQuery,
    LightningInvoiceQueryVariables
  >({
    query: LightningInvoiceDocument,
    variables: { hash: id },
  })

  const invoice = data.data.lightningInvoice

  return (
    <>
      <h1 className="mx-6 mt-6 text-2xl font-semibold text-gray-700">
        Transaction details
      </h1>
      <>
        <h2 className="text-xl font-semibold text-gray-700">Invoice</h2>
        <LnInvoice invoice={invoice} />
      </>
    </>
  )
}
