import { Wallets } from "@app"
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
  it("add a self generated invoice", async () => {
    const lnInvoice = await Wallets.addInvoice({
      walletId: userWallet1.user.walletId as WalletId,
      amount: toSats(1000),
    })
    if (lnInvoice instanceof Error) return lnInvoice
    const { paymentRequest: request } = lnInvoice

    expect(request.startsWith("lnbcrt10")).toBeTruthy()
    const { walletId } = await InvoiceUser.findById(getHash(request))
    expect(String(walletId)).toBe(String(userWallet1.user.walletId))
  })

  it("add a self generated invoice without amount", async () => {
    const lnInvoice = await Wallets.addInvoiceNoAmount({
      walletId: userWallet1.user.walletId as WalletId,
    })
    if (lnInvoice instanceof Error) return lnInvoice
    const { paymentRequest: request } = lnInvoice

    const { walletId } = await InvoiceUser.findById(getHash(request))
    expect(String(walletId)).toBe(String(userWallet1.user.walletId))
  })

  it("fails to add invoice past rate limit", async () => {
    // Reset limits before starting
    const resetOk = await resetSelfWalletIdLimits(userWallet1.user.walletId)
    expect(resetOk).not.toBeInstanceOf(Error)
    if (resetOk instanceof Error) throw resetOk

    // Create max number of invoices
    const limitsNum = getInvoiceCreateAttemptLimits().points

    const promises: Promise<LnInvoice | ApplicationError>[] = []
    for (let i = 0; i < limitsNum; i++) {
      const lnInvoicePromise = Wallets.addInvoice({
        walletId: userWallet1.user.walletId as WalletId,
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
    const resetOk = await resetSelfWalletIdLimits(userWallet1.user.walletId)
    expect(resetOk).not.toBeInstanceOf(Error)
    if (resetOk instanceof Error) throw resetOk

    // Create max number of invoices
    const limitsNum = getInvoiceCreateAttemptLimits().points
    const promises: Promise<LnInvoice | ApplicationError>[] = []
    for (let i = 0; i < limitsNum; i++) {
      const lnInvoicePromise = Wallets.addInvoiceNoAmount({
        walletId: userWallet1.user.walletId as WalletId,
      })
      promises.push(lnInvoicePromise)
    }
    const lnInvoices = await Promise.all(promises)
    const isNotError = (item) => !(item instanceof Error)
    expect(lnInvoices.every(isNotError)).toBe(true)

    return testPastSelfInvoiceLimits(userWallet1.user)
  })

  it("adds a public invoice", async () => {
    const lnInvoice = await Wallets.addInvoiceNoAmountForRecipient({
      recipientWalletId: userWallet1.user.walletId,
    })
    if (lnInvoice instanceof Error) throw lnInvoice
    const { paymentRequest: request } = lnInvoice
    expect(request.startsWith("lnbcrt1")).toBeTruthy()
    const { walletId, selfGenerated } = await InvoiceUser.findById(getHash(request))
    expect(String(walletId)).toBe(String(userWallet1.user.walletId))
    expect(selfGenerated).toBe(false)
  })

  it("fails to add public invoice past rate limit", async () => {
    // Reset limits before starting
    const resetOk = await resetRecipientWalletIdLimits(userWallet1.user.walletId)
    expect(resetOk).not.toBeInstanceOf(Error)
    if (resetOk instanceof Error) throw resetOk

    // Create max number of invoices
    const limitsNum = getInvoiceCreateForRecipientAttemptLimits().points
    const promises: Promise<LnInvoice | ApplicationError>[] = []
    for (let i = 0; i < limitsNum; i++) {
      const lnInvoicePromise = Wallets.addInvoiceForRecipient({
        recipientWalletId: userWallet1.user.walletId,
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
    const resetOk = await resetRecipientWalletIdLimits(userWallet1.user.walletId)
    expect(resetOk).not.toBeInstanceOf(Error)
    if (resetOk instanceof Error) throw resetOk

    // Create max number of invoices
    const limitsNum = getInvoiceCreateForRecipientAttemptLimits().points
    const promises: Promise<LnInvoice | ApplicationError>[] = []
    for (let i = 0; i < limitsNum; i++) {
      const lnInvoicePromise = Wallets.addInvoiceNoAmountForRecipient({
        recipientWalletId: userWallet1.user.walletId,
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
  const lnInvoice = await Wallets.addInvoice({
    walletId: user.walletId as WalletId,
    amount: toSats(1000),
  })
  expect(lnInvoice).toBeInstanceOf(RateLimiterExceededError)

  const lnNoAmountInvoice = await Wallets.addInvoiceNoAmount({
    walletId: user.walletId as WalletId,
  })
  expect(lnNoAmountInvoice).toBeInstanceOf(RateLimiterExceededError)

  // Test that recipient invoices still work
  const lnRecipientInvoice = await Wallets.addInvoiceForRecipient({
    recipientWalletId: user.walletId,
    amount: toSats(1000),
  })
  expect(lnRecipientInvoice).not.toBeInstanceOf(Error)
  expect(lnRecipientInvoice).toHaveProperty("paymentRequest")

  const lnNoAmountRecipientInvoice = await Wallets.addInvoiceNoAmountForRecipient({
    recipientWalletId: user.walletId,
  })
  expect(lnNoAmountRecipientInvoice).not.toBeInstanceOf(Error)
  expect(lnNoAmountRecipientInvoice).toHaveProperty("paymentRequest")

  // Reset limits when done for other tests
  let resetOk = await resetSelfWalletIdLimits(user.walletId)
  expect(resetOk).not.toBeInstanceOf(Error)
  resetOk = await resetRecipientWalletIdLimits(user.walletId)
  expect(resetOk).not.toBeInstanceOf(Error)
}

const testPastRecipientInvoiceLimits = async (user) => {
  // Test that first invoice past the limit fails
  const lnRecipientInvoice = await Wallets.addInvoiceForRecipient({
    recipientWalletId: user.walletId,
    amount: toSats(1000),
  })
  expect(lnRecipientInvoice).toBeInstanceOf(RateLimiterExceededError)

  const lnNoAmountRecipientInvoice = await Wallets.addInvoiceNoAmountForRecipient({
    recipientWalletId: user.walletId,
  })
  expect(lnNoAmountRecipientInvoice).toBeInstanceOf(RateLimiterExceededError)

  // Test that recipient invoices still work
  const lnInvoice = await Wallets.addInvoice({
    walletId: user.walletId as WalletId,
    amount: toSats(1000),
  })
  expect(lnInvoice).not.toBeInstanceOf(Error)
  expect(lnInvoice).toHaveProperty("paymentRequest")

  const lnNoAmountInvoice = await Wallets.addInvoiceNoAmount({
    walletId: user.walletId as WalletId,
  })
  expect(lnNoAmountInvoice).not.toBeInstanceOf(Error)
  expect(lnNoAmountInvoice).toHaveProperty("paymentRequest")

  // Reset limits when done for other tests
  let resetOk = await resetSelfWalletIdLimits(user.walletId)
  expect(resetOk).not.toBeInstanceOf(Error)
  resetOk = await resetRecipientWalletIdLimits(user.walletId)
  expect(resetOk).not.toBeInstanceOf(Error)
}
