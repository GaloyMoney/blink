import { NextPage } from "next"
import { headers } from "next/headers"

import { fetchInvoiceByHash } from "@/app/graphql/queries/invoice-by-hash"
import Invoice from "@/components/invoice"

const CheckoutPage: NextPage<{ params: { hash: string } }> = async (context) => {
  const headersList = headers()
  const returnUrl = headersList.get("x-return-url")

  const { hash } = context.params
  const invoice = await fetchInvoiceByHash({ hash })
  if (invoice instanceof Error || !invoice.paymentRequest) {
    return <div>Error getting invoice for hash: {hash}</div>
  }
  return (
    <div>
      Invoice request: {invoice.paymentRequest} <br />
      Status: {invoice.status}
      <br />
      Return url: {returnUrl}
      <Invoice title="Pay Invoice" paymentRequest={invoice.paymentRequest} />
    </div>
  )
}

export default CheckoutPage
