import {
  CouldNotFindWalletInvoiceError,
  RepositoryError,
  UnknownRepositoryError,
} from "@domain/errors"
import { UsdPaymentAmount } from "@domain/shared"

import { WalletInvoice } from "./schema"

export const WalletInvoicesRepository = (): IWalletInvoicesRepository => {
  const persistNew = async ({
    paymentHash,
    recipientWalletDescriptor,
    selfGenerated,
    pubkey,
    paid,
    usdAmount,
  }: WalletInvoice): Promise<WalletInvoice | RepositoryError> => {
    try {
      const walletInvoice = await new WalletInvoice({
        _id: paymentHash,
        walletId: recipientWalletDescriptor.id,
        selfGenerated,
        pubkey,
        paid,
        cents: usdAmount ? Number(usdAmount.amount) : undefined,
        currency: recipientWalletDescriptor.currency,
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
      ]).cursor({ batchSize: 100 })
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
  paymentHash: result._id as PaymentHash,
  recipientWalletDescriptor: {
    id: result.walletId as WalletId,
    currency: result.currency as WalletCurrency,
  },
  selfGenerated: result.selfGenerated,
  pubkey: result.pubkey as Pubkey,
  paid: result.paid as boolean,
  usdAmount: result.cents ? UsdPaymentAmount(BigInt(result.cents)) : undefined,
})
