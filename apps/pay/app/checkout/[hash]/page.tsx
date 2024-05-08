import { NextPage } from "next"
import { headers } from "next/headers"

import styles from "./hash.module.css"

import { fetchInvoiceByHash } from "@/app/graphql/queries/invoice-by-hash"

import Invoice from "@/components/invoice"
import CancelInvoiceButton from "@/components/invoice/cancel-button"
import CheckoutLayoutContainer from "@/components/layouts/checkout-layout"
import PrintButton from "@/components/invoice/print-button"

const CheckoutPage: NextPage<{ params: { hash: string } }> = async (context) => {
  const headersList = headers()
  const returnUrl = headersList.get("x-return-url")

  const { hash } = context.params
  const invoice = await fetchInvoiceByHash({ hash })
  if (invoice instanceof Error || !invoice.paymentRequest) {
    return <div>Error getting invoice for hash: {hash}</div>
  }

  const showPendingActions = invoice && invoice.status === "PENDING"
  const showPaidActions = invoice && invoice.status === "PAID"

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
        {showPaidActions && (
          <div className={styles.payBtnContainer}>
            <PrintButton />
          </div>
        )}
        {showPendingActions && (
          <div className={styles.payBtnContainer}>
            <CancelInvoiceButton returnUrl={returnUrl} />
          </div>
        )}
      </div>
    </CheckoutLayoutContainer>
  )
}

export default CheckoutPage
