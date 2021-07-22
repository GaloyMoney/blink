import { bitcoindClient, getUserWallet } from "test/helpers"

jest.mock("src/realtimePrice", () => require("test/mocks/realtimePrice"))
jest.mock("src/phone-provider", () => require("test/mocks/phone-provider"))

let userWallet0, userWallet1

beforeAll(async () => {
  userWallet0 = await getUserWallet(0)
  userWallet1 = await getUserWallet(1)
})

describe("UserWallet - getOnchainFee", () => {
  it("returns a fee greater than zero for an external address", async () => {
    const address = await bitcoindClient.getNewAddress()
    const fee = await userWallet0.getOnchainFee({ address })
    expect(fee).toBeGreaterThan(0)
  })

  it("returns zero for an on us address", async () => {
    const address = await userWallet1.getOnChainAddress()
    const fee = await userWallet0.getOnchainFee({ address })
    expect(fee).toBe(0)
  })
})
