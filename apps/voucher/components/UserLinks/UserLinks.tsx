import { Status } from "@/utils/generated/graphql";
import Link from "next/link";
import React from "react";
import Bold from "../Bold";
import { formatDate } from "@/utils/helpers";
import styles from "./UserLinks.module.css";
import { color } from "@mui/system";
import { WithdrawLink } from "@/utils/generated/graphql";

interface UserLinksProps {
  withdrawLink: WithdrawLink;
}

export default function UserLinks({ withdrawLink }: UserLinksProps) {
  return (
    <>
      {" "}
      <Link
        href={
          withdrawLink.status === Status.Unfunded
            ? `/fund/${withdrawLink.id}`
            : withdrawLink.status === Status.Funded
            ? `/withdraw/${withdrawLink.id}`
            : "#"
        }
        onClick={(event) => {
          if (
            withdrawLink.status !== Status.Unfunded &&
            withdrawLink.status !== Status.Funded
          ) {
            event.preventDefault();
          }
        }}
        key={withdrawLink.id}
        className={styles.TopContainer}
      >
        <div className={styles.LinkContainer}>
          <div className={styles.HeadingContainer}>
            <div>
              <p
                style={{
                  fontWeight: "600",
                }}
              >
                {withdrawLink.identifier_code}
              </p>
              <p>
                <p
                  className="
                    text-xs
                    font-medium
                    text-gray-500
                    "
                >
                  Created on {formatDate(withdrawLink.created_at)}
                </p>
              </p>
            </div>
            <span
              style={{
                backgroundColor:
                  withdrawLink.status === Status.Unfunded
                    ? "#d12b2b67"
                    : withdrawLink.status === Status.Paid
                    ? "#a9a9a975"
                    : withdrawLink.status === Status.Funded
                    ? "#207f3c75"
                    : "white",
                color:
                  withdrawLink.status === Status.Unfunded
                    ? "#b82222"
                    : withdrawLink.status === Status.Paid
                    ? "#757575"
                    : withdrawLink.status === Status.Funded
                    ? "#0a802d"
                    : "white",
              }}
              className={styles.Status}
            >
              {withdrawLink.status === Status.Unfunded ? (
                <p>Unfunded</p>
              ) : withdrawLink.status === Status.Paid ? (
                <p>Claimed</p>
              ) : withdrawLink.status === Status.Funded ? (
                <p>Active</p>
              ) : (
                ""
              )}
            </span>
          </div>
          <div className={styles.DetailsContainer}>
            <div className={styles.LinkDetails}>
              <Bold>Voucher Amount</Bold>{" "}
              <p>${withdrawLink.voucher_amount / 100} US</p>
            </div>
            <div className={styles.LinkDetails}>
              <Bold>Percent commission</Bold>{" "}
              <p>{withdrawLink.commission_percentage}</p>
            </div>
            <div className={styles.LinkDetails}>
              <Bold>Sales amount</Bold>{" "}
              <p>
                ${withdrawLink?.sales_amount}{" "}
                {withdrawLink.account_type === "BTC" ? "sats" : "US"}
              </p>
            </div>
          </div>
        </div>
      </Link>
    </>
  );
}
