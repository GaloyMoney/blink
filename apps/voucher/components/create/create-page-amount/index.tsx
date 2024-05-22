"use client"
import { useState } from "react"

import styles from "../create-link.module.css"

import NumPad from "@/components/num-pad"
import Button from "@/components/button"
import ModalComponent from "@/components/modal-component"
import { formatCurrency, validateCommission } from "@/lib/utils"

interface Props {
  amount: string
  setAmount: (amount: string) => void
  currency: string
  commissionPercentage: number
  setConfirmModal: (currency: boolean) => void
  setCommissionPercentage: (amount: number) => void
}

export default function HomePage({
  setAmount,
  setConfirmModal,
  amount,
  currency,
  commissionPercentage,
  setCommissionPercentage,
}: Props) {
  const [alerts, setAlerts] = useState<boolean>(false)
  const voucherAmount =
    Number(amount) - Number(amount) * (Number(commissionPercentage) / 100)
  const profitAmount = Number(amount) - voucherAmount

  const handleConfirmLink = () => {
    if (Number(amount) < 0.01) {
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
          Amount cannot be less than 0.01
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
            setCommissionPercentage={setCommissionPercentage}
          />
        </div>
        <div className="flex flex-col items-center justify-center w-full sm:mt-10">
          <NumPad currentAmount={amount} setCurrentAmount={setAmount} unit="FIAT" />
          <div className="flex justify-center w-10/12 gap-2 mt-4 align-middle">
            <Button
              data-testid="create-voucher-btn"
              className="w-11/12"
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
  currency: string
}) => {
  return (
    <div className="flex flex-col justify-center align-middle text-center gap-3">
      <p>Sales Amount </p>
      <div className="text-4xl font-semibold">
        {formatCurrency({
          amount: Number(amount),
          currency,
        })}
      </div>
    </div>
  )
}

const CommissionAndProfitSections = ({
  currency,
  commissionPercentage,
  profit,
  setCommissionPercentage,
}: {
  currency: string
  commissionPercentage: number
  profit: number
  setCommissionPercentage: (amount: number) => void
}) => {
  return (
    <div className="flex w-10/12 justify-between sm:w-9/12">
      <div className="text-left">
        <div className="text-sm ">
          <div className="text-sm ">commission</div>
        </div>
        <div className="text-xl font-bold">
          <input
            type="number"
            min={0}
            max={99}
            value={commissionPercentage}
            onChange={(e) => {
              const value = e.target.value
              const sanitizedValue = validateCommission(value)
              localStorage.setItem("commission", String(sanitizedValue))
              setCommissionPercentage(sanitizedValue)
            }}
            className="text-xl font-bold bg-secondary rounded-md p-1 w-20"
          />{" "}
          %
        </div>
      </div>
      <div className="text-right">
        <div className="text-sm ">Profit</div>
        <div className="text-xl font-bold">
          {formatCurrency({
            amount: Number(profit),
            currency,
          })}
        </div>
      </div>
    </div>
  )
}
