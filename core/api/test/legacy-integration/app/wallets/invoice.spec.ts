import { Wallets } from "@/app"
import { addWallet } from "@/app/accounts/add-wallet"
import {
  getInvoiceCreateAttemptLimits,
  getInvoiceCreateForRecipientAttemptLimits,
} from "@/config"
import { decodeInvoice } from "@/domain/bitcoin/lightning"
import { toCents } from "@/domain/fiat"
import {
  InvoiceCreateForRecipientRateLimiterExceededError,
  InvoiceCreateRateLimiterExceededError,
} from "@/domain/rate-limit/errors"
import { WalletCurrency } from "@/domain/shared"
import { WalletType } from "@/domain/wallets"
import { DealerPriceService } from "@/services/dealer-price"
import { WalletInvoicesRepository } from "@/services/mongoose"

import {
  createUserAndWalletFromPhone,
  getAccountIdByPhone,
  getDefaultWalletIdByPhone,
  getHash,
  randomPhone,
} from "test/helpers"
import {
  resetRecipientAccountIdLimits,
  resetSelfAccountIdLimits,
} from "test/helpers/rate-limit"

let walletIdBtc: WalletId
let walletIdUsd: WalletId
let accountIdB: AccountId

const walletInvoices = WalletInvoicesRepository()

const dealerFns = DealerPriceService()

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
  walletIdUsd = wallet.id
})

afterAll(() => {
  jest.restoreAllMocks()
})

describe("Wallet - addInvoice BTC", () => {
  it("add a self generated invoice", async () => {
    const amountInput = 1000

    const invoice = await Wallets.addInvoiceForSelfForBtcWallet({
      walletId: walletIdBtc,
      amount: amountInput,
    })
    if (invoice instanceof Error) throw invoice
    const { paymentRequest: request } = invoice.lnInvoice

    expect(request.startsWith("lnbcrt10")).toBeTruthy()
    const result = await walletInvoices.findByPaymentHash(getHash(request))
    if (result instanceof Error) throw result

    const {
      recipientWalletDescriptor: { id: walletId, currency },
    } = result

    expect(walletId).toBe(walletIdBtc)
    expect(currency).toBe(WalletCurrency.Btc)

    const decodedInvoice = decodeInvoice(request)
    if (decodedInvoice instanceof Error) throw decodedInvoice

    const { amount } = decodedInvoice
    expect(amount).toBe(amountInput)
  })

  it("add a self generated invoice without amount", async () => {
    const invoice = await Wallets.addInvoiceNoAmountForSelf({
      walletId: walletIdBtc,
    })
    if (invoice instanceof Error) throw invoice
    const { paymentRequest: request } = invoice.lnInvoice

    const result = await walletInvoices.findByPaymentHash(getHash(request))
    if (result instanceof Error) throw result

    const {
      recipientWalletDescriptor: { id: walletId, currency },
    } = result

    expect(walletId).toBe(walletIdBtc)
    expect(currency).toBe(WalletCurrency.Btc)
  })

  it("adds a public with amount invoice", async () => {
    const amountInput = 10

    const invoice = await Wallets.addInvoiceForRecipientForBtcWallet({
      recipientWalletId: walletIdBtc,
      amount: amountInput,
    })
    if (invoice instanceof Error) throw invoice
    const { paymentRequest: request } = invoice.lnInvoice
    expect(request.startsWith("lnbcrt1")).toBeTruthy()

    const result = await walletInvoices.findByPaymentHash(getHash(request))
    if (result instanceof Error) throw result

    const {
      recipientWalletDescriptor: { id: walletId },
      selfGenerated,
    } = result

    expect(String(walletId)).toBe(String(walletIdBtc))
    expect(selfGenerated).toBe(false)

    const decodedInvoice = decodeInvoice(request)
    if (decodedInvoice instanceof Error) throw decodedInvoice

    const { amount } = decodedInvoice
    expect(amount).toBe(amountInput)
  })

  it("adds a public no amount invoice", async () => {
    const invoice = await Wallets.addInvoiceNoAmountForRecipient({
      recipientWalletId: walletIdBtc,
    })
    if (invoice instanceof Error) throw invoice
    const { paymentRequest: request } = invoice.lnInvoice
    expect(request.startsWith("lnbcrt1")).toBeTruthy()

    const result = await walletInvoices.findByPaymentHash(getHash(request))
    if (result instanceof Error) throw result
    const {
      recipientWalletDescriptor: { id: walletId },
      selfGenerated,
    } = result
    expect(String(walletId)).toBe(String(walletIdBtc))
    expect(selfGenerated).toBe(false)
  })
})

describe("Wallet - addInvoice USD", () => {
  it("add a self generated USD invoice", async () => {
    const centsInput = 10000

    const btcAmount = await dealerFns.getSatsFromCentsForFutureBuy({
      amount: BigInt(centsInput),
      currency: WalletCurrency.Usd,
    })
    if (btcAmount instanceof Error) throw btcAmount
    const sats = Number(btcAmount.amount)

    const invoice = await Wallets.addInvoiceForSelfForUsdWallet({
      walletId: walletIdUsd,
      amount: toCents(centsInput),
    })
    if (invoice instanceof Error) throw invoice
    const { paymentRequest: request } = invoice.lnInvoice

    expect(request.startsWith("lnbcrt")).toBeTruthy()
    const result = await walletInvoices.findByPaymentHash(getHash(request))
    if (result instanceof Error) throw result
    const {
      recipientWalletDescriptor: { id: walletId, currency },
      usdAmount,
    } = result

    expect(String(walletId)).toBe(String(walletIdUsd))
    expect(usdAmount?.amount).toBe(BigInt(centsInput))
    expect(currency).toBe(WalletCurrency.Usd)

    const decodedInvoice = decodeInvoice(request)
    if (decodedInvoice instanceof Error) throw decodedInvoice

    const { amount } = decodedInvoice
    expect(amount).toBe(sats)
  })

  it("add a self generated invoice without amount", async () => {
    const invoice = await Wallets.addInvoiceNoAmountForSelf({
      walletId: walletIdUsd,
    })
    if (invoice instanceof Error) throw invoice
    const { paymentRequest: request } = invoice.lnInvoice

    const result = await walletInvoices.findByPaymentHash(getHash(request))
    if (result instanceof Error) throw result
    const {
      recipientWalletDescriptor: { id: walletId },
      usdAmount,
    } = result
    expect(String(walletId)).toBe(String(walletIdUsd))
    expect(usdAmount?.amount).toBe(undefined)
  })

  it("adds a public with amount invoice", async () => {
    const centsInput = 10000

    const btcAmount = await dealerFns.getSatsFromCentsForFutureBuy({
      amount: BigInt(centsInput),
      currency: WalletCurrency.Usd,
    })
    if (btcAmount instanceof Error) throw btcAmount
    const sats = Number(btcAmount.amount)

    const invoice = await Wallets.addInvoiceForRecipientForUsdWallet({
      recipientWalletId: walletIdUsd,
      amount: toCents(centsInput),
    })
    if (invoice instanceof Error) throw invoice
    const { paymentRequest: request } = invoice.lnInvoice
    expect(request.startsWith("lnbcrt")).toBeTruthy()

    const result = await walletInvoices.findByPaymentHash(getHash(request))
    if (result instanceof Error) throw result
    const {
      recipientWalletDescriptor: { id: walletId },
      usdAmount,
      selfGenerated,
    } = result
    expect(usdAmount?.amount).toBe(BigInt(centsInput))

    expect(String(walletId)).toBe(String(walletIdUsd))
    expect(selfGenerated).toBe(false)

    const decodedInvoice = decodeInvoice(request)
    if (decodedInvoice instanceof Error) throw decodedInvoice

    const { amount } = decodedInvoice
    expect(amount).toBe(sats)
  })

  it("adds a public invoice", async () => {
    const invoice = await Wallets.addInvoiceNoAmountForRecipient({
      recipientWalletId: walletIdUsd,
    })
    if (invoice instanceof Error) throw invoice
    const { paymentRequest: request } = invoice.lnInvoice
    expect(request.startsWith("lnbcrt1")).toBeTruthy()

    const result = await walletInvoices.findByPaymentHash(getHash(request))
    if (result instanceof Error) throw result
    const {
      recipientWalletDescriptor: { id: walletId },
      usdAmount,
      selfGenerated,
    } = result
    expect(String(walletId)).toBe(String(walletIdUsd))
    expect(selfGenerated).toBe(false)
    expect(usdAmount?.amount).toBe(undefined)
  })
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
