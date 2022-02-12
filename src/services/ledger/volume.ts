import { LedgerTransactionType, toLiabilitiesWalletId } from "@domain/ledger"
import { LedgerServiceError, UnknownLedgerError } from "@domain/ledger/errors"
import { addEventToCurrentSpan } from "@services/tracing"

import { Transaction } from "./books"

export const volume = {
  allPaymentVolumeSince: async ({
    walletId,
    timestamp,
  }: {
    walletId: WalletId
    timestamp: Date
  }) => {
    return txVolumeSince({
      walletId,
      timestamp,
      txnTypes: [
        LedgerTransactionType.IntraLedger,
        LedgerTransactionType.OnchainIntraLedger,
        LedgerTransactionType.Payment,
        LedgerTransactionType.OnchainPayment,
      ],
    })
  },

  externalPaymentVolumeSince: async ({
    walletId,
    timestamp,
  }: {
    walletId: WalletId
    timestamp: Date
  }) => {
    return txVolumeSince({
      walletId,
      timestamp,
      txnTypes: [LedgerTransactionType.Payment, LedgerTransactionType.OnchainPayment],
    })
  },

  intraledgerTxBaseVolumeSince: async ({
    walletId,
    timestamp,
  }: {
    walletId: WalletId
    timestamp: Date
  }) => {
    return txVolumeSince({
      walletId,
      timestamp,
      txnTypes: [
        LedgerTransactionType.IntraLedger,
        LedgerTransactionType.OnchainIntraLedger,
      ],
    })
  },

  allTxBaseVolumeSince: async ({
    walletId,
    timestamp,
  }: {
    walletId: WalletId
    timestamp: Date
  }) => {
    return txVolumeSince({
      walletId,
      timestamp,
      txnTypes: Object.values(LedgerTransactionType),
    })
  },
}

const txVolumeSince = async ({
  walletId,
  timestamp,
  txnTypes,
}: {
  walletId: WalletId
  timestamp: Date
  txnTypes: LedgerTransactionType[]
}): Promise<TxBaseVolume | LedgerServiceError> => {
  const liabilitiesWalletId = toLiabilitiesWalletId(walletId)

  const txnTypesObj = txnTypes.map((txnType) => ({
    type: txnType,
  }))

  try {
    addEventToCurrentSpan("volume aggregation starts")
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
    addEventToCurrentSpan("volume aggregation ends")

    return {
      outgoingBaseAmount: result?.outgoingBaseAmount ?? (0 as CurrencyBaseAmount),
      incomingBaseAmount: result?.incomingBaseAmount ?? (0 as CurrencyBaseAmount),
    }
  } catch (err) {
    return new UnknownLedgerError(err)
  }
}
