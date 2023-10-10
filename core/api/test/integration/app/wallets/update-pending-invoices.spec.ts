import { randomUUID } from "crypto"

import { handleHeldInvoices } from "@/app/wallets"
import * as UpdatePendingInvoicesImpl from "@/app/wallets/update-pending-invoices"

import { DEFAULT_EXPIRATIONS } from "@/domain/bitcoin/lightning/invoice-expiration"
import { WalletCurrency } from "@/domain/shared"
import { baseLogger } from "@/services/logger"
import { WalletInvoicesRepository } from "@/services/mongoose"
import { WalletInvoice } from "@/services/mongoose/schema"
import { getSecretAndPaymentHash } from "@/domain/bitcoin/lightning"

afterEach(async () => {
  await WalletInvoice.deleteMany({})
})

describe("update pending invoices", () => {
  describe("handleHeldInvoices", () => {
    it("declines USD invoice with expired 'createdAt'", async () => {
      // Setup mocks
      const declineHeldInvoiceMock = jest.fn()
      const declineHeldInvoiceSpy = jest
        .spyOn(UpdatePendingInvoicesImpl, "declineHeldInvoice")
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
        paymentRequest: "paymentRequest" as EncodedPaymentRequest,
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
      expect(declineHeldInvoiceMock.mock.calls[0][0].paymentHash).toBe(paymentHash)

      // Restore system state
      declineHeldInvoiceSpy.mockRestore()
    })

    it("does not decline BTC invoice with expired 'createdAt'", async () => {
      // Setup mocks
      const declineHeldInvoiceMock = jest.fn()
      const declineHeldInvoiceSpy = jest
        .spyOn(UpdatePendingInvoicesImpl, "declineHeldInvoice")
        .mockImplementation(declineHeldInvoiceMock)

      const updatePendingInvoiceMock = jest.fn()
      const updatePendingInvoiceSpy = jest
        .spyOn(UpdatePendingInvoicesImpl, "updatePendingInvoice")
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
        paymentRequest: "paymentRequest" as EncodedPaymentRequest,
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
})
