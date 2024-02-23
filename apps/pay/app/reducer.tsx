import React from "react"

import { MAX_INPUT_VALUE_LENGTH } from "../config/config"

import { Currency } from "@/lib/graphql/generated"

export const ACTIONS = {
  ADD_DIGIT: "ADD_DIGIT",
  DELETE_DIGIT: "DELETE_DIGIT",
  CLEAR_INPUT: "CLEAR_INPUT",
  CREATE_INVOICE: "CREATE_INVOICE",
  CREATE_NEW_INVOICE: "CREATE_NEW_INVOICE",
  UPDATE_USERNAME: "UPDATE_USERNAME",
  UPDATE_WALLET_CURRENCY: "UPDATE_WALLET_CURRENCY",
  SET_AMOUNT_FROM_PARAMS: "SET_AMOUNT_FROM_PARAMS",
  PINNED_TO_HOMESCREEN_MODAL_VISIBLE: "PINNED_TO_HOMESCREEN_MODAL_VISIBLE",
  BACK: "BACK",
  ADD_MEMO: "ADD_MEMO",
  UPDATE_DISPLAY_CURRENCY_METADATA: "UPDATE_DISPLAY_CURRENCY_METADATA",
} as const

type ActionType = keyof typeof ACTIONS

export type InvoiceState = {
  currentAmount: string
  username: string
  walletCurrency: string
  walletId: string
  createdInvoice: boolean
  pinnedToHomeScreenModalVisible: boolean
  memo: string
  displayCurrencyMetaData: Currency
}

export type ACTION_TYPE = {
  type: ActionType
  payload?: string | string[] | (() => void) | boolean | undefined | Currency
}

function reducer(
  state: React.ComponentState,
  { type, payload }: ACTION_TYPE,
): InvoiceState {
  switch (type) {
    case ACTIONS.ADD_DIGIT:
      if (state.currentAmount.includes("NaN")) {
        state.currentAmount = state.currentAmount.replace("NaN", "")
      }
      if (payload == "0" && state.currentAmount == "0") return state
      if (payload === "." && state.currentAmount.includes(".")) return state
      if (state.currentAmount?.length >= MAX_INPUT_VALUE_LENGTH) return state
      if (state.currentAmount.match(/(\.[0-9]{2,}$|\..*\.)/)) return state
      if (
        payload === "." &&
        (state.currentAmount === "0" || state.currentAmount === "")
      ) {
        return { ...state, currentAmount: "0." }
      }
      if (state.currentAmount === "0" && payload !== ".") {
        return {
          ...state,
          currentAmount: payload,
        }
      }
      return {
        ...state,
        currentAmount: `${state.currentAmount || "0"}${payload}`,
      }

    case ACTIONS.DELETE_DIGIT: {
      if (
        state.currentAmount == null ||
        state.currentAmount === "" ||
        state.currentAmount === "0"
      )
        return { ...state, currentAmount: "0" }
      const updatedAmount = state.currentAmount.slice(0, -1)
      return {
        ...state,
        currentAmount: updatedAmount === "" ? "0" : updatedAmount,
      }
    }

    case ACTIONS.SET_AMOUNT_FROM_PARAMS:
      if (state.currentAmount == null) return state
      if (payload?.toString().match(/(\.[0-9]{2,}$|\..*\.)/)) {
        if (payload?.toString() === "0.00")
          return {
            ...state,
            currentAmount: "0",
          }
        return {
          ...state,
          currentAmount: Number(payload).toFixed(2),
        }
      }
      return {
        ...state,
        currentAmount: payload,
      }

    case ACTIONS.UPDATE_USERNAME:
      return {
        ...state,
        username: payload,
      }

    case ACTIONS.UPDATE_WALLET_CURRENCY:
      return {
        ...state,
        walletCurrency: payload,
      }

    case ACTIONS.CLEAR_INPUT:
      if (state.currentAmount == null) return state
      if (state.username == null) return state

      return {
        ...state,
        currentAmount: "0",
      }

    case ACTIONS.CREATE_INVOICE:
      if (state.createdInvoice) return state
      if (!Number(state.currentAmount)) {
        return state
      }

      return {
        ...state,
        createdInvoice: true,
      }

    case ACTIONS.CREATE_NEW_INVOICE:
      if (!state.createdInvoice) return state

      return {
        ...state,
        createdInvoice: false,
        currentAmount: "0",
        memo: "",
      }

    case ACTIONS.BACK:
      return {
        ...state,
        createdInvoice: false,
      }

    case ACTIONS.PINNED_TO_HOMESCREEN_MODAL_VISIBLE:
      return {
        ...state,
        pinnedToHomeScreenModalVisible: payload,
      }

    case ACTIONS.ADD_MEMO:
      return {
        ...state,
        memo: payload,
      }

    case ACTIONS.UPDATE_DISPLAY_CURRENCY_METADATA:
      return {
        ...state,
        displayCurrencyMetaData: payload,
      }

    default:
      return state
  }
}

export default reducer
