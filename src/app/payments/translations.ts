import { LedgerTransactionType } from "@domain/ledger"
import {
  MissingPropsInTransactionForPaymentFlowError,
  NonLnPaymentTransactionForPaymentFlowError,
  PaymentFlow,
} from "@domain/payments"
import {
  paymentAmountFromCents,
  paymentAmountFromSats,
  WalletCurrency,
} from "@domain/shared"
import { PaymentInitiationMethod, SettlementMethod } from "@domain/wallets"

export const PaymentFlowFromLedgerTransaction = <
  S extends WalletCurrency,
  R extends WalletCurrency,
>(
  ledgerTxn: LedgerTransaction<S>,
): PaymentFlow<S, R> | ValidationError => {
  if (ledgerTxn.type !== LedgerTransactionType.Payment) {
    return new NonLnPaymentTransactionForPaymentFlowError()
  }
  const settlementMethod = SettlementMethod.Lightning
  const paymentInitiationMethod = PaymentInitiationMethod.Lightning

  const {
    walletId: senderWalletId,
    currency: senderWalletCurrency,
    paymentHash,
    satsAmount,
    centsAmount,
    satsFee,
    centsFee,
    timestamp: createdAt,
  } = ledgerTxn
  if (
    senderWalletId === undefined ||
    senderWalletCurrency === undefined ||
    paymentHash === undefined ||
    satsAmount === undefined ||
    centsAmount === undefined ||
    satsFee === undefined ||
    centsFee === undefined ||
    createdAt === undefined
  ) {
    return new MissingPropsInTransactionForPaymentFlowError()
  }

  const btcPaymentAmount = paymentAmountFromSats(satsAmount)
  const usdPaymentAmount = paymentAmountFromCents(centsAmount)

  return PaymentFlow({
    senderWalletId,
    senderWalletCurrency,
    settlementMethod,
    paymentInitiationMethod,

    paymentHash,
    descriptionFromInvoice: "",
    createdAt,
    paymentSentAndPending: true,

    btcPaymentAmount,
    usdPaymentAmount,
    inputAmount:
      senderWalletCurrency === WalletCurrency.Usd
        ? usdPaymentAmount.amount
        : btcPaymentAmount.amount,

    btcProtocolFee: paymentAmountFromSats(satsFee),
    usdProtocolFee: paymentAmountFromCents(centsFee),
  })
}
