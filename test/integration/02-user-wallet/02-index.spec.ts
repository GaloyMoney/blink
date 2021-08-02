import { getGenericLimits, MS_PER_HOUR } from "@config/app"
import { getUserWallet } from "test/helpers"
import { setAccountStatus } from "@core/admin-ops"
import { usernameExists } from "@domain/user"

jest.mock("@services/realtime-price", () => require("test/mocks/realtime-price"))
jest.mock("@services/phone-provider", () => require("test/mocks/phone-provider"))

let userWallet0, userWallet1, userWallet2
const username = "user0"

describe("UserWallet", () => {
  beforeAll(async () => {
    userWallet0 = await getUserWallet(0)
    userWallet1 = await getUserWallet(1)
    userWallet2 = await getUserWallet(2)
    // load funder wallet before use it
    await getUserWallet(4)
  })

  it("has a role if it was configured", async () => {
    const dealer = await getUserWallet(6)
    expect(dealer.user.role).toBe("dealer")
  })

  it("has currencies if they were configured", async () => {
    const user5 = await getUserWallet(5)
    expect(user5.user.currencies[0]).toMatchObject({ id: "USD", ratio: 1 })
  })

  it("has a title if it was configured", () => {
    expect(userWallet2.user.title).toBeTruthy()
  })

  it("does not allow withdraw if the user is new", () => {
    expect(userWallet2.user.oldEnoughForWithdrawal).toBeFalsy()

    // in 6 days:
    const genericLimits = getGenericLimits()
    const date =
      Date.now() + genericLimits.oldEnoughForWithdrawalMicroseconds - MS_PER_HOUR

    jest.spyOn(global.Date, "now").mockImplementationOnce(() => new Date(date).valueOf())

    expect(userWallet2.user.oldEnoughForWithdrawal).toBeFalsy()
  })

  it("allows withdraw if user is old enough", () => {
    expect(userWallet2.user.oldEnoughForWithdrawal).toBeFalsy()

    // TODO make this configurable
    // in 8 days:
    const genericLimits = getGenericLimits()
    const date =
      Date.now() + genericLimits.oldEnoughForWithdrawalMicroseconds + MS_PER_HOUR

    jest.spyOn(global.Date, "now").mockImplementationOnce(() => new Date(date).valueOf())

    expect(userWallet2.user.oldEnoughForWithdrawal).toBeTruthy()
  })

  describe("setUsername", () => {
    it("does not set username if length is less than 3", async () => {
      await expect(userWallet0.setUsername({ username: "ab" })).rejects.toThrow()
    })

    it("does not set username if contains invalid characters", async () => {
      await expect(userWallet0.setUsername({ username: "ab+/" })).rejects.toThrow()
    })

    it("does not allow non english characters", async () => {
      await expect(userWallet0.setUsername({ username: "ñ_user1" })).rejects.toThrow()
    })

    it("does not set username starting with 1, 3, bc1, lnbc1", async () => {
      await expect(userWallet0.setUsername({ username: "1ab" })).rejects.toThrow()
      await expect(userWallet0.setUsername({ username: "3basd" })).rejects.toThrow()
      await expect(userWallet0.setUsername({ username: "bc1ba" })).rejects.toThrow()
      await expect(userWallet0.setUsername({ username: "lnbc1qwe1" })).rejects.toThrow()
    })

    it("allows set username", async () => {
      let result = await userWallet0.setUsername({ username: "user0" })
      expect(!!result).toBeTruthy()
      result = await userWallet1.setUsername({ username: "user1" })
      expect(!!result).toBeTruthy()
      result = await userWallet2.setUsername({ username: "lily" })
      expect(!!result).toBeTruthy()
    })

    it("does not allow set username if already taken", async () => {
      await getUserWallet(2)
      await expect(userWallet2.setUsername({ username })).rejects.toThrow()
    })

    it("does not allow set username with only case difference", async () => {
      await expect(userWallet2.setUsername({ username: "User1" })).rejects.toThrow()
    })

    it("does not allow re-setting username", async () => {
      await expect(userWallet0.setUsername({ username: "abc" })).rejects.toThrow()
    })
  })

  describe("usernameExists", () => {
    it("return true if username already exists", async () => {
      const result = await usernameExists({ username })
      expect(result).toBe(true)
    })

    it("return true for other capitalization", async () => {
      const result = await usernameExists({ username: username.toLocaleUpperCase() })
      expect(result).toBe(true)
    })

    it("return false if username does not exist", async () => {
      const result = await usernameExists({ username: "user" })
      expect(result).toBe(false)
    })
  })

  describe("getStringCsv", () => {
    const csvHeader =
      "voided,approved,_id,accounts,credit,debit,_journal,book,unix,date,datetime,currency,username,type,hash,txid,fee,feeUsd,sats,usd,memo,memoPayer,meta,pending"
    it("exports to csv", async () => {
      const base64Data = await userWallet0.getStringCsv()
      expect(typeof base64Data).toBe("string")
      const data = Buffer.from(base64Data, "base64")
      expect(data.includes(csvHeader)).toBeTruthy()
    })
  })

  describe("setAccountStatus", () => {
    it("sets account status for given user id", async () => {
      let user = await setAccountStatus({ uid: userWallet2.user._id, status: "locked" })
      expect(user.status).toBe("locked")
      user = await setAccountStatus({ uid: user._id, status: "active" })
      expect(user.status).toBe("active")
    })
  })
})
