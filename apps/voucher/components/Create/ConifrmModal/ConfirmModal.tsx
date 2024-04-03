import Button from "@/components/Button/Button";
import ModalComponent from "@/components/ModalComponent";
import React, { MouseEvent } from "react";
import styles from "./ConfirmModal.module.css";
import { formatOperand } from "@/utils/helpers";
import { Currency } from "@/utils/generated/graphql";

interface Props {
  open: boolean;
  onClose: (currency: MouseEvent<HTMLButtonElement>) => void;
  handleSubmit: (event: MouseEvent<HTMLButtonElement>) => void; // Update the type of handleSubmit
  amount: string;
  currency: Currency;
  commissionPercentage: string;
  commissionAmountInDollars: string;
  usdToSats: (currency: number) => number;
}

const ConfirmModal = ({
  open,
  onClose,
  handleSubmit,
  amount,
  currency,
  commissionPercentage,
  commissionAmountInDollars,
  usdToSats,
}: Props) => {
  return (
    <ModalComponent open={open} onClose={onClose}>
      <div className={styles.modal_container}>
        <h1 className={styles.modalTitle}>Confirm</h1>
        <div>
          <h3 className={styles.modalSubtitle}>Sales Amount </h3>
          <p className={styles.modalText}>
            {formatOperand(Number(amount).toFixed(currency.fractionDigits))}{" "}
            {currency.name}
          </p>
        </div>
        <div>
          <h3 className={styles.modalSubtitle}>Voucher Amount</h3>
          <p className={styles.modalText}>
            {Number(commissionAmountInDollars)} US Dollar
          </p>
        </div>

        <div>
          <h3 className={styles.modalSubtitle}>Funding Amount</h3>
          <p className={styles.modalText}>
            ≈ {usdToSats(Number(commissionAmountInDollars)).toFixed()} sats
          </p>
        </div>

        <div>
          <h3 className={styles.modalSubtitle}>Escrow Currency</h3>
          <p className={styles.modalText}>US Dollar (Stablesats)</p>
        </div>
        <div>
          <h3 className={styles.modalSubtitle}>Sales Commission</h3>
          <p className={styles.modalText}>{Number(commissionPercentage)}%</p>
        </div>
        <div className={styles.button_container}>
          <Button onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit}>Fund</Button>
        </div>
      </div>
    </ModalComponent>
  );
};

export default ConfirmModal;
