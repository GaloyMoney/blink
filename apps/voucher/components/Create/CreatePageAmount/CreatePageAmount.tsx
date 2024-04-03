"use client"
import { useState } from "react"

import styles from "../CreateLink.module.css"

import { useDisplayCurrency } from "@/hooks/useDisplayCurrency"
import NumPad from "@/components/NumPad/NumPad"
import { formatOperand } from "@/utils/helpers"
import LoadingComponent from "@/components/Loading/LoadingComponent"
import PageLoadingComponent from "@/components/Loading/PageLoadingComponent"
import Button from "@/components/Button/Button"
import ModalComponent from "@/components/ModalComponent"
import InfoComponent from "@/components/InfoComponent/InfoComponent"
import Heading from "@/components/Heading"
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
  AmountInDollars: string
  commissionAmountInDollars: string
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
  commissionAmountInDollars,
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

  const handelConfimLink = () => {
    if (Number(commissionAmountInDollars) < 0.01) {
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
          Amount cannot be less than 0.01 ≈ {(usdToSats(1) / 100).toFixed()} sats
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
        <div>
          {currency.symbol} {formatOperand(amount)}
        </div>
      </div>
      <div>{Number(commissionPercentage)}% commission</div>
      {hasLoaded.current === false ? (
        <LoadingComponent></LoadingComponent>
      ) : (
        <div>≈ ${formatOperand(commissionAmountInDollars)}</div>
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
        <Button enabled={true} onClick={handelConfimLink}>
          Create link
        </Button>
      </div>

      <InfoComponent>
        Regular sats refer to BTC sats, which can fluctuate in value over time, either
        increasing or decreasing. On the other hand, stable sats are USD sats that
        maintain a fixed value and do not change their values.
      </InfoComponent>
    </>
  )
}
