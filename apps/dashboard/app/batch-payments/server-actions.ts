"use server"
import { getServerSession } from "next-auth"

import { authOptions } from "../api/auth/[...nextauth]/route"

import { convertUsdToBtcSats, dollarsToCents, getBTCWallet, getUSDWallet } from "../utils"

import {
  AmountCurrency,
  CSVRecord,
  ProcessedRecords,
  TotalAmountForWallets,
} from "./index.types"

import { getWalletDetailsByUsername } from "@/services/graphql/queries/get-user-wallet-id"
import { intraLedgerUsdPaymentSend } from "@/services/graphql/mutations/intra-ledger-payment-send/usd"
import { intraLedgerBtcPaymentSend } from "@/services/graphql/mutations/intra-ledger-payment-send/btc"
import { WalletCurrency } from "@/services/graphql/generated"
import { getRealtimePriceQuery } from "@/services/graphql/queries/realtime-price"

export const processRecords = async (
  records: CSVRecord[],
): Promise<{
  error: boolean
  message: string
  responsePayload: ProcessedRecords[] | null
}> => {
  const session = await getServerSession(authOptions)
  const token = session?.accessToken
  const me = session?.userData.data
  if (!me) {
    return {
      error: true,
      message: "User Not Found",
      responsePayload: null,
    }
  }

  if (!token) {
    return {
      error: true,
      message: "token Not Found",
      responsePayload: null,
    }
  }

  const processedRecords: ProcessedRecords[] = []
  for (const record of records) {
    const getDefaultWalletID = await getWalletDetailsByUsername(token, record.username)
    if (getDefaultWalletID instanceof Error) {
      return {
        error: true,
        message: getDefaultWalletID.message,
        responsePayload: processedRecords,
      }
    }

    processedRecords.push({
      username: record.username,
      recipientWalletId: getDefaultWalletID?.data.accountDefaultWallet.id,
      amount: Number(record.amount),
      currency: record.currency,
      sendingWallet: record.wallet,
      memo: record.memo,
      status: {
        failed: false,
        message: null,
      },
    })
  }

  return {
    error: false,
    message: "success",
    responsePayload: processedRecords,
  }
}

export const processPaymentsServerAction = async (records: ProcessedRecords[]) => {
  const failedPayments: ProcessedRecords[] = []
  const session = await getServerSession(authOptions)

  const token = session?.accessToken
  if (!token) {
    return {
      error: true,
      message: "Session not Found",
      responsePayload: null,
    }
  }

  const btcWallet = getBTCWallet(session.userData.data)
  const usdWallet = getUSDWallet(session.userData.data)
  const realtimePrice = await getRealtimePriceQuery(token)
  if (realtimePrice instanceof Error) {
    return {
      error: true,
      message: realtimePrice.message,
      responsePayload: null,
    }
  }

  if (!btcWallet || !usdWallet) {
    return {
      error: true,
      message: "Wallet details not Found",
      responsePayload: null,
    }
  }
  for (const record of records) {
    let response
    if (record.sendingWallet === WalletCurrency.Usd) {
      response = await intraLedgerUsdPaymentSend({
        token,
        amount: dollarsToCents(record.amount),
        memo: record.memo,
        recipientWalletId: record.recipientWalletId,
        walletId: usdWallet?.id,
      })
      if (response instanceof Error) {
        failedPayments.push({
          ...record,
          status: {
            failed: true,
            message: response.message,
          },
        })
      } else if (response?.intraLedgerUsdPaymentSend.errors.length) {
        failedPayments.push({
          ...record,
          status: {
            failed: true,
            message: response?.intraLedgerUsdPaymentSend.errors[0].message,
          },
        })
      }
    } else if (record.sendingWallet === WalletCurrency.Btc) {
      let amount = record.amount
      if (record.currency === AmountCurrency.USD) {
        amount = convertUsdToBtcSats(record.amount, realtimePrice.data)
      }
      response = await intraLedgerBtcPaymentSend({
        token,
        amount,
        memo: record.memo,
        recipientWalletId: record.recipientWalletId,
        walletId: btcWallet.id,
      })

      if (response instanceof Error) {
        failedPayments.push({
          ...record,
          status: {
            failed: true,
            message: response.message,
          },
        })
      } else if (response?.intraLedgerPaymentSend.errors.length) {
        failedPayments.push({
          ...record,
          status: {
            failed: true,
            message: response?.intraLedgerPaymentSend.errors[0].message,
          },
        })
      }
    }
  }

  if (failedPayments.length > 0) {
    return {
      error: true,
      message: `Transaction unsuccessful for certain orders. Please attempt to retry these failed orders`,
      responsePayload: failedPayments,
    }
  }

  return {
    error: false,
    message: "success",
    responsePayload: null,
  }
}

export const validatePaymentDetail = async (
  TotalAmount: TotalAmountForWallets,
): Promise<{
  error: boolean
  message: string
  responsePayload: {
    transactionAmount: {
      totalAmountForBTCWallet: number
      totalAmountForUSDWallet: number
    }
    userWalletBalance: {
      btcWalletBalance: number
      usdWalletBalance: number
    }
  } | null
}> => {
  // TODO move this logic to client side by setting up apollo clint
  const session = await getServerSession(authOptions)
  const token = session?.accessToken
  const me = session?.userData.data
  if (!me || !token) {
    return {
      error: true,
      message: "User Not Found",
      responsePayload: null,
    }
  }

  const btcWallet = getBTCWallet(session.userData.data)
  const usdWallet = getUSDWallet(session.userData.data)

  if (!btcWallet || !usdWallet) {
    return {
      error: true,
      message: "Wallet details not Found",
      responsePayload: null,
    }
  }

  const realtimePrice = await getRealtimePriceQuery(token)
  if (realtimePrice instanceof Error) {
    return {
      error: true,
      message: realtimePrice.message,
      responsePayload: null,
    }
  }

  const totalAmountForBTCWallet =
    TotalAmount.wallets.BTC.SATS +
    convertUsdToBtcSats(TotalAmount.wallets.USD, realtimePrice.data)
  const totalAmountForUSDWallet = TotalAmount.wallets.USD * 100
  if (
    btcWallet?.balance >= totalAmountForBTCWallet &&
    usdWallet?.balance >= totalAmountForUSDWallet
  ) {
    return {
      error: false,
      message: "success",
      responsePayload: {
        transactionAmount: {
          totalAmountForBTCWallet,
          totalAmountForUSDWallet,
        },
        userWalletBalance: {
          btcWalletBalance: btcWallet?.balance,
          usdWalletBalance: usdWallet?.balance,
        },
      },
    }
  }

  return {
    error: true,
    message: "Insufficient Balance",
    responsePayload: null,
  }
}
