import React from "react"

import Numpad from "@/components/num-pad"
import { formatOperand } from "@/utils/helpers"
import Button from "@/components/button"

interface Props {
  commissionPercentage: string
  setCommissionPercentage: (amount: string) => void
  setCurrentPage: (amount: string) => void
}

export default function CreatePagePercentage({
  commissionPercentage,
  setCommissionPercentage,
  setCurrentPage,
}: Props) {
  return (
    <div className="flex flex-col sm:h-full h-[calc(100dvh-6rem)] justify-between w-full">
      <div className="flex flex-col justify-center align-middle">
        <p className="m-auto">Commission Percentage</p>
        <div className="text-4xl text-center mt-5 font-semibold">
          {formatOperand(commissionPercentage)}%
        </div>
      </div>
      <div className="w-full m-0 flex flex-col justify-center align-middle sm:mt-28">
        <Numpad
          currentAmount={commissionPercentage}
          setCurrentAmount={setCommissionPercentage}
          unit="PERCENTAGE"
        />
        <Button className="w-10/12 m-auto mt-5" onClick={() => setCurrentPage("AMOUNT")}>
          Set commission
        </Button>
      </div>
    </div>
  )
}
