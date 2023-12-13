import Link from "next/link"
import { useRouter } from "next/router"
import React from "react"
import Container from "react-bootstrap/Container"
import Image from "react-bootstrap/Image"

import Head from "next/head"

import { gql } from "@apollo/client"

import ParsePayment from "../components/ParsePOSPayment"
import PinToHomescreen from "../components/PinToHomescreen"

import CurrencyDropdown from "../components/Currency/currency-dropdown"

import { useAccountDefaultWalletsQuery } from "../lib/graphql/generated"

import reducer, { ACTIONS } from "./_reducer"
import styles from "./_user.module.css"

gql`
  query accountDefaultWallets($username: Username!) {
    accountDefaultWallet(username: $username) {
      __typename
      id
      walletCurrency
    }
  }
`

function ReceivePayment() {
  const router = useRouter()
  const { username, memo, display } = router.query
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)

  let accountUsername: string
  if (!username) {
    accountUsername = ""
  } else {
    accountUsername = username.toString()
  }

  if (!display) {
    const displayFromLocal = localStorage.getItem("display") ?? "USD"
    const queryString = window.location.search
    const searchParams = new URLSearchParams(queryString)
    searchParams.set("display", displayFromLocal)
    const newQueryString = searchParams.toString()
    window.history.pushState(null, "", "?" + newQueryString)
  }

  const manifestParams = new URLSearchParams()
  if (memo) {
    manifestParams.set("memo", memo.toString())
  }

  const { data, error: usernameError } = useAccountDefaultWalletsQuery({
    variables: { username: accountUsername },
    skip: !accountUsername,
  })

  const [state, dispatch] = React.useReducer(reducer, {
    currentAmount: "",
    createdInvoice: false,
    walletCurrency: data?.accountDefaultWallet.walletCurrency || "USD",
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
      {router.query.username ? (
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
                      width: isIOS || isSafari ? "72px" : "56px",
                      height: "42px",
                      fontSize: "18px",
                      backgroundColor: "white",
                      textAlign: "center",
                      verticalAlign: "middle",
                    }}
                    showOnlyFlag={true}
                    onSelectedDisplayCurrencyChange={(newDisplayCurrency) => {
                      localStorage.setItem("display", newDisplayCurrency)
                      router.push(
                        {
                          query: { ...router.query, display: newDisplayCurrency },
                        },
                        undefined,
                        { shallow: true },
                      )
                      setTimeout(() => {
                        // hard reload to re-calculate currency
                        // in a future PR we can manage state globally for selected display currency
                        window.location.reload()
                      }, 100)
                    }}
                  />
                </div>
              </div>
              {/* {memo && <p className={styles.memo}>{`Memo: ${memo}`}</p>} */}

              <ParsePayment
                state={state}
                dispatch={dispatch}
                defaultWalletCurrency={data?.accountDefaultWallet.walletCurrency}
                walletId={data?.accountDefaultWallet.id}
              />
            </>
          )}
        </Container>
      ) : null}
    </>
  )
}

export default ReceivePayment
