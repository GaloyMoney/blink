"use client"
import React from "react"
import Image from "react-bootstrap/Image"

import { formattedDate, formattedTime } from "../../utils/date-util"

import GaloyIcon from "./galoy-icon"
import styles from "./payment-outcome.module.css"

interface Props {
  amount: string | string[] | undefined
  sats: string | string[] | undefined
  username: string | string[] | undefined
  paymentRequest: string
  memo: string | string[] | undefined
  paymentAmount: string | string[] | undefined
}

function receipt(props: Props) {
  return (
    <div className="w-100">
      <div className="d-flex py-3 justify-content-center">
        <Image src="/blink-qr-logo.png" width={50} height={50} alt="Blink logo" />
      </div>

      <div className="text-center">
        <span>Transaction Amount</span>
        <h1
          style={{
            fontSize: "2.5rem",
          }}
        >
          {props.sats} sats
        </h1>
        <span> ~ {localStorage.getItem("formattedFiatValue")}</span>

        <div className="d-flex justify-content-center">
          <table className="my-3 w-100">
            <tr>
              <td className="py-3 border-bottom">Beneficiary Name</td>
              <td className="py-3 border-bottom">{props.username}</td>
            </tr>
            <tr>
              <td className="py-3 border-bottom">Paid On</td>
              <td className="py-3 border-bottom">
                {formattedDate(new Date())} at <span>{formattedTime(new Date())}</span>
              </td>
            </tr>

            <tr>
              <td className="py-5 border-bottom">
                Transaction Reference <br /> (Invoice)
              </td>
              <td className="py-5 border-bottom">
                <div className={styles.reference}>{props.paymentRequest}</div>
              </td>
            </tr>

            <tr>
              <td className="py-3 border-bottom">Status</td>
              <td className="py-3 border-bottom">Paid</td>
            </tr>

            <tr>
              <td className="py-3 border-bottom">Description</td>
              <td className="py-3 border-bottom">{props.memo ? props.memo : "none"}</td>
            </tr>
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

export default receipt
