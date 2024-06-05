"use client"
import { useEffect, useState } from "react"

import { gql } from "@apollo/client"

import CreatePageAmount from "@/components/create/create-page-amount"
import CreatePagePercentage from "@/components/create/create-page-percentage"
import ConfirmModal from "@/components/create/confirm-modal"
import { useCurrency } from "@/context/currency-context"
import { useCurrencyConversionEstimationQuery } from "@/lib/graphql/generated"
import { amountCalculator } from "@/lib/amount-calculator"
import { convertCurrency } from "@/lib/utils"

gql`
  mutation CreateWithdrawLink($input: CreateWithdrawLinkInput!) {
    createWithdrawLink(input: $input) {
      commissionPercentage
      createdAt
      id
      identifierCode
      salesAmountInCents
      status
      uniqueHash
      userId
      voucherAmountInCents
      voucherSecret
      paidAt
    }
  }
`

gql`
  query CurrencyConversionEstimation($amount: Float!, $currency: DisplayCurrency!) {
    currencyConversionEstimation(amount: $amount, currency: $currency) {
      btcSatAmount
      id
      usdCentAmount
      timestamp
    }
  }
`

type Props = {
  platformFeesInPpm: number
}

export default function CreatePage({ platformFeesInPpm }: Props) {
  const { currency } = useCurrency()
  const [commissionPercentage, setCommissionPercentage] = useState("0")
  const [voucherPrice, setVoucherPrice] = useState<string>("0")
  const [confirmModal, setConfirmModal] = useState<boolean>(false)
  const [currentPage, setCurrentPage] = useState<string>("AMOUNT")

  const { data: currencyConversion, refetch } = useCurrencyConversionEstimationQuery({
    variables: { amount: Number(voucherPrice), currency },
    context: { endpoint: "GALOY" },
    pollInterval: 60000,
    fetchPolicy: "no-cache",
  })

  useEffect(() => {
    refetch({ amount: Number(voucherPrice), currency })
  }, [voucherPrice, currency, refetch])

  useEffect(() => {
    const value = localStorage.getItem("commission")
    if (value) {
      setCommissionPercentage(value)
    }
  }, [])

  const voucherAmountInCents =
    amountCalculator.voucherAmountAfterPlatformFeesAndCommission({
      voucherPrice: currencyConversion?.currencyConversionEstimation.usdCentAmount,
      commissionPercentage: Number(commissionPercentage),
      platformFeesInPpm,
    })

  const voucherAmountInDollars = convertCurrency.centsToUsd({
    cents: voucherAmountInCents,
  })

  if (currentPage === "AMOUNT") {
    return (
      <div className="top_page_container">
        <ConfirmModal
          open={confirmModal}
          onClose={() => setConfirmModal(false)}
          voucherPrice={Number(voucherPrice)}
          currency={currency}
          commissionPercentage={Number(commissionPercentage)}
          platformFeesInPpm={platformFeesInPpm}
          voucherAmountInDollars={voucherAmountInDollars}
          voucherPriceInCents={
            currencyConversion?.currencyConversionEstimation.usdCentAmount
          }
        />

        <CreatePageAmount
          voucherPrice={voucherPrice}
          currency={currency}
          setVoucherPrice={setVoucherPrice}
          setCurrentPage={setCurrentPage}
          setConfirmModal={setConfirmModal}
          commissionPercentage={commissionPercentage}
          voucherAmountInDollars={voucherAmountInDollars}
        />
      </div>
    )
  } else {
    return (
      <>
        <div className="top_page_container">
          <CreatePagePercentage
            commissionPercentage={commissionPercentage}
            setCommissionPercentage={setCommissionPercentage}
            setCurrentPage={setCurrentPage}
          />
        </div>
      </>
    )
  }
}
