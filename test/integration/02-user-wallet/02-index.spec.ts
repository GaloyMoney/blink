import { Accounts } from "@app"
import { setUsername } from "@app/accounts"
import { delete2fa } from "@app/users"
import { UsernameIsImmutableError, UsernameNotAvailableError } from "@domain/accounts"
import { ValidationError } from "@domain/errors"
import { CsvWalletsExport } from "@services/ledger/csv-wallet-export"
import { AccountsRepository, UsersRepository } from "@services/mongoose"
import { User } from "@services/mongoose/schema"

import {
  createMandatoryUsers,
  createUserAndWalletFromUserRef,
  enable2FA,
  generateTokenHelper,
  getAccountIdByTestUserRef,
  getDefaultWalletIdByTestUserRef,
  getUserIdByTestUserRef,
  getUserRecordByTestUserRef,
} from "test/helpers"

let userRecordA: UserRecord, userRecordC: UserRecord
let walletIdA: WalletId
let accountIdA: AccountId, accountIdB: AccountId, accountIdC: AccountId
let userIdA: UserId

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

    userIdA = await getUserIdByTestUserRef("A")
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
      let result = await setUsername({ username: "user0", id: accountIdA })
      expect(result).not.toBeInstanceOf(Error)
      result = await setUsername({ username: "user1", id: accountIdB })
      expect(result).not.toBeInstanceOf(Error)
    })

    it("does not allow set username if already taken", async () => {
      const username = "user0"
      await expect(setUsername({ username, id: accountIdC })).resolves.toBeInstanceOf(
        UsernameNotAvailableError,
      )
    })

    it("does not allow set username with only case difference", async () => {
      await expect(
        setUsername({ username: "User1", id: accountIdC }),
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
      const username = "user0" as Username

      const accountsRepo = AccountsRepository()
      const account = await accountsRepo.findByUsername(username)
      if (account instanceof Error) throw account
      expect(account.id).toStrictEqual(accountIdA)
    })

    it("return true for other capitalization", async () => {
      const username = "user0" as Username

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
    it("sets account status for given user id", async () => {
      let user = await Accounts.updateAccountStatus({
        id: accountIdC,
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
      const user = await usersRepo.findById(userIdA)
      if (user instanceof Error) throw user

      const secret = await enable2FA(userIdA)
      if (secret instanceof Error) return secret

      userRecordA = await getUserRecordByTestUserRef("A")
      expect(userRecordA.twoFA.secret).toBe(secret)
    })
  })

  describe("delete2fa", () => {
    it("delete 2fa for user0", async () => {
      const usersRepo = UsersRepository()
      const user = await usersRepo.findById(userIdA)
      if (user instanceof Error) throw user

      const token = generateTokenHelper(userRecordA.twoFA.secret)
      const result = await delete2fa({ token, userId: userIdA })
      expect(result).toBeTruthy()
      userRecordA = await getUserRecordByTestUserRef("A")
      expect(userRecordA.twoFA.secret).toBeNull()
    })
  })
})
