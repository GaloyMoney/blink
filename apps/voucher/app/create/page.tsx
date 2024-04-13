"use client"
import { useEffect, useState } from "react"

import { gql } from "@apollo/client"

import { useSession } from "next-auth/react"

import CreatePageAmount from "@/components/create/create-page-amount"
import CreatePagePercentage from "@/components/create/create-page-percentage"
import { Currency, useCurrencyConversionEstimationQuery } from "@/lib/graphql/generated"
import useSatsPrice from "@/hooks/useSatsPrice"
import { calculateAmountAfterCommission, getWalletDetails } from "@/utils/helpers"
import ConfirmModal from "@/components/create/confirm-modal"
import InfoComponent from "@/components/info-component"
import { DEFAULT_CURRENCY } from "@/config/appConfig"

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

export default function CreatePage() {
  const session = useSession()

  const { usdToSats } = useSatsPrice()
  const storedCurrency =
    typeof window !== "undefined" ? localStorage.getItem("currency") : null
  const storedCommission =
    typeof window !== "undefined" ? localStorage.getItem("commission") : null

  const [currency, setCurrency] = useState<Currency>(
    storedCurrency ? JSON.parse(storedCurrency) : DEFAULT_CURRENCY,
  )
  const [commissionPercentage, setCommissionPercentage] = useState<string>(
    storedCommission || "0",
  )

  const [amount, setAmount] = useState<string>("0")
  const { data: currencyConversion, refetch } = useCurrencyConversionEstimationQuery({
    variables: {
      amount: Number(amount),
      currency: currency.id,
    },
    context: {
      endpoint: "GALOY",
    },
    pollInterval: 5000,
  })

  useEffect(() => {
    refetch({
      amount: Number(amount),
      currency: currency.id,
    })
  }, [amount, currency.id, refetch])

  const [confirmModal, setConfirmModal] = useState<boolean>(false)
  const [currentPage, setCurrentPage] = useState<string>("AMOUNT")

  const amountInDollars = Number(
    (currencyConversion?.currencyConversionEstimation.usdCentAmount / 100).toFixed(2),
  )

  const voucherAmountInDollars = calculateAmountAfterCommission({
    amount: amountInDollars,
    commissionRatePercentage: Number(commissionPercentage),
  })

  if (!session?.data?.userData?.me?.defaultAccount.wallets) {
    return null
  }

  const { btcWallet, usdWallet } = getWalletDetails({
    wallets: session?.data?.userData?.me?.defaultAccount?.wallets,
  })

  if (!btcWallet || !usdWallet) {
    return null
  }

  if (currentPage === "AMOUNT") {
    return (
      <div className="top_page_container">
        <ConfirmModal
          open={confirmModal}
          onClose={() => setConfirmModal(false)}
          amount={amount}
          currency={currency}
          commissionPercentage={commissionPercentage}
          voucherAmountInDollars={voucherAmountInDollars}
          btcWallet={btcWallet}
          usdWallet={usdWallet}
        />

        <CreatePageAmount
          amount={amount}
          currency={currency}
          setAmount={setAmount}
          setCurrency={setCurrency}
          setCurrentPage={setCurrentPage}
          usdToSats={usdToSats}
          setConfirmModal={setConfirmModal}
          commissionPercentage={commissionPercentage}
          amountInDollars={amountInDollars}
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
          <InfoComponent>
            Please enter the commission percentage that will be deducted from the original
            Link amount. The maximum commission is 99 percent.
          </InfoComponent>
        </div>
      </>
    )
  }
}
