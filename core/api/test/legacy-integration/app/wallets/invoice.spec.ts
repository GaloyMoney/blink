import { Wallets } from "@/app"
import { addWallet } from "@/app/accounts/add-wallet"
import {
  getInvoiceCreateAttemptLimits,
  getInvoiceCreateForRecipientAttemptLimits,
} from "@/config"
import {
  InvoiceCreateForRecipientRateLimiterExceededError,
  InvoiceCreateRateLimiterExceededError,
} from "@/domain/rate-limit/errors"
import { WalletCurrency } from "@/domain/shared"
import { WalletType } from "@/domain/wallets"

import {
  createUserAndWalletFromPhone,
  getAccountIdByPhone,
  getDefaultWalletIdByPhone,
  randomPhone,
} from "test/helpers"
import {
  resetRecipientAccountIdLimits,
  resetSelfAccountIdLimits,
} from "test/helpers/rate-limit"

let walletIdBtc: WalletId
let accountIdB: AccountId

beforeAll(async () => {
  const phoneB = randomPhone()
  await createUserAndWalletFromPhone(phoneB)

  walletIdBtc = await getDefaultWalletIdByPhone(phoneB)
  accountIdB = await getAccountIdByPhone(phoneB)

  const wallet = await addWallet({
    accountId: accountIdB,
    type: WalletType.Checking,
    currency: WalletCurrency.Usd,
  })
  if (wallet instanceof Error) return wallet
})

afterAll(() => {
  jest.restoreAllMocks()
})

describe("Wallet - rate limiting test", () => {
  it("fails to add invoice past rate limit", async () => {
    // Reset limits before starting
    const resetOk = await resetSelfAccountIdLimits(accountIdB)
    expect(resetOk).not.toBeInstanceOf(Error)
    if (resetOk instanceof Error) throw resetOk

    // Create max number of invoices
    const limitsNum = getInvoiceCreateAttemptLimits().points

    const promises: Promise<WalletInvoice | ApplicationError>[] = []
    for (let i = 0; i < limitsNum; i++) {
      const invoicePromise = Wallets.addInvoiceForSelfForBtcWallet({
        walletId: walletIdBtc,
        amount: 1000,
      })
      promises.push(invoicePromise)
    }
    const invoices = await Promise.all(promises)
    const isNotError = (item: unknown) => !(item instanceof Error)
    expect(invoices.every(isNotError)).toBe(true)

    return testPastSelfInvoiceLimits({ walletId: walletIdBtc, accountId: accountIdB })
  })

  it("fails to add no amount invoice past rate limit", async () => {
    // Reset limits before starting
    const resetOk = await resetSelfAccountIdLimits(accountIdB)
    expect(resetOk).not.toBeInstanceOf(Error)
    if (resetOk instanceof Error) throw resetOk

    // Create max number of invoices
    const limitsNum = getInvoiceCreateAttemptLimits().points
    const promises: Promise<WalletInvoice | ApplicationError>[] = []
    for (let i = 0; i < limitsNum; i++) {
      const invoicePromise = Wallets.addInvoiceNoAmountForSelf({
        walletId: walletIdBtc,
      })
      promises.push(invoicePromise)
    }
    const invoices = await Promise.all(promises)
    const isNotError = (item: unknown) => !(item instanceof Error)
    expect(invoices.every(isNotError)).toBe(true)

    return testPastSelfInvoiceLimits({ walletId: walletIdBtc, accountId: accountIdB })
  })

  it("fails to add public invoice past rate limit", async () => {
    // Reset limits before starting
    const resetOk = await resetRecipientAccountIdLimits(accountIdB)
    expect(resetOk).not.toBeInstanceOf(Error)
    if (resetOk instanceof Error) throw resetOk

    // Create max number of invoices
    const limitsNum = getInvoiceCreateForRecipientAttemptLimits().points
    const promises: Promise<WalletInvoice | ApplicationError>[] = []
    for (let i = 0; i < limitsNum; i++) {
      const invoicePromise = Wallets.addInvoiceForRecipientForBtcWallet({
        recipientWalletId: walletIdBtc,
        amount: 1000,
      })
      promises.push(invoicePromise)
    }
    const invoices = await Promise.all(promises)
    const isNotError = (item: unknown) => !(item instanceof Error)
    expect(invoices.every(isNotError)).toBe(true)

    return testPastRecipientInvoiceLimits({
      walletId: walletIdBtc,
      accountId: accountIdB,
    })
  })

  it("fails to add no amount public invoice past rate limit", async () => {
    // Reset limits before starting
    const resetOk = await resetRecipientAccountIdLimits(accountIdB)
    expect(resetOk).not.toBeInstanceOf(Error)
    if (resetOk instanceof Error) throw resetOk

    // Create max number of invoices
    const limitsNum = getInvoiceCreateForRecipientAttemptLimits().points
    const promises: Promise<WalletInvoice | ApplicationError>[] = []
    for (let i = 0; i < limitsNum; i++) {
      const invoicePromise = Wallets.addInvoiceNoAmountForRecipient({
        recipientWalletId: walletIdBtc,
      })
      promises.push(invoicePromise)
    }
    const invoices = await Promise.all(promises)
    const isNotError = (item: unknown) => !(item instanceof Error)
    expect(invoices.every(isNotError)).toBe(true)

    return testPastRecipientInvoiceLimits({
      walletId: walletIdBtc,
      accountId: accountIdB,
    })
  })
})

const testPastSelfInvoiceLimits = async ({
  walletId,
  accountId,
}: {
  walletId: WalletId
  accountId: AccountId
}) => {
  // Test that first invoice past the limit fails
  const invoice = await Wallets.addInvoiceForSelfForBtcWallet({
    walletId,
    amount: 1000,
  })
  expect(invoice).toBeInstanceOf(InvoiceCreateRateLimiterExceededError)

  const lnNoAmountInvoice = await Wallets.addInvoiceNoAmountForSelf({
    walletId,
  })
  expect(lnNoAmountInvoice).toBeInstanceOf(InvoiceCreateRateLimiterExceededError)

  // Test that recipient invoices still work
  const lnRecipientInvoice = await Wallets.addInvoiceForRecipientForBtcWallet({
    recipientWalletId: walletId,
    amount: 1000,
  })
  if (lnRecipientInvoice instanceof Error) throw lnRecipientInvoice
  expect(lnRecipientInvoice.lnInvoice).toHaveProperty("paymentRequest")

  const lnNoAmountRecipientInvoice = await Wallets.addInvoiceNoAmountForRecipient({
    recipientWalletId: walletId,
  })
  if (lnNoAmountRecipientInvoice instanceof Error) throw lnNoAmountRecipientInvoice
  expect(lnNoAmountRecipientInvoice.lnInvoice).toHaveProperty("paymentRequest")

  // Reset limits when done for other tests
  let resetOk = await resetSelfAccountIdLimits(accountId)
  expect(resetOk).not.toBeInstanceOf(Error)
  resetOk = await resetRecipientAccountIdLimits(accountId)
  expect(resetOk).not.toBeInstanceOf(Error)
}

const testPastRecipientInvoiceLimits = async ({
  walletId,
  accountId,
}: {
  walletId: WalletId
  accountId: AccountId
}) => {
  // Test that first invoice past the limit fails
  const lnRecipientInvoice = await Wallets.addInvoiceForRecipientForBtcWallet({
    recipientWalletId: walletId,
    amount: 1000,
  })
  expect(lnRecipientInvoice).toBeInstanceOf(
    InvoiceCreateForRecipientRateLimiterExceededError,
  )

  const lnNoAmountRecipientInvoice = await Wallets.addInvoiceNoAmountForRecipient({
    recipientWalletId: walletId,
  })
  expect(lnNoAmountRecipientInvoice).toBeInstanceOf(
    InvoiceCreateForRecipientRateLimiterExceededError,
  )

  // Test that recipient invoices still work
  const invoice = await Wallets.addInvoiceForSelfForBtcWallet({
    walletId,
    amount: 1000,
  })
  if (invoice instanceof Error) throw invoice
  expect(invoice.lnInvoice).toHaveProperty("paymentRequest")

  const lnNoAmountInvoice = await Wallets.addInvoiceNoAmountForSelf({
    walletId,
  })
  if (lnNoAmountInvoice instanceof Error) throw lnNoAmountInvoice
  expect(lnNoAmountInvoice.lnInvoice).toHaveProperty("paymentRequest")

  // Reset limits when done for other tests
  let resetOk = await resetSelfAccountIdLimits(accountId)
  expect(resetOk).not.toBeInstanceOf(Error)
  resetOk = await resetRecipientAccountIdLimits(accountId)
  expect(resetOk).not.toBeInstanceOf(Error)
}
