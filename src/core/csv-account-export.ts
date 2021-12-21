import { LedgerService } from "@services/ledger"
import { createObjectCsvStringifier, createObjectCsvWriter } from "csv-writer"

const header = [
  { id: "id", title: "id" },
  { id: "walletId", title: "walletId" },
  { id: "type", title: "type" },
  { id: "credit", title: "credit" },
  { id: "debit", title: "debit" },
  { id: "fee", title: "fee" },
  { id: "currency", title: "currency" },
  { id: "timestamp", title: "timestamp" },
  { id: "pendingConfirmation", title: "pendingConfirmation" },
  { id: "journalId", title: "journalId" },
  { id: "lnMemo", title: "lnMemo" },
  { id: "usd", title: "usd" },
  { id: "feeUsd", title: "feeUsd" },
  { id: "recipientWalletId", title: "recipientWalletId" },
  { id: "username", title: "username" },
  { id: "memoFromPayer", title: "memoFromPayer" },
  { id: "paymentHash", title: "paymentHash" },
  { id: "pubkey", title: "pubkey" },
  { id: "feeKnownInAdvance", title: "feeKnownInAdvance" },
  { id: "address", title: "address" },
  { id: "txHash", title: "txHash" },
]

export class CSVAccountExport {
  entries: LedgerTransaction[] = []

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
    console.log("saving complete")
  }

  async addWallet({ wallet }): Promise<void | Error> {
    const txs = await LedgerService().getLiabilityTransactions(wallet)
    if (txs instanceof Error) return txs

    this.entries.push(...txs)
  }
}
