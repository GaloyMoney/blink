import { RepositoryError } from "@domain/errors"
import { WalletInvoicesRepository } from "@services/mongoose"

const createTestWalletInvoice = () => {
  const randomPaymentHash = Math.random().toString(36) as PaymentHash
  return {
    paymentHash: randomPaymentHash,
    walletId: "walletId" as WalletId,
    selfGenerated: false,
    pubkey: "pubkey" as Pubkey,
    paid: false,
  }
}

describe("WalletInvoices", () => {
  it("persists and finds invoices", async () => {
    const repo = WalletInvoicesRepository()
    const invoiceToPersist = createTestWalletInvoice()
    const persistResult = await repo.persist(invoiceToPersist)
    expect(persistResult).not.toBeInstanceOf(RepositoryError)

    const { paymentHash } = persistResult as WalletInvoice
    const lookedUpInvoice = await repo.findByPaymentHash(paymentHash)
    expect(lookedUpInvoice).toEqual(invoiceToPersist)
  })

  it("delete one invoice by hash", async () => {
    const repo = WalletInvoicesRepository()
    const invoiceToPersist = createTestWalletInvoice()
    const persistResult = await repo.persist(invoiceToPersist)
    expect(persistResult).not.toBeInstanceOf(RepositoryError)

    const { paymentHash } = persistResult as WalletInvoice
    const isDeleted = await repo.deleteByPaymentHash(paymentHash)
    expect(isDeleted).not.toBeInstanceOf(RepositoryError)
    expect(isDeleted).toEqual(true)
  })
})
