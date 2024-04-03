import React from "react";
import styles from "./LinkDetails.module.css";
import { timeSince } from "@/utils/helpers";
import { WithdrawLink } from "@/utils/generated/graphql";
import useSatPrice from "@/hooks/useSatsPrice";
import { TimeBar } from "@/components/TimeBar/TimeBar";
import Bold from "../Bold";
import { Status } from "@/utils/generated/graphql";
interface LinkDetailsProps {
  withdrawLink?: WithdrawLink | null;
  setExpired?: (expired: boolean) => void;
}

export default function LinkDetails({
  withdrawLink,
  setExpired,
}: LinkDetailsProps) {
  const { usdToSats } = useSatPrice();

  if (!withdrawLink) {
    return null;
  }

  return (
    <div className={styles.container}>
      <div
        className={
          withdrawLink?.status === Status.Unfunded
            ? styles.status_UNFUNDED
            : styles.status_FUNDED
        }
      >
        {withdrawLink?.status === Status.Unfunded
          ? "Not Funded"
          : withdrawLink?.status === Status.Funded
          ? "Funded and Active"
          : null}
      </div>
      {withdrawLink.status === Status.Unfunded ? (
        <>
          <div className={styles.amount}>
            Pay{" "}
            {withdrawLink?.account_type === "BTC"
              ? `${withdrawLink?.voucher_amount} sats`
              : `≈ ${usdToSats(
                  withdrawLink?.voucher_amount / 100
                ).toFixed()} sats`}{" "}
            to create withdraw link for ${withdrawLink?.voucher_amount / 100}{" "}
            US Dollar
          </div>
          <div>
            {withdrawLink?.commission_percentage === 0
              ? `No commission`
              : `${withdrawLink?.commission_percentage} percent Commission`}
          </div>
        </>
      ) : withdrawLink?.status === Status.Funded ? (
        <>
          <div className={`${styles.amount} print_this`}>
            Voucher Amount ${withdrawLink?.voucher_amount / 100} US
          </div>
          <div className="print_this">
            Voucher Code <Bold>{withdrawLink.identifier_code}</Bold>{" "}
          </div>
        </>
      ) : null}

      <div className={styles.time}>
        Created {timeSince(Number(withdrawLink?.created_at))}{" "}
      </div>
      <div className={styles.expire_time}>
        {withdrawLink.status === Status.Unfunded && setExpired ? (
          <>
            Invoice Expires in{" "}
            <TimeBar
              setExpired={setExpired}
              expirationTimestamp={Number(withdrawLink?.invoice_expiration)}
            ></TimeBar>
          </>
        ) : null}
      </div>
    </div>
  );
}
