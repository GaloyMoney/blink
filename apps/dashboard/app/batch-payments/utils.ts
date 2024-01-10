import { parse } from "csv-parse/sync"

import { centsToDollars } from "../utils"

import { AmountCurrency, CSVRecord, TotalPayingAmountForWallets } from "./index.types"

import { WalletCurrency } from "@/services/graphql/generated"

const HEADERS = {
  USERNAME: "username",
  AMOUNT: "amount",
  CURRENCY: "currency",
  WALLET: "wallet",
  MEMO: "memo",
} as const

export function validateCSV({
  fileContent,
  defaultWallet,
}: {
  fileContent: string
  defaultWallet: WalletCurrency
}):
  | {
      records: CSVRecord[]
      totalAmount: TotalPayingAmountForWallets
    }
  | Error {
  let records
  try {
    records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
    })
  } catch (err) {
    return new Error("Invalid CSV Format")
  }

  if (records.length === 0) {
    return new Error("No records found")
  }

  const totalAmount: TotalPayingAmountForWallets = {
    wallets: {
      btcWallet: {
        SATS: 0,
        USD: 0,
      },
      usdWallet: {
        USD: 0,
      },
    },
  }

  const headers = Object.keys(records[0])
  if (
    !headers.includes(HEADERS.USERNAME) ||
    !headers.includes(HEADERS.AMOUNT) ||
    !headers.includes(HEADERS.CURRENCY)
  ) {
    return new Error("Missing required CSV headers")
  }

  for (const record of records) {
    if (!record.username || !record.amount || !record.currency) {
      return new Error("Record with missing required field found.")
    }

    if (
      record.currency !== AmountCurrency.SATS &&
      record.currency !== AmountCurrency.USD
    ) {
      return new Error("Invalid currency type")
    }

    if (
      record.wallet &&
      record.wallet !== WalletCurrency.Usd &&
      record.wallet !== WalletCurrency.Btc
    ) {
      return new Error("Invalid wallet type")
    }

    if (record.wallet === WalletCurrency.Usd && record.currency === AmountCurrency.SATS) {
      return new Error(
        "Invalid wallet currency combination, cannot use SATS with USD wallet",
      )
    }

    let amount = Number(record.amount)
    if (isNaN(amount) || amount <= 0) {
      return new Error("Record with invalid amount")
    }

    if (record.currency === AmountCurrency.SATS) {
      amount = Math.floor(amount)
      record.amount = amount
    } else if (record.currency === AmountCurrency.USD) {
      amount = Math.floor(amount * 100) / 100
      record.amount = amount
    }

    if (
      !record.wallet &&
      record.currency === AmountCurrency.SATS &&
      defaultWallet === WalletCurrency.Usd
    ) {
      return new Error(
        "Your default wallet currency is USD, which doesn't support SATS currency. Please specify BTC Wallet to use SATS currency.",
      )
    }

    if (!record.wallet) {
      record.wallet = defaultWallet
    }

    if (record.wallet === WalletCurrency.Btc) {
      if (record.currency === AmountCurrency.SATS) {
        totalAmount.wallets.btcWallet.SATS += amount
      } else {
        totalAmount.wallets.btcWallet.USD += amount
      }
    } else {
      totalAmount.wallets.usdWallet.USD += amount
    }
  }

  return {
    records: records as CSVRecord[],
    totalAmount,
  }
}

export const displayWalletBalanceBatchPayments = ({
  amount,
  walletCurrency,
}: {
  amount: number
  walletCurrency: WalletCurrency
}) => {
  return walletCurrency === WalletCurrency.Usd
    ? `$${centsToDollars(amount)} USD`
    : `${amount} sats`
}

export const displayCurrencyBatchPayments = ({
  walletCurrency,
}: {
  walletCurrency: WalletCurrency
}) => {
  return walletCurrency === WalletCurrency.Usd ? "USD" : "sats"
}
