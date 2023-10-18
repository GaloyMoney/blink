import crypto from "crypto"

import { WalletCurrency } from "@/domain/shared"
import { decodeInvoice, getSecretAndPaymentHash } from "@/domain/bitcoin/lightning"
import { WalletInvoicesRepository } from "@/services/mongoose"

import { createUserAndWalletFromPhone, randomPhone } from "test/helpers"

const phoneB = randomPhone()

beforeAll(async () => {
  await createUserAndWalletFromPhone(phoneB)
})

const createTestWalletInvoice = () => {
  return {
    ...getSecretAndPaymentHash(),
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
    lnInvoice: decodeInvoice(
      "lnbc1pjjahwgpp5zzh9s6tkhpk7heu8jt4l7keuzg7v046p0lzx2hvy3jf6a56w50nqdp82pshjgr5dusyymrfde4jq4mpd3kx2apq24ek2uscqzpuxqyz5vqsp5vl4zmuvhl8rzy4rmq0g3j28060pv3gqp22rh8l7u45xwyu27928q9qyyssqn9drylhlth9ee320e4ahz52y9rklujqgw0kj9ce2gcmltqk6uuay5yv8vgks0y5tggndv0kek2m2n02lf43znx50237mglxsfw4au2cqqr6qax",
    ) as LnInvoice, // Use a real invoice to test decoding
    createdAt: new Date(),
  }
}

describe("WalletInvoices", () => {
  it("persists and finds an invoice", async () => {
    const repo = WalletInvoicesRepository()
    const invoiceToPersist = createTestWalletInvoice()
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
})
