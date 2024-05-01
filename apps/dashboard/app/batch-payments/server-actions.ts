"use server"
import { getServerSession } from "next-auth"

import { authOptions } from "../api/auth/[...nextauth]/route"

import { convertUsdToBtcSats, dollarsToCents, getBTCWallet, getUSDWallet } from "../utils"

import {
  AmountCurrency,
  ProcessedRecords,
  TotalPayingAmountForWallets,
} from "./index.types"

import { intraLedgerUsdPaymentSend } from "@/services/graphql/mutations/intra-ledger-payment-send/usd"
import { intraLedgerBtcPaymentSend } from "@/services/graphql/mutations/intra-ledger-payment-send/btc"
import { WalletCurrency } from "@/services/graphql/generated"
import { getRealtimePriceQuery } from "@/services/graphql/queries/realtime-price"

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
  const realtimePrice = await getRealtimePriceQuery()
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
  TotalAmount: TotalPayingAmountForWallets,
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
  if (!session?.userData.data || !session?.accessToken) {
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

  const realtimePrice = await getRealtimePriceQuery()
  if (realtimePrice instanceof Error) {
    return {
      error: true,
      message: realtimePrice.message,
      responsePayload: null,
    }
  }

  const totalAmountForBTCWallet =
    TotalAmount.wallets.btcWallet.SATS +
    convertUsdToBtcSats(TotalAmount.wallets.btcWallet.USD, realtimePrice.data)
  const totalAmountForUSDWallet = dollarsToCents(TotalAmount.wallets.usdWallet.USD)

  if (
    btcWallet?.balance < totalAmountForBTCWallet ||
    usdWallet?.balance < totalAmountForUSDWallet
  ) {
    return {
      error: true,
      message: "Insufficient Balance",
      responsePayload: null,
    }
  }

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
