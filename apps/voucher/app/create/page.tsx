"use client"
import { useState } from "react"

import CreatePageAmount from "@/components/Create/CreatePageAmount/CreatePageAmount"
import CreatePagePercentage from "@/components/Create/CreatePagePercentage/CreatePagePercentage"
import { Currency, Wallet } from "@/lib/graphql/generated"
import useSatsPrice from "@/hooks/useSatsPrice"
import PageLoadingComponent from "@/components/Loading/PageLoadingComponent"
import { calculateAmountAfterCommission, getWalletDetails } from "@/utils/helpers"
import ConfirmModal from "@/components/Create/ConifrmModal/ConfirmModal"
import InfoComponent from "@/components/InfoComponent/InfoComponent"
import useRealtimePrice from "@/hooks/useRealTimePrice"
import { DEFAULT_CURRENCY } from "@/config/appConfig"
import { gql } from "@apollo/client"
import { useSession } from "next-auth/react"

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
  const { currencyToCents, hasLoaded } = useRealtimePrice(currency.id)
  const [amount, setAmount] = useState<string>("0")

  const [confirmModal, setConfirmModal] = useState<boolean>(false)
  const [currentPage, setCurrentPage] = useState<string>("AMOUNT")

  const AmountInDollars = Number(
    (
      currencyToCents(Number(amount), currency.id, currency.fractionDigits)
        .convertedCurrencyAmount / 100
    ).toFixed(2),
  )

  const voucherAmountInDollars = calculateAmountAfterCommission({
    amount: AmountInDollars,
    commissionRatePercentage: Number(commissionPercentage),
  })

  if (!session?.data?.userData?.me?.defaultAccount.wallets) {
    return null
  }

  const { btcWallet, usdWallet } = getWalletDetails({
    wallets: session?.data?.userData?.me?.defaultAccount?.wallets as Wallet[],
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
          AmountInDollars={AmountInDollars}
          voucherAmountInDollars={voucherAmountInDollars}
          hasLoaded={hasLoaded}
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
