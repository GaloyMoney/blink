import { getHash } from "@core/utils"
import { InvoiceUser } from "@services/mongoose/schema"
import { getUserWallet } from "test/helpers"

jest.mock("@services/realtime-price", () => require("test/mocks/realtime-price"))
jest.mock("@services/phone-provider", () => require("test/mocks/phone-provider"))

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
