"use client"

import React from "react"

import styles from "./index.module.css"

import { type ReceiptProps } from "./index.types"

import GaloyIcon from "@/components/galoy-icon"
import { formattedDate, formattedTime } from "@/utils/date-util"

import { getLocaleConfig } from "@/utils/utils"

function Receipt({ amount, currency, invoice, status }: ReceiptProps) {
  if (!invoice) {
    return null
  }
  const memo = invoice?.tags?.find((t) => t.tagName === "description")?.data?.toString()
  const language = typeof navigator !== "undefined" ? navigator?.language : "en"
  const { numberFormatter } = getLocaleConfig({
    locale: language,
    currency: currency || "USD",
  })
  return (
    <div className="hidden print:!block w-100">
      <div className="text-center">
        <span>Transaction Amount</span>
        <h1 style={{ fontSize: "2.5rem" }}>{invoice.satoshis} sats</h1>
        {amount && <span> ~ {numberFormatter.format(amount || 0)}</span>}
        <div className="d-flex justify-content-center">
          <table className="my-3 w-100">
            <tbody>
              <tr>
                <td className="py-3 border-bottom">Date</td>
                <td className="py-3 border-bottom">
                  {formattedDate(new Date())} at <span>{formattedTime(new Date())}</span>
                </td>
              </tr>

              <tr>
                <td className="py-5 border-bottom">
                  Transaction Reference <br /> (Invoice)
                </td>
                <td className="py-5 border-bottom">
                  <div className={styles.reference}>{invoice.paymentRequest}</div>
                </td>
              </tr>

              <tr>
                <td className="py-3 border-bottom">Status</td>
                <td className="py-3 border-bottom">{status}</td>
              </tr>

              <tr>
                <td className="py-3 border-bottom">Description</td>
                <td className="py-3 border-bottom">{memo || "none"}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="link-wrapper">
          <a
            className={styles.link}
            href="https://galoy.io"
            target="_blank"
            rel="noreferrer"
          >
            Powered by <GaloyIcon />
          </a>
        </div>
      </div>
    </div>
  )
}

export default Receipt
