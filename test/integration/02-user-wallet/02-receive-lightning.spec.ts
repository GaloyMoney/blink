import { ledger } from "@services/mongodb"
import { baseLogger } from "@services/logger"
import { getHash } from "@core/utils"
import {
  checkIsBalanced,
  getAndCreateUserWallet,
  lndOutside1,
  pay,
  getBTCBalance,
} from "test/helpers"
import { MEMO_SHARING_SATS_THRESHOLD } from "@config/app"
import { Wallets, Lightning } from "@app"
import { PaymentInitiationMethod } from "@domain/wallets"
import { toSats } from "@domain/bitcoin"

let userWallet1
let initBalance1

beforeAll(async () => {
  userWallet1 = await getAndCreateUserWallet(1)
})

beforeEach(async () => {
  initBalance1 = await getBTCBalance(userWallet1.user.walletId)
})

afterEach(async () => {
  await checkIsBalanced()
})

describe("UserWallet - Lightning", () => {
  it("receives payment from outside", async () => {
    // larger amount to not fall below the escrow limit
    const sats = 50000
    const memo = "myMemo"

    const lnInvoice = await Wallets.addInvoice({
      walletId: userWallet1.user.walletId as WalletId,
      amount: toSats(sats),
      memo,
    })
    if (lnInvoice instanceof Error) return lnInvoice
    const { paymentRequest: invoice } = lnInvoice

    const checker = await Lightning.PaymentStatusChecker({ paymentRequest: invoice })
    expect(checker).not.toBeInstanceOf(Error)
    if (checker instanceof Error) throw checker

    const isPaidBeforePay = await checker.invoiceIsPaid()
    expect(isPaidBeforePay).not.toBeInstanceOf(Error)
    expect(isPaidBeforePay).toBe(false)

    const hash = getHash(invoice)

    await pay({ lnd: lndOutside1, request: invoice })

    expect(
      await Wallets.updatePendingInvoiceByPaymentHash({
        paymentHash: hash as PaymentHash,
        logger: baseLogger,
      }),
    ).not.toBeInstanceOf(Error)
    // should be idempotent (not return error when called again)
    expect(
      await Wallets.updatePendingInvoiceByPaymentHash({
        paymentHash: hash as PaymentHash,
        logger: baseLogger,
      }),
    ).not.toBeInstanceOf(Error)

    const dbTx = await ledger.getTransactionByHash(hash)
    expect(dbTx.sats).toBe(sats)
    expect(dbTx.memo).toBe(memo)
    expect(dbTx.pending).toBe(false)

    const isPaidAfterPay = await checker.invoiceIsPaid()
    expect(isPaidAfterPay).not.toBeInstanceOf(Error)
    expect(isPaidAfterPay).toBe(true)

    // check that memo is not filtered by spam filter
    const { result: txns, error } = await Wallets.getTransactionsForWalletId({
      walletId: userWallet1.user.walletId,
    })
    if (error instanceof Error || txns === null) {
      throw error
    }
    const noSpamTxn = txns.find(
      (txn) =>
        txn.initiationVia.type === PaymentInitiationMethod.Lightning &&
        txn.initiationVia.paymentHash === hash,
    ) as WalletTransaction
    expect(noSpamTxn.deprecated.description).toBe(memo)

    const finalBalance = await getBTCBalance(userWallet1.user.walletId)
    expect(finalBalance).toBe(initBalance1 + sats)
  })

  it("receives zero amount invoice", async () => {
    const sats = 1000

    const lnInvoice = await Wallets.addInvoiceNoAmount({
      walletId: userWallet1.user.walletId as WalletId,
    })
    if (lnInvoice instanceof Error) return lnInvoice
    const { paymentRequest: invoice } = lnInvoice

    const hash = getHash(invoice)

    await pay({ lnd: lndOutside1, request: invoice, tokens: sats })

    expect(
      await Wallets.updatePendingInvoiceByPaymentHash({
        paymentHash: hash as PaymentHash,
        logger: baseLogger,
      }),
    ).not.toBeInstanceOf(Error)
    // should be idempotent (not return error when called again)
    expect(
      await Wallets.updatePendingInvoiceByPaymentHash({
        paymentHash: hash as PaymentHash,
        logger: baseLogger,
      }),
    ).not.toBeInstanceOf(Error)

    const dbTx = await ledger.getTransactionByHash(hash)
    expect(dbTx.sats).toBe(sats)
    expect(dbTx.memo).toBe("")
    expect(dbTx.pending).toBe(false)

    const finalBalance = await getBTCBalance(userWallet1.user.walletId)
    expect(finalBalance).toBe(initBalance1 + sats)
  })

  it("receives spam invoice", async () => {
    // amount below MEMO_SPAM threshold
    const sats = 100
    const memo = "THIS MIGHT BE SPAM!!!"

    // confirm that transaction should be filtered
    expect(sats).toBeLessThan(MEMO_SHARING_SATS_THRESHOLD)

    // process spam transaction
    const lnInvoice = await Wallets.addInvoice({
      walletId: userWallet1.user.walletId as WalletId,
      amount: toSats(sats),
      memo,
    })
    if (lnInvoice instanceof Error) return lnInvoice
    const { paymentRequest: invoice } = lnInvoice

    const hash = getHash(invoice)
    await pay({ lnd: lndOutside1, request: invoice })
    expect(
      await Wallets.updatePendingInvoiceByPaymentHash({
        paymentHash: hash as PaymentHash,
        logger: baseLogger,
      }),
    ).not.toBeInstanceOf(Error)

    // check that spam memo is persisted to database
    const dbTx = await ledger.getTransactionByHash(hash)
    expect(dbTx.memo).toBe(memo)

    // check that spam memo is filtered from transaction description
    const { result: txns, error } = await Wallets.getTransactionsForWalletId({
      walletId: userWallet1.user.walletId,
    })
    if (error instanceof Error || txns === null) {
      throw error
    }
    const spamTxn = txns.find(
      (txn) =>
        txn.initiationVia.type === PaymentInitiationMethod.Lightning &&
        txn.initiationVia.paymentHash === hash,
    ) as WalletTransaction
    expect(dbTx.type).toBe("invoice")
    expect(spamTxn.deprecated.description).toBe(dbTx.type)

    // confirm expected final balance
    const finalBalance = await getBTCBalance(userWallet1.user.walletId)
    expect(finalBalance).toBe(initBalance1 + sats)
  })
})
