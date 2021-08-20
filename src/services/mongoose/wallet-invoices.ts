import {
  CouldNotFindError,
  RepositoryError,
  UnknownRepositoryError,
} from "@domain/errors"
import { InvoiceUser } from "./schema"

export const WalletInvoicesRepository = (): IWalletInvoicesRepository => {
  const persist = async ({
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

  async function* listWalletsWithPendingInvoices():
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

  const setPaidByPaymentHash = async (
    paymentHash: PaymentHash,
  ): Promise<boolean | RepositoryError> => {
    try {
      const result = await InvoiceUser.updateOne({ _id: paymentHash }, { paid: true })
      return result.nModified === 1
    } catch (error) {
      return new RepositoryError(error)
    }
  }

  const deleteByPaymentHash = async (
    paymentHash: PaymentHash,
  ): Promise<boolean | RepositoryError> => {
    try {
      const result = await InvoiceUser.deleteOne({ _id: paymentHash })
      return result.deletedCount === 1
    } catch (error) {
      return new RepositoryError(error)
    }
  }

  const deleteExpired = async (before: Date): Promise<number | RepositoryError> => {
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
    persist,
    findByPaymentHash,
    findPendingByWalletId,
    listWalletsWithPendingInvoices,
    setPaidByPaymentHash,
    deleteByPaymentHash,
    deleteExpired,
  }
}
