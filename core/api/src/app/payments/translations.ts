import { LedgerTransactionType } from "@/domain/ledger"
import {
  MissingPropsInTransactionForPaymentFlowError,
  NonLnPaymentTransactionForPaymentFlowError,
  PaymentFlow,
} from "@/domain/payments"
import { paymentAmountFromNumber, WalletCurrency } from "@/domain/shared"
import { PaymentInitiationMethod, SettlementMethod } from "@/domain/wallets"

export const PaymentFlowFromLedgerTransaction = <
  S extends WalletCurrency,
  R extends WalletCurrency,
>({
  ledgerTxn,
  senderAccountId,
}: {
  ledgerTxn: LedgerTransaction<S>
  senderAccountId: AccountId
}): PaymentFlow<S, R> | ValidationError => {
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

  const btcPaymentAmount = paymentAmountFromNumber({
    amount: satsAmount,
    currency: WalletCurrency.Btc,
  })
  if (btcPaymentAmount instanceof Error) return btcPaymentAmount

  const usdPaymentAmount = paymentAmountFromNumber({
    amount: centsAmount,
    currency: WalletCurrency.Usd,
  })
  if (usdPaymentAmount instanceof Error) return usdPaymentAmount

  const btcProtocolAndBankFee = paymentAmountFromNumber({
    amount: satsFee,
    currency: WalletCurrency.Btc,
  })
  if (btcProtocolAndBankFee instanceof Error) return btcProtocolAndBankFee

  const usdProtocolAndBankFee = paymentAmountFromNumber({
    amount: centsFee,
    currency: WalletCurrency.Usd,
  })
  if (usdProtocolAndBankFee instanceof Error) return usdProtocolAndBankFee

  return PaymentFlow({
    senderWalletId,
    senderWalletCurrency,
    senderAccountId,
    settlementMethod,
    paymentInitiationMethod,

    paymentHash,
    descriptionFromInvoice: "",
    skipProbeForDestination: false,
    createdAt,
    paymentSentAndPending: true,

    btcPaymentAmount,
    usdPaymentAmount,
    inputAmount:
      senderWalletCurrency === WalletCurrency.Usd
        ? usdPaymentAmount.amount
        : btcPaymentAmount.amount,

    btcProtocolAndBankFee,
    usdProtocolAndBankFee,
  })
}
