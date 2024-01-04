import crypto from "crypto"

import { getInvoicePreImageByHash } from "@/app/transactions/get-invoice-preimage-by-hash"

import { WalletCurrency } from "@/domain/shared"
import { InvoiceNotPaidError } from "@/domain/wallet-invoices/errors"

import * as WalletInvoicesRepositoryImpl from "@/services/mongoose/wallet-invoices"

import { createMockWalletInvoice } from "test/helpers/wallet-invoices"

describe("getInvoicePreImageByHash", () => {
  it("returns a valid preimage when invoice has been paid", async () => {
    const defaultInvoice = createMockWalletInvoice({
      id: crypto.randomUUID() as WalletId,
      currency: WalletCurrency.Btc,
    })
    jest
      .spyOn(WalletInvoicesRepositoryImpl, "WalletInvoicesRepository")
      .mockImplementationOnce(() => ({
        findForWalletByPaymentHash: jest.fn(),
        findInvoicesForWallets: jest.fn(),
        markAsPaid: jest.fn(),
        markAsProcessingCompleted: jest.fn(),
        persistNew: jest.fn(),
        yieldPending: jest.fn(),
        findByPaymentHash: () => Promise.resolve({ ...defaultInvoice, paid: true }),
      }))

    const preImage = await getInvoicePreImageByHash({
      paymentHash: defaultInvoice.paymentHash,
    })
    expect(preImage).not.toBeInstanceOf(Error)
    expect(preImage).toBe(defaultInvoice.secret)
  })

  it("returns error if invoice has not been paid", async () => {
    const defaultInvoice = createMockWalletInvoice({
      id: crypto.randomUUID() as WalletId,
      currency: WalletCurrency.Btc,
    })
    jest
      .spyOn(WalletInvoicesRepositoryImpl, "WalletInvoicesRepository")
      .mockImplementationOnce(() => ({
        findForWalletByPaymentHash: jest.fn(),
        findInvoicesForWallets: jest.fn(),
        markAsPaid: jest.fn(),
        markAsProcessingCompleted: jest.fn(),
        persistNew: jest.fn(),
        yieldPending: jest.fn(),
        findByPaymentHash: () => Promise.resolve({ ...defaultInvoice, paid: false }),
      }))

    const preImage = await getInvoicePreImageByHash({
      paymentHash: defaultInvoice.paymentHash,
    })
    expect(preImage).toBeInstanceOf(InvoiceNotPaidError)
  })
})
