"use client"
import { useState } from "react"

import styles from "../create-link.module.css"

import NumPad from "@/components/num-pad"
import Button from "@/components/button"
import ModalComponent from "@/components/modal-component"
import { formatCurrency } from "@/lib/utils"
import { amountCalculator } from "@/lib/amount-calculator"

interface Props {
  voucherPrice: string
  setVoucherPrice: (amount: string) => void
  currency: string
  setCurrentPage: (accountType: string) => void
  commissionPercentage: string
  setConfirmModal: (currency: boolean) => void
  voucherAmountInDollars: number
}

export default function HomePage({
  setVoucherPrice,
  setCurrentPage,
  setConfirmModal,
  voucherPrice,
  currency,
  commissionPercentage,
  voucherAmountInDollars,
}: Props) {
  const [alerts, setAlerts] = useState<boolean>(false)
  const profitAmount = amountCalculator.profitAmount({
    voucherPrice: Number(voucherPrice),
    commissionPercentage: Number(commissionPercentage),
  })

  const handleConfirmLink = () => {
    if (Number(voucherPrice) < 0.01 || voucherAmountInDollars < 0.01) {
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
            className="w-1/2"
            onClick={() => {
              setAlerts(false)
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
          <SalesAmountSection amount={voucherPrice} currency={currency} />
          <CommissionAndProfitSections
            currency={currency}
            commissionPercentage={Number(commissionPercentage)}
            profit={profitAmount}
          />
        </div>
        <div className="flex flex-col items-center justify-center w-full sm:mt-10">
          <NumPad
            currentValue={voucherPrice}
            setCurrentValue={setVoucherPrice}
            unit="FIAT"
          />
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
  const voucherPriceDisplay = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(Number(amount))

  return (
    <div className="flex flex-col justify-center align-middle text-center gap-3">
      <p>Voucher Price </p>
      <div className="text-4xl font-semibold">{voucherPriceDisplay}</div>
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
