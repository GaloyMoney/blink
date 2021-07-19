import { getHash } from "src/utils"
import { InvoiceUser } from "src/schema"
import { getUserWallet } from "test/helpers"

jest.mock("src/realtimePrice", () => require("test/mocks/realtimePrice"))

let userWallet1

beforeAll(async () => {
  userWallet1 = await getUserWallet(1)
})

describe("UserWallet - addInvoice", () => {
  it("adds a self generated invoice", async () => {
    const request = await userWallet1.addInvoice({ value: 1000 })
    expect(request.startsWith("lnbcrt10")).toBeTruthy()
    const { uid } = await InvoiceUser.findById(getHash(request))
    expect(String(uid)).toBe(String(userWallet1.user._id))
  })

  it("adds a self generated invoice without amount", async () => {
    const request = await userWallet1.addInvoice({})
    const { uid } = await InvoiceUser.findById(getHash(request))
    expect(String(uid)).toBe(String(userWallet1.user._id))
  })

  it("adds a public invoice", async () => {
    const request = await userWallet1.addInvoice({ selfGenerated: false })
    expect(request.startsWith("lnbcrt1")).toBeTruthy()
    const { uid, selfGenerated } = await InvoiceUser.findById(getHash(request))
    expect(String(uid)).toBe(String(userWallet1.user._id))
    expect(selfGenerated).toBe(false)
  })
})
