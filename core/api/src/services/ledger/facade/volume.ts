import { Transaction } from "../books"

import {
  LedgerTransactionType,
  UnknownLedgerError,
  toLiabilitiesWalletId,
} from "@/domain/ledger"

import { timestampDaysAgo } from "@/utils"

import { paymentAmountFromNumber } from "@/domain/shared"
import { addAttributesToCurrentSpan } from "@/services/tracing"
import { MS_PER_DAY } from "@/config"

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

const TxVolumeAmountSinceFactory = () => {
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

const VolumesForAccountWalletsFactory = () => {
  const create =
    (txnGroup: TxnGroup): VolumeAmountForAccountSinceFn =>
    async ({
      accountWalletDescriptors,
      period,
    }: {
      accountWalletDescriptors: AccountWalletDescriptors
      period: Days
    }): Promise<TxBaseVolumeAmount<WalletCurrency>[] | ApplicationError> => {
      const timestamp1Day = timestampDaysAgo(period)
      if (timestamp1Day instanceof Error) return timestamp1Day

      const volumeAmountSince = TxVolumeAmountSinceFactory().create(txnGroup)

      const btcWalletVolumeAmount = await volumeAmountSince({
        walletDescriptor: accountWalletDescriptors.BTC,
        timestamp: timestamp1Day,
      })
      if (btcWalletVolumeAmount instanceof Error) return btcWalletVolumeAmount

      const usdWalletVolumeAmount = await volumeAmountSince({
        walletDescriptor: accountWalletDescriptors.USD,
        timestamp: timestamp1Day,
      })
      if (usdWalletVolumeAmount instanceof Error) return usdWalletVolumeAmount

      return [btcWalletVolumeAmount, usdWalletVolumeAmount]
    }

  return { create }
}

const volumeAmountForAccountFactory = VolumesForAccountWalletsFactory()
const txVolumeAmountFactory = TxVolumeAmountSinceFactory()

export const externalPaymentVolumeAmountForAccountSince =
  volumeAmountForAccountFactory.create("externalPaymentVolumeSince")
export const externalPaymentVolumeAmountSince = txVolumeAmountFactory.create(
  "externalPaymentVolumeSince",
)

export const intraledgerTxBaseVolumeAmountForAccountSince =
  volumeAmountForAccountFactory.create("intraledgerTxBaseVolumeSince")
export const intraledgerTxBaseVolumeAmountSince = txVolumeAmountFactory.create(
  "intraledgerTxBaseVolumeSince",
)
export const tradeIntraAccountTxBaseVolumeAmountForAccountSince =
  volumeAmountForAccountFactory.create("tradeIntraAccountTxBaseVolumeSince")
export const tradeIntraAccountTxBaseVolumeAmountSince = txVolumeAmountFactory.create(
  "tradeIntraAccountTxBaseVolumeSince",
)

export const allPaymentVolumeAmountSince = txVolumeAmountFactory.create(
  "allPaymentVolumeSince",
)
export const allTxBaseVolumeAmountSince =
  txVolumeAmountFactory.create("allTxBaseVolumeSince")
export const onChainTxBaseVolumeAmountSince = txVolumeAmountFactory.create(
  "onChainTxBaseVolumeSince",
)
export const lightningTxBaseVolumeAmountSince = txVolumeAmountFactory.create(
  "lightningTxBaseVolumeSince",
)
