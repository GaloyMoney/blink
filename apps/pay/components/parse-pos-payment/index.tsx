"use client"
import { useRouter, useSearchParams } from "next/navigation"
import React, { useEffect } from "react"
import Image from "next/image"

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

import { satCurrencyMetadata } from "@/app/sats-currency-metadata"
import useDynamicFontSize from "@/hooks/use-dynamic-font-size"

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
  const display = parseDisplayCurrency(searchParams)
  const showMemo =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("memoChecked") ?? "false")
      : false
  const currencyMetadata = state.displayCurrencyMetaData
  const language = typeof navigator !== "undefined" ? navigator?.language : "en"
  const amountFontSize = useDynamicFontSize({
    inputValue: state.currentAmount,
    defaultSize: 3,
  })
  // set all query params on first load, even if they are not passed
  useEffect(() => {
    const initialAmount = safeAmount(state.currentAmount).toString()
    const initialDisplay = display
    const initialQuery = extractSearchParams(searchParams)
    const newQuery = {
      amount: initialAmount,
      memo: memo ?? "",
      display: initialDisplay,
    }
    if (initialQuery !== newQuery) {
      const params = new URLSearchParams({
        amount: initialAmount,
        memo: memo ?? "",
        display: initialDisplay,
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

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      const { key } = event
      if (!state.createdInvoice) {
        if (key === "Backspace") {
          dispatch({ type: ACTIONS.DELETE_DIGIT })
        } else if (!isNaN(Number(key))) {
          dispatch({ type: ACTIONS.ADD_DIGIT, payload: key })
        } else if (key === "." && currencyMetadata.fractionDigits > 0) {
          dispatch({ type: ACTIONS.ADD_DIGIT, payload: key })
        } else if (key === "Enter") {
          dispatch({
            type: ACTIONS.CREATE_INVOICE,
            payload: state.currentAmount,
          })
        }
      } else {
        if (key === "Backspace") {
          dispatch({ type: ACTIONS.CREATE_NEW_INVOICE })
        }
      }
    }
    window.addEventListener("keydown", handleKeyPress)
    return () => {
      window.removeEventListener("keydown", handleKeyPress)
    }
  }, [dispatch, currencyMetadata.fractionDigits, state.createdInvoice])
  // Update Params From Current Amount
  const handleAmountChange = (skipRouterPush?: boolean) => {
    const amount = state.currentAmount
    if (isNaN(Number(amount))) return

    const formattedValue = formatValue({
      value: amount,
      intlConfig: { locale: language, currency: display },
    })
    localStorage.setItem("formattedFiatValue", formattedValue)

    // 3) update the query params
    const newQuery = {
      amount: state.currentAmount,
      memo: memo ?? "",
      display,
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
    if (display === "SAT" && state.walletCurrency === "USD") {
      // update param if display is "SAT" and wallet currency is "USD"
      const params = new URLSearchParams({
        amount: "0",
        memo: memo ?? "",
        display: "USD",
      })
      const newUrl = new URL(window.location.toString())
      newUrl.pathname = `/${username}`
      newUrl.search = params.toString()
      router.replace(newUrl.toString(), {
        scroll: true,
      })
      // "currencyList?.length > 0" is to prevent unnecessary renders
    } else if (display === "SAT" && currencyList?.length > 0) {
      dispatch({
        type: ACTIONS.UPDATE_DISPLAY_CURRENCY_METADATA,
        payload: satCurrencyMetadata,
      })
    } else {
      const latestCurrencyMetadata = currencyList?.find((c) => c.id === display)
      if (latestCurrencyMetadata) {
        dispatch({
          type: ACTIONS.UPDATE_DISPLAY_CURRENCY_METADATA,
          payload: latestCurrencyMetadata,
        })
      }
    }
  }, [display, currencyList])

  return (
    <div className={styles.digitsContainer}>
      <CurrencyInput
        style={{
          width: "100%",
          border: 0,
          color: "black",
          backgroundColor: "transparent",
          textAlign: "center",
          fontWeight: 600,
          fontSize: amountFontSize,
          height: "3rem",
        }}
        value={state.currentAmount}
        intlConfig={{ locale: language, currency: display }}
        readOnly={true}
      />
      {showMemo && <Memo state={state} dispatch={dispatch} />}
      {state.createdInvoice ? (
        <ReceiveInvoice
          dispatch={dispatch}
          state={state}
          recipientWalletCurrency={defaultWalletCurrency}
          walletId={walletId}
        />
      ) : (
        <>
          <div className={styles.digitsGrid}>
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
                displayValue={
                  getLocaleConfig({ locale: language, currency: display })
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

      <div className={styles.payBtnContainer}>
        <button
          data-testid="pay-btn"
          className={state.createdInvoice ? styles.secondaryBtn : styles.payBtn}
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
          {state.createdInvoice ? (
            <>
              <Image
                src="/icons/caret-left.svg"
                alt="Back"
                width="20"
                height="20"
              ></Image>
              Back
            </>
          ) : (
            <>
              <Image
                src={"/icons/lightning-icon.svg"}
                alt="lightning icon"
                width="20"
                height="20"
              />
              Create invoice
            </>
          )}
        </button>
      </div>
    </div>
  )
}

export default ParsePayment
