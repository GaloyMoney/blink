import { createObjectCsvStringifier, createObjectCsvWriter } from "csv-writer"

import { LedgerService } from "@/services/ledger"
import { baseLogger } from "@/services/logger"

const headers_field = [
  "id",
  "walletId",
  "type",
  "credit",
  "debit",
  "fee",
  "currency",
  "timestamp",
  "pendingConfirmation",
  "journalId",
  "lnMemo",
  "usd",
  "feeUsd",
  "recipientWalletId",
  "username",
  "memoFromPayer",
  "paymentHash",
  "pubkey",
  "feeKnownInAdvance",
  "address",
  "txHash",
  "displayAmount",
  "displayFee",
  "displayCurrency",
]

const header = headers_field.map((item) => ({ id: item, title: item }))

export class CsvWalletsExport {
  entries: LedgerTransaction<WalletCurrency>[] = []

  getBase64(): string {
    const csvWriter = createObjectCsvStringifier({
      header,
    })

    const header_stringify = csvWriter.getHeaderString()
    const records = csvWriter.stringifyRecords(this.entries)

    const str = header_stringify + records

    // create buffer from string
    const binaryData = Buffer.from(str, "utf8")

    // decode buffer as base64
    const base64Data = binaryData.toString("base64")

    return base64Data
  }

  async saveToDisk(): Promise<void> {
    const csvWriter = createObjectCsvWriter({
      path: "export_accounts.csv",
      header,
    })

    await csvWriter.writeRecords(this.entries)
    baseLogger.info("saving complete")
  }

  async addWallet(walletId: WalletId): Promise<void | ApplicationError> {
    // TODO: interface could be improved by returning self, so that it's
    // possible to run csv.addWallet(wallet).getBase64()
    const txs = await LedgerService().getTransactionsByWalletId(walletId)
    if (txs instanceof Error) return txs

    this.entries.push(...txs)
  }
}
