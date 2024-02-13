import React from "react"

import { MAX_INPUT_VALUE_LENGTH } from "../config/config"

export const ACTIONS = {
  ADD_DIGIT: "add-digit",
  DELETE_DIGIT: "delete-digit",
  CLEAR_INPUT: "clear-input",
  CREATE_INVOICE: "create-invoice",
  CREATE_NEW_INVOICE: "create-new-invoice",
  UPDATE_USERNAME: "update-username",
  UPDATE_WALLET_CURRENCY: "update-wallet-currency",
  SET_AMOUNT_FROM_PARAMS: "set-amount-from-search",
  PINNED_TO_HOMESCREEN_MODAL_VISIBLE: "pin-to-home-screen-modal-visible",
  BACK: "back-by-one-history",
  ADD_MEMO: "add-memo",
}

export type ACTION_TYPE = {
  type: string
  payload?: string | string[] | (() => void) | boolean | undefined
}

function reducer(state: React.ComponentState, { type, payload }: ACTION_TYPE) {
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
      return {
        ...state,
        currentAmount: `${state.currentAmount || ""}${payload}`,
      }

    case ACTIONS.DELETE_DIGIT:
      if (state.currentAmount == null) return state
      return {
        ...state,
        currentAmount: state.currentAmount?.slice(0, -1),
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

    default:
      return state
  }
}

export default reducer
