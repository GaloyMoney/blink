import { randomUUID } from "crypto"

import { handleHeldInvoices } from "@/app/wallets"
import * as UpdatePendingInvoicesImpl from "@/app/wallets/update-pending-invoices"

import { DEFAULT_EXPIRATIONS } from "@/domain/bitcoin/lightning/invoice-expiration"
import { WalletCurrency } from "@/domain/shared"
import { baseLogger } from "@/services/logger"
import { WalletInvoicesRepository } from "@/services/mongoose"
import { WalletInvoice } from "@/services/mongoose/schema"
import { decodeInvoice, getSecretAndPaymentHash } from "@/domain/bitcoin/lightning"

const mockLnInvoice = decodeInvoice(
  "lnbc1pjjahwgpp5zzh9s6tkhpk7heu8jt4l7keuzg7v046p0lzx2hvy3jf6a56w50nqdp82pshjgr5dusyymrfde4jq4mpd3kx2apq24ek2uscqzpuxqyz5vqsp5vl4zmuvhl8rzy4rmq0g3j28060pv3gqp22rh8l7u45xwyu27928q9qyyssqn9drylhlth9ee320e4ahz52y9rklujqgw0kj9ce2gcmltqk6uuay5yv8vgks0y5tggndv0kek2m2n02lf43znx50237mglxsfw4au2cqqr6qax",
) as LnInvoice

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
        lnInvoice: mockLnInvoice,
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
        lnInvoice: mockLnInvoice,
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
