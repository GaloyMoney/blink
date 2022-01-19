import {
  CouldNotFindWalletInvoiceError,
  RepositoryError,
  UnknownRepositoryError,
} from "@domain/errors"

import { InvoiceUser } from "./schema"

export const WalletInvoicesRepository = (): IWalletInvoicesRepository => {
  const persistNew = async ({
    paymentHash,
    walletId,
    selfGenerated,
    pubkey,
    paid,
  }: WalletInvoice): Promise<WalletInvoice | RepositoryError> => {
    try {
      const invoiceUser = await new InvoiceUser({
        _id: paymentHash,
        walletId,
        selfGenerated,
        pubkey,
        paid,
      }).save()
      return walletInvoiceFromRaw(invoiceUser)
    } catch (err) {
      return new UnknownRepositoryError(err)
    }
  }

  const markAsPaid = async (
    paymentHash: PaymentHash,
  ): Promise<WalletInvoice | RepositoryError> => {
    try {
      const invoiceUser = await InvoiceUser.findOneAndUpdate(
        { _id: paymentHash },
        { paid: true },
        {
          new: true,
        },
      )
      if (!invoiceUser) {
        return new RepositoryError("Couldn't update invoice for payment hash")
      }
      return walletInvoiceFromRaw(invoiceUser)
    } catch (err) {
      return new UnknownRepositoryError(err)
    }
  }

  const findByPaymentHash = async (
    paymentHash: PaymentHash,
  ): Promise<WalletInvoice | RepositoryError> => {
    try {
      const invoiceUser = await InvoiceUser.findOne({ _id: paymentHash })
      if (!invoiceUser) {
        return new CouldNotFindWalletInvoiceError(paymentHash)
      }
      return walletInvoiceFromRaw(invoiceUser)
    } catch (err) {
      return new UnknownRepositoryError(err)
    }
  }

  async function* findPendingByWalletId(
    walletId: WalletId,
  ): AsyncGenerator<WalletInvoice> | RepositoryError {
    let pending
    try {
      pending = InvoiceUser.find({ walletId, paid: false }).cursor({
        batchSize: 100,
      })
    } catch (error) {
      return new RepositoryError(error)
    }

    for await (const invoiceUser of pending) {
      yield walletInvoiceFromRaw(invoiceUser)
    }
  }

  async function* listWalletIdsWithPendingInvoices():
    | AsyncGenerator<WalletId>
    | RepositoryError {
    let pending
    try {
      // select distinct user ids from pending invoices
      pending = InvoiceUser.aggregate([
        { $match: { paid: false } },
        { $group: { _id: "$walletId" } },
      ])
        .cursor({ batchSize: 100 })
        .exec()
    } catch (error) {
      return new RepositoryError(error)
    }

    for await (const { _id } of pending) {
      yield _id as WalletId
    }
  }

  const deleteByPaymentHash = async (
    paymentHash: PaymentHash,
  ): Promise<boolean | RepositoryError> => {
    try {
      const result = await InvoiceUser.deleteOne({ _id: paymentHash })
      if (result.deletedCount === 0) {
        return new CouldNotFindWalletInvoiceError(paymentHash)
      }
      return true
    } catch (error) {
      return new RepositoryError(error)
    }
  }

  const deleteUnpaidOlderThan = async (
    before: Date,
  ): Promise<number | RepositoryError> => {
    try {
      const result = await InvoiceUser.deleteMany({
        timestamp: { $lt: before },
        paid: false,
      })
      return result.deletedCount
    } catch (error) {
      return new RepositoryError(error)
    }
  }

  return {
    persistNew,
    markAsPaid,
    findByPaymentHash,
    findPendingByWalletId,
    listWalletIdsWithPendingInvoices,
    deleteByPaymentHash,
    deleteUnpaidOlderThan,
  }
}

const walletInvoiceFromRaw = (result): WalletInvoice => ({
  paymentHash: result.id as PaymentHash,
  walletId: result.walletId as WalletId,
  selfGenerated: result.selfGenerated,
  pubkey: result.pubkey as Pubkey,
  paid: result.paid,
})
