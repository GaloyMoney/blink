import React from "react"

import Bold from "../bold"

import styles from "./user-links.module.css"

import { formatDate } from "@/utils/helpers"
import { Status, WithdrawLink } from "@/lib/graphql/generated"

interface UserLinksProps {
  withdrawLink: WithdrawLink
}

export default function UserLinks({ withdrawLink }: UserLinksProps) {
  return (
    <>
      {" "}
      <div key={withdrawLink.id} className={styles.TopContainer}>
        <div className={styles.LinkContainer}>
          <div className={styles.HeadingContainer}>
            <div>
              <p
                style={{
                  fontWeight: "600",
                }}
              >
                {withdrawLink.identifierCode}
              </p>
              <p>
                <p
                  className="
                    text-xs
                    font-medium
                    text-gray-500
                    "
                >
                  Created on {formatDate(withdrawLink.createdAt)}
                </p>
              </p>
            </div>
            <span
              style={{
                backgroundColor:
                  withdrawLink.status === Status.Paid
                    ? "#a9a9a975"
                    : withdrawLink.status === Status.Active
                      ? "#207f3c75"
                      : "white",
                color:
                  withdrawLink.status === Status.Paid
                    ? "#757575"
                    : withdrawLink.status === Status.Active
                      ? "#0a802d"
                      : "white",
              }}
              className={styles.Status}
            >
              {withdrawLink.status === Status.Paid ? (
                <p>Claimed</p>
              ) : withdrawLink.status === Status.Active ? (
                <p>Active</p>
              ) : (
                ""
              )}
            </span>
          </div>
          <div className={styles.DetailsContainer}>
            <div className={styles.LinkDetails}>
              <Bold>Voucher Amount</Bold>{" "}
              <p>${withdrawLink.voucherAmountInCents / 100} US</p>
            </div>
            <div className={styles.LinkDetails}>
              <Bold>Percent commission</Bold> <p>{withdrawLink.commissionPercentage}</p>
            </div>
            <div className={styles.LinkDetails}>
              <Bold>Sales amount</Bold>{" "}
              <p>${withdrawLink?.salesAmountInCents / 100} US</p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
