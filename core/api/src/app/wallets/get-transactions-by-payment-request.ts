import {
  getTransactionsByHash,
  getTransactionsForWalletByPaymentHash,
} from "./get-transactions-by-hash"

import { decodeInvoice } from "@/domain/bitcoin/lightning"

export const getTransactionsForWalletByPaymentRequest = async ({
  walletId,
  uncheckedPaymentRequest,
}: {
  walletId: WalletId
  uncheckedPaymentRequest: string
}): Promise<WalletTransaction[] | ApplicationError> => {
  const decodedInvoice = decodeInvoice(uncheckedPaymentRequest)
  if (decodedInvoice instanceof Error) return decodedInvoice

  return getTransactionsForWalletByPaymentHash({
    walletId,
    paymentHash: decodedInvoice.paymentHash,
  })
}

export const getTransactionsByPaymentRequest = async ({
  uncheckedPaymentRequest,
}: {
  uncheckedPaymentRequest: string
}): Promise<WalletTransaction[] | ApplicationError> => {
  const decodedInvoice = decodeInvoice(uncheckedPaymentRequest)
  if (decodedInvoice instanceof Error) return decodedInvoice

  return getTransactionsByHash(decodedInvoice.paymentHash)
}
