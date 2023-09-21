import { LightningError as LnError } from "lightning"

import { MEMO_SHARING_SATS_THRESHOLD, SECS_PER_10_MINS } from "@config"

import { Lightning } from "@app"
import * as Wallets from "@app/wallets"
import { handleHeldInvoices } from "@app/wallets"

import { toSats } from "@domain/bitcoin"
import { InvoiceNotFoundError } from "@domain/bitcoin/lightning"
import { toCents } from "@domain/fiat"
import { PaymentInitiationMethod } from "@domain/wallets"
import { CouldNotFindWalletInvoiceError } from "@domain/errors"

import { WalletInvoicesRepository } from "@services/mongoose"
import { LedgerService } from "@services/ledger"
import { LndService } from "@services/lnd"
import { KnownLndErrorDetails } from "@services/lnd/errors"
import { baseLogger } from "@services/logger"
import { setupInvoiceSubscribe } from "@servers/trigger"

import { sleep } from "@utils"

import { parseLndErrorDetails } from "@services/lnd/config"

import { WalletInvoice } from "@services/mongoose/schema"

import {
  checkIsBalanced,
  createUserAndWalletFromPhone,
  getBalanceHelper,
  getDefaultWalletIdByPhone,
  getError,
  getHash,
  getInvoice,
  getPubKey,
  getTransactionsForWalletId,
  getUsdWalletIdByPhone,
  lnd1,
  lndOutside1,
  pay,
  randomPhone,
  safePay,
  safePayNoExpect,
  subscribeToInvoices,
} from "test/helpers"

let walletIdB: WalletId
let walletIdUsdB: WalletId
let walletIdF: WalletId
let walletIdUsdF: WalletId
let initBalanceB: Satoshis
let initBalanceUsdB: UsdCents

const phoneB = randomPhone()
const phoneF = randomPhone()

beforeAll(async () => {
  await createUserAndWalletFromPhone(phoneB)
  await createUserAndWalletFromPhone(phoneF)
  walletIdB = await getDefaultWalletIdByPhone(phoneB)
  walletIdUsdB = await getUsdWalletIdByPhone(phoneB)
  walletIdF = await getDefaultWalletIdByPhone(phoneF)
  walletIdUsdF = await getUsdWalletIdByPhone(phoneF)
})

beforeEach(async () => {
  initBalanceB = toSats(await getBalanceHelper(walletIdB))
  initBalanceUsdB = toCents(await getBalanceHelper(walletIdUsdB))
})

afterEach(async () => {
  await checkIsBalanced()
})

describe("UserWallet - Lightning", () => {
  it("calls updateInvoice multiple times idempotently", async () => {
    // larger amount to not fall below the escrow limit
    const sats = 500_000
    const memo = "myMemo"

    const lnInvoice = await Wallets.addInvoiceForSelfForBtcWallet({
      walletId: walletIdB,
      amount: toSats(sats),
      memo,
    })
    if (lnInvoice instanceof Error) throw lnInvoice
    const { paymentRequest, paymentHash } = lnInvoice

    const balanceBefore = await getBalanceHelper(walletIdB)
    const updateInvoice = async () => {
      // TODO: we could use event instead of a sleep to lower test latency
      await sleep(500)

      return Wallets.updatePendingInvoiceByPaymentHash({
        paymentHash,
        logger: baseLogger,
      })
    }

    // first arg is the outsideLndpayResult
    const [, result] = await Promise.all([
      safePay({ lnd: lndOutside1, request: paymentRequest }),
      updateInvoice(),
    ])
    expect(result).not.toBeInstanceOf(Error)

    const balanceAfter = await getBalanceHelper(walletIdB)
    expect(balanceAfter).toBeGreaterThan(balanceBefore)

    // should be idempotent (not return error when called again)
    const resultRetry = await updateInvoice()
    expect(resultRetry).not.toBeInstanceOf(Error)

    const balanceAfterRetry = await getBalanceHelper(walletIdB)
    expect(balanceAfterRetry).toEqual(balanceAfter)
  })

  it("if trigger is missing the USD invoice, then it should be denied", async () => {
    /*
      the reason we are doing this behavior is to limit the discrepancy between our books,
      and the state of lnd.
      if we get invoices that lnd has been settled because we were not using holdinvoice,
      then there would be discrepancy between the time lnd settled the invoice
      and the time it's being settle in our ledger
      the reason this could happen is because trigger has to restart
      the discrepancy in ledger is an okish behavior for bitcoin invoice, because there
      are no price risk, but it's an unbearable risk for non bitcoin wallets,
      because of the associated price risk exposure
    */

    const cents = 1000
    const memo = "myUsdMemo"

    const lnInvoice = await Wallets.addInvoiceForSelfForUsdWallet({
      walletId: walletIdUsdB as WalletId,
      amount: toCents(cents),
      memo,
    })
    if (lnInvoice instanceof Error) throw lnInvoice
    const { paymentRequest: invoice } = lnInvoice

    // fake timestamp in wallet invoice to avoid the use of fake timers
    await WalletInvoice.findOneAndUpdate(
      { _id: lnInvoice.paymentHash },
      { timestamp: new Date(Date.now() - SECS_PER_10_MINS * 1000) },
    )

    const checker = await Lightning.PaymentStatusChecker(invoice)
    if (checker instanceof Error) throw checker

    const isPaidBeforePay = await checker.invoiceIsPaid()
    expect(isPaidBeforePay).not.toBeInstanceOf(Error)
    expect(isPaidBeforePay).toBe(false)

    const paymentHash = getHash(invoice)
    const pubkey = getPubKey(invoice)

    await Promise.all([
      (async () => {
        const err = await getError<LnError>(() =>
          pay({ lnd: lndOutside1, request: invoice }),
        )
        expect(err[1]).toBe("PaymentRejectedByDestination")
      })(),
      (async () => {
        await sleep(500)

        // make sure invoice is held

        const lndService = LndService()
        if (lndService instanceof Error) throw lndService

        {
          const lnInvoiceLookup = await lndService.lookupInvoice({ pubkey, paymentHash })
          if (lnInvoiceLookup instanceof Error) throw lnInvoiceLookup

          expect(lnInvoiceLookup.isHeld).toBe(true)
        }

        // handling invoice
        await handleHeldInvoices(baseLogger)

        const ledger = LedgerService()
        const ledgerTxs = await ledger.getTransactionsByHash(paymentHash)
        if (ledgerTxs instanceof Error) throw ledgerTxs
        expect(ledgerTxs).toStrictEqual([])

        const isPaidAfterPay = await checker.invoiceIsPaid()
        expect(isPaidAfterPay).not.toBeInstanceOf(Error)
        expect(isPaidAfterPay).toBe(false)

        const finalBalance = await getBalanceHelper(walletIdUsdB)
        expect(finalBalance).toBe(initBalanceUsdB)

        const lnInvoiceLookup = await lndService.lookupInvoice({ pubkey, paymentHash })
        expect(lnInvoiceLookup).toBeInstanceOf(InvoiceNotFoundError)

        {
          const walletInvoiceRepo = WalletInvoicesRepository()
          const result = await walletInvoiceRepo.findByPaymentHash(paymentHash)
          expect(result).toBeInstanceOf(CouldNotFindWalletInvoiceError)
        }

        // making sure relooping is a no-op and doesn't throw
        await handleHeldInvoices(baseLogger)
      })(),
    ])
  })

  it("if trigger is missing the BTC invoice, then it should be processed", async () => {
    const sats = 25000
    const memo = "myBtcMemo"

    const lnInvoice = await Wallets.addInvoiceForSelfForBtcWallet({
      walletId: walletIdB as WalletId,
      amount: toSats(sats),
      memo,
    })
    if (lnInvoice instanceof Error) throw lnInvoice
    const { paymentRequest: invoice } = lnInvoice

    const checker = await Lightning.PaymentStatusChecker(invoice)
    if (checker instanceof Error) throw checker

    const isPaidBeforePay = await checker.invoiceIsPaid()
    expect(isPaidBeforePay).not.toBeInstanceOf(Error)
    expect(isPaidBeforePay).toBe(false)

    const paymentHash = getHash(invoice)
    const pubkey = getPubKey(invoice)

    await Promise.all([
      pay({ lnd: lndOutside1, request: invoice }),
      (async () => {
        await sleep(500)

        // make sure invoice is held

        const lndService = LndService()
        if (lndService instanceof Error) throw lndService

        {
          const lnInvoiceLookup = await lndService.lookupInvoice({ pubkey, paymentHash })
          if (lnInvoiceLookup instanceof Error) throw lnInvoiceLookup

          expect(lnInvoiceLookup.isHeld).toBe(true)
        }

        // handling invoice
        await handleHeldInvoices(baseLogger)

        const ledger = LedgerService()
        const ledgerTxs = await ledger.getTransactionsByHash(paymentHash)
        if (ledgerTxs instanceof Error) throw ledgerTxs
        expect(ledgerTxs).toHaveLength(1)

        const isPaidAfterPay = await checker.invoiceIsPaid()
        expect(isPaidAfterPay).not.toBeInstanceOf(Error)
        expect(isPaidAfterPay).toBe(true)

        const finalBalance = await getBalanceHelper(walletIdB)
        expect(finalBalance).toBe(initBalanceB + sats)

        const lnInvoiceLookup = await lndService.lookupInvoice({ pubkey, paymentHash })
        expect(lnInvoiceLookup).not.toBeInstanceOf(Error)
        if (lnInvoiceLookup instanceof Error) throw lnInvoiceLookup
        expect(lnInvoiceLookup.isSettled).toBeTruthy()

        {
          const walletInvoiceRepo = WalletInvoicesRepository()
          const result = await walletInvoiceRepo.findByPaymentHash(paymentHash)
          expect(result).not.toBeInstanceOf(Error)
          if (result instanceof Error) throw result
          expect(result.paid).toBeTruthy()
        }

        // making sure relooping is a no-op and doesn't throw
        await handleHeldInvoices(baseLogger)
      })(),
    ])
  })

  it("receives 'less than 1 sat amount' invoice", async () => {
    const mtokens = "995"
    const lnInvoice = await Wallets.addInvoiceNoAmountForSelf({
      walletId: walletIdB as WalletId,
    })
    if (lnInvoice instanceof Error) throw lnInvoice
    const { paymentRequest: invoice, paymentHash: hash } = lnInvoice

    safePayNoExpect({ lnd: lndOutside1, request: invoice, mtokens })
    // TODO: we could use an event instead of a sleep
    await sleep(500)

    expect(
      await Wallets.updatePendingInvoiceByPaymentHash({
        paymentHash: hash,
        logger: baseLogger,
      }),
    ).not.toBeInstanceOf(Error)
    // should be idempotent (not return error when called again)
    expect(
      await Wallets.updatePendingInvoiceByPaymentHash({
        paymentHash: hash,
        logger: baseLogger,
      }),
    ).not.toBeInstanceOf(Error)

    // Check that no new txns are added
    const ledgerTxs = await LedgerService().getTransactionsByHash(hash)
    if (ledgerTxs instanceof Error) throw ledgerTxs
    expect(ledgerTxs).toHaveLength(0)

    // Check that wallet invoice is deleted (was declined)
    const walletInvoice = await WalletInvoicesRepository().findByPaymentHash(hash)
    expect(walletInvoice).toBeInstanceOf(CouldNotFindWalletInvoiceError)

    // Check that invoice is deleted in lnd
    let getInvoiceErr
    try {
      await getInvoice({ lnd: lnd1, id: hash })
    } catch (err) {
      getInvoiceErr = err
    }
    expect(parseLndErrorDetails(getInvoiceErr)).toMatch(
      KnownLndErrorDetails.InvoiceNotFound,
    )

    // Check that wallet balance is unchanged
    const finalBalance = await getBalanceHelper(walletIdB)
    expect(finalBalance).toBe(initBalanceB)
  })

  it("receives spam invoice", async () => {
    // amount below MEMO_SPAM threshold
    const sats = 100
    const memo = "THIS MIGHT BE SPAM!!!"

    // confirm that transaction should be filtered
    expect(sats).toBeLessThan(MEMO_SHARING_SATS_THRESHOLD)

    // process spam transaction
    const lnInvoice = await Wallets.addInvoiceForSelfForBtcWallet({
      walletId: walletIdB as WalletId,
      amount: toSats(sats),
      memo,
    })
    if (lnInvoice instanceof Error) throw lnInvoice
    const { paymentRequest: invoice } = lnInvoice

    const hash = getHash(invoice)
    safePayNoExpect({ lnd: lndOutside1, request: invoice })

    // TODO: we could use an event instead of a sleep
    await sleep(500)

    expect(
      await Wallets.updatePendingInvoiceByPaymentHash({
        paymentHash: hash as PaymentHash,
        logger: baseLogger,
      }),
    ).not.toBeInstanceOf(Error)

    // check that spam memo is persisted to database
    const ledger = LedgerService()
    const ledgerTxs = await ledger.getTransactionsByHash(hash)
    if (ledgerTxs instanceof Error) throw ledgerTxs

    const ledgerTx = ledgerTxs[0]
    expect(ledgerTx.lnMemo).toBe(memo)

    // check that spam memo is filtered from transaction description
    const { result: txns, error } = await getTransactionsForWalletId(walletIdB)
    if (error instanceof Error || txns === null) throw error
    expect(ledgerTx.type).toBe("invoice")

    const spamTxn = txns.slice.find(
      (txn) =>
        txn.initiationVia.type === PaymentInitiationMethod.Lightning &&
        txn.initiationVia.paymentHash === hash,
    ) as WalletTransaction
    expect(spamTxn.memo).toBeNull()

    // confirm expected final balance
    const finalBalance = await getBalanceHelper(walletIdB)
    expect(finalBalance).toBe(initBalanceB + sats)
  })
})

describe("Invoice handling from trigger", () => {
  describe("btc recipient invoice", () => {
    const sats = toSats(500)

    it("should process held invoice when trigger comes back up", async () => {
      // Create invoice for self
      const lnInvoice = await Wallets.addInvoiceForSelfForBtcWallet({
        walletId: walletIdF,
        amount: sats,
      })
      expect(lnInvoice).not.toBeInstanceOf(Error)
      if (lnInvoice instanceof Error) throw lnInvoice

      // Pay invoice promise
      const startPay = async () => {
        try {
          return await pay({
            lnd: lndOutside1,
            request: lnInvoice.paymentRequest,
          })
        } catch (err) {
          return parseLndErrorDetails(err)
        }
      }

      // Listener promise
      const delayedListener = async (subInvoices) => {
        await sleep(500)
        setupInvoiceSubscribe({
          lnd: lnd1,
          pubkey: process.env.LND1_PUBKEY as Pubkey,
          subInvoices,
        })
      }

      // Pay and then listen
      const subInvoices = subscribeToInvoices({ lnd: lnd1 })
      const [result] = await Promise.all([startPay(), delayedListener(subInvoices)])

      // See successful payment
      expect(result.is_confirmed).toBeTruthy()
      subInvoices.removeAllListeners()
    })

    it("should process new invoice payment when trigger comes back up", async () => {
      // Create invoice for self
      const lnInvoice = await Wallets.addInvoiceForSelfForBtcWallet({
        walletId: walletIdF,
        amount: sats,
      })
      expect(lnInvoice).not.toBeInstanceOf(Error)
      if (lnInvoice instanceof Error) throw lnInvoice

      // Kick off listener
      const subInvoices = subscribeToInvoices({ lnd: lnd1 })
      setupInvoiceSubscribe({
        lnd: lnd1,
        pubkey: process.env.LND1_PUBKEY as Pubkey,
        subInvoices,
      })

      // Pay invoice
      const result = await pay({
        lnd: lndOutside1,
        request: lnInvoice.paymentRequest,
      })

      // See successful payment
      expect(result.is_confirmed).toBeTruthy()
      subInvoices.removeAllListeners()
    })
  })

  describe("usd recipient invoice", () => {
    const cents = toCents(100)

    it("should process held invoice when trigger comes back up", async () => {
      // Create invoice for self
      const lnInvoice = await Wallets.addInvoiceForSelfForUsdWallet({
        walletId: walletIdUsdF,
        amount: cents,
      })
      expect(lnInvoice).not.toBeInstanceOf(Error)
      if (lnInvoice instanceof Error) throw lnInvoice

      // Pay invoice promise
      const startPay = async () => {
        try {
          return await pay({
            lnd: lndOutside1,
            request: lnInvoice.paymentRequest,
          })
        } catch (err) {
          return parseLndErrorDetails(err)
        }
      }

      // Listener promise
      const delayedListener = async (subInvoices) => {
        await sleep(500)
        setupInvoiceSubscribe({
          lnd: lnd1,
          pubkey: process.env.LND1_PUBKEY as Pubkey,
          subInvoices,
        })
      }

      // Pay and then listen
      const subInvoices = subscribeToInvoices({ lnd: lnd1 })
      const [result] = await Promise.all([startPay(), delayedListener(subInvoices)])

      // See successful payment
      expect(result.is_confirmed).toBeTruthy()
      subInvoices.removeAllListeners()
    })

    it("should decline held invoice when trigger comes back up", async () => {
      // Create invoice for self
      const lnInvoice = await Wallets.addInvoiceForSelfForUsdWallet({
        walletId: walletIdUsdF,
        amount: cents,
      })
      expect(lnInvoice).not.toBeInstanceOf(Error)
      if (lnInvoice instanceof Error) throw lnInvoice

      // fake timestamp in wallet invoice to avoid the use of fake timers
      await WalletInvoice.findOneAndUpdate(
        { _id: lnInvoice.paymentHash },
        { timestamp: new Date(Date.now() - SECS_PER_10_MINS * 1000) },
      )

      // Pay invoice promise
      const startPay = async () => {
        try {
          return await pay({
            lnd: lndOutside1,
            request: lnInvoice.paymentRequest,
          })
        } catch (err) {
          return parseLndErrorDetails(err)
        }
      }

      // Listener promise
      const delayedListener = async (subInvoices) => {
        await sleep(500)
        setupInvoiceSubscribe({
          lnd: lnd1,
          pubkey: process.env.LND1_PUBKEY as Pubkey,
          subInvoices,
        })
      }

      // Pay and then listen
      const subInvoices = subscribeToInvoices({ lnd: lnd1 })
      const [result] = await Promise.all([startPay(), delayedListener(subInvoices)])

      // See successful payment
      expect(result).toMatch(KnownLndErrorDetails.PaymentRejectedByDestination)
      subInvoices.removeAllListeners()
    })

    it("should process new invoice payment when trigger comes back up", async () => {
      // Create invoice for self
      const lnInvoice = await Wallets.addInvoiceForSelfForUsdWallet({
        walletId: walletIdUsdF,
        amount: cents,
      })
      expect(lnInvoice).not.toBeInstanceOf(Error)
      if (lnInvoice instanceof Error) throw lnInvoice

      // Kick off listener
      const subInvoices = subscribeToInvoices({ lnd: lnd1 })
      setupInvoiceSubscribe({
        lnd: lnd1,
        pubkey: process.env.LND1_PUBKEY as Pubkey,
        subInvoices,
      })

      // Pay invoice
      const result = await pay({
        lnd: lndOutside1,
        request: lnInvoice.paymentRequest,
      })

      // See successful payment
      expect(result.is_confirmed).toBeTruthy()
      subInvoices.removeAllListeners()
    })
  })
})
