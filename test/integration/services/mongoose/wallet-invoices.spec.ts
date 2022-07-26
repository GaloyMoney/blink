import crypto from "crypto"

import { Wallets } from "@app"
import { toSats } from "@domain/bitcoin"
import { WalletCurrency } from "@domain/shared"
import { WalletInvoicesRepository } from "@services/mongoose"
import { WalletInvoice } from "@services/mongoose/schema"

import {
  createUserAndWalletFromUserRef,
  getDefaultWalletIdByTestUserRef,
} from "test/helpers"

let walletB: WalletId

beforeAll(async () => {
  await createUserAndWalletFromUserRef("B")

  walletB = await getDefaultWalletIdByTestUserRef("B")
})

const createTestWalletInvoice = () => {
  const randomPaymentHash = crypto.randomBytes(32).toString("hex") as PaymentHash
  return {
    paymentHash: randomPaymentHash,
    selfGenerated: false,
    pubkey: "pubkey" as Pubkey,
    paid: false,
    recipientWalletDescriptor: {
      currency: WalletCurrency.Btc,
      id: crypto.randomUUID() as WalletId,
    },
    usdAmount: {
      currency: WalletCurrency.Usd,
      amount: 10n,
    },
  } as WalletInvoice
}

describe("WalletInvoices", () => {
  it("persists and finds an invoice", async () => {
    const repo = WalletInvoicesRepository()
    const invoiceToPersist = createTestWalletInvoice()
    const persistResult = await repo.persistNew(invoiceToPersist)
    expect(persistResult).not.toBeInstanceOf(Error)

    const { paymentHash } = persistResult as WalletInvoice
    const lookedUpInvoice = await repo.findByPaymentHash(paymentHash)
    expect(lookedUpInvoice).not.toBeInstanceOf(Error)
    expect(lookedUpInvoice).toEqual(invoiceToPersist)
  })

  it("updates an invoice", async () => {
    const repo = WalletInvoicesRepository()
    const invoiceToPersist = createTestWalletInvoice()
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
    const invoiceToPersist = createTestWalletInvoice()
    const persistResult = await repo.persistNew(invoiceToPersist)
    expect(persistResult).not.toBeInstanceOf(Error)

    const { paymentHash } = persistResult as WalletInvoice
    const isDeleted = await repo.deleteByPaymentHash(paymentHash)
    expect(isDeleted).not.toBeInstanceOf(Error)
    expect(isDeleted).toEqual(true)
  })

  it("find pending invoices by wallet id", async () => {
    for (let i = 0; i < 2; i++) {
      await Wallets.addInvoiceForSelf({
        walletId: walletB,
        amount: toSats(1000),
      })
    }

    const invoicesCount = await WalletInvoice.countDocuments({
      walletId: walletB,
      paid: false,
    })

    const repo = WalletInvoicesRepository()
    const invoices = repo.findPendingByWalletId(walletB)
    expect(invoices).not.toBeInstanceOf(Error)

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
