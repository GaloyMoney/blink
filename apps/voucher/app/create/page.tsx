"use client"
import { useState } from "react"

import { gql } from "@apollo/client"

import { useSession } from "next-auth/react"

import CreatePageAmount from "@/components/create/create-page-amount"
import { getWalletDetails } from "@/utils/helpers"
import ConfirmModal from "@/components/create/confirm-modal"
import { useCurrency } from "@/context/currency-context"
import { validateCommission } from "@/lib/utils"

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

  const [commissionPercentage, setCommissionPercentage] = useState<number>(
    validateCommission(storedCommission || "0"),
  )

  const [amount, setAmount] = useState<string>("0")
  const [confirmModal, setConfirmModal] = useState<boolean>(false)

  if (!session?.data?.userData?.me?.defaultAccount.wallets) {
    return null
  }

  const { btcWallet, usdWallet } = getWalletDetails({
    wallets: session?.data?.userData?.me?.defaultAccount?.wallets,
  })

  if (!btcWallet || !usdWallet) {
    return null
  }

  return (
    <>
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
          setConfirmModal={setConfirmModal}
          commissionPercentage={commissionPercentage}
          setCommissionPercentage={setCommissionPercentage}
        />
      </div>
    </>
  )
}
