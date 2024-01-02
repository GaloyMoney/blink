import { parse } from "csv-parse/sync"

import { WalletCurrency } from "@/services/graphql/generated"

const CSV_HEADER_USERNAME = "username"
const CSV_HEADER_CENTS = "cents"
const CSV_HEADER_SATS = "sats"
const CSV_HEADER_MEMO = "memo"

export type CSVRecord = {
  username: string
  cents?: string
  sats?: string
  memo?: string
}

function validateCSV(fileContent: string):
  | {
      records: CSVRecord[]
      walletType: WalletCurrency
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
    (headers.includes(CSV_HEADER_CENTS) || headers.includes(CSV_HEADER_SATS)) &&
    headers.length === 3 &&
    headers.includes(CSV_HEADER_MEMO)
  ) {
    const walletType = headers.includes(CSV_HEADER_CENTS)
      ? WalletCurrency.Usd
      : WalletCurrency.Btc

    let totalAmount = 0
    for (const record of records) {
      if (!record.username) {
        return new Error("Record with missing username field found.")
      }

      const amount = walletType === WalletCurrency.Usd ? record.cents : record.sats
      if (!amount || Number(amount) <= 0) {
        return new Error("Record with invalid amount (negative or zero) found.")
      }

      totalAmount += Number(amount)
    }

    return {
      records: records as CSVRecord[],
      walletType,
      totalAmount,
    }
  }

  return new Error("Incorrect CSV Format")
}

export { validateCSV }
