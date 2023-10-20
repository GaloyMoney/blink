import { WalletInvoice } from "./schema"

import { parseRepositoryError } from "./utils"

import { decodeInvoice } from "@/domain/bitcoin/lightning"

import {
  CouldNotFindWalletInvoiceError,
  RepositoryError,
  UnknownRepositoryError,
  WalletInvoiceMissingLnInvoiceError,
} from "@/domain/errors"
import { UsdPaymentAmount } from "@/domain/shared"

export const WalletInvoicesRepository = (): IWalletInvoicesRepository => {
  const persistNew = async ({
    paymentHash,
    secret,
    recipientWalletDescriptor,
    selfGenerated,
    pubkey,
    paid,
    usdAmount,
    lnInvoice,
  }: WalletInvoicesPersistNewArgs): Promise<WalletInvoice | RepositoryError> => {
    try {
      const walletInvoice = await new WalletInvoice({
        _id: paymentHash,
        secret,
        walletId: recipientWalletDescriptor.id,
        selfGenerated,
        pubkey,
        paid,
        cents: usdAmount ? Number(usdAmount.amount) : undefined,
        currency: recipientWalletDescriptor.currency,
        paymentRequest: lnInvoice.paymentRequest,
      }).save()
      return ensureWalletInvoiceHasLnInvoice(walletInvoiceFromRaw(walletInvoice))
    } catch (err) {
      return parseRepositoryError(err)
    }
  }

  const markAsPaid = async (
    paymentHash: PaymentHash,
  ): Promise<WalletInvoiceWithOptionalLnInvoice | RepositoryError> => {
    try {
      const walletInvoice = await WalletInvoice.findOneAndUpdate(
        { _id: paymentHash },
        { paid: true },
        {
          new: true,
        },
      )
      if (!walletInvoice) {
        return new CouldNotFindWalletInvoiceError()
      }
      return walletInvoiceFromRaw(walletInvoice)
    } catch (err) {
      return parseRepositoryError(err)
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
      return ensureWalletInvoiceHasLnInvoice(walletInvoiceFromRaw(walletInvoice))
    } catch (err) {
      return parseRepositoryError(err)
    }
  }

  const findForWalletByPaymentHash = async ({
    walletId,
    paymentHash,
  }: WalletInvoiceFindForWalletByPaymentHashArgs): Promise<
    WalletInvoice | RepositoryError
  > => {
    try {
      const walletInvoice = await WalletInvoice.findOne({ _id: paymentHash, walletId })
      if (!walletInvoice) {
        return new CouldNotFindWalletInvoiceError(paymentHash)
      }
      return ensureWalletInvoiceHasLnInvoice(walletInvoiceFromRaw(walletInvoice))
    } catch (err) {
      return parseRepositoryError(err)
    }
  }

  async function* yieldPending():
    | AsyncGenerator<WalletInvoiceWithOptionalLnInvoice>
    | RepositoryError {
    let pending
    try {
      pending = WalletInvoice.find({ paid: false }).cursor({
        batchSize: 100,
      })
    } catch (error) {
      return new UnknownRepositoryError(error)
    }

    for await (const walletInvoice of pending) {
      yield walletInvoiceFromRaw(walletInvoice)
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
      return new UnknownRepositoryError(error)
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
      return new UnknownRepositoryError(error)
    }
  }

  return {
    persistNew,
    markAsPaid,
    findByPaymentHash,
    findForWalletByPaymentHash,
    yieldPending,
    deleteByPaymentHash,
    deleteUnpaidOlderThan,
  }
}

const walletInvoiceFromRaw = (
  result: WalletInvoiceRecord,
): WalletInvoiceWithOptionalLnInvoice => {
  const lnInvoice = result.paymentRequest
    ? decodeInvoice(result.paymentRequest)
    : undefined

  if (lnInvoice instanceof Error) throw new Error("Corrupt payment request in db")

  return {
    paymentHash: result._id as PaymentHash,
    secret: result.secret as SecretPreImage,
    recipientWalletDescriptor: {
      id: result.walletId as WalletId,
      currency: result.currency as WalletCurrency,
    },
    selfGenerated: result.selfGenerated,
    pubkey: result.pubkey as Pubkey,
    paid: result.paid as boolean,
    usdAmount: result.cents ? UsdPaymentAmount(BigInt(result.cents)) : undefined,
    createdAt: new Date(result.timestamp.getTime()),
    lnInvoice,
  }
}

const ensureWalletInvoiceHasLnInvoice = (
  walletInvoiceWithOptionalLnInvoice: WalletInvoiceWithOptionalLnInvoice,
) => {
  if (!walletInvoiceWithOptionalLnInvoice.lnInvoice) {
    return new WalletInvoiceMissingLnInvoiceError()
  }

  return walletInvoiceWithOptionalLnInvoice as WalletInvoice
}
