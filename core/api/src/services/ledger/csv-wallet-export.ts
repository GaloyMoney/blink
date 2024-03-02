import { createObjectCsvStringifier, createObjectCsvWriter } from "csv-writer"

import { LedgerService } from "@/services/ledger"
import { baseLogger } from "@/services/logger"

const header = [
  "id",
  "walletId",
  "type",
  "credit",
  "debit",
  "currency",
  "timestamp",
  "pendingConfirmation",
  "journalId",
  "lnMemo",
  "recipientWalletId",
  "username",
  "memoFromPayer",
  "paymentHash",
  "pubkey",
  "feeKnownInAdvance",
  "satsAmount",
  "centsAmount",
  "satsFee",
  "centsFee",
  "displayAmount",
  "displayFee",
  "displayCurrency",
  "address",
  "txHash",
  "vout",
].map((item) => ({ id: item, title: item }))

export const CsvWalletsExporter = (walletIds: WalletId[]) => {
  const entries: LedgerTransaction<WalletCurrency>[] = []

  const getBase64 = async (): Promise<string | Error> => {
    // TODO: use getTransactionsByWalletIds
    // but first need to understand how not to do pagination

    for (const walletId of walletIds) {
      const txs = await LedgerService().getTransactionsByWalletId(walletId)
      if (txs instanceof Error) return txs

      entries.push(...txs)
    }

    const csvWriter = createObjectCsvStringifier({
      header,
    })

    const headerStringify = csvWriter.getHeaderString()
    const records = csvWriter.stringifyRecords(entries)

    const str = headerStringify + records

    // create buffer from string
    const binaryData = Buffer.from(str, "utf8")

    // decode buffer as base64
    const base64Data = binaryData.toString("base64")

    return base64Data
  }

  const email = async () => {
    // TODO

    const csvWriter = createObjectCsvWriter({
      path: "export_accounts.csv",
      header,
    })

    // save to disk
    await csvWriter.writeRecords(entries)
    baseLogger.info("saving complete")

    // need to upload to a s3-like with a ~1 week peremption
    // and send email to client with the link
  }

  return {
    getBase64,
    email,
  }
}
