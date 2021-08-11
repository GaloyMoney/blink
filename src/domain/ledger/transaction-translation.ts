import { toSats } from "@domain/bitcoin"

import { MEMO_SHARING_SATS_THRESHOLD } from "@config/app"

export const ledgerToWalletTransactions = (
  ledgerTransactions: LedgerTransaction[],
): WalletTransaction[] => {
  return ledgerTransactions.map(
    ({
      id,
      memoFromPayer,
      lnMemo,
      type,
      credit,
      debit,
      fee,
      paymentHash,
      username,
      addresses,
      pendingConfirmation,
      timestamp,
    }) => {
      const settlementAmount = toSats(credit - debit)
      const description = translateDescription({
        type,
        memoFromPayer,
        lnMemo,
        credit,
        username,
      })
      if (username) {
        return {
          id,
          settlementVia: "intraledger",
          description,
          settlementAmount,
          settlementFee: fee,
          recipientId: username,
          pendingConfirmation,
          createdAt: timestamp,
        }
      } else if (addresses && addresses.length > 0) {
        return {
          id,
          settlementVia: "onchain",
          addresses,
          description,
          settlementAmount,
          settlementFee: fee,
          pendingConfirmation,
          createdAt: timestamp,
        }
      }
      return {
        id,
        settlementVia: "lightning",
        description,
        settlementAmount,
        settlementFee: fee,
        paymentHash: paymentHash as PaymentHash,
        username,
        pendingConfirmation,
        createdAt: timestamp,
      }
    },
  )
}

export const translateDescription = ({
  memoFromPayer,
  lnMemo,
  username,
  type,
  credit,
}: {
  memoFromPayer?: string
  lnMemo?: string
  username?: string
  type: LedgerTransactionType
  credit: number
}): string => {
  if (shouldDisplayMemo(credit)) {
    if (memoFromPayer) {
      return memoFromPayer
    }
    if (lnMemo) {
      return lnMemo
    }
  }

  let usernameDescription
  if (username) {
    if (credit > 0) {
      usernameDescription = `from ${username}`
    } else {
      usernameDescription = `to ${username}`
    }
  }

  return usernameDescription || type
}

export const shouldDisplayMemo = (credit: number) => {
  return credit == 0 || credit >= MEMO_SHARING_SATS_THRESHOLD
}
