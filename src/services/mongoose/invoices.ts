import { UnknownRepositoryError, CouldNotFindError } from "@domain/errors"
import { InvoiceUser } from "./schema"

export const MakeInvoicesRepo = () => {
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

  return { persist, findByPaymentHash }
}
