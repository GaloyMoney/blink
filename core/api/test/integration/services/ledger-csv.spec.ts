import { CsvWalletsExporter } from "@/services/ledger/csv-wallet-export"
import { createRandomUserAndBtcWallet } from "test/helpers"

describe("CsvWalletsExporter", () => {
  const csvHeader =
    "id,walletId,type,credit,debit,currency,timestamp,pendingConfirmation,journalId,lnMemo,recipientWalletId,username,memoFromPayer,paymentHash,pubkey,feeKnownInAdvance,satsAmount,centsAmount,satsFee,centsFee,displayAmount,displayFee,displayCurrency,address,txHash,vout"

  it("exports to csv", async () => {
    const newWalletDescriptor = await createRandomUserAndBtcWallet()

    const exporter = CsvWalletsExporter([newWalletDescriptor.id])
    const base64Data = await exporter.getBase64()
    expect(typeof base64Data).toBe("string")
    if (base64Data instanceof Error) throw base64Data
    const data = Buffer.from(base64Data, "base64")
    expect(data.includes(csvHeader)).toBeTruthy()
  })
})
