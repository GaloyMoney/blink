import { Accounts } from "@app"
import { setUsername } from "@app/accounts"
import { delete2fa } from "@app/users"
import { getGenericLimits, MS_PER_HOUR } from "@config/app"
import { UsernameIsImmutableError, UsernameNotAvailableError } from "@domain/accounts"
import { ValidationError } from "@domain/errors"
import { CsvWalletsExport } from "@services/ledger/csv-wallet-export"
import { UsersRepository, WalletsRepository } from "@services/mongoose"

import {
  createMandatoryUsers,
  createUserWallet,
  generateTokenHelper,
  getAccountIdByTestUserIndex,
  getDefaultWalletIdByTestUserIndex,
  getUserIdByTestUserIndex,
  enable2FA,
  getUserTypeByTestUserIndex,
} from "test/helpers"

let userType0: UserType, userType2: UserType
let walletId0: WalletId
let accountId0: AccountId, accountId1: AccountId, accountId2: AccountId
let userId0: UserId

describe("UserWallet", () => {
  beforeAll(async () => {
    createMandatoryUsers()

    await createUserWallet(0)
    await createUserWallet(2)

    userType0 = await getUserTypeByTestUserIndex(0)
    userType2 = await getUserTypeByTestUserIndex(2)

    walletId0 = await getDefaultWalletIdByTestUserIndex(0)
    accountId0 = await getAccountIdByTestUserIndex(0)

    await createUserWallet(1)
    accountId1 = await getAccountIdByTestUserIndex(1)

    accountId2 = await getAccountIdByTestUserIndex(2)

    userId0 = await getUserIdByTestUserIndex(0)

    // load edit for admin-panel manual testing
    await createUserWallet(13)
  })

  it("has a role if it was configured", async () => {
    const dealer = await getUserTypeByTestUserIndex(6)
    expect(dealer.role).toBe("dealer")
  })

  it("has currencies if they were configured", async () => {
    await createUserWallet(5)
    const user5 = await getUserTypeByTestUserIndex(5)
    expect(user5.currencies[0]).toMatchObject({ id: "USD", ratio: 1 })
  })

  it("has a title if it was configured", () => {
    expect(userType2.title).toBeTruthy()
  })

  it("does not allow withdraw if the user is new", () => {
    expect(userType2.oldEnoughForWithdrawal).toBeFalsy()

    // in 6 days:
    const genericLimits = getGenericLimits()
    const date =
      Date.now() + genericLimits.oldEnoughForWithdrawalMicroseconds - MS_PER_HOUR

    jest.spyOn(global.Date, "now").mockImplementationOnce(() => new Date(date).valueOf())

    expect(userType2.oldEnoughForWithdrawal).toBeFalsy()
  })

  it("allows withdraw if user is old enough", () => {
    expect(userType2.oldEnoughForWithdrawal).toBeFalsy()

    // TODO make this configurable
    // in 8 days:
    const genericLimits = getGenericLimits()
    const date =
      Date.now() + genericLimits.oldEnoughForWithdrawalMicroseconds + MS_PER_HOUR

    jest.spyOn(global.Date, "now").mockImplementationOnce(() => new Date(date).valueOf())

    expect(userType2.oldEnoughForWithdrawal).toBeTruthy()
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
        setUsername({ username: "bc1ba", id: accountId0 }),
      ).resolves.toBeInstanceOf(ValidationError)
      await expect(
        setUsername({ username: "lnbc1qwe1", id: accountId0 }),
      ).resolves.toBeInstanceOf(ValidationError)
    })

    it("allows set username", async () => {
      let result = await setUsername({ username: "user0", id: accountId0 })
      expect(!!result).toBeTruthy()
      result = await setUsername({ username: "user1", id: accountId1 })
      expect(!!result).toBeTruthy()
    })

    it("does not allow set username if already taken", async () => {
      const username = "user0"

      await createUserWallet(2)
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
      expect(!!result).toBeTruthy()
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

      const walletsRepo = WalletsRepository()
      const wallet = await walletsRepo.findByUsername(username)
      expect(wallet).toStrictEqual(
        expect.objectContaining({
          id: expect.any(String),
        }),
      )
    })

    it("return true for other capitalization", async () => {
      const username = "user0" as Username

      const walletsRepo = WalletsRepository()
      const wallet = await walletsRepo.findByUsername(
        username.toLocaleUpperCase() as Username,
      )
      expect(wallet).toStrictEqual(
        expect.objectContaining({
          id: expect.any(String),
        }),
      )
    })

    it("return false if username does not exist", async () => {
      const walletsRepo = WalletsRepository()
      const wallet = await walletsRepo.findByUsername("user" as Username)
      expect(wallet).toBeInstanceOf(Error)
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

      userType0 = await getUserTypeByTestUserIndex(0)
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
      userType0 = await getUserTypeByTestUserIndex(0)
      expect(userType0.twoFA.secret).toBeNull()
    })
  })
})
