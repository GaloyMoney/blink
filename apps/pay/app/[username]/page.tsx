"use client"
import React, { useEffect } from "react"
import Image from "react-bootstrap/Image"

import Head from "next/head"

import { gql } from "@apollo/client"

import ParsePayment from "../../components/parse-pos-payment"

import { ACTIONS } from "../reducer"

import styles from "./username.module.css"

import LoadingComponent from "@/components/loading"
import { useInvoiceContext } from "@/context/invoice-context"

gql`
  query accountDefaultWallets($username: Username!) {
    accountDefaultWallet(username: $username) {
      __typename
      id
      walletCurrency
    }
  }
`

type Props = {
  searchParams: {
    memo: string
    amount: string
  }
}

function ReceivePayment({ searchParams }: Props) {
  const { memo, amount } = searchParams
  const { state, dispatch } = useInvoiceContext()
  const { username } = state

  const manifestParams = new URLSearchParams()

  useEffect(() => {
    dispatch({
      type: ACTIONS.SET_AMOUNT_FROM_PARAMS,
      payload: amount ?? "0",
    })
  }, [])

  if (memo) {
    manifestParams.set("memo", memo.toString())
  }

  return username ? (
    <div className={styles.paymentContainer}>
      <Head>
        <link
          rel="manifest"
          href={`/api/${username}/manifest?${manifestParams.toString()}`}
          id="manifest"
        />
      </Head>
      <div className={styles.usernameContainer}>
        {state.createdInvoice && (
          <button onClick={() => dispatch({ type: ACTIONS.BACK })}>
            <Image
              src="/icons/chevron-left-icon.svg"
              alt="back button"
              width="10px"
              height="12px"
            />
          </button>
        )}
        <p className={styles.username}>{`Pay ${username}`}</p>
      </div>
      {username && state ? (
        <ParsePayment
          state={state}
          dispatch={dispatch}
          defaultWalletCurrency={state.walletCurrency}
          walletId={state?.walletId}
          username={username}
        />
      ) : (
        <LoadingComponent />
      )}
    </div>
  ) : null
}

export default ReceivePayment
