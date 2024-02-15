"use client"
import { useRouter, useSearchParams } from "next/navigation"
import React, { useEffect } from "react"
import Container from "react-bootstrap/Container"
import Image from "react-bootstrap/Image"

import CurrencyInput, { formatValue } from "react-currency-input-field"

import useRealtimePrice from "../../lib/use-realtime-price"
import { ACTION_TYPE, ACTIONS } from "../../app/reducer"
import {
  formatOperand,
  safeAmount,
  getLocaleConfig,
  extractSearchParams,
} from "../../utils/utils"
import Memo from "../Memo"

import { useDisplayCurrency } from "../../lib/use-display-currency"

import { Currency } from "../../lib/graphql/generated"

import DigitButton from "./Digit-Button"
import styles from "./parse-payment.module.css"
import ReceiveInvoice from "./Receive-Invoice"

function isRunningStandalone() {
  if (typeof window === "undefined") {
    return false
  }
  return window.matchMedia("(display-mode: standalone)").matches
}

interface Props {
  defaultWalletCurrency: string
  walletId: string
  dispatch: React.Dispatch<ACTION_TYPE>
  state: React.ComponentState
  username: string
}

interface UpdateAmount {
  shouldUpdate: boolean
  value: string | null
}

export enum AmountUnit {
  Sat = "SAT",
  Cent = "CENT", // TODO: eventually depreciate this for Fiat, but don't want to break existing POS links
  Fiat = "FIAT",
}

const defaultCurrencyMetadata: Currency = {
  id: "USD",
  flag: "🇺🇸",
  name: "US Dollar",
  symbol: "$",
  fractionDigits: 2,
  __typename: "Currency",
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
  const { amount, sats, unit, memo } = extractSearchParams(searchParams)

  const display = searchParams?.get("display") ?? localStorage.getItem("display") ?? "USD"
  const { currencyToSats, satsToCurrency, hasLoaded } = useRealtimePrice(display)
  const { currencyList } = useDisplayCurrency()
  const [valueInFiat, setValueInFiat] = React.useState(0)
  const [valueInSats, setValueInSats] = React.useState(0)
  const [exchangeRateFormatted, setExchangeRateFormatted] = React.useState("$0")
  const [currentAmount, setCurrentAmount] = React.useState(state.currentAmount)
  const [currencyMetadata, setCurrencyMetadata] = React.useState<Currency>(
    defaultCurrencyMetadata,
  )
  const [numOfChanges, setNumOfChanges] = React.useState(0)
  const language = typeof navigator !== "undefined" ? navigator?.language : "en"
  const prevUnit = React.useRef(AmountUnit.Cent)

  // onload
  // set all query params on first load, even if they are not passed
  useEffect(() => {
    const initialUnit = unit ?? "CENT" // TODO: eventually depreciate CENT for Fiat, but don't want to break existing POS links
    const initialAmount = safeAmount(amount).toString()
    const initialSats = safeAmount(sats).toString()
    const initialDisplay = display ?? localStorage.getItem("display") ?? "USD"
    const initialUsername = username
    const initialQuery = extractSearchParams(searchParams)
    delete initialQuery?.currency
    const newQuery = {
      amount: initialAmount,
      sats: initialSats,
      unit: initialUnit,
      memo: memo ?? "",
      display: initialDisplay,
      username: initialUsername,
    }
    if (initialQuery !== newQuery) {
      const params = new URLSearchParams({
        amount: initialAmount,
        sats: initialSats,
        unit: initialUnit,
        memo: memo ?? "",
        display: initialDisplay,
        currency: defaultWalletCurrency,
      })
      const newUrl = new URL(window.location.toString())
      newUrl.pathname = `/${username}`
      newUrl.search = params.toString()

      router.replace(newUrl.toString(), {
        scroll: true,
      })
    }
    // this only runs once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const updateCurrentAmountWithParams = React.useCallback((): UpdateAmount => {
    if (unit === AmountUnit.Sat) {
      if (sats === currentAmount) {
        return {
          shouldUpdate: false,
          value: null,
        }
      } else if (sats) {
        return {
          shouldUpdate: true,
          value: sats?.toString(),
        }
      }
    } else {
      if (Number(amount) === Number(currentAmount)) {
        return { shouldUpdate: false, value: null }
      } else if (amount) {
        return { shouldUpdate: true, value: amount.toString() }
      }
    }
    return { shouldUpdate: false, value: null }
  }, [amount, sats, unit, currentAmount])

  const toggleCurrency = () => {
    const newUnit = unit === AmountUnit.Sat ? AmountUnit.Cent : AmountUnit.Sat
    prevUnit.current = (unit as AmountUnit) || AmountUnit.Cent
    const params = new URLSearchParams({
      currency: defaultWalletCurrency,
      unit: newUnit,
      memo,
      display,
      amount,
      sats,
    })

    const newUrl = new URL(window.location.toString())
    newUrl.pathname = `/${username}`
    newUrl.search = params.toString()
    router.replace(newUrl.toString())
  }

  // Update Params From Current Amount
  const handleAmountChange = (skipRouterPush?: boolean) => {
    calculateExchangeRate()
    if (!unit || (currentAmount === "" && numOfChanges === 0)) return
    setNumOfChanges(numOfChanges + 1)

    // 1) format the fiat amount
    const { convertedCurrencyAmount } = satsToCurrency(
      currentAmount,
      display,
      currencyMetadata.fractionDigits,
    )
    let amt = unit === AmountUnit.Sat ? convertedCurrencyAmount : currentAmount
    if (unit === AmountUnit.Sat || currencyMetadata.fractionDigits === 0) {
      const safeAmt = safeAmount(amt)
      amt =
        currencyMetadata.fractionDigits === 0
          ? safeAmt.toFixed()
          : safeAmt.toFixed(currencyMetadata.fractionDigits)
    }
    if (isNaN(Number(amt))) return

    const formattedValue = formatValue({
      value: amt,
      intlConfig: { locale: language, currency: display },
    })
    localStorage.setItem("formattedFiatValue", formattedValue)
    setValueInFiat(amt)

    // 2) format the sats amount
    let satsAmt =
      unit === AmountUnit.Sat
        ? currentAmount
        : currencyToSats(Number(currentAmount), display, currencyMetadata.fractionDigits)
            .convertedCurrencyAmount
    satsAmt = safeAmount(satsAmt).toFixed()
    localStorage.setItem("formattedSatsValue", `${formatOperand(satsAmt)} sats`)
    setValueInSats(satsAmt)

    // 3) update the query params
    const newQuery = {
      amount: amt,
      sats: satsAmt,
      currency: defaultWalletCurrency,
      unit,
      memo,
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  React.useEffect(handleAmountChange, [currentAmount, hasLoaded.current])

  React.useEffect(() => {
    setCurrentAmount(state.currentAmount)
  }, [state.currentAmount])

  // Toggle Current Amount
  React.useEffect(() => {
    if (!unit || unit === prevUnit.current) return
    if (unit === AmountUnit.Cent) {
      const { convertedCurrencyAmount } = currencyToSats(
        Number(amount),
        display,
        currencyMetadata.fractionDigits,
      )
      dispatch({
        type: ACTIONS.SET_AMOUNT_FROM_PARAMS,
        payload: convertedCurrencyAmount.toString(),
      })
    }
    if (unit === AmountUnit.Sat) {
      const { convertedCurrencyAmount } = satsToCurrency(
        Number(sats),
        display,
        currencyMetadata.fractionDigits,
      )
      dispatch({
        type: ACTIONS.SET_AMOUNT_FROM_PARAMS,
        payload: convertedCurrencyAmount?.toString(),
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unit])

  // Update CurrencyMetadata
  React.useEffect(() => {
    const latestCurrencyMetadata = currencyList?.find((c) => c.id === display)
    if (latestCurrencyMetadata) {
      setCurrencyMetadata(latestCurrencyMetadata)
    }
  }, [display, currencyList])

  // Update Current Amount From Params
  React.useEffect(() => {
    if (!unit || !sats || !amount) return
    const { shouldUpdate, value } = updateCurrentAmountWithParams()
    if (shouldUpdate && value) {
      dispatch({
        type: ACTIONS.SET_AMOUNT_FROM_PARAMS,
        payload: value?.toString(),
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amount, sats, unit, dispatch])

  const calculateExchangeRate = React.useCallback(() => {
    const { formattedCurrency } = satsToCurrency(
      100_000_000, // 1 BTC
      display,
      currencyMetadata.fractionDigits,
    )
    setExchangeRateFormatted(formattedCurrency)
  }, [currencyMetadata.fractionDigits, display, satsToCurrency])

  return (
    <Container className={styles.digits_container}>
      <div className={styles.output}>
        {!state.createdInvoice && !isRunningStandalone() && (
          <button
            onClick={() => {
              dispatch({
                type: ACTIONS.PINNED_TO_HOMESCREEN_MODAL_VISIBLE,
                payload: !state.pinnedToHomeScreenModalVisible,
              })
            }}
            className={styles.pin_btn}
          >
            <Image src="/icons/pin-icon.svg" alt="pin icon" className={styles.pin_icon} />
          </button>
        )}
        <div
          className={`${
            !unit || unit === AmountUnit.Cent ? styles.zero_order : styles.first_order
          }`}
        >
          <CurrencyInput
            style={{
              width: "100%",
              border: 0,
              color: "black",
              backgroundColor: "transparent",
              textAlign: "center",
              fontWeight: 600,
            }}
            value={!amount ? 0 : valueInFiat}
            intlConfig={{ locale: language, currency: display }}
            readOnly={true}
          />
        </div>
        <div
          className={`${unit === AmountUnit.Sat ? styles.zero_order : styles.first_order}
          }`}
        >
          {unit === "CENT" ? "≈" : ""} {formatOperand(valueInSats.toString())} sats
          {!hasLoaded.current && (
            <span
              style={{
                fontSize: "1rem",
                marginLeft: ".5rem",
                width: "18px",
                height: "18px",
              }}
              className={styles.spinner}
            ></span>
          )}
        </div>
        {state.createdInvoice ? null : (
          <button title="toggle currency" onClick={() => toggleCurrency()}>
            <Image
              src="/icons/convert-icon.svg"
              alt="convert to SAT/USD icon"
              width="24"
              height="24"
            />
          </button>
        )}
      </div>

      <div className={styles.output}>
        <span style={{ paddingTop: "1rem", fontSize: ".75rem" }}>
          {exchangeRateFormatted} / BTC
        </span>
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
              disabled={unit === AmountUnit.Sat}
              displayValue={
                getLocaleConfig({ locale: language, currency: display }).decimalSeparator
              }
            />
          ) : (
            <DigitButton digit={""} dispatch={dispatch} disabled={true} />
          )}

          <DigitButton digit={"0"} dispatch={dispatch} />
          <button
            data-testid="backspace-btn"
            className={styles.backspace_icon}
            onClick={() => dispatch({ type: ACTIONS.DELETE_DIGIT })}
          >
            <Image
              src="/icons/backspace-icon.svg"
              alt="delete digit icon"
              width="32"
              height="32"
            />
          </button>
        </div>
      )}

      <div className={styles.pay_btn_container}>
        <button
          data-testid="pay-btn"
          className={state.createdInvoice ? styles.pay_new_btn : styles.pay_btn}
          onClick={() => {
            if (state.createdInvoice) {
              dispatch({ type: ACTIONS.CREATE_NEW_INVOICE })
            } else {
              dispatch({ type: ACTIONS.CREATE_INVOICE, payload: amount?.toString() })
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
