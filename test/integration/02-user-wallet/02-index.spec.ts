import { find } from "lodash"
import { yamlConfig } from "src/config"
import { OnboardingEarn } from "src/types"
import { setAccountStatus, usernameExists } from "src/AdminOps"
import { bitcoindClient, checkIsBalanced, getUserWallet } from "test/helpers"
import { InvoiceUser } from "src/schema"
import { getHash } from "src/utils"
import { baseLogger } from "src/logger"

jest.mock("src/realtimePrice", () => require("test/mocks/realtimePrice"))

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

  it("has a title if it was configured", async () => {
    expect(userWallet2.user.title).toBeTruthy()
  })

  it("does not allow withdraw if the user is new", async () => {
    expect(userWallet2.user.oldEnoughForWithdrawal).toBeFalsy()

    // in 6 days:
    const date = Date.now() + yamlConfig.limits.oldEnoughForWithdrawal - 60 * 60 * 1000

    jest.spyOn(global.Date, "now").mockImplementationOnce(() => new Date(date).valueOf())

    expect(userWallet2.user.oldEnoughForWithdrawal).toBeFalsy()
  })

  it("allows withdraw if user is old enough", async () => {
    expect(userWallet2.user.oldEnoughForWithdrawal).toBeFalsy()

    // TODO make this configurable
    // in 8 days:
    const date = Date.now() + yamlConfig.limits.oldEnoughForWithdrawal + 60 * 60 * 1000

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

  describe("getOnchainFee", () => {
    it("returns a fee greater than zero for an external address", async () => {
      const address = await bitcoindClient.getNewAddress()
      const fee = await userWallet0.getOnchainFee({ address })
      expect(fee).toBeGreaterThan(0)
    })

    it("returns zero for an on us address", async () => {
      const address = await userWallet2.getOnChainAddress()
      const fee = await userWallet0.getOnchainFee({ address })
      expect(fee).toBe(0)
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

  describe("addInvoice", () => {
    it("adds a self generated invoice", async () => {
      const request = await userWallet1.addInvoice({ value: 1000 })
      expect(request.startsWith("lnbcrt10")).toBeTruthy()
      const { uid } = await InvoiceUser.findById(getHash(request))
      expect(String(uid)).toBe(String(userWallet1.user._id))
    })

    it("adds a self generated invoice without amount", async () => {
      const request = await userWallet2.addInvoice({})
      const { uid } = await InvoiceUser.findById(getHash(request))
      expect(String(uid)).toBe(String(userWallet2.user._id))
    })

    it("adds a public invoice", async () => {
      const request = await userWallet1.addInvoice({ selfGenerated: false })
      expect(request.startsWith("lnbcrt1")).toBeTruthy()
      const { uid, selfGenerated } = await InvoiceUser.findById(getHash(request))
      expect(String(uid)).toBe(String(userWallet1.user._id))
      expect(selfGenerated).toBe(false)
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
