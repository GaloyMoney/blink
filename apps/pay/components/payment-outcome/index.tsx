"use client"
import { useParams, useSearchParams } from "next/navigation"
import React, { useRef } from "react"
import Image from "react-bootstrap/Image"

import { useReactToPrint } from "react-to-print"

import { gql } from "@apollo/client"

import { ACTIONS, ACTION_TYPE } from "../../app/reducer"

import { useLnInvoicePaymentStatusSubscription } from "../../lib/graphql/generated"

import styles from "./payment-outcome.module.css"
import Receipt from "./receipt"

import { extractSearchParams } from "@/utils/utils"
import { useInvoiceContext } from "@/context/invoice-context"

interface Props {
  paymentRequest: string
  paymentAmount: string | string[] | undefined
  dispatch: React.Dispatch<ACTION_TYPE>
  satoshis: number | undefined
}

gql`
  subscription lnInvoicePaymentStatus($input: LnInvoicePaymentStatusInput!) {
    lnInvoicePaymentStatus(input: $input) {
      __typename
      errors {
        message
        __typename
      }
      status
    }
  }
`

function PaymentOutcome({ paymentRequest, paymentAmount, dispatch, satoshis }: Props) {
  const searchParams = useSearchParams()
  const { username } = useParams()
  const { amount, memo } = extractSearchParams(searchParams)
  const { state } = useInvoiceContext()
  const isCurrencySats = state.displayCurrencyMetaData.id === "SAT"
  const componentRef = useRef<HTMLDivElement | null>(null)

  const printReceipt = useReactToPrint({
    content: () => componentRef.current,
  })

  const { loading, data, error } = useLnInvoicePaymentStatusSubscription({
    variables: {
      input: { paymentRequest },
    },
    skip: !paymentRequest,
  })

  if (!paymentRequest) {
    return null
  }

  if (data !== undefined) {
    if (error) console.error(error)
  }

  const backToCashRegisterButton = (
    <button
      className={styles.backBtn}
      onClick={() => dispatch({ type: ACTIONS.CREATE_NEW_INVOICE })}
    >
      Back
    </button>
  )

  const downloadReceipt = (
    <button className={styles.payNewBtn} onClick={() => printReceipt()}>
      <Image src="/icons/print-icon.svg" alt="print icon" width="18" height="18" />
      Print Receipt
    </button>
  )

  if (data) {
    const { status, errors } = data.lnInvoicePaymentStatus
    if (status === "PAID") {
      return (
        <div className={styles.container}>
          <div aria-labelledby="Payment successful">
            <Image
              data-testid="success-icon"
              src="/icons/success-icon.svg"
              alt="success icon"
              width="104"
              height="104"
            />
            <p className={styles.text}>
              {`The invoice of ${localStorage.getItem("formattedFiatValue")}
             ${!isCurrencySats ? `(~${satoshis} sats)` : ""}
                has been paid`}
            </p>

            {/* the component for printing receipt */}
            <div className={styles.hideReceipt}>
              <div ref={componentRef}>
                <Receipt
                  amount={amount}
                  sats={String(satoshis)}
                  username={username}
                  paymentRequest={paymentRequest}
                  paymentAmount={paymentAmount}
                  memo={memo}
                  isCurrencySats={isCurrencySats}
                />
              </div>
            </div>
            {downloadReceipt}
          </div>
          {backToCashRegisterButton}
        </div>
      )
    }

    if (errors.length > 0 || error?.message) {
      return (
        <div className={styles.container}>
          <div aria-labelledby="Payment unsuccessful">
            <Image
              src="/icons/cancel-icon.svg"
              alt="success icon"
              width="104"
              height="104"
            />
            <p className={styles.text}>
              Please try again. Either the invoice has expired or it hasn’t been paid.
            </p>
          </div>
          {backToCashRegisterButton}
        </div>
      )
    }
  }
  return <>{loading && null}</>
}

export default PaymentOutcome
