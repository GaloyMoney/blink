"use client"
import { useRouter, useSearchParams } from "next/navigation"
import React, { useEffect } from "react"
import Container from "react-bootstrap/Container"
import Image from "next/Image"

import CurrencyInput, { formatValue } from "react-currency-input-field"

import { ACTION_TYPE, ACTIONS } from "../../app/reducer"
import {
  safeAmount,
  getLocaleConfig,
  extractSearchParams,
  parseDisplayCurrency,
} from "../../utils/utils"

import { useDisplayCurrency } from "../../lib/use-display-currency"

import Memo from "../memo"

import DigitButton from "./digit-button"
import styles from "./parse-payment.module.css"
import ReceiveInvoice from "./receive-invoice"
import NFCComponent from "./nfc"

import { satsCurrencyMetadata } from "@/app/sats-currency"

interface Props {
  defaultWalletCurrency: string
  walletId: string
  dispatch: React.Dispatch<ACTION_TYPE>
  state: React.ComponentState
  username: string
}

function ParsePayment({
  defaultWalletCurrency,
  walletId,
  dispatch,
  state,
  username,
}: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { currencyList } = useDisplayCurrency()
  const memo = searchParams?.get("memo")
  const displayCurrency = parseDisplayCurrency(searchParams)

  const currencyMetadata = state.displayCurrencyMetaData
  const language = typeof navigator !== "undefined" ? navigator?.language : "en"

  // set all query params on first load, even if they are not passed
  useEffect(() => {
    const initialAmount = safeAmount(state.currentAmount).toString()
    const initialDisplay = displayCurrency
    const initialQuery = extractSearchParams(searchParams)
    const newQuery = {
      amount: initialAmount,
      memo: memo ?? "",
      displayCurrency: initialDisplay,
    }
    if (initialQuery !== newQuery) {
      const params = new URLSearchParams({
        amount: initialAmount,
        memo: memo ?? "",
        displayCurrency: initialDisplay,
      })
      const newUrl = new URL(window.location.toString())
      newUrl.pathname = `/${username}`
      newUrl.search = params.toString()
      router.replace(newUrl.toString(), {
        scroll: true,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Update Params From Current Amount
  const handleAmountChange = (skipRouterPush?: boolean) => {
    let amount = state.currentAmount
    if (currencyMetadata.fractionDigits === 0) {
      const safeAmt = safeAmount(amount)
      amount =
        currencyMetadata.fractionDigits === 0
          ? safeAmt.toFixed()
          : safeAmt.toFixed(currencyMetadata.fractionDigits)
    }
    if (isNaN(Number(amount))) return

    const formattedValue = formatValue({
      value: amount,
      intlConfig: { locale: language, currency: displayCurrency },
    })
    localStorage.setItem("formattedFiatValue", formattedValue)

    // 3) update the query params
    const newQuery = {
      amount: state.currentAmount,
      memo: memo ?? "",
      displayCurrency,
    }

    const initialQuery = extractSearchParams(searchParams)
    if (initialQuery !== newQuery && !skipRouterPush) {
      const newUrl = new URL(window.location.toString())
      newUrl.pathname = `/${username}`
      newUrl.search = new URLSearchParams(newQuery).toString()
      router.replace(newUrl.toString())
    }
  }

  React.useEffect(handleAmountChange, [state.currentAmount])

  // Update CurrencyMetadata
  React.useEffect(() => {
    if (displayCurrency === "SATS") {
      dispatch({
        type: ACTIONS.UPDATE_DISPLAY_CURRENCY_METADATA,
        payload: satsCurrencyMetadata,
      })
    } else {
      const latestCurrencyMetadata = currencyList?.find((c) => c.id === displayCurrency)
      if (latestCurrencyMetadata) {
        dispatch({
          type: ACTIONS.UPDATE_DISPLAY_CURRENCY_METADATA,
          payload: latestCurrencyMetadata,
        })
      }
    }
  }, [displayCurrency, currencyList])

  return (
    <Container className={styles.digits_container}>
      <div className={styles.output}>
        <CurrencyInput
          style={{
            width: "100%",
            border: 0,
            color: "black",
            backgroundColor: "transparent",
            textAlign: "center",
            fontWeight: 600,
            fontSize: "1.9rem",
          }}
          value={state.currentAmount}
          intlConfig={{ locale: language, currency: displayCurrency }}
          readOnly={true}
        />
      </div>
      <Memo state={state} dispatch={dispatch} />
      {state.createdInvoice ? (
        <ReceiveInvoice
          dispatch={dispatch}
          state={state}
          recipientWalletCurrency={defaultWalletCurrency}
          walletId={walletId}
        />
      ) : (
        <>
          <NFCComponent />

          <div className={styles.digits_grid}>
            <DigitButton digit={"1"} dispatch={dispatch} />
            <DigitButton digit={"2"} dispatch={dispatch} />
            <DigitButton digit={"3"} dispatch={dispatch} />
            <DigitButton digit={"4"} dispatch={dispatch} />
            <DigitButton digit={"5"} dispatch={dispatch} />
            <DigitButton digit={"6"} dispatch={dispatch} />
            <DigitButton digit={"7"} dispatch={dispatch} />
            <DigitButton digit={"8"} dispatch={dispatch} />
            <DigitButton digit={"9"} dispatch={dispatch} />
            {currencyMetadata.fractionDigits > 0 ? (
              <DigitButton
                digit={"."}
                dispatch={dispatch}
                disabled={displayCurrency === "SATS"}
                displayValue={
                  getLocaleConfig({ locale: language, currency: displayCurrency })
                    .decimalSeparator
                }
              />
            ) : (
              <DigitButton digit={""} dispatch={dispatch} disabled={true} />
            )}

            <DigitButton digit={"0"} dispatch={dispatch} />
            <button
              data-testid="backspace-btn"
              onClick={() => dispatch({ type: ACTIONS.DELETE_DIGIT })}
            >
              <Image
                src="/icons/backspace-icon.svg"
                alt=" digit icon"
                width={32}
                height={32}
              />
            </button>
          </div>
        </>
      )}

      <div className={styles.pay_btn_container}>
        <button
          data-testid="pay-btn"
          className={state.createdInvoice ? styles.pay_new_btn : styles.pay_btn}
          onClick={() => {
            if (state.createdInvoice) {
              dispatch({ type: ACTIONS.CREATE_NEW_INVOICE })
            } else {
              dispatch({
                type: ACTIONS.CREATE_INVOICE,
                payload: state.currentAmount,
              })
            }
          }}
        >
          <Image
            src={"/icons/lightning-icon.svg"}
            alt="lightning icon"
            width="20"
            height="20"
          />
          {state.createdInvoice ? "Create new invoice" : "Create invoice"}
        </button>
        {!state.createdInvoice && (
          <button
            data-testid="clear-btn"
            className={styles.clear_btn}
            onClick={() => dispatch({ type: ACTIONS.CLEAR_INPUT })}
          >
            <Image
              src="/icons/clear-input-icon.svg"
              alt="clear input icon"
              width="20"
              height="20"
            />
            Clear
          </button>
        )}
      </div>
    </Container>
  )
}

export default ParsePayment
