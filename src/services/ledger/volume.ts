import { LedgerTransactionType, toLiabilitiesWalletId } from "@domain/ledger"
import { LedgerServiceError, UnknownLedgerError } from "@domain/ledger/errors"
import { paymentAmountFromNumber } from "@domain/shared"
import { addAttributesToCurrentSpan } from "@services/tracing"

import { Transaction } from "./books"

export const TxnGroups = {
  allPaymentVolumeSince: [
    LedgerTransactionType.IntraLedger,
    LedgerTransactionType.OnchainIntraLedger,
    LedgerTransactionType.LnIntraLedger,
    LedgerTransactionType.Payment,
    LedgerTransactionType.OnchainPayment,
  ],
  externalPaymentVolumeSince: [
    LedgerTransactionType.Payment,
    LedgerTransactionType.OnchainPayment,
  ],
  intraledgerTxBaseVolumeSince: [
    LedgerTransactionType.IntraLedger,
    LedgerTransactionType.OnchainIntraLedger,
    LedgerTransactionType.LnIntraLedger,
  ],
  tradeIntraAccountTxBaseVolumeSince: [
    LedgerTransactionType.WalletIdTradeIntraAccount,
    LedgerTransactionType.OnChainTradeIntraAccount,
    LedgerTransactionType.LnTradeIntraAccount,
  ],
  lightningTxBaseVolumeSince: [
    LedgerTransactionType.Payment,
    LedgerTransactionType.Invoice,
    LedgerTransactionType.LnFeeReimbursement,
  ],
  onChainTxBaseVolumeSince: [
    LedgerTransactionType.OnchainPayment,
    LedgerTransactionType.OnchainReceipt,
  ],
  allTxBaseVolumeSince: Object.values(LedgerTransactionType),
} as const

const volumeFn =
  (txnGroup: TxnGroup): GetVolumeSinceFn =>
  async (args) =>
    txVolumeSince({ ...args, txnGroup })

const volumeAmountFn =
  (txnGroup: TxnGroup): GetVolumeAmountSinceFn =>
  async (args) => {
    const {
      walletDescriptor: { id: walletId, currency: walletCurrency },
      timestamp,
    } = args
    const volume = await txVolumeSince({ walletId, timestamp, txnGroup })
    if (volume instanceof Error) return volume

    const outgoingBaseAmount = paymentAmountFromNumber({
      amount: volume.outgoingBaseAmount,
      currency: walletCurrency,
    })
    if (outgoingBaseAmount instanceof Error) return outgoingBaseAmount

    const incomingBaseAmount = paymentAmountFromNumber({
      amount: volume.incomingBaseAmount,
      currency: walletCurrency,
    })
    if (incomingBaseAmount instanceof Error) return incomingBaseAmount

    return { outgoingBaseAmount, incomingBaseAmount }
  }

const txVolumeSince = async ({
  walletId,
  timestamp,
  txnGroup,
}: {
  walletId: WalletId
  timestamp: Date
  txnGroup: TxnGroup
}): Promise<TxBaseVolume | LedgerServiceError> => {
  const liabilitiesWalletId = toLiabilitiesWalletId(walletId)

  const txnTypes: TxnTypes = TxnGroups[txnGroup]
  const txnTypesObj = txnTypes.map((txnType) => ({
    type: txnType,
  }))

  try {
    const [result]: (TxBaseVolume & { _id: null })[] = await Transaction.aggregate([
      {
        $match: {
          accounts: liabilitiesWalletId,
          $or: txnTypesObj,
          $and: [{ timestamp: { $gte: timestamp } }],
        },
      },
      {
        $group: {
          _id: null,
          outgoingBaseAmount: { $sum: "$debit" },
          incomingBaseAmount: { $sum: "$credit" },
        },
      },
    ])

    const outgoingBaseAmount = result?.outgoingBaseAmount ?? (0 as CurrencyBaseAmount)
    const incomingBaseAmount = result?.incomingBaseAmount ?? (0 as CurrencyBaseAmount)
    addAttributesToCurrentSpan({
      "txVolume.function": txnGroup,
      "txVolume.outgoing": outgoingBaseAmount.toString(),
      "txVolume.incoming": incomingBaseAmount.toString(),
    })
    return { outgoingBaseAmount, incomingBaseAmount }
  } catch (err) {
    return new UnknownLedgerError(err)
  }
}

export const volume = {
  allPaymentVolumeSince: volumeFn("allPaymentVolumeSince"),
  externalPaymentVolumeSince: volumeFn("externalPaymentVolumeSince"),
  intraledgerTxBaseVolumeSince: volumeFn("intraledgerTxBaseVolumeSince"),
  tradeIntraAccountTxBaseVolumeSince: volumeFn("tradeIntraAccountTxBaseVolumeSince"),
  allTxBaseVolumeSince: volumeFn("allTxBaseVolumeSince"),
  onChainTxBaseVolumeSince: volumeFn("onChainTxBaseVolumeSince"),
  lightningTxBaseVolumeSince: volumeFn("lightningTxBaseVolumeSince"),

  allPaymentVolumeAmountSince: volumeAmountFn("allPaymentVolumeSince"),
  externalPaymentVolumeAmountSince: volumeAmountFn("externalPaymentVolumeSince"),
  intraledgerTxBaseVolumeAmountSince: volumeAmountFn("intraledgerTxBaseVolumeSince"),
  tradeIntraAccountTxBaseVolumeAmountSince: volumeAmountFn(
    "tradeIntraAccountTxBaseVolumeSince",
  ),
  allTxBaseVolumeAmountSince: volumeAmountFn("allTxBaseVolumeSince"),
  onChainTxBaseVolumeAmountSince: volumeAmountFn("onChainTxBaseVolumeSince"),
  lightningTxBaseVolumeAmountSince: volumeAmountFn("lightningTxBaseVolumeSince"),
}
