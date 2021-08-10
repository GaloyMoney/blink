import { MEMO_SHARING_SATS_THRESHOLD } from "@config/app"

export const ledgerToWalletTransactions = (ledgerTransactions: LedgerTransaction[]) => {
  return ledgerTransactions.map(({ id, type, currency, memoFromPayer, credit }) => {
    return {
      id,
      description: translateDescription({ type, memoFromPayer, credit }),
    }
  })
}

export const translateDescription = ({
  memoFromPayer,
  memo,
  username,
  type,
  credit,
}: {
  memoFromPayer?: string
  memo?: string
  username?: string
  type: LedgerTransactionType
  credit: number
}): string => {
  if (shouldDisplayMemo(credit)) {
    if (memoFromPayer) {
      return memoFromPayer
    }
    if (memo) {
      return memo
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
