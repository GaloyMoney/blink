"use client"
import Link from "next/link"
import React from "react"
import Container from "react-bootstrap/Container"
import Image from "react-bootstrap/Image"

import Head from "next/head"

import { gql } from "@apollo/client"

import { useSearchParams } from "next/navigation"

import ParsePayment from "../../components/ParsePOSPayment"
import PinToHomescreen from "../../components/PinToHomescreen"

import CurrencyDropdown from "../../components/Currency/currency-dropdown"

import { useAccountDefaultWalletsQuery } from "../../lib/graphql/generated"

import reducer, { ACTIONS } from "../reducer"

import styles from "./username.module.css"

import LoadingComponent from "@/components/Loading"

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
  params: {
    username: string
  }
}

function updateCurrencyAndReload(newDisplayCurrency: string): void {
  localStorage.setItem("display", newDisplayCurrency)

  const currentURL = new URL(window.location.toString())
  const searchParams = new URLSearchParams(window.location.search)
  searchParams.set("display", newDisplayCurrency)
  currentURL.search = searchParams.toString()

  window.history.pushState({}, "", currentURL.toString())
  setTimeout(() => {
    window.location.reload()
  }, 100)
}

function ReceivePayment({ params }: Props) {
  const searchParams = useSearchParams()
  const query = searchParams ? Object.fromEntries(searchParams.entries()) : {}

  const { memo } = query
  const { username } = params

  let accountUsername: string
  if (!username) {
    accountUsername = ""
  } else {
    accountUsername = username.toString()
  }

  const manifestParams = new URLSearchParams()
  if (memo) {
    manifestParams.set("memo", memo.toString())
  }

  const {
    data,
    error: usernameError,
    loading: usernameLoading,
  } = useAccountDefaultWalletsQuery({
    variables: { username: accountUsername },
    skip: !accountUsername,
  })

  const [state, dispatch] = React.useReducer(reducer, {
    currentAmount: "",
    createdInvoice: false,
    walletCurrency: data?.accountDefaultWallet.walletCurrency,
    username: accountUsername,
    pinnedToHomeScreenModalVisible: false,
  })

  React.useEffect(() => {
    if (state.walletCurrency === data?.accountDefaultWallet.walletCurrency) {
      return
    }
    dispatch({
      type: ACTIONS.UPDATE_WALLET_CURRENCY,
      payload: data?.accountDefaultWallet.walletCurrency,
    })
    dispatch({ type: ACTIONS.UPDATE_USERNAME, payload: username })
  }, [state, username, data])

  return (
    <>
      {username ? (
        <Container className={styles.payment_container}>
          <Head>
            <link
              rel="manifest"
              href={`/api/${username}/manifest?${manifestParams.toString()}`}
              id="manifest"
            />
          </Head>
          {usernameError ? (
            <div className={styles.error}>
              <p>{`${usernameError.message}.`}</p>
              <p>Please check the username in your browser URL and try again.</p>
              <Link
                href={"/setuppwa"}
                onClick={() => localStorage.removeItem("username")}
              >
                Back
              </Link>
            </div>
          ) : (
            <>
              <PinToHomescreen
                pinnedToHomeScreenModalVisible={state.pinnedToHomeScreenModalVisible}
                dispatch={dispatch}
              />
              <div className={styles.username_container}>
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
                <div style={{ marginLeft: "12px", marginTop: "9px" }}>
                  <CurrencyDropdown
                    style={{
                      border: "none",
                      outline: "none",
                      width: "56px",
                      height: "42px",
                      fontSize: "18px",
                      backgroundColor: "white",
                      textAlign: "center",
                      verticalAlign: "middle",
                    }}
                    showOnlyFlag={true}
                    onSelectedDisplayCurrencyChange={updateCurrencyAndReload}
                  />
                </div>
              </div>
              {data && !usernameLoading && accountUsername && state ? (
                <ParsePayment
                  state={state}
                  dispatch={dispatch}
                  defaultWalletCurrency={data?.accountDefaultWallet.walletCurrency}
                  walletId={data?.accountDefaultWallet.id}
                  username={accountUsername}
                />
              ) : (
                <LoadingComponent />
              )}
            </>
          )}
        </Container>
      ) : null}
    </>
  )
}

export default ReceivePayment
