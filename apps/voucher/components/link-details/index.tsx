import React from "react"

import Bold from "../bold"

import styles from "./link-details.module.css"

import { timeSince } from "@/utils/helpers"
import { Status, WithdrawLinkWithSecret } from "@/lib/graphql/generated"
interface LinkDetailsProps {
  withdrawLink: WithdrawLinkWithSecret | null | undefined
}

export default function LinkDetails({ withdrawLink }: LinkDetailsProps) {
  if (!withdrawLink) {
    return null
  }

  return (
    <div className={styles.container}>
      <div className={styles.status_ACTIVE}>
        {withdrawLink?.status === Status.Active && "Active"}
      </div>
      {withdrawLink?.status === Status.Active && (
        <>
          <div
            data-testid="voucher-amount-detail"
            className={`${styles.amount} print_this`}
          >
            Voucher Amount ${withdrawLink?.voucherAmountInCents / 100} US
          </div>
          <div className="print_this">
            Voucher Code
            <span
              style={{
                marginLeft: "0.3em",
              }}
              data-testid="voucher-id-code-detail"
            >
              <Bold>{withdrawLink.identifierCode}</Bold>
            </span>{" "}
          </div>
        </>
      )}
      <div className={styles.time}>
        Created {timeSince(Number(withdrawLink?.createdAt))}{" "}
      </div>
    </div>
  )
}
