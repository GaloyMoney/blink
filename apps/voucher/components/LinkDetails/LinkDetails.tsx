import React from "react"

import Bold from "../Bold"

import styles from "./LinkDetails.module.css"

import { timeSince } from "@/utils/helpers"
import { WithdrawLink, Status } from "@/utils/generated/graphql"
import useSatPrice from "@/hooks/useSatsPrice"
import { TimeBar } from "@/components/TimeBar/TimeBar"
interface LinkDetailsProps {
  withdrawLink?: WithdrawLink | null
  setExpired?: (expired: boolean) => void
}

export default function LinkDetails({ withdrawLink, setExpired }: LinkDetailsProps) {
  const { usdToSats } = useSatPrice()

  if (!withdrawLink) {
    return null
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
            {withdrawLink?.accountType === "BTC"
              ? `${withdrawLink?.voucherAmount} sats`
              : `≈ ${usdToSats(withdrawLink?.voucherAmount / 100).toFixed()} sats`}{" "}
            to create withdraw link for ${withdrawLink?.voucherAmount / 100} US Dollar
          </div>
          <div>
            {withdrawLink?.commissionPercentage === 0
              ? `No commission`
              : `${withdrawLink?.commissionPercentage} percent Commission`}
          </div>
        </>
      ) : withdrawLink?.status === Status.Funded ? (
        <>
          <div className={`${styles.amount} print_this`}>
            Voucher Amount ${withdrawLink?.voucherAmount / 100} US
          </div>
          <div className="print_this">
            Voucher Code <Bold>{withdrawLink.identifierCode}</Bold>{" "}
          </div>
        </>
      ) : null}

      <div className={styles.time}>
        Created {timeSince(Number(withdrawLink?.createdAt))}{" "}
      </div>
      <div className={styles.expire_time}>
        {withdrawLink.status === Status.Unfunded && setExpired ? (
          <>
            Invoice Expires in{" "}
            <TimeBar
              setExpired={setExpired}
              expirationTimestamp={Number(withdrawLink?.invoiceExpiration)}
            ></TimeBar>
          </>
        ) : null}
      </div>
    </div>
  )
}
