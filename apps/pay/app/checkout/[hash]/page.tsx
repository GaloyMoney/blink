import { NextPage } from "next"
import { headers } from "next/headers"

import styles from "./hash.module.css"

import { fetchInvoiceByHash } from "@/app/graphql/queries/invoice-by-hash"

import Invoice from "@/components/invoice"
import CheckoutLayoutContainer from "@/components/layouts/checkout-layout"

const CheckoutPage: NextPage<{ params: { hash: string } }> = async (context) => {
  const headersList = headers()
  const returnUrl = headersList.get("x-return-url")

  const { hash } = context.params
  const invoice = await fetchInvoiceByHash({ hash })
  if (invoice instanceof Error || !invoice.paymentRequest) {
    return <div>Error getting invoice for hash: {hash}</div>
  }

  return (
    <CheckoutLayoutContainer>
      <div className={styles.paymentContainer}>
        <div className={styles.headerContainer}>
          <p className={styles.title}>Pay Invoice</p>
        </div>
        <Invoice
          title="Pay Invoice"
          status={invoice.status || "PENDING"}
          paymentRequest={invoice.paymentRequest}
          returnUrl={returnUrl}
        />
      </div>
    </CheckoutLayoutContainer>
  )
}

export default CheckoutPage
