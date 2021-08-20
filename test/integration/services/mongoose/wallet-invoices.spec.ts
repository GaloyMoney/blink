import { addInvoiceForSelf } from "@app/wallets"
import { toSats } from "@domain/bitcoin"
import { RepositoryError } from "@domain/errors"
import { WalletInvoicesRepository } from "@services/mongoose"
import { InvoiceUser } from "@services/mongoose/schema"
import { getUserWallet } from "test/helpers"

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

  it("set invoice as paid by hash", async () => {
    const repo = WalletInvoicesRepository()
    const invoiceToPersist = createTestWalletInvoice()
    const persistResult = await repo.persist(invoiceToPersist)
    expect(persistResult).not.toBeInstanceOf(RepositoryError)

    const { paymentHash } = persistResult as WalletInvoice
    let isUpdated = await repo.setPaidByPaymentHash(paymentHash)
    expect(persistResult).not.toBeInstanceOf(RepositoryError)
    expect(isUpdated).toBe(true)

    // if we try to update again it should return false
    isUpdated = await repo.setPaidByPaymentHash(paymentHash)
    expect(persistResult).not.toBeInstanceOf(RepositoryError)
    expect(isUpdated).toBe(false)
  })

  it("find pending invoices by wallet id", async () => {
    const wallet = await getUserWallet(1)
    for (let i = 0; i < 2; i++) {
      await addInvoiceForSelf({
        walletId: wallet.user.id as WalletId,
        amount: toSats(1000),
      })
    }

    const invoicesCount = await InvoiceUser.countDocuments({
      uid: wallet.user.id,
      paid: false,
    })

    const repo = WalletInvoicesRepository()
    const invoices = repo.findPendingByWalletId(wallet.user.id)
    expect(invoices).not.toBeInstanceOf(RepositoryError)

    const pendingInvoices = invoices as AsyncGenerator<WalletInvoice>

    let count = 0
    for await (const invoice of pendingInvoices) {
      count++
      expect(invoice).toBeDefined()
      expect(invoice).toHaveProperty("paymentHash")
      expect(invoice).toHaveProperty("pubkey")
      expect(invoice.paid).toBe(false)
    }

    expect(count).toBeGreaterThan(0)
    expect(count).toBe(invoicesCount)
  })
})
