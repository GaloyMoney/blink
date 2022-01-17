import { Accounts } from "@app"
import { setUsername } from "@app/accounts"
import { delete2fa } from "@app/users"
import { UsernameIsImmutableError, UsernameNotAvailableError } from "@domain/accounts"
import { ValidationError } from "@domain/errors"
import { CsvWalletsExport } from "@services/ledger/csv-wallet-export"
import { AccountsRepository, UsersRepository } from "@services/mongoose"

import {
  createMandatoryUsers,
  createUserWallet,
  enable2FA,
  generateTokenHelper,
  getAccountIdByTestUserIndex,
  getDefaultWalletIdByTestUserIndex,
  getUserIdByTestUserIndex,
  getUserRecordByTestUserIndex,
} from "test/helpers"

let userType0: UserRecord, userType2: UserRecord
let walletId0: WalletId
let accountId0: AccountId, accountId1: AccountId, accountId2: AccountId
let userId0: UserId

describe("UserWallet", () => {
  beforeAll(async () => {
    await createMandatoryUsers()

    await createUserWallet(0)
    await createUserWallet(1)
    await createUserWallet(2)

    // load edit for admin-panel manual testing
    await createUserWallet(13)

    userType0 = await getUserRecordByTestUserIndex(0)
    userType2 = await getUserRecordByTestUserIndex(2)

    walletId0 = await getDefaultWalletIdByTestUserIndex(0)

    accountId0 = await getAccountIdByTestUserIndex(0)
    accountId1 = await getAccountIdByTestUserIndex(1)
    accountId2 = await getAccountIdByTestUserIndex(2)

    userId0 = await getUserIdByTestUserIndex(0)
  })

  it("has a role if it was configured", async () => {
    const dealer = await getUserRecordByTestUserIndex(6)
    expect(dealer.role).toBe("dealer")
  })

  it("has a title if it was configured", () => {
    expect(userType2.title).toBeTruthy()
  })

  describe("setUsername", () => {
    it("does not set username if length is less than 3", async () => {
      await expect(
        setUsername({ username: "ab", id: accountId0 }),
      ).resolves.toBeInstanceOf(ValidationError)
    })

    it("does not set username if contains invalid characters", async () => {
      await expect(
        setUsername({ username: "ab+/", id: accountId0 }),
      ).resolves.toBeInstanceOf(ValidationError)
    })

    it("does not allow non english characters", async () => {
      await expect(
        setUsername({ username: "ñ_user1", id: accountId0 }),
      ).resolves.toBeInstanceOf(ValidationError)
    })

    it("does not set username starting with 1, 3, bc1, lnbc1", async () => {
      await expect(
        setUsername({ username: "1ab", id: accountId0 }),
      ).resolves.toBeInstanceOf(ValidationError)
      await expect(
        setUsername({ username: "3basd", id: accountId0 }),
      ).resolves.toBeInstanceOf(ValidationError)
      await expect(
        setUsername({ username: "bc1be", id: accountId0 }),
      ).resolves.toBeInstanceOf(ValidationError)
      await expect(
        setUsername({ username: "lnbc1qwe1", id: accountId0 }),
      ).resolves.toBeInstanceOf(ValidationError)
    })

    it("allows set username", async () => {
      let result = await setUsername({ username: "user0", id: accountId0 })
      expect(result).not.toBeInstanceOf(Error)
      result = await setUsername({ username: "user1", id: accountId1 })
      expect(result).not.toBeInstanceOf(Error)
    })

    it("does not allow set username if already taken", async () => {
      const username = "user0"
      await expect(setUsername({ username, id: accountId2 })).resolves.toBeInstanceOf(
        UsernameNotAvailableError,
      )
    })

    it("does not allow set username with only case difference", async () => {
      await expect(
        setUsername({ username: "User1", id: accountId2 }),
      ).resolves.toBeInstanceOf(UsernameNotAvailableError)

      // set username for account2
      const result = await setUsername({ username: "lily", id: accountId2 })
      expect(result).not.toBeInstanceOf(Error)
    })

    it("does not allow re-setting username", async () => {
      await expect(
        setUsername({ username: "abc", id: accountId0 }),
      ).resolves.toBeInstanceOf(UsernameIsImmutableError)
    })
  })

  describe("usernameExists", () => {
    it("return true if username already exists", async () => {
      const username = "user0" as Username

      const accountsRepo = AccountsRepository()
      const account = await accountsRepo.findByUsername(username)
      expect(account).toStrictEqual(
        expect.objectContaining({
          id: expect.any(String),
        }),
      )
    })

    it("return true for other capitalization", async () => {
      const username = "user0" as Username

      const accountsRepo = AccountsRepository()
      const account = await accountsRepo.findByUsername(
        username.toLocaleUpperCase() as Username,
      )
      expect(account).toStrictEqual(
        expect.objectContaining({
          id: expect.any(String),
        }),
      )
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
      await csv.addWallet(walletId0)
      const base64Data = csv.getBase64()
      expect(typeof base64Data).toBe("string")
      const data = Buffer.from(base64Data, "base64")
      expect(data.includes(csvHeader)).toBeTruthy()
    })
  })

  describe("updateAccountStatus", () => {
    it("sets account status for given user id", async () => {
      let user = await Accounts.updateAccountStatus({
        id: accountId2,
        status: "locked",
      })
      if (user instanceof Error) {
        throw user
      }
      expect(user.status).toBe("locked")
      user = await Accounts.updateAccountStatus({ id: user.id, status: "active" })
      if (user instanceof Error) {
        throw user
      }
      expect(user.status).toBe("active")
    })
  })

  describe("save2fa", () => {
    it("saves 2fa for user0", async () => {
      const usersRepo = UsersRepository()
      const user = await usersRepo.findById(userId0)
      if (user instanceof Error) throw user

      const secret = await enable2FA(userId0)
      if (secret instanceof Error) return secret

      userType0 = await getUserRecordByTestUserIndex(0)
      expect(userType0.twoFA.secret).toBe(secret)
    })
  })

  describe("delete2fa", () => {
    it("delete 2fa for user0", async () => {
      const usersRepo = UsersRepository()
      const user = await usersRepo.findById(userId0)
      if (user instanceof Error) throw user

      const token = generateTokenHelper(userType0.twoFA.secret)
      const result = await delete2fa({ token, userId: userId0 })
      expect(result).toBeTruthy()
      userType0 = await getUserRecordByTestUserIndex(0)
      expect(userType0.twoFA.secret).toBeNull()
    })
  })
})
