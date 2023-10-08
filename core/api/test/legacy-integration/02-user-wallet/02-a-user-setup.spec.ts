import { randomUUID } from "crypto"

import { Accounts } from "@/app"
import { setUsername } from "@/app/accounts"
import { UsernameIsImmutableError, UsernameNotAvailableError } from "@/domain/accounts"
import { ValidationError } from "@/domain/shared"
import { CsvWalletsExport } from "@/services/ledger/csv-wallet-export"
import { AccountsRepository } from "@/services/mongoose"
import { Account } from "@/services/mongoose/schema"

import {
  createMandatoryUsers,
  randomPhone,
  createUserAndWalletFromPhone,
  getAccountRecordByPhone,
  getDefaultWalletIdByPhone,
  getAccountUuidByPhone,
} from "test/helpers"

let accountRecordC: AccountRecord
let walletIdA: WalletId
let accountIdA: AccountUuid, accountIdB: AccountUuid, accountIdC: AccountUuid

const phoneA = randomPhone()
const phoneB = randomPhone()
const phoneC = randomPhone()

describe("UserWallet", () => {
  beforeAll(async () => {
    await createMandatoryUsers()

    await createUserAndWalletFromPhone(phoneA)
    await createUserAndWalletFromPhone(phoneB)
    await createUserAndWalletFromPhone(phoneC)

    accountRecordC = await getAccountRecordByPhone(phoneC)

    walletIdA = await getDefaultWalletIdByPhone(phoneA)

    accountIdA = await getAccountUuidByPhone(phoneA)
    accountIdB = await getAccountUuidByPhone(phoneB)
    accountIdC = await getAccountUuidByPhone(phoneC)
  })

  it("has a role if it was configured", async () => {
    const dealer = await Account.findOne({ role: "dealer" })
    expect(dealer).toBeTruthy()
  })

  it("has a title if it was configured", () => {
    expect(accountRecordC).toHaveProperty("title")
  })

  describe("setUsername", () => {
    it("does not set username if length is less than 3", async () => {
      await expect(
        setUsername({ username: "ab", accountUuid: accountIdA }),
      ).resolves.toBeInstanceOf(ValidationError)
    })

    it("does not set username if contains invalid characters", async () => {
      await expect(
        setUsername({ username: "ab+/", accountUuid: accountIdA }),
      ).resolves.toBeInstanceOf(ValidationError)
    })

    it("does not allow non english characters", async () => {
      await expect(
        setUsername({ username: "ñ_user1", accountUuid: accountIdA }),
      ).resolves.toBeInstanceOf(ValidationError)
    })

    it("does not set username starting with 1, 3, bc1, lnbc1", async () => {
      await expect(
        setUsername({ username: "1ab", accountUuid: accountIdA }),
      ).resolves.toBeInstanceOf(ValidationError)
      await expect(
        setUsername({ username: "3basd", accountUuid: accountIdA }),
      ).resolves.toBeInstanceOf(ValidationError)
      await expect(
        setUsername({ username: "bc1be", accountUuid: accountIdA }),
      ).resolves.toBeInstanceOf(ValidationError)
      await expect(
        setUsername({ username: "lnbc1qwe1", accountUuid: accountIdA }),
      ).resolves.toBeInstanceOf(ValidationError)
    })

    it("allows set username", async () => {
      let result = await setUsername({ username: "userA", accountUuid: accountIdA })
      expect(result).not.toBeInstanceOf(Error)
      result = await setUsername({ username: "userB", accountUuid: accountIdB })
      expect(result).not.toBeInstanceOf(Error)
    })

    it("does not allow set username if already taken", async () => {
      const username = "userA"
      await expect(
        setUsername({ username, accountUuid: accountIdC }),
      ).resolves.toBeInstanceOf(UsernameNotAvailableError)
    })

    it("does not allow set username with only case difference", async () => {
      await expect(
        setUsername({ username: "UserA", accountUuid: accountIdC }),
      ).resolves.toBeInstanceOf(UsernameNotAvailableError)

      // set username for accountC
      const result = await setUsername({ username: "lily", accountUuid: accountIdC })
      expect(result).not.toBeInstanceOf(Error)
    })

    it("does not allow re-setting username", async () => {
      await expect(
        setUsername({ username: "abc", accountUuid: accountIdA }),
      ).resolves.toBeInstanceOf(UsernameIsImmutableError)
    })
  })

  describe("usernameExists", () => {
    it("return true if username already exists", async () => {
      const username = "userA" as Username

      const accountsRepo = AccountsRepository()
      const account = await accountsRepo.findByUsername(username)
      if (account instanceof Error) throw account
      expect(account.uuid).toStrictEqual(accountIdA)
    })

    it("return true for other capitalization", async () => {
      const username = "userA" as Username

      const accountsRepo = AccountsRepository()
      const account = await accountsRepo.findByUsername(
        username.toLocaleUpperCase() as Username,
      )
      if (account instanceof Error) throw account
      expect(account.uuid).toStrictEqual(accountIdA)
    })

    it("return false if username does not exist", async () => {
      const accountsRepo = AccountsRepository()
      const account = await accountsRepo.findByUsername("user" as Username)
      expect(account).toBeInstanceOf(Error)
    })
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
        accountUuid: accountIdC,
        status: "pending",
        updatedByPrivilegedClientId,
      })
      if (account instanceof Error) {
        throw account
      }
      expect(account.status).toEqual("pending")

      account = await Accounts.updateAccountStatus({
        accountUuid: account.uuid,
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
        accountUuid: account.uuid,
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
