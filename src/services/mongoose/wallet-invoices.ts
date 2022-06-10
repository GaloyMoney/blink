import {
  CouldNotFindWalletInvoiceError,
  RepositoryError,
  UnknownRepositoryError,
} from "@domain/errors"
import { toCents } from "@domain/fiat"

import { WalletInvoice } from "./schema"

export const WalletInvoicesRepository = (): IWalletInvoicesRepository => {
  const persistNew = async ({
    paymentHash,
    walletId,
    selfGenerated,
    pubkey,
    paid,
    cents,
    currency,
    callback
  }: WalletInvoice): Promise<WalletInvoice | RepositoryError> => {
    try {
      const walletInvoice = await new WalletInvoice({
        _id: paymentHash,
        walletId,
        selfGenerated,
        pubkey,
        paid,
        cents,
        currency,
        callback,
      }).save()
      return walletInvoiceFromRaw(walletInvoice)
    } catch (err) {
      return new UnknownRepositoryError(err)
    }
  }

  const markAsPaid = async (
    paymentHash: PaymentHash,
  ): Promise<WalletInvoice | RepositoryError> => {
    try {
      const walletInvoice = await WalletInvoice.findOneAndUpdate(
        { _id: paymentHash },
        { paid: true },
        {
          new: true,
        },
      )
      if (!walletInvoice) {
        return new RepositoryError("Couldn't update invoice for payment hash")
      }
      return walletInvoiceFromRaw(walletInvoice)
    } catch (err) {
      return new UnknownRepositoryError(err)
    }
  }

  const findByPaymentHash = async (
    paymentHash: PaymentHash,
  ): Promise<WalletInvoice | RepositoryError> => {
    try {
      const walletInvoice = await WalletInvoice.findOne({ _id: paymentHash })
      if (!walletInvoice) {
        return new CouldNotFindWalletInvoiceError(paymentHash)
      }
      return walletInvoiceFromRaw(walletInvoice)
    } catch (err) {
      return new UnknownRepositoryError(err)
    }
  }

  async function* findPendingByWalletId(
    walletId: WalletId,
  ): AsyncGenerator<WalletInvoice> | RepositoryError {
    let pending
    try {
      pending = WalletInvoice.find({ walletId, paid: false }).cursor({
        batchSize: 100,
      })
    } catch (error) {
      return new RepositoryError(error)
    }

    for await (const walletInvoice of pending) {
      yield walletInvoiceFromRaw(walletInvoice)
    }
  }

  async function* listWalletIdsWithPendingInvoices():
    | AsyncGenerator<WalletId>
    | RepositoryError {
    let pending
    try {
      // select distinct user ids from pending invoices
      pending = WalletInvoice.aggregate([
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
      const result = await WalletInvoice.deleteOne({ _id: paymentHash })
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
      const result = await WalletInvoice.deleteMany({
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

const walletInvoiceFromRaw = (result: WalletInvoiceRecord): WalletInvoice => ({
  paymentHash: result.id as PaymentHash,
  walletId: result.walletId as WalletId,
  selfGenerated: result.selfGenerated,
  pubkey: result.pubkey as Pubkey,
  paid: result.paid as boolean,
  cents: result.cents ? toCents(result.cents) : undefined,
  currency: result.currency as WalletCurrency,
  callback: result.callback ? result.callback as Callback : undefined
})
