import crypto from "crypto"

import { getInvoicePreImageByHash } from "@/app/transactions/get-invoice-preimage-by-hash"

import { WalletCurrency } from "@/domain/shared"
import { InvoiceNotPaidError } from "@/domain/wallet-invoices/errors"

import { WalletInvoicesRepository } from "@/services/mongoose"

import { createMockWalletInvoice } from "test/helpers/wallet-invoices"

describe("getInvoicePreImageByHash", () => {
  it("returns a valid preimage when invoice has been paid", async () => {
    const invoice = createMockWalletInvoice({
      id: crypto.randomUUID() as WalletId,
      currency: WalletCurrency.Btc,
    })
    await WalletInvoicesRepository().persistNew({ ...invoice, paid: true })

    const preImage = await getInvoicePreImageByHash({
      paymentHash: invoice.paymentHash,
    })
    expect(preImage).not.toBeInstanceOf(Error)
    expect(preImage).toBe(invoice.secret)
  })

  it("returns error if invoice has not been paid", async () => {
    const invoice = createMockWalletInvoice({
      id: crypto.randomUUID() as WalletId,
      currency: WalletCurrency.Btc,
    })
    await WalletInvoicesRepository().persistNew({ ...invoice, paid: false })

    const preImage = await getInvoicePreImageByHash({
      paymentHash: invoice.paymentHash,
    })
    expect(preImage).toBeInstanceOf(InvoiceNotPaidError)
  })
})
