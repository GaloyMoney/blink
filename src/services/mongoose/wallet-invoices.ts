import {
  CouldNotFindError,
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
      await new InvoiceUser({
        _id: paymentHash,
        uid: walletId,
        selfGenerated,
        pubkey,
        paid,
      }).save()
      return {
        paymentHash,
        walletId,
        selfGenerated,
        pubkey,
        paid,
      } as WalletInvoice
    } catch (err) {
      return new UnknownRepositoryError(err)
    }
  }

  const update = async ({
    paymentHash,
    walletId,
    selfGenerated,
    pubkey,
    paid,
  }: WalletInvoice): Promise<WalletInvoice | RepositoryError> => {
    try {
      const data = { uid: walletId, selfGenerated, pubkey, paid }
      const doc = await InvoiceUser.updateOne({ _id: paymentHash }, { $set: data })
      if (doc.nModified !== 1) {
        return new RepositoryError("Couldn't update invoice for payment hash")
      }
      return {
        paymentHash,
        walletId,
        selfGenerated,
        pubkey,
        paid,
      }
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
        return new CouldNotFindError("Couldn't find invoice for payment hash")
      }
      return {
        paymentHash,
        walletId: invoiceUser.uid,
        selfGenerated: invoiceUser.selfGenerated,
        pubkey: invoiceUser.pubkey,
        paid: invoiceUser.paid,
      }
    } catch (err) {
      return new UnknownRepositoryError(err)
    }
  }

  async function* findPendingByWalletId(
    walletId: WalletId,
  ): AsyncGenerator<WalletInvoice> | RepositoryError {
    let pending
    try {
      pending = InvoiceUser.find({ uid: walletId, paid: false }).cursor({
        batchSize: 100,
      })
    } catch (error) {
      return new RepositoryError(error)
    }

    for await (const invoice of pending) {
      yield {
        paymentHash: invoice.id as PaymentHash,
        walletId: invoice.uid as WalletId,
        selfGenerated: invoice.selfGenerated,
        pubkey: invoice.pubkey as Pubkey,
        paid: invoice.paid,
      } as WalletInvoice
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
        { $group: { _id: "$uid" } },
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
        return new CouldNotFindError()
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
    update,
    findByPaymentHash,
    findPendingByWalletId,
    listWalletIdsWithPendingInvoices,
    deleteByPaymentHash,
    deleteUnpaidOlderThan,
  }
}
