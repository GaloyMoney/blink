import { NextPage } from "next"
import { headers } from "next/headers"

import styles from "./hash.module.css"

import { fetchInvoiceByHash } from "@/app/graphql/queries/invoice-by-hash"

import Invoice from "@/components/invoice"
import { decodeInvoice } from "@/components/utils"
import StatusActions from "@/components/invoice/status-actions"
import CheckoutLayoutContainer from "@/components/layouts/checkout-layout"

import { InvoiceStatusProvider } from "@/context/invoice-status-context"

import { baseLogger } from "@/lib/logger"

const CheckoutPage: NextPage<{ params: { hash: string } }> = async (context) => {
  const headersList = headers()
  const returnUrl = headersList.get("x-return-url")

  const { hash } = context.params
  const invoice = await fetchInvoiceByHash({ hash })
  if (invoice instanceof Error || !invoice.paymentRequest || !invoice.status) {
    baseLogger.error({ hash }, "Error getting invoice for hash")
    return <div>Error getting invoice for hash: {hash}</div>
  }

  const decodedInvoice = decodeInvoice(invoice.paymentRequest)
  if (!decodedInvoice) {
    baseLogger.error({ invoice }, "Error decoding invoice for hash")
    return <div>Error decoding invoice for hash: {hash}</div>
  }

  return (
    <InvoiceStatusProvider invoice={decodedInvoice} initialStatus={invoice.status}>
      <CheckoutLayoutContainer>
        <div className={styles.paymentContainer}>
          <div className={styles.headerContainer}>
            <p className={styles.title}>Pay Invoice</p>
          </div>
          <Invoice title="Pay Invoice" returnUrl={returnUrl} />
          <StatusActions returnUrl={returnUrl} />
        </div>
      </CheckoutLayoutContainer>
    </InvoiceStatusProvider>
  )
}

export default CheckoutPage
