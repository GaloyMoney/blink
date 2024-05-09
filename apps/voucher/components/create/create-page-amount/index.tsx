"use client"
import { useState } from "react"

import styles from "../create-link.module.css"

import NumPad from "@/components/num-pad"
import Button from "@/components/button"
import ModalComponent from "@/components/modal-component"
import { formatCurrency } from "@/lib/utils"

interface Props {
  amount: string
  setAmount: (amount: string) => void
  currency: string
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
}: {
  currency: string
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
            currency,
          })}
        </div>
      </div>
    </div>
  )
}
