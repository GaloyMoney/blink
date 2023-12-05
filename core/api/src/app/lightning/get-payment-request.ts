import { lookupPaymentByHash } from "./lookup-payment-by-hash"

import { lookupInvoiceByHash } from "./lookup-invoice-by-hash"

import {
  CouldNotFindLnPaymentFromHashError,
  CouldNotFindWalletInvoiceError,
} from "@/domain/errors"
import { LedgerTransactionType, CouldNotFindTransactionError } from "@/domain/ledger"

import { LedgerService } from "@/services/ledger"
import { LnPaymentsRepository, WalletInvoicesRepository } from "@/services/mongoose"

export const getPaymentRequestByTransactionId = async ({
  ledgerTransactionId,
}: {
  ledgerTransactionId: LedgerTransactionId
}): Promise<EncodedPaymentRequest | ApplicationError> => {
  const ledgerTransaction = await LedgerService().getTransactionById(ledgerTransactionId)
  if (ledgerTransaction instanceof Error) {
    return ledgerTransaction
  }

  const { type, paymentHash } = ledgerTransaction
  if (!paymentHash) {
    return new CouldNotFindTransactionError()
  }

  const isSettledIntraledger =
    type === LedgerTransactionType.LnIntraLedger ||
    type === LedgerTransactionType.LnTradeIntraAccount
  if (isSettledIntraledger || ledgerTransaction.credit > 0) {
    return getInvoiceRequestByHash({ paymentHash })
  }

  return getPaymentRequestByHash({ paymentHash })
}

export const getPaymentRequestByHash = async ({
  paymentHash,
}: {
  paymentHash: PaymentHash
}): Promise<EncodedPaymentRequest | ApplicationError> => {
  const lnPayment = await LnPaymentsRepository().findByPaymentHash(paymentHash)
  if ("paymentRequest" in lnPayment && lnPayment.paymentRequest) {
    return lnPayment.paymentRequest
  }

  const lndPayment = await lookupPaymentByHash(paymentHash)
  if (lndPayment instanceof Error) return lndPayment

  if ("paymentRequest" in lndPayment && lndPayment.paymentRequest) {
    return lndPayment.paymentRequest
  }

  return new CouldNotFindLnPaymentFromHashError(paymentHash)
}

export const getInvoiceRequestByHash = async ({
  paymentHash,
}: {
  paymentHash: PaymentHash
}): Promise<EncodedPaymentRequest | ApplicationError> => {
  const walletInvoice = await WalletInvoicesRepository().findByPaymentHash(paymentHash)
  if ("lnInvoice" in walletInvoice && walletInvoice.lnInvoice?.paymentRequest) {
    return walletInvoice.lnInvoice.paymentRequest
  }

  const lndInvoice = await lookupInvoiceByHash(paymentHash)
  if (lndInvoice instanceof Error) return lndInvoice

  if (lndInvoice.lnInvoice?.paymentRequest) {
    return lndInvoice.lnInvoice.paymentRequest
  }

  return new CouldNotFindWalletInvoiceError(paymentHash)
}
