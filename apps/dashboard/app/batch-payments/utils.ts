import { parse } from "csv-parse/sync"

import { centsToDollars } from "../utils"

import { WalletCurrency } from "@/services/graphql/generated"

const CSV_HEADER_USERNAME = "username"
const CSV_HEADER_DOLLARS = "dollars"
const CSV_HEADER_SATS = "sats"
const CSV_HEADER_MEMO = "memo"

export type CSVRecord = {
  username: string
  dollars?: string
  sats?: string
  memo?: string
}

export function validateCSV(fileContent: string):
  | {
      records: CSVRecord[]
      walletCurrency: WalletCurrency
      totalAmount: number
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

  const headers = Object.keys(records[0])

  if (
    headers.includes(CSV_HEADER_USERNAME) &&
    (headers.includes(CSV_HEADER_DOLLARS) || headers.includes(CSV_HEADER_SATS)) &&
    headers.length === 3 &&
    headers.includes(CSV_HEADER_MEMO)
  ) {
    const walletCurrency = headers.includes(CSV_HEADER_DOLLARS)
      ? WalletCurrency.Usd
      : WalletCurrency.Btc

    let totalAmount = 0
    for (const record of records) {
      if (!record.username) {
        return new Error("Record with missing username field found.")
      }

      const amount = walletCurrency === WalletCurrency.Usd ? record.dollars : record.sats
      if (!amount || Number(amount) <= 0) {
        return new Error("Record with invalid amount")
      }

      totalAmount += Number(amount)
    }

    return {
      records: records as CSVRecord[],
      walletCurrency,
      totalAmount,
    }
  }

  return new Error("Incorrect CSV Format")
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
