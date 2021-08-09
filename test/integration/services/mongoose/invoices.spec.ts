import { RepositoryError } from "@domain/errors"
import { MakeInvoicesRepo } from "@services/mongoose/invoices"

describe("Invoices", () => {
  it("persists and finds invoices", async () => {
    const randomPaymentHash = Math.random().toString(36) as PaymentHash
    const repo = MakeInvoicesRepo()
    const invoiceToPersist = {
      paymentHash: randomPaymentHash,
      walletId: "walletId" as WalletId,
      selfGenerated: false,
      pubkey: "pubkey" as Pubkey,
      paid: false,
    }
    const persistResult = await repo.persist(invoiceToPersist)
    expect(persistResult).not.toBeInstanceOf(RepositoryError)

    const lookedUpInvoice = await repo.findByPaymentHash(randomPaymentHash)
    expect(lookedUpInvoice).toEqual(invoiceToPersist)
  })
})
