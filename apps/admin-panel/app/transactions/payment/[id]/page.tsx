import {
  LightningPaymentDocument,
  LightningPaymentQuery,
  LightningPaymentQueryVariables,
} from "../../../../generated"

import LnPayment from "../../../../components/transactions/ln-payment"
import { getClient } from "../../../graphql-rsc"

export default async function InvoiceDetails({ params }: { params: { id: string } }) {
  const id = params.id

  const data = await getClient().query<
    LightningPaymentQuery,
    LightningPaymentQueryVariables
  >({
    query: LightningPaymentDocument,
    variables: { hash: id },
  })

  const payment = data.data.lightningPayment

  return (
    <>
      <h1 className="mx-6 mt-6 text-2xl font-semibold text-gray-700">
        Transaction details
      </h1>
      <>
        <h2 className="text-xl font-semibold text-gray-700">Payment</h2>
        <LnPayment payment={payment} />
      </>
    </>
  )
}
