import { Wallets } from "@app"
import {
  getInvoiceCreateAttemptLimits,
  getInvoiceCreateForRecipientAttemptLimits,
} from "@config/app"
import { toSats } from "@domain/bitcoin"
import { RateLimiterExceededError } from "@domain/rate-limit/errors"
import { WalletInvoicesRepository } from "@services/mongoose"

import { getDefaultWalletIdByTestUserIndex, getHash } from "test/helpers"
import {
  resetRecipientWalletIdLimits,
  resetSelfWalletIdLimits,
} from "test/helpers/rate-limit"

let wallet1: WalletId

const walletInvoices = WalletInvoicesRepository()

beforeAll(async () => {
  wallet1 = await getDefaultWalletIdByTestUserIndex(1)
})

describe("UserWallet - addInvoice", () => {
  it("add a self generated invoice", async () => {
    const lnInvoice = await Wallets.addInvoice({
      walletId: wallet1,
      amount: toSats(1000),
    })
    if (lnInvoice instanceof Error) return lnInvoice
    const { paymentRequest: request } = lnInvoice

    expect(request.startsWith("lnbcrt10")).toBeTruthy()
    const result = await walletInvoices.findByPaymentHash(getHash(request))
    if (result instanceof Error) throw result
    const { walletId } = result
    expect(String(walletId)).toBe(String(wallet1))
  })

  it("add a self generated invoice without amount", async () => {
    const lnInvoice = await Wallets.addInvoiceNoAmount({
      walletId: wallet1,
    })
    if (lnInvoice instanceof Error) return lnInvoice
    const { paymentRequest: request } = lnInvoice

    const result = await walletInvoices.findByPaymentHash(getHash(request))
    if (result instanceof Error) throw result
    const { walletId } = result
    expect(String(walletId)).toBe(String(wallet1))
  })

  it("fails to add invoice past rate limit", async () => {
    // Reset limits before starting
    const resetOk = await resetSelfWalletIdLimits(wallet1)
    expect(resetOk).not.toBeInstanceOf(Error)
    if (resetOk instanceof Error) throw resetOk

    // Create max number of invoices
    const limitsNum = getInvoiceCreateAttemptLimits().points

    const promises: Promise<LnInvoice | ApplicationError>[] = []
    for (let i = 0; i < limitsNum; i++) {
      const lnInvoicePromise = Wallets.addInvoice({
        walletId: wallet1,
        amount: toSats(1000),
      })
      promises.push(lnInvoicePromise)
    }
    const lnInvoices = await Promise.all(promises)
    const isNotError = (item) => !(item instanceof Error)
    expect(lnInvoices.every(isNotError)).toBe(true)

    return testPastSelfInvoiceLimits(wallet1)
  })

  it("fails to add no amount invoice past rate limit", async () => {
    // Reset limits before starting
    const resetOk = await resetSelfWalletIdLimits(wallet1)
    expect(resetOk).not.toBeInstanceOf(Error)
    if (resetOk instanceof Error) throw resetOk

    // Create max number of invoices
    const limitsNum = getInvoiceCreateAttemptLimits().points
    const promises: Promise<LnInvoice | ApplicationError>[] = []
    for (let i = 0; i < limitsNum; i++) {
      const lnInvoicePromise = Wallets.addInvoiceNoAmount({
        walletId: wallet1,
      })
      promises.push(lnInvoicePromise)
    }
    const lnInvoices = await Promise.all(promises)
    const isNotError = (item) => !(item instanceof Error)
    expect(lnInvoices.every(isNotError)).toBe(true)

    return testPastSelfInvoiceLimits(wallet1)
  })

  it("adds a public invoice", async () => {
    const lnInvoice = await Wallets.addInvoiceNoAmountForRecipient({
      recipientWalletId: wallet1,
    })
    if (lnInvoice instanceof Error) throw lnInvoice
    const { paymentRequest: request } = lnInvoice
    expect(request.startsWith("lnbcrt1")).toBeTruthy()

    const result = await walletInvoices.findByPaymentHash(getHash(request))
    if (result instanceof Error) throw result
    const { walletId, selfGenerated } = result
    expect(String(walletId)).toBe(String(wallet1))
    expect(selfGenerated).toBe(false)
  })

  it("fails to add public invoice past rate limit", async () => {
    // Reset limits before starting
    const resetOk = await resetRecipientWalletIdLimits(wallet1)
    expect(resetOk).not.toBeInstanceOf(Error)
    if (resetOk instanceof Error) throw resetOk

    // Create max number of invoices
    const limitsNum = getInvoiceCreateForRecipientAttemptLimits().points
    const promises: Promise<LnInvoice | ApplicationError>[] = []
    for (let i = 0; i < limitsNum; i++) {
      const lnInvoicePromise = Wallets.addInvoiceForRecipient({
        recipientWalletId: wallet1,
        amount: toSats(1000),
      })
      promises.push(lnInvoicePromise)
    }
    const lnInvoices = await Promise.all(promises)
    const isNotError = (item) => !(item instanceof Error)
    expect(lnInvoices.every(isNotError)).toBe(true)

    return testPastRecipientInvoiceLimits(wallet1)
  })

  it("fails to add no amount public invoice past rate limit", async () => {
    // Reset limits before starting
    const resetOk = await resetRecipientWalletIdLimits(wallet1)
    expect(resetOk).not.toBeInstanceOf(Error)
    if (resetOk instanceof Error) throw resetOk

    // Create max number of invoices
    const limitsNum = getInvoiceCreateForRecipientAttemptLimits().points
    const promises: Promise<LnInvoice | ApplicationError>[] = []
    for (let i = 0; i < limitsNum; i++) {
      const lnInvoicePromise = Wallets.addInvoiceNoAmountForRecipient({
        recipientWalletId: wallet1,
      })
      promises.push(lnInvoicePromise)
    }
    const lnInvoices = await Promise.all(promises)
    const isNotError = (item) => !(item instanceof Error)
    expect(lnInvoices.every(isNotError)).toBe(true)

    return testPastRecipientInvoiceLimits(wallet1)
  })
})

const testPastSelfInvoiceLimits = async (walletId: WalletId) => {
  // Test that first invoice past the limit fails
  const lnInvoice = await Wallets.addInvoice({
    walletId,
    amount: toSats(1000),
  })
  expect(lnInvoice).toBeInstanceOf(RateLimiterExceededError)

  const lnNoAmountInvoice = await Wallets.addInvoiceNoAmount({
    walletId,
  })
  expect(lnNoAmountInvoice).toBeInstanceOf(RateLimiterExceededError)

  // Test that recipient invoices still work
  const lnRecipientInvoice = await Wallets.addInvoiceForRecipient({
    recipientWalletId: walletId,
    amount: toSats(1000),
  })
  expect(lnRecipientInvoice).not.toBeInstanceOf(Error)
  expect(lnRecipientInvoice).toHaveProperty("paymentRequest")

  const lnNoAmountRecipientInvoice = await Wallets.addInvoiceNoAmountForRecipient({
    recipientWalletId: walletId,
  })
  expect(lnNoAmountRecipientInvoice).not.toBeInstanceOf(Error)
  expect(lnNoAmountRecipientInvoice).toHaveProperty("paymentRequest")

  // Reset limits when done for other tests
  let resetOk = await resetSelfWalletIdLimits(walletId)
  expect(resetOk).not.toBeInstanceOf(Error)
  resetOk = await resetRecipientWalletIdLimits(walletId)
  expect(resetOk).not.toBeInstanceOf(Error)
}

const testPastRecipientInvoiceLimits = async (walletId: WalletId) => {
  // Test that first invoice past the limit fails
  const lnRecipientInvoice = await Wallets.addInvoiceForRecipient({
    recipientWalletId: walletId,
    amount: toSats(1000),
  })
  expect(lnRecipientInvoice).toBeInstanceOf(RateLimiterExceededError)

  const lnNoAmountRecipientInvoice = await Wallets.addInvoiceNoAmountForRecipient({
    recipientWalletId: walletId,
  })
  expect(lnNoAmountRecipientInvoice).toBeInstanceOf(RateLimiterExceededError)

  // Test that recipient invoices still work
  const lnInvoice = await Wallets.addInvoice({
    walletId,
    amount: toSats(1000),
  })
  expect(lnInvoice).not.toBeInstanceOf(Error)
  expect(lnInvoice).toHaveProperty("paymentRequest")

  const lnNoAmountInvoice = await Wallets.addInvoiceNoAmount({
    walletId,
  })
  expect(lnNoAmountInvoice).not.toBeInstanceOf(Error)
  expect(lnNoAmountInvoice).toHaveProperty("paymentRequest")

  // Reset limits when done for other tests
  let resetOk = await resetSelfWalletIdLimits(walletId)
  expect(resetOk).not.toBeInstanceOf(Error)
  resetOk = await resetRecipientWalletIdLimits(walletId)
  expect(resetOk).not.toBeInstanceOf(Error)
}
