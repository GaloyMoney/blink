import { InvoiceNotPaidError } from "@/domain/wallet-invoices/errors"

import { WalletInvoicesRepository } from "@/services/mongoose/wallet-invoices"

export const getInvoicePreImageByHash = async ({
  paymentHash,
}: {
  paymentHash: PaymentHash
}): Promise<SecretPreImage | ApplicationError> => {
  const invoice = await WalletInvoicesRepository().findByPaymentHash(paymentHash)
  if (invoice instanceof Error) return invoice

  if (!invoice.paid) return new InvoiceNotPaidError(paymentHash)

  return invoice.secret
}
