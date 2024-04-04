import { DEFAULT_EXPIRATIONS } from "@/domain/bitcoin/lightning/invoice-expiration"
import { CouldNotFindWalletInvoiceError, RepositoryError } from "@/domain/errors"
import { WalletCurrency } from "@/domain/shared"
import { WalletInvoiceChecker } from "@/domain/wallet-invoices"

const goodWalletInvoice: WalletInvoiceWithOptionalLnInvoice = {
  paymentHash: "paymentHash" as PaymentHash,
  secret: "secretPreImage" as SecretPreImage,
  selfGenerated: true,
  pubkey: "pubkey" as Pubkey,
  recipientWalletDescriptor: { id: "walletId" as WalletId, currency: WalletCurrency.Usd },
  paid: false,
  createdAt: new Date(Date.now()),
  processingCompleted: false,
  externalId: "externalId" as LedgerExternalId,
}

describe("WalletInvoiceChecker", () => {
  describe("shouldDecline", () => {
    it("returns false for no error and good expiry", () => {
      expect(WalletInvoiceChecker(goodWalletInvoice).shouldDecline()).toBe(false)
    })

    it("returns false for walletInvoice error", () => {
      expect(WalletInvoiceChecker(new RepositoryError()).shouldDecline()).toBe(false)
    })

    it("returns true for CouldNotFindWalletInvoiceError", () => {
      expect(
        WalletInvoiceChecker(new CouldNotFindWalletInvoiceError()).shouldDecline(),
      ).toBe(true)
    })

    it("returns true for expired usd invoice", () => {
      const usdDelayMs = DEFAULT_EXPIRATIONS.USD.delay * 1000
      const timeBuffer = 1000 // buffer for any time library discrepancies
      const pastCreatedAt = new Date(Date.now() - (usdDelayMs + timeBuffer))
      expect(
        WalletInvoiceChecker({
          ...goodWalletInvoice,
          createdAt: pastCreatedAt,
        }).shouldDecline(),
      ).toBe(true)
    })
  })
})
