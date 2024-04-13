"use client"
import { useState } from "react"

import styles from "../create-link.module.css"

import { useDisplayCurrency } from "@/hooks/useDisplayCurrency"
import NumPad from "@/components/num-pad"
import { formatOperand } from "@/utils/helpers"
import LoadingComponent from "@/components/loading/loading-component"
import PageLoadingComponent from "@/components/loading/page-loading-component"
import Button from "@/components/button"
import ModalComponent from "@/components/modal-component"
import InfoComponent from "@/components/info-component"
import Heading from "@/components/heading"
import { Currency } from "@/lib/graphql/generated"
import { DEFAULT_CURRENCY } from "@/config/appConfig"

interface Props {
  amount: string
  setAmount: (amount: string) => void
  currency: Currency
  setCurrency: (currency: Currency) => void
  setCurrentPage: (accountType: string) => void
  usdToSats: (accountType: number) => number
  commissionPercentage: string
  setConfirmModal: (currency: boolean) => void
  amountInDollars: number
  voucherAmountInDollars: number
  hasLoaded: {
    current: boolean
  }
}

export default function HomePage({
  setAmount,
  setCurrency,
  setCurrentPage,
  setConfirmModal,
  amount,
  currency,
  usdToSats,
  commissionPercentage,
  voucherAmountInDollars,
  hasLoaded,
}: Props) {
  const { currencyList, loading } = useDisplayCurrency()
  const [alerts, setAlerts] = useState<boolean>(false)

  const handleCurrencyChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedCurrency = currencyList.find(
      (currency: Currency) => currency.id === event.target.value,
    )
    localStorage.setItem("currency", JSON.stringify(selectedCurrency))
    setCurrency(selectedCurrency || DEFAULT_CURRENCY)
  }

  if (loading) {
    return <PageLoadingComponent></PageLoadingComponent>
  }

  const handleConfirmLink = () => {
    if (Number(voucherAmountInDollars) < 0.01) {
      setAlerts(true)
      return
    }
    setConfirmModal(true)
  }

  return (
    <>
      <ModalComponent
        open={alerts}
        onClose={() => {
          setAlerts(false)
        }}
      >
        <div className={styles.alert_box}>
          Amount cannot be less than $0.01 USD
          <Button
            onClick={() => {
              setAlerts(false)
            }}
            style={{
              width: "8rem",
            }}
          >
            Ok
          </Button>
        </div>
      </ModalComponent>
      <Heading>Please Enter Amount</Heading>
      <select
        id="currency"
        value={currency.id}
        className={styles.currency_drop_down}
        onChange={handleCurrencyChange}
      >
        {currencyList.map((currencyOption) => (
          <option
            key={currencyOption.id}
            value={currencyOption.id}
            className={styles.currency_drop_down_option}
          >
            {currencyOption.name}
          </option>
        ))}
      </select>
      <div className="text-3xl font-semibold">
        {currency.symbol} {formatOperand(amount)}
      </div>
      <div>{Number(commissionPercentage)}% commission</div>
      {hasLoaded.current === false ? (
        <LoadingComponent />
      ) : (
        <div>≈ ${formatOperand(String(voucherAmountInDollars))}</div>
      )}
      <NumPad currentAmount={amount} setCurrentAmount={setAmount} unit="FIAT" />
      <div className={styles.commission_and_submit_buttons}>
        <Button
          onClick={() => {
            setCurrentPage("COMMISSION")
          }}
        >
          Commission
        </Button>
        <Button
          data-testid="create-voucher-btn"
          enabled={true}
          onClick={handleConfirmLink}
        >
          Create Voucher
        </Button>
      </div>

      <InfoComponent>
        Enter the amount you want to create a voucher for. Sales amount refers to the
        amount that will be deducted from the voucher amount as commission.
      </InfoComponent>
    </>
  )
}
