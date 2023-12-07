import { CsvWalletsExport } from "@/services/ledger/csv-wallet-export"

import {
  createMandatoryUsers,
  randomPhone,
  createUserAndWalletFromPhone,
  getDefaultWalletIdByPhone,
} from "test/helpers"

let walletIdA: WalletId

const phoneA = randomPhone()

describe("UserWallet", () => {
  beforeAll(async () => {
    await createMandatoryUsers()

    await createUserAndWalletFromPhone(phoneA)

    walletIdA = await getDefaultWalletIdByPhone(phoneA)
  })

  describe("getStringCsv", () => {
    const csvHeader =
      "id,walletId,type,credit,debit,fee,currency,timestamp,pendingConfirmation,journalId,lnMemo,usd,feeUsd,recipientWalletId,username,memoFromPayer,paymentHash,pubkey,feeKnownInAdvance,address,txHash"
    it("exports to csv", async () => {
      const csv = new CsvWalletsExport()
      await csv.addWallet(walletIdA)
      const base64Data = csv.getBase64()
      expect(typeof base64Data).toBe("string")
      const data = Buffer.from(base64Data, "base64")
      expect(data.includes(csvHeader)).toBeTruthy()
    })
  })
})
