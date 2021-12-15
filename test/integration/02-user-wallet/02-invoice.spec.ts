import {
  addInvoice,
  addInvoiceForRecipient,
  addInvoiceNoAmount,
  addInvoiceNoAmountForRecipient,
} from "@app/wallets"
import {
  getInvoiceCreateAttemptLimits,
  getInvoiceCreateForRecipientAttemptLimits,
} from "@config/app"
import { getHash } from "@core/utils"
import { toSats } from "@domain/bitcoin"
import { RateLimiterExceededError } from "@domain/rate-limit/errors"
import { InvoiceUser } from "@services/mongoose/schema"
import { getAndCreateUserWallet } from "test/helpers"
import {
  resetRecipientWalletIdLimits,
  resetSelfWalletIdLimits,
} from "test/helpers/rate-limit"

let userWallet1

beforeAll(async () => {
  userWallet1 = await getAndCreateUserWallet(1)
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
    const resetOk = await resetSelfWalletIdLimits(userWallet1.user.id)
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

    return testPastSelfInvoiceLimits(userWallet1.user)
  })

  it("fails to add no amount invoice past rate limit", async () => {
    // Reset limits before starting
    const resetOk = await resetSelfWalletIdLimits(userWallet1.user.id)
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

    return testPastSelfInvoiceLimits(userWallet1.user)
  })

  it("adds a public invoice", async () => {
    const lnInvoice = await addInvoiceNoAmountForRecipient({
      recipientWalletId: userWallet1.user.id,
    })
    if (lnInvoice instanceof Error) return lnInvoice
    const { paymentRequest: request } = lnInvoice

    expect(request.startsWith("lnbcrt1")).toBeTruthy()
    const { uid, selfGenerated } = await InvoiceUser.findById(getHash(request))
    expect(String(uid)).toBe(String(userWallet1.user._id))
    expect(selfGenerated).toBe(false)
  })

  it("fails to add public invoice past rate limit", async () => {
    // Reset limits before starting
    const resetOk = await resetRecipientWalletIdLimits(userWallet1.user.id)
    expect(resetOk).not.toBeInstanceOf(Error)
    if (resetOk instanceof Error) throw resetOk

    // Create max number of invoices
    const limitsNum = getInvoiceCreateForRecipientAttemptLimits().points
    const promises: Promise<LnInvoice | ApplicationError>[] = []
    for (let i = 0; i < limitsNum; i++) {
      const lnInvoicePromise = addInvoiceForRecipient({
        recipientWalletId: userWallet1.user.id,
        amount: toSats(1000),
      })
      promises.push(lnInvoicePromise)
    }
    const lnInvoices = await Promise.all(promises)
    const isNotError = (item) => !(item instanceof Error)
    expect(lnInvoices.every(isNotError)).toBe(true)

    return testPastRecipientInvoiceLimits(userWallet1.user)
  })

  it("fails to add no amount public invoice past rate limit", async () => {
    // Reset limits before starting
    const resetOk = await resetRecipientWalletIdLimits(userWallet1.user.id)
    expect(resetOk).not.toBeInstanceOf(Error)
    if (resetOk instanceof Error) throw resetOk

    // Create max number of invoices
    const limitsNum = getInvoiceCreateForRecipientAttemptLimits().points
    const promises: Promise<LnInvoice | ApplicationError>[] = []
    for (let i = 0; i < limitsNum; i++) {
      const lnInvoicePromise = addInvoiceNoAmountForRecipient({
        recipientWalletId: userWallet1.user.id,
      })
      promises.push(lnInvoicePromise)
    }
    const lnInvoices = await Promise.all(promises)
    const isNotError = (item) => !(item instanceof Error)
    expect(lnInvoices.every(isNotError)).toBe(true)

    return testPastRecipientInvoiceLimits(userWallet1.user)
  })
})

const testPastSelfInvoiceLimits = async (user) => {
  // Test that first invoice past the limit fails
  const lnInvoice = await addInvoice({
    walletId: user.id as WalletId,
    amount: toSats(1000),
  })
  expect(lnInvoice).toBeInstanceOf(RateLimiterExceededError)

  const lnNoAmountInvoice = await addInvoiceNoAmount({
    walletId: user.id as WalletId,
  })
  expect(lnNoAmountInvoice).toBeInstanceOf(RateLimiterExceededError)

  // Test that recipient invoices still work
  const lnRecipientInvoice = await addInvoiceForRecipient({
    recipientWalletId: user.id,
    amount: toSats(1000),
  })
  expect(lnRecipientInvoice).not.toBeInstanceOf(Error)
  expect(lnRecipientInvoice).toHaveProperty("paymentRequest")

  const lnNoAmountRecipientInvoice = await addInvoiceNoAmountForRecipient({
    recipientWalletId: user.id,
  })
  expect(lnNoAmountRecipientInvoice).not.toBeInstanceOf(Error)
  expect(lnNoAmountRecipientInvoice).toHaveProperty("paymentRequest")

  // Reset limits when done for other tests
  let resetOk = await resetSelfWalletIdLimits(user.id)
  expect(resetOk).not.toBeInstanceOf(Error)
  resetOk = await resetRecipientWalletIdLimits(user.id)
  expect(resetOk).not.toBeInstanceOf(Error)
}

const testPastRecipientInvoiceLimits = async (user) => {
  // Test that first invoice past the limit fails
  const lnRecipientInvoice = await addInvoiceForRecipient({
    recipientWalletId: user.id,
    amount: toSats(1000),
  })
  expect(lnRecipientInvoice).toBeInstanceOf(RateLimiterExceededError)

  const lnNoAmountRecipientInvoice = await addInvoiceNoAmountForRecipient({
    recipientWalletId: user.id,
  })
  expect(lnNoAmountRecipientInvoice).toBeInstanceOf(RateLimiterExceededError)

  // Test that recipient invoices still work
  const lnInvoice = await addInvoice({
    walletId: user.id as WalletId,
    amount: toSats(1000),
  })
  expect(lnInvoice).not.toBeInstanceOf(Error)
  expect(lnInvoice).toHaveProperty("paymentRequest")

  const lnNoAmountInvoice = await addInvoiceNoAmount({
    walletId: user.id as WalletId,
  })
  expect(lnNoAmountInvoice).not.toBeInstanceOf(Error)
  expect(lnNoAmountInvoice).toHaveProperty("paymentRequest")

  // Reset limits when done for other tests
  let resetOk = await resetSelfWalletIdLimits(user.id)
  expect(resetOk).not.toBeInstanceOf(Error)
  resetOk = await resetRecipientWalletIdLimits(user.id)
  expect(resetOk).not.toBeInstanceOf(Error)
}
