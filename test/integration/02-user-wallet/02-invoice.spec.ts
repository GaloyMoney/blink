import {
  addInvoice,
  addInvoiceNoAmount,
  addInvoiceForRecipient,
  addInvoiceNoAmountForRecipient,
} from "@app/wallets"

import { getInvoiceCreateAttemptLimits } from "@config/app"
import { getHash } from "@core/utils"
import { toSats } from "@domain/bitcoin"
import { InvoiceCreateRateLimiterExceededError } from "@domain/rate-limit/errors"
import { InvoiceUser } from "@services/mongoose/schema"
import { getUserWallet } from "test/helpers"
import { resetSelfWalletIdLimits } from "test/helpers/rate-limit"

jest.mock("@services/realtime-price", () => require("test/mocks/realtime-price"))
jest.mock("@services/phone-provider", () => require("test/mocks/phone-provider"))

let userWallet1

beforeAll(async () => {
  userWallet1 = await getUserWallet(1)
})

describe("UserWallet - addInvoice", () => {
  it("adds a self generated invoice", async () => {
    const lnInvoice = await addInvoice({
      walletId: userWallet1.user.id as WalletId,
      amount: toSats(1000),
    })
    if (lnInvoice instanceof Error) return lnInvoice
    const { paymentRequest: request } = lnInvoice

    expect(request.startsWith("lnbcrt10")).toBeTruthy()
    const { uid } = await InvoiceUser.findById(getHash(request))
    expect(String(uid)).toBe(String(userWallet1.user._id))
  })

  it("adds a self generated invoice without amount", async () => {
    const lnInvoice = await addInvoiceNoAmount({
      walletId: userWallet1.user.id as WalletId,
    })
    if (lnInvoice instanceof Error) return lnInvoice
    const { paymentRequest: request } = lnInvoice

    const { uid } = await InvoiceUser.findById(getHash(request))
    expect(String(uid)).toBe(String(userWallet1.user._id))
  })

  it("fails to add invoice past rate limit", async () => {
    // Reset limits before starting
    let resetOk = await resetSelfWalletIdLimits(userWallet1.user.id)
    expect(resetOk).not.toBeInstanceOf(Error)
    if (resetOk instanceof Error) throw resetOk

    // Create max number of invoices
    const limitsNum = getInvoiceCreateAttemptLimits().points
    const promises: Promise<LnInvoice | ApplicationError>[] = []
    for (let i = 0; i < limitsNum; i++) {
      const lnInvoicePromise = addInvoice({
        walletId: userWallet1.user.id as WalletId,
        amount: toSats(1000),
      })
      promises.push(lnInvoicePromise)
    }
    const lnInvoices = await Promise.all(promises)
    const isNotError = (item) => !(item instanceof Error)
    expect(lnInvoices.every(isNotError)).toBe(true)

    // Test that first invoice past the limit fails
    const lnInvoice = await addInvoice({
      walletId: userWallet1.user.id as WalletId,
      amount: toSats(1000),
    })
    expect(lnInvoice).toBeInstanceOf(InvoiceCreateRateLimiterExceededError)

    const lnNoAmountInvoice = await addInvoiceNoAmount({
      walletId: userWallet1.user.id as WalletId,
    })
    expect(lnNoAmountInvoice).toBeInstanceOf(InvoiceCreateRateLimiterExceededError)

    // Test that recipient invoices still work
    const lnRecipientInvoice = await addInvoiceForRecipient({
      recipientWalletPublicId: userWallet1.user.walletPublicId,
      amount: toSats(1000),
    })
    expect(lnRecipientInvoice).not.toBeInstanceOf(Error)
    expect(lnRecipientInvoice).toHaveProperty("paymentRequest")

    const lnNoAmountRecipientInvoice = await addInvoiceNoAmountForRecipient({
      recipientWalletPublicId: userWallet1.user.walletPublicId,
    })
    expect(lnNoAmountRecipientInvoice).not.toBeInstanceOf(Error)
    expect(lnNoAmountRecipientInvoice).toHaveProperty("paymentRequest")

    // Reset limits when done for other tests
    resetOk = await resetSelfWalletIdLimits(userWallet1.user.id)
    expect(resetOk).not.toBeInstanceOf(Error)
  })

  it("fails to add no amount invoice past rate limit", async () => {
    // Reset limits before starting
    let resetOk = await resetSelfWalletIdLimits(userWallet1.user.id)
    expect(resetOk).not.toBeInstanceOf(Error)
    if (resetOk instanceof Error) throw resetOk

    // Create max number of invoices
    const limitsNum = getInvoiceCreateAttemptLimits().points
    const promises: Promise<LnInvoice | ApplicationError>[] = []
    for (let i = 0; i < limitsNum; i++) {
      const lnInvoicePromise = addInvoiceNoAmount({
        walletId: userWallet1.user.id as WalletId,
      })
      promises.push(lnInvoicePromise)
    }
    const lnInvoices = await Promise.all(promises)
    const isNotError = (item) => !(item instanceof Error)
    expect(lnInvoices.every(isNotError)).toBe(true)

    // Test that first invoice past the limit fails
    const lnInvoice = await addInvoice({
      walletId: userWallet1.user.id as WalletId,
      amount: toSats(1000),
    })
    expect(lnInvoice).toBeInstanceOf(InvoiceCreateRateLimiterExceededError)

    const lnNoAmountInvoice = await addInvoiceNoAmount({
      walletId: userWallet1.user.id as WalletId,
    })
    expect(lnNoAmountInvoice).toBeInstanceOf(InvoiceCreateRateLimiterExceededError)

    // Test that recipient invoices still work
    const lnRecipientInvoice = await addInvoiceForRecipient({
      recipientWalletPublicId: userWallet1.user.walletPublicId,
      amount: toSats(1000),
    })
    expect(lnRecipientInvoice).not.toBeInstanceOf(Error)
    expect(lnRecipientInvoice).toHaveProperty("paymentRequest")

    const lnNoAmountRecipientInvoice = await addInvoiceNoAmountForRecipient({
      recipientWalletPublicId: userWallet1.user.walletPublicId,
    })
    expect(lnNoAmountRecipientInvoice).not.toBeInstanceOf(Error)
    expect(lnNoAmountRecipientInvoice).toHaveProperty("paymentRequest")

    // Reset limits when done for other tests
    resetOk = await resetSelfWalletIdLimits(userWallet1.user.id)
    expect(resetOk).not.toBeInstanceOf(Error)
  })

  it("adds a public invoice", async () => {
    const lnInvoice = await addInvoiceNoAmountForRecipient({
      recipientWalletPublicId: "user1" as WalletPublicId,
    })
    if (lnInvoice instanceof Error) return lnInvoice
    const { paymentRequest: request } = lnInvoice

    expect(request.startsWith("lnbcrt1")).toBeTruthy()
    const { uid, selfGenerated } = await InvoiceUser.findById(getHash(request))
    expect(String(uid)).toBe(String(userWallet1.user._id))
    expect(selfGenerated).toBe(false)
  })
})
