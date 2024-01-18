import { Transaction } from "../books"

import {
  LedgerTransactionType,
  UnknownLedgerError,
  toLiabilitiesWalletId,
} from "@/domain/ledger"

import { AmountCalculator, paymentAmountFromNumber } from "@/domain/shared"
import { addAttributesToCurrentSpan } from "@/services/tracing"
import { MS_PER_DAY } from "@/config"

const calc = AmountCalculator()

export const TxnGroups = {
  allPaymentVolumeSince: [
    LedgerTransactionType.IntraLedger,
    LedgerTransactionType.OnchainIntraLedger,
    LedgerTransactionType.LnIntraLedger,
    LedgerTransactionType.Payment,
    LedgerTransactionType.LnFeeReimbursement,
    LedgerTransactionType.OnchainPayment,
  ],
  externalPaymentVolumeSince: [
    LedgerTransactionType.Payment,
    LedgerTransactionType.LnFeeReimbursement,
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

export const TxVolumeAmountSinceFactory = () => {
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
          $lookup: {
            from: "medici_transactions",
            localField: "_original_journal",
            foreignField: "_journal",
            as: "original_transactions",
          },
        },
        {
          $addFields: {
            is_transaction_valid: {
              $or: [
                { $eq: [{ $size: "$original_transactions" }, 0] },
                {
                  $gte: [
                    { $arrayElemAt: ["$original_transactions.datetime", 0] },
                    new Date(Date.now() - MS_PER_DAY),
                  ],
                },
              ],
            },
          },
        },
        {
          $match: {
            is_transaction_valid: true,
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

  const create =
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

  return { create }
}

export const VolumeCalculator = <S extends WalletCurrency>(
  txBaseVolumeAmount: TxBaseVolumeAmount<S>,
): VolumeCalculator<S> => ({
  in: () => txBaseVolumeAmount.incomingBaseAmount,
  out: () => txBaseVolumeAmount.outgoingBaseAmount,
  netIn: () =>
    calc.sub(
      txBaseVolumeAmount.incomingBaseAmount,
      txBaseVolumeAmount.outgoingBaseAmount,
    ),
  netOut: () =>
    calc.sub(
      txBaseVolumeAmount.outgoingBaseAmount,
      txBaseVolumeAmount.incomingBaseAmount,
    ),
  absolute: () =>
    calc.add(
      txBaseVolumeAmount.incomingBaseAmount,
      txBaseVolumeAmount.outgoingBaseAmount,
    ),
})

const txVolumeAmountFactory = TxVolumeAmountSinceFactory()

export const netOutExternalPaymentVolumeAmountSince = async <S extends WalletCurrency>(
  args: IGetVolumeAmountArgs<S>,
): Promise<PaymentAmount<S> | LedgerServiceError> => {
  const externalPaymentVolumeAmountSince = txVolumeAmountFactory.create(
    "externalPaymentVolumeSince",
  )

  const txBaseVolumeAmount = await externalPaymentVolumeAmountSince(args)
  if (txBaseVolumeAmount instanceof Error) return txBaseVolumeAmount

  return VolumeCalculator(txBaseVolumeAmount).netOut()
}

export const outIntraledgerTxBaseVolumeAmountSince = async <S extends WalletCurrency>(
  args: IGetVolumeAmountArgs<S>,
): Promise<PaymentAmount<S> | LedgerServiceError> => {
  const intraledgerTxBaseVolumeAmountSince = txVolumeAmountFactory.create(
    "intraledgerTxBaseVolumeSince",
  )

  const txBaseVolumeAmount = await intraledgerTxBaseVolumeAmountSince(args)
  if (txBaseVolumeAmount instanceof Error) return txBaseVolumeAmount

  return VolumeCalculator(txBaseVolumeAmount).out()
}

export const outTradeIntraAccountTxBaseVolumeAmountSince = async <
  S extends WalletCurrency,
>(
  args: IGetVolumeAmountArgs<S>,
): Promise<PaymentAmount<S> | LedgerServiceError> => {
  const tradeIntraAccountTxBaseVolumeAmountSince = txVolumeAmountFactory.create(
    "tradeIntraAccountTxBaseVolumeSince",
  )

  const txBaseVolumeAmount = await tradeIntraAccountTxBaseVolumeAmountSince(args)
  if (txBaseVolumeAmount instanceof Error) return txBaseVolumeAmount

  return VolumeCalculator(txBaseVolumeAmount).out()
}

export const absoluteAllTxBaseVolumeAmountSince = async <S extends WalletCurrency>(
  args: IGetVolumeAmountArgs<S>,
): Promise<PaymentAmount<S> | LedgerServiceError> => {
  const allTxBaseVolumeAmountSince = txVolumeAmountFactory.create("allTxBaseVolumeSince")

  const txBaseVolumeAmount = await allTxBaseVolumeAmountSince(args)
  if (txBaseVolumeAmount instanceof Error) return txBaseVolumeAmount

  return VolumeCalculator(txBaseVolumeAmount).absolute()
}

export const netInOnChainTxBaseVolumeAmountSince = async <S extends WalletCurrency>(
  args: IGetVolumeAmountArgs<S>,
): Promise<PaymentAmount<S> | LedgerServiceError> => {
  const onChainTxBaseVolumeAmountSince = txVolumeAmountFactory.create(
    "onChainTxBaseVolumeSince",
  )

  const txBaseVolumeAmount = await onChainTxBaseVolumeAmountSince(args)
  if (txBaseVolumeAmount instanceof Error) return txBaseVolumeAmount

  return VolumeCalculator(txBaseVolumeAmount).netIn()
}

export const netInLightningTxBaseVolumeAmountSince = async <S extends WalletCurrency>(
  args: IGetVolumeAmountArgs<S>,
): Promise<PaymentAmount<S> | LedgerServiceError> => {
  const lightningTxBaseVolumeAmountSince = txVolumeAmountFactory.create(
    "lightningTxBaseVolumeSince",
  )

  const txBaseVolumeAmount = await lightningTxBaseVolumeAmountSince(args)
  if (txBaseVolumeAmount instanceof Error) return txBaseVolumeAmount

  return VolumeCalculator(txBaseVolumeAmount).netIn()
}
