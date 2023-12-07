import { randomUUID } from "crypto"

import { Accounts } from "@/app"
import { CsvWalletsExport } from "@/services/ledger/csv-wallet-export"

import {
  createMandatoryUsers,
  randomPhone,
  createUserAndWalletFromPhone,
  getDefaultWalletIdByPhone,
  getAccountIdByPhone,
} from "test/helpers"

let walletIdA: WalletId
let accountIdC: AccountId

const phoneA = randomPhone()
const phoneC = randomPhone()

describe("UserWallet", () => {
  beforeAll(async () => {
    await createMandatoryUsers()

    await createUserAndWalletFromPhone(phoneA)
    await createUserAndWalletFromPhone(phoneC)

    walletIdA = await getDefaultWalletIdByPhone(phoneA)

    accountIdC = await getAccountIdByPhone(phoneC)
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

  describe("updateAccountStatus", () => {
    it("sets account status (with history) for given user id", async () => {
      let account

      const updatedByPrivilegedClientId = randomUUID() as PrivilegedClientId

      account = await Accounts.updateAccountStatus({
        accountId: accountIdC,
        status: "pending",
        updatedByPrivilegedClientId,
      })
      if (account instanceof Error) {
        throw account
      }
      expect(account.status).toEqual("pending")

      account = await Accounts.updateAccountStatus({
        accountId: account.id,
        status: "locked",
        updatedByPrivilegedClientId,
        comment: "Looks spammy",
      })
      if (account instanceof Error) {
        throw account
      }
      expect(account.statusHistory.slice(-1)[0]).toMatchObject({
        status: "locked",
        updatedByPrivilegedClientId,
        comment: "Looks spammy",
      })
      expect(account.status).toEqual("locked")

      account = await Accounts.updateAccountStatus({
        accountId: account.id,
        status: "active",
        updatedByPrivilegedClientId,
      })
      if (account instanceof Error) {
        throw account
      }
      expect(account.statusHistory.length).toBe(4)
      expect(account.status).toEqual("active")
    })
  })
})
