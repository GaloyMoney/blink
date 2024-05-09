"use client"
import { useState } from "react"

import { gql } from "@apollo/client"

import { useSession } from "next-auth/react"

import CreatePageAmount from "@/components/create/create-page-amount"
import CreatePagePercentage from "@/components/create/create-page-percentage"
import { getWalletDetails } from "@/utils/helpers"
import ConfirmModal from "@/components/create/confirm-modal"
import { useCurrency } from "@/context/currency-context"

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
  const { currency } = useCurrency()
  const storedCommission =
    typeof window !== "undefined" ? localStorage.getItem("commission") : null

  const [commissionPercentage, setCommissionPercentage] = useState<string>(
    storedCommission || "0",
  )

  const [amount, setAmount] = useState<string>("0")
  const [confirmModal, setConfirmModal] = useState<boolean>(false)
  const [currentPage, setCurrentPage] = useState<string>("AMOUNT")

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
          btcWallet={btcWallet}
          usdWallet={usdWallet}
        />

        <CreatePageAmount
          amount={amount}
          currency={currency}
          setAmount={setAmount}
          setCurrentPage={setCurrentPage}
          setConfirmModal={setConfirmModal}
          commissionPercentage={commissionPercentage}
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
