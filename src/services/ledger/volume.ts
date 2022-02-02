import { toSats } from "@domain/bitcoin"
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

  intraledgerTxVolumeSince: async ({
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

  allTxVolumeSince: async ({
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
}): Promise<TxVolume | LedgerServiceError> => {
  const liabilitiesWalletId = toLiabilitiesWalletId(walletId)

  const txnTypesObj = txnTypes.map((txnType) => ({
    type: txnType,
  }))

  try {
    addEventToCurrentSpan("volume aggregation starts")
    const [result]: (TxVolume & { _id: null })[] = await Transaction.aggregate([
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
          outgoingSats: { $sum: "$debit" },
          incomingSats: { $sum: "$credit" },
        },
      },
    ])
    addEventToCurrentSpan("volume aggregation ends")

    return {
      outgoingSats: toSats(result?.outgoingSats ?? 0),
      incomingSats: toSats(result?.incomingSats ?? 0),
    }
  } catch (err) {
    return new UnknownLedgerError(err)
  }
}
