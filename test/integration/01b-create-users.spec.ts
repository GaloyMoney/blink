import { User } from "src/schema"
import { yamlConfig } from "src/config"
import { usernameExists } from "src/AdminOps"
import { setupMongoConnection } from "src/mongodb"

import { getUserWallet } from "test/helpers"

jest.mock("src/realtimePrice", () => require("test/mocks/realtimePrice"))

const username = "user0"
let mongoose, userWallet0, userWallet1, userWallet2

beforeAll(async () => {
  mongoose = await setupMongoConnection()
})

afterAll(async () => {
  await mongoose.connection.close()
})

describe("userWallet", () => {
  beforeAll(async () => {
    userWallet0 = await getUserWallet(0)
    userWallet1 = await getUserWallet(1)
    userWallet2 = await getUserWallet(2)
    //add funder
    await getUserWallet(4)
  })

  it("should have a role if it was configured", async () => {
    const dealer = await getUserWallet(6)
    expect(dealer.user.role).toBe("dealer")
  })

  it("should have currencies if they were configured", async () => {
    const user5 = await getUserWallet(5)
    expect(user5.user.currencies[0]).toMatchObject({ id: "USD", ratio: 1 })
  })

  it("should have a title if it was configured", async () => {
    expect(userWallet2.user.title).toBeTruthy()
  })

  it("should not allow withdraw if user is new", async () => {
    expect(userWallet2.user.oldEnoughForWithdrawal).toBeFalsy()

    // in 6 days:
    const date = Date.now() + yamlConfig.limits.oldEnoughForWithdrawal - 60 * 60 * 1000

    jest.spyOn(global.Date, "now").mockImplementationOnce(() => new Date(date).valueOf())

    expect(userWallet2.user.oldEnoughForWithdrawal).toBeFalsy()
  })

  it("should allow withdraw if user is old enough", async () => {
    expect(userWallet2.user.oldEnoughForWithdrawal).toBeFalsy()

    // TODO make this configurable
    // in 8 days:
    const date = Date.now() + yamlConfig.limits.oldEnoughForWithdrawal + 60 * 60 * 1000

    jest.spyOn(global.Date, "now").mockImplementationOnce(() => new Date(date).valueOf())

    expect(userWallet2.user.oldEnoughForWithdrawal).toBeTruthy()
  })

  describe("setUsername", () => {
    it("should not set username if length less than 3", async () => {
      await expect(userWallet0.setUsername({ username: "ab" })).rejects.toThrow()
    })

    it("should not set username if contains invalid characters", async () => {
      await expect(userWallet0.setUsername({ username: "ab+/" })).rejects.toThrow()
    })

    it("should not allow non english characters", async () => {
      await expect(userWallet0.setUsername({ username: "ñ_user1" })).rejects.toThrow()
    })

    it("should not set username starting with 1, 3, bc1, lnbc1", async () => {
      await expect(userWallet0.setUsername({ username: "1ab" })).rejects.toThrow()
      await expect(userWallet0.setUsername({ username: "3basd" })).rejects.toThrow()
      await expect(userWallet0.setUsername({ username: "bc1ba" })).rejects.toThrow()
      await expect(userWallet0.setUsername({ username: "lnbc1qwe1" })).rejects.toThrow()
    })

    it("should allow set username", async () => {
      let result = await userWallet0.setUsername({ username: "user0" })
      expect(!!result).toBeTruthy()
      result = await userWallet1.setUsername({ username: "user1" })
      expect(!!result).toBeTruthy()
      result = await userWallet2.setUsername({ username: "lily" })
      expect(!!result).toBeTruthy()
    })

    it("should not allow set username if already taken", async () => {
      await getUserWallet(2)
      await expect(userWallet2.setUsername({ username })).rejects.toThrow()
    })

    it("should not allow set username with only case difference", async () => {
      await expect(userWallet2.setUsername({ username: "User1" })).rejects.toThrow()
    })

    it("should not allow re-setting username", async () => {
      await expect(userWallet0.setUsername({ username: "abc" })).rejects.toThrow()
    })
  })

  describe("usernameExists", () => {
    it("should return true if username already exists", async () => {
      const result = await usernameExists({ username })
      expect(result).toBe(true)
    })

    it("should return true for other capitalization", async () => {
      const result = await usernameExists({ username: username.toLocaleUpperCase() })
      expect(result).toBe(true)
    })
  })

  it('"user" should not match', async () => {
    const result = await User.exists({ username: "user" })
    expect(result).toBeFalsy()
  })

  // FIXME: failing for some reason
  // it('sets account status correctly', async () => {
  //   await setAccountStatus({uid: userWallet2._id, status: 'locked'})
  //   await expect(userWallet2.status).toBe('locked')
  // })
})
