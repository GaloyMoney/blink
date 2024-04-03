import React from "react";
import Numpad from "@/components/NumPad/NumPad";
import { formatOperand } from "@/utils/helpers";
import styles from "../CreateLink.module.css";
import Button from "@/components/Button/Button";
import Heading from "@/components/Heading";

interface Props {
  commissionPercentage: string;
  setCommissionPercentage: (amount: string) => void;
  setCurrentPage: (amount: string) => void;
}

export default function CreatePagePercentage({
  commissionPercentage,
  setCommissionPercentage,
  setCurrentPage,
}: Props) {
  return (
    <>
      <Heading>Please Enter Commission</Heading>
      <div className="text-3xl font-semibold">
        {formatOperand(commissionPercentage)}%
      </div>

      <Numpad
        currentAmount={commissionPercentage}
        setCurrentAmount={setCommissionPercentage}
        unit="PERCENTAGE"
      />
      <div className={styles.commission_and_submit_buttons}>
        <Button
          style={{ width: "90%" }}
          onClick={() => setCurrentPage("AMOUNT")}
        >
          Set commission
        </Button>
      </div>
    </>
  );
}
