import { Accounts } from "@app"
import { setUsername } from "@app/accounts"
import { UsernameIsImmutableError, UsernameNotAvailableError } from "@domain/accounts"
import { ValidationError } from "@domain/shared"
import { CsvWalletsExport } from "@services/ledger/csv-wallet-export"
import { AccountsRepository } from "@services/mongoose"
import { User } from "@services/mongoose/schema"

import {
  createMandatoryUsers,
  createUserAndWalletFromUserRef,
  getAccountIdByTestUserRef,
  getDefaultWalletIdByTestUserRef,
  getUserRecordByTestUserRef,
} from "test/helpers"

let userRecordA: UserRecord, userRecordC: UserRecord
let walletIdA: WalletId
let accountIdA: AccountId, accountIdB: AccountId, accountIdC: AccountId

describe("UserWallet", () => {
  beforeAll(async () => {
    await createMandatoryUsers()

    await createUserAndWalletFromUserRef("A")
    await createUserAndWalletFromUserRef("B")
    await createUserAndWalletFromUserRef("C")

    userRecordA = await getUserRecordByTestUserRef("A")
    userRecordC = await getUserRecordByTestUserRef("C")

    walletIdA = await getDefaultWalletIdByTestUserRef("A")

    accountIdA = await getAccountIdByTestUserRef("A")
    accountIdB = await getAccountIdByTestUserRef("B")
    accountIdC = await getAccountIdByTestUserRef("C")
  })

  it("has a role if it was configured", async () => {
    const dealer = await User.findOne({ role: "dealer" })
    expect(dealer).toHaveProperty("phone")
  })

  it("has a title if it was configured", () => {
    expect(userRecordC.title).toBeTruthy()
  })

  describe("setUsername", () => {
    it("does not set username if length is less than 3", async () => {
      await expect(
        setUsername({ username: "ab", id: accountIdA }),
      ).resolves.toBeInstanceOf(ValidationError)
    })

    it("does not set username if contains invalid characters", async () => {
      await expect(
        setUsername({ username: "ab+/", id: accountIdA }),
      ).resolves.toBeInstanceOf(ValidationError)
    })

    it("does not allow non english characters", async () => {
      await expect(
        setUsername({ username: "ñ_user1", id: accountIdA }),
      ).resolves.toBeInstanceOf(ValidationError)
    })

    it("does not set username starting with 1, 3, bc1, lnbc1", async () => {
      await expect(
        setUsername({ username: "1ab", id: accountIdA }),
      ).resolves.toBeInstanceOf(ValidationError)
      await expect(
        setUsername({ username: "3basd", id: accountIdA }),
      ).resolves.toBeInstanceOf(ValidationError)
      await expect(
        setUsername({ username: "bc1be", id: accountIdA }),
      ).resolves.toBeInstanceOf(ValidationError)
      await expect(
        setUsername({ username: "lnbc1qwe1", id: accountIdA }),
      ).resolves.toBeInstanceOf(ValidationError)
    })

    it("allows set username", async () => {
      let result = await setUsername({ username: "userA", id: accountIdA })
      expect(result).not.toBeInstanceOf(Error)
      result = await setUsername({ username: "userB", id: accountIdB })
      expect(result).not.toBeInstanceOf(Error)
    })

    it("does not allow set username if already taken", async () => {
      const username = "userA"
      await expect(setUsername({ username, id: accountIdC })).resolves.toBeInstanceOf(
        UsernameNotAvailableError,
      )
    })

    it("does not allow set username with only case difference", async () => {
      await expect(
        setUsername({ username: "UserA", id: accountIdC }),
      ).resolves.toBeInstanceOf(UsernameNotAvailableError)

      // set username for accountC
      const result = await setUsername({ username: "lily", id: accountIdC })
      expect(result).not.toBeInstanceOf(Error)
    })

    it("does not allow re-setting username", async () => {
      await expect(
        setUsername({ username: "abc", id: accountIdA }),
      ).resolves.toBeInstanceOf(UsernameIsImmutableError)
    })
  })

  describe("usernameExists", () => {
    it("return true if username already exists", async () => {
      const username = "userA" as Username

      const accountsRepo = AccountsRepository()
      const account = await accountsRepo.findByUsername(username)
      if (account instanceof Error) throw account
      expect(account.id).toStrictEqual(accountIdA)
    })

    it("return true for other capitalization", async () => {
      const username = "userA" as Username

      const accountsRepo = AccountsRepository()
      const account = await accountsRepo.findByUsername(
        username.toLocaleUpperCase() as Username,
      )
      if (account instanceof Error) throw account
      expect(account.id).toStrictEqual(accountIdA)
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

      const updatedByUserId = userRecordA._id as unknown as UserId

      account = await Accounts.updateAccountStatus({
        id: accountIdC,
        status: "pending",
        updatedByUserId,
      })
      if (account instanceof Error) {
        throw account
      }
      expect(account.status).toEqual("pending")

      account = await Accounts.updateAccountStatus({
        id: account.id,
        status: "locked",
        updatedByUserId,
        comment: "Looks spammy",
      })
      if (account instanceof Error) {
        throw account
      }
      expect(account.statusHistory.slice(-1)[0]).toMatchObject({
        status: "locked",
        updatedByUserId,
        comment: "Looks spammy",
      })
      expect(account.status).toEqual("locked")

      account = await Accounts.updateAccountStatus({
        id: account.id,
        status: "active",
        updatedByUserId,
      })
      if (account instanceof Error) {
        throw account
      }
      expect(account.statusHistory.length).toBe(4)
      expect(account.status).toEqual("active")
    })
  })
})
