"use server"
import { getServerSession } from "next-auth"

import { authOptions } from "../api/auth/[...nextauth]/route"

import { dollarsToCents } from "../utils"

import { CSVRecord } from "./utils"

import { getWalletDetailsByUsername } from "@/services/graphql/queries/get-user-wallet-id"
import { intraLedgerUsdPaymentSend } from "@/services/graphql/mutations/intra-ledger-payment-send/usd"
import { intraLedgerBtcPaymentSend } from "@/services/graphql/mutations/intra-ledger-payment-send/btc"
import { WalletCurrency } from "@/services/graphql/generated"

export type ProcessedRecords = {
  username: string
  recipient_wallet_id: string
  amount: number
  memo?: string
  status: {
    failed: boolean
    message: string | null
  }
}
export const processRecords = async (
  records: CSVRecord[],
  walletType: WalletCurrency,
): Promise<{
  error: boolean
  message: string
  responsePayload: ProcessedRecords[] | null
}> => {
  const session = await getServerSession(authOptions)
  const token = session?.accessToken

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

    const amount = walletType === WalletCurrency.Usd ? record.dollars : record.sats
    processedRecords.push({
      username: record.username,
      recipient_wallet_id: getDefaultWalletID?.data.accountDefaultWallet.id,
      amount: Number(amount),
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

export const processPaymentsServerAction = async (
  records: ProcessedRecords[],
  walletDetails: {
    balance: number
    walletCurrency: string
    id: string
  },
) => {
  const failedPayments: ProcessedRecords[] = []
  const session = await getServerSession(authOptions)
  const token = session?.accessToken
  if (!token) {
    return {
      error: "No token found",
    }
  }

  for (const record of records) {
    let response
    if (walletDetails.walletCurrency === "USD") {
      response = await intraLedgerUsdPaymentSend({
        token,
        amount: dollarsToCents(record.amount),
        memo: record.memo,
        recipientWalletId: record.recipient_wallet_id,
        walletId: walletDetails.id,
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
    } else {
      response = await intraLedgerBtcPaymentSend({
        token,
        amount: record.amount,
        memo: record.memo,
        recipientWalletId: record.recipient_wallet_id,
        walletId: walletDetails.id,
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
