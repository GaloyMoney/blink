import { AlreadyPaidError, SelfPaymentError } from "@domain/errors"
import { WalletInvoiceValidator } from "@domain/wallet-invoices"

describe("WalletInvoiceValidator", () => {
  const walletInvoice: WalletInvoice = {
    paymentHash: "paymentHash" as PaymentHash,
    walletId: "toWalletId" as WalletId,
    selfGenerated: false,
    pubkey: "pubkey" as Pubkey,
    paid: false,
  }
  const fromWalletId = "fromWalletId" as WalletId

  it("passes for unpaid invoice and valid recipient wallet", () => {
    walletInvoice.paid = false
    const walletInvoiceValidator = WalletInvoiceValidator(walletInvoice)

    const validatorResult = walletInvoiceValidator.validateToSend({ fromWalletId })
    expect(validatorResult).not.toBeInstanceOf(Error)
  })

  it("fails for self recipient wallet", () => {
    walletInvoice.paid = false
    const walletInvoiceValidator = WalletInvoiceValidator(walletInvoice)

    const validatorResult = walletInvoiceValidator.validateToSend({
      fromWalletId: walletInvoice.walletId,
    })
    expect(validatorResult).toBeInstanceOf(SelfPaymentError)
  })

  it("fails for non-pending invoice and valid recipient wallet", () => {
    walletInvoice.paid = true
    const walletInvoiceValidator = WalletInvoiceValidator(walletInvoice)

    const validatorResult = walletInvoiceValidator.validateToSend({ fromWalletId })
    expect(validatorResult).toBeInstanceOf(AlreadyPaidError)
  })
})
