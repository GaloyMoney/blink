"use client"
import { useState } from "react"

import styles from "../create-link.module.css"

import NumPad from "@/components/num-pad"
import Button from "@/components/button"
import ModalComponent from "@/components/modal-component"
import { Currency } from "@/lib/graphql/generated"
import { formatCurrency } from "@/lib/utils"

interface Props {
  amount: string
  setAmount: (amount: string) => void
  currency: Currency
  setCurrency: (currency: Currency) => void
  setCurrentPage: (accountType: string) => void
  commissionPercentage: string
  setConfirmModal: (currency: boolean) => void
}

export default function HomePage({
  setAmount,
  setCurrentPage,
  setConfirmModal,
  amount,
  currency,
  commissionPercentage,
}: Props) {
  const [alerts, setAlerts] = useState<boolean>(false)
  const voucherAmount =
    Number(amount) - Number(amount) * (Number(commissionPercentage) / 100)
  const profitAmount = Number(amount) - voucherAmount
  // const handleCurrencyChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
  //   const selectedCurrency = currencyList.find(
  //     (currency: Currency) => currency.id === event.target.value,
  //   )
  //   localStorage.setItem("currency", JSON.stringify(selectedCurrency))
  //   setCurrency(selectedCurrency || DEFAULT_CURRENCY)
  // }

  // if (loading) {
  //   return <PageLoadingComponent></PageLoadingComponent>
  // }

  const handleConfirmLink = () => {
    if (Number(amount) < 0.01) {
      setAlerts(true)
      return
    }
    setConfirmModal(true)
  }

  {
    /* <select
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
      </select> */
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
      <div
        className={`flex flex-col sm:h-full h-[calc(100dvh-6rem)] justify-between w-full`}
      >
        <div className="flex flex-col items-center justify-center w-full gap-10">
          <SalesAmountSection amount={amount} currency={currency} />
          <CommissionAndProfitSections
            currency={currency}
            commissionPercentage={Number(commissionPercentage)}
            profit={profitAmount}
          />
        </div>
        <div className="flex flex-col items-center justify-center w-full sm:mt-10">
          <NumPad currentAmount={amount} setCurrentAmount={setAmount} unit="FIAT" />
          <div className="flex justify-between w-10/12 gap-2 mt-4">
            <Button
              variant="outline"
              className="w-1/4"
              onClick={() => {
                setCurrentPage("COMMISSION")
              }}
            >
              %
            </Button>
            <Button
              data-testid="create-voucher-btn"
              className="w-3/4"
              enabled={true}
              onClick={handleConfirmLink}
            >
              Create Voucher
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}

const SalesAmountSection = ({
  amount,
  currency,
}: {
  amount: string
  currency: { id: string }
}) => {
  return (
    <div className="flex flex-col justify-center align-middle text-center gap-3">
      <p>Sales Amount </p>
      <div className="text-4xl font-semibold">
        {formatCurrency({
          amount: Number(amount),
          currency: currency.id,
        })}
      </div>
    </div>
  )
}

const CommissionAndProfitSections = ({
  currency,
  commissionPercentage,
  profit,
}: {
  currency: { id: string }
  commissionPercentage: number
  profit: number
}) => {
  return (
    <div className="flex w-10/12 justify-between sm:w-9/12">
      <div className="text-left">
        <div className="text-sm ">Commission</div>
        <div className="text-xl font-bold">{Number(commissionPercentage)}%</div>
      </div>
      <div className="text-right">
        <div className="text-sm ">Profit</div>
        <div className="text-xl font-bold">
          {formatCurrency({
            amount: Number(profit),
            currency: currency.id,
          })}
        </div>
      </div>
    </div>
  )
}
