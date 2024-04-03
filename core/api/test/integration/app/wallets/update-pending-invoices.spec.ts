import { randomUUID } from "crypto"

import { MS_PER_DAY } from "@/config"

import * as LedgerFacadeImpl from "@/services/ledger/facade"
import * as LndImpl from "@/services/lnd"

import * as DeclinePendingInvoiceImpl from "@/app/wallets/decline-single-pending-invoice"
import * as UpdatePendingInvoiceImpl from "@/app/wallets/update-single-pending-invoice"

import { handleHeldInvoices } from "@/app/wallets"
import { updatePendingInvoice } from "@/app/wallets/update-single-pending-invoice"

import { toMilliSatsFromNumber, toSats } from "@/domain/bitcoin"
import { decodeInvoice, getSecretAndPaymentHash } from "@/domain/bitcoin/lightning"
import { DEFAULT_EXPIRATIONS } from "@/domain/bitcoin/lightning/invoice-expiration"
import { LedgerTransactionType } from "@/domain/ledger"
import { WalletCurrency } from "@/domain/shared"
import * as DisplayAmountsConverterImpl from "@/domain/fiat"

import { baseLogger } from "@/services/logger"
import { WalletInvoicesRepository } from "@/services/mongoose"
import { WalletInvoice } from "@/services/mongoose/schema"
import { Transaction, TransactionMetadata } from "@/services/ledger/schema"

import {
  createMandatoryUsers,
  createRandomUserAndBtcWallet,
  getBalanceHelper,
} from "test/helpers"

const mockLnInvoice = decodeInvoice(
  "lnbc1pjjahwgpp5zzh9s6tkhpk7heu8jt4l7keuzg7v046p0lzx2hvy3jf6a56w50nqdp82pshjgr5dusyymrfde4jq4mpd3kx2apq24ek2uscqzpuxqyz5vqsp5vl4zmuvhl8rzy4rmq0g3j28060pv3gqp22rh8l7u45xwyu27928q9qyyssqn9drylhlth9ee320e4ahz52y9rklujqgw0kj9ce2gcmltqk6uuay5yv8vgks0y5tggndv0kek2m2n02lf43znx50237mglxsfw4au2cqqr6qax",
) as LnInvoice

const DEFAULT_PUBKEY =
  "03ca1907342d5d37744cb7038375e1867c24a87564c293157c95b2a9d38dcfb4c2" as Pubkey

beforeAll(async () => {
  await createMandatoryUsers()
})

afterEach(async () => {
  await WalletInvoice.deleteMany({})
  await Transaction.deleteMany({})
  await TransactionMetadata.deleteMany({})

  jest.restoreAllMocks()
})

describe("update pending invoices", () => {
  describe("handleHeldInvoices", () => {
    it("declines USD invoice with expired 'createdAt'", async () => {
      // Setup mocks
      const declineHeldInvoiceMock = jest.fn()
      const declineHeldInvoiceSpy = jest
        .spyOn(DeclinePendingInvoiceImpl, "declineHeldInvoice")
        .mockImplementation(declineHeldInvoiceMock)

      // Setup expired USD wallet invoice
      const { paymentHash } = getSecretAndPaymentHash()
      const expiredUsdWalletInvoice = {
        paymentHash,
        secret: "secretPreImage" as SecretPreImage,
        selfGenerated: true,
        pubkey: "pubkey" as Pubkey,
        recipientWalletDescriptor: {
          id: randomUUID() as WalletId,
          currency: WalletCurrency.Usd,
        },
        paid: false,
        lnInvoice: mockLnInvoice,
        processingCompleted: false,
        externalId: undefined,
      }
      const persisted = await WalletInvoicesRepository().persistNew(
        expiredUsdWalletInvoice,
      )
      if (persisted instanceof Error) throw persisted

      const usdDelayMs = DEFAULT_EXPIRATIONS.USD.delay * 1000
      const timeBuffer = 1000 // buffer for any time library discrepancies
      const pastCreatedAt = new Date(Date.now() - (usdDelayMs + timeBuffer))
      await WalletInvoice.findOneAndUpdate(
        { _id: paymentHash },
        { timestamp: pastCreatedAt },
      )

      // Handle invoices
      await handleHeldInvoices(baseLogger)

      // Expect declined invoice
      expect(declineHeldInvoiceMock.mock.calls.length).toBe(1)
      expect(declineHeldInvoiceMock.mock.calls[0][0].walletInvoice.paymentHash).toBe(
        paymentHash,
      )

      // Restore system state
      declineHeldInvoiceSpy.mockRestore()
    })

    it("does not decline BTC invoice with expired 'createdAt'", async () => {
      // Setup mocks
      const declineHeldInvoiceMock = jest.fn()
      const declineHeldInvoiceSpy = jest
        .spyOn(DeclinePendingInvoiceImpl, "declineHeldInvoice")
        .mockImplementation(declineHeldInvoiceMock)

      const updatePendingInvoiceMock = jest.fn()
      const updatePendingInvoiceSpy = jest
        .spyOn(UpdatePendingInvoiceImpl, "updatePendingInvoice")
        .mockImplementation(updatePendingInvoiceMock)

      // Setup expired BTC wallet invoice
      const { paymentHash } = getSecretAndPaymentHash()
      const expiredBtcWalletInvoice = {
        paymentHash,
        secret: "secretPreImage" as SecretPreImage,
        selfGenerated: true,
        pubkey: "pubkey" as Pubkey,
        recipientWalletDescriptor: {
          id: randomUUID() as WalletId,
          currency: WalletCurrency.Btc,
        },
        paid: false,
        lnInvoice: mockLnInvoice,
        processingCompleted: false,
        externalId: undefined,
      }
      const persisted = await WalletInvoicesRepository().persistNew(
        expiredBtcWalletInvoice,
      )
      if (persisted instanceof Error) throw persisted

      const btcDelayMs = DEFAULT_EXPIRATIONS.BTC.delay * 1000
      const timeBuffer = 1000 // buffer for any time library discrepancies
      const pastCreatedAt = new Date(Date.now() - (btcDelayMs + timeBuffer))
      await WalletInvoice.findOneAndUpdate(
        { _id: paymentHash },
        { timestamp: pastCreatedAt },
      )

      // Handle invoices
      await handleHeldInvoices(baseLogger)

      // Expect declined invoice
      expect(declineHeldInvoiceMock.mock.calls.length).toBe(0)
      expect(updatePendingInvoiceMock.mock.calls.length).toBe(1)
      expect(updatePendingInvoiceMock.mock.calls[0][0].walletInvoice.paymentHash).toBe(
        paymentHash,
      )

      // Restore system state
      declineHeldInvoiceSpy.mockRestore()
      updatePendingInvoiceSpy.mockRestore()
    })
  })

  describe("updatePendingInvoice", () => {
    it("should be idempotent", async () => {
      const invoiceAmount = toSats(1)
      const { paymentHash } = getSecretAndPaymentHash()
      const btcDelayMs = DEFAULT_EXPIRATIONS.BTC.delay * 1000
      const timeBuffer = 1000 // buffer for any time library discrepancies
      const pastCreatedAt = new Date(Date.now() - (btcDelayMs + timeBuffer))

      const walletInvoices = WalletInvoicesRepository()

      // Setup mocks
      const lnInvoiceLookup: LnInvoiceLookup = {
        paymentHash,
        createdAt: pastCreatedAt,
        confirmedAt: undefined,
        isSettled: false,
        isHeld: true,
        heldAt: undefined,
        roundedDownReceived: invoiceAmount,
        milliSatsReceived: toMilliSatsFromNumber(1000),
        secretPreImage: "secretPreImage" as SecretPreImage,
        lnInvoice: {
          description: "",
          paymentRequest: undefined,
          expiresAt: new Date(Date.now() + MS_PER_DAY),
          roundedDownAmount: invoiceAmount,
        },
      }
      const { LndService: LnServiceOrig } = jest.requireActual("@/services/lnd")
      const lndServiceSpy = jest.spyOn(LndImpl, "LndService").mockReturnValue({
        ...LnServiceOrig(),
        defaultPubkey: () => DEFAULT_PUBKEY,
        lookupInvoice: () => lnInvoiceLookup,
        settleInvoice: () => true,
      })

      // Setup BTC wallet and invoice
      const recipientWalletDescriptor = await createRandomUserAndBtcWallet()
      const initialBalance = await getBalanceHelper(recipientWalletDescriptor.id)

      const btcWalletInvoice = {
        paymentHash,
        secret: "secretPreImage" as SecretPreImage,
        selfGenerated: true,
        pubkey: "pubkey" as Pubkey,
        recipientWalletDescriptor,
        paid: false,
        lnInvoice: mockLnInvoice,
        processingCompleted: false,
        externalId: undefined,
      }

      const persisted = await walletInvoices.persistNew(btcWalletInvoice)
      if (persisted instanceof Error) throw persisted

      await WalletInvoice.findOneAndUpdate(
        { _id: paymentHash },
        { timestamp: pastCreatedAt },
      )

      // Run invoice update multiple times
      const walletInvoice = await walletInvoices.findByPaymentHash(paymentHash)
      if (walletInvoice instanceof Error) throw walletInvoice
      const args = { walletInvoice, logger: baseLogger }
      const multipleCalls = [
        updatePendingInvoice(args),
        updatePendingInvoice(args),
        updatePendingInvoice(args),
      ]
      const results = await Promise.all(multipleCalls)
      const resultSet = new Set(results)
      expect(resultSet.size).toEqual(1)
      expect(resultSet).toContain(true)

      // Check final balance
      const finalBalance = await getBalanceHelper(recipientWalletDescriptor.id)
      expect(finalBalance - initialBalance).toEqual(invoiceAmount)

      // Restore system state
      lndServiceSpy.mockRestore()
    })

    it("records transaction with ln-receive metadata on ln receive", async () => {
      const invoiceAmount = toSats(1)
      const { paymentHash } = getSecretAndPaymentHash()
      const btcDelayMs = DEFAULT_EXPIRATIONS.BTC.delay * 1000
      const timeBuffer = 1000 // buffer for any time library discrepancies
      const pastCreatedAt = new Date(Date.now() - (btcDelayMs + timeBuffer))

      const walletInvoices = WalletInvoicesRepository()

      // Setup mocks
      const lnInvoiceLookup: LnInvoiceLookup = {
        paymentHash,
        createdAt: pastCreatedAt,
        confirmedAt: undefined,
        isSettled: false,
        isHeld: true,
        heldAt: undefined,
        roundedDownReceived: invoiceAmount,
        milliSatsReceived: toMilliSatsFromNumber(1000),
        secretPreImage: "secretPreImage" as SecretPreImage,
        lnInvoice: {
          description: "",
          paymentRequest: undefined,
          expiresAt: new Date(Date.now() + MS_PER_DAY),
          roundedDownAmount: invoiceAmount,
        },
      }
      const { LndService: LnServiceOrig } = jest.requireActual("@/services/lnd")
      jest.spyOn(LndImpl, "LndService").mockReturnValue({
        ...LnServiceOrig(),
        defaultPubkey: () => DEFAULT_PUBKEY,
        lookupInvoice: () => lnInvoiceLookup,
        settleInvoice: () => true,
      })

      const displayAmountsConverterSpy = jest.spyOn(
        DisplayAmountsConverterImpl,
        "DisplayAmountsConverter",
      )

      const lnReceiveLedgerMetadataSpy = jest.spyOn(
        LedgerFacadeImpl,
        "LnReceiveLedgerMetadata",
      )
      const recordReceiveOffChainSpy = jest.spyOn(
        LedgerFacadeImpl,
        "recordReceiveOffChain",
      )

      // Setup BTC wallet and invoice
      const recipientWalletDescriptor = await createRandomUserAndBtcWallet()

      const btcWalletInvoice = {
        paymentHash,
        secret: "secretPreImage" as SecretPreImage,
        selfGenerated: true,
        pubkey: "pubkey" as Pubkey,
        recipientWalletDescriptor,
        paid: false,
        lnInvoice: mockLnInvoice,
        processingCompleted: false,
        externalId: undefined,
      }

      const persisted = await walletInvoices.persistNew(btcWalletInvoice)
      if (persisted instanceof Error) throw persisted

      await WalletInvoice.findOneAndUpdate(
        { _id: paymentHash },
        { timestamp: pastCreatedAt },
      )

      // Call invoice update
      const walletInvoice = await walletInvoices.findByPaymentHash(paymentHash)
      if (walletInvoice instanceof Error) throw walletInvoice
      await updatePendingInvoice({ walletInvoice, logger: baseLogger })

      // Check record function was called with right metadata
      expect(displayAmountsConverterSpy).toHaveBeenCalledTimes(1)
      expect(lnReceiveLedgerMetadataSpy).toHaveBeenCalledTimes(1)
      const args = recordReceiveOffChainSpy.mock.calls[0][0]
      expect(args.metadata.type).toBe(LedgerTransactionType.Invoice)
    })
  })
})
