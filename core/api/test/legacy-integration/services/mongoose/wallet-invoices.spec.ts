import crypto from "crypto"

import { WalletCurrency } from "@/domain/shared"
import { WalletInvoicesRepository } from "@/services/mongoose"

import { createUserAndWalletFromPhone, randomPhone } from "test/helpers"
import { createMockWalletInvoice } from "test/helpers/wallet-invoices"

const phoneB = randomPhone()

beforeAll(async () => {
  await createUserAndWalletFromPhone(phoneB)
})

describe("WalletInvoices", () => {
  const walletDescriptor = {
    currency: WalletCurrency.Btc,
    id: crypto.randomUUID() as WalletId,
  }
  it("persists and finds an invoice", async () => {
    const repo = WalletInvoicesRepository()
    const invoiceToPersist = createMockWalletInvoice(walletDescriptor)
    const persistResult = await repo.persistNew(invoiceToPersist)
    expect(persistResult).not.toBeInstanceOf(Error)

    const { paymentHash } = persistResult as WalletInvoice
    const lookedUpInvoice = await repo.findByPaymentHash(paymentHash)
    if (lookedUpInvoice instanceof Error) throw lookedUpInvoice

    const dateDifference = Math.abs(
      lookedUpInvoice.createdAt.getTime() - invoiceToPersist.createdAt.getTime(),
    )
    expect(dateDifference).toBeLessThanOrEqual(10) // 10ms

    lookedUpInvoice.createdAt = invoiceToPersist.createdAt = new Date()
    expect(lookedUpInvoice).toEqual(invoiceToPersist)
  })

  it("updates an invoice", async () => {
    const repo = WalletInvoicesRepository()
    const invoiceToPersist = createMockWalletInvoice(walletDescriptor)
    const persistResult = await repo.persistNew(invoiceToPersist)
    expect(persistResult).not.toBeInstanceOf(Error)

    const invoiceToUpdate = persistResult as WalletInvoice
    const updatedResult = await repo.markAsPaid(invoiceToUpdate.paymentHash)
    expect(updatedResult).not.toBeInstanceOf(Error)
    expect(updatedResult).toHaveProperty("paid", true)

    const { paymentHash } = updatedResult as WalletInvoice
    const lookedUpInvoice = await repo.findByPaymentHash(paymentHash)
    expect(lookedUpInvoice).not.toBeInstanceOf(Error)
    expect(lookedUpInvoice).toEqual(updatedResult)
    expect(lookedUpInvoice).toHaveProperty("paid", true)
  })

  it("deletes an invoice by hash", async () => {
    const repo = WalletInvoicesRepository()
    const invoiceToPersist = createMockWalletInvoice(walletDescriptor)
    const persistResult = await repo.persistNew(invoiceToPersist)
    expect(persistResult).not.toBeInstanceOf(Error)

    const { paymentHash } = persistResult as WalletInvoice
    const isDeleted = await repo.deleteByPaymentHash(paymentHash)
    expect(isDeleted).not.toBeInstanceOf(Error)
    expect(isDeleted).toEqual(true)
  })
})
