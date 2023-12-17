import { CsvWalletsExport } from "@/services/ledger/csv-wallet-export"

import { createRandomUserAndBtcWallet } from "test/helpers"

describe("CsvWalletsExport", () => {
  const csvHeader =
    "id,walletId,type,credit,debit,fee,currency,timestamp,pendingConfirmation,journalId,lnMemo,usd,feeUsd,recipientWalletId,username,memoFromPayer,paymentHash,pubkey,feeKnownInAdvance,address,txHash"

  it("exports to csv", async () => {
    const newWalletDescriptor = await createRandomUserAndBtcWallet()

    const csv = new CsvWalletsExport()
    await csv.addWallet(newWalletDescriptor.id)
    const base64Data = csv.getBase64()
    expect(typeof base64Data).toBe("string")
    const data = Buffer.from(base64Data, "base64")
    expect(data.includes(csvHeader)).toBeTruthy()
  })
})
