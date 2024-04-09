import React from "react"

import styles from "../create-link.module.css"

import Numpad from "@/components/num-pad"
import { formatOperand } from "@/utils/helpers"
import Button from "@/components/button"
import Heading from "@/components/heading"

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
    <>
      <Heading>Commission Percentage</Heading>
      <div className="text-3xl font-semibold">{formatOperand(commissionPercentage)}%</div>

      <Numpad
        currentAmount={commissionPercentage}
        setCurrentAmount={setCommissionPercentage}
        unit="PERCENTAGE"
      />
      <div className={styles.commission_and_submit_buttons}>
        <Button style={{ width: "80%" }} onClick={() => setCurrentPage("AMOUNT")}>
          Set commission
        </Button>
      </div>
    </>
  )
}
