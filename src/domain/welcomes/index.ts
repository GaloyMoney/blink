import { LedgerTransactionType } from "@domain/ledger"

import { WelcomeError } from "./error"

export const NewWelcomeCacheState = () => {
  let mostRecentWelcomeTimestamp: Date | undefined

  const updateFromNewTransactions = (transactionList: PossibleWelcomeTransaction[]) => {
    for (const tx of transactionList) {
      const welcome = maybeWelcomeFromTx({
        mostRecentWelcomeTimestamp,
        maybeWelcomeTx: tx,
        accountHasBeenWelcomed: () => false, // TODO check for welcome in graph
      })

      if (!welcome) {
        continue
      }

      if (welcome instanceof WelcomeError) {
        return welcome
      }

      // TODO save welcome in graph
    }
  }

  const generateWelcomeProfiles = ({
    outerCircleDepth,
  }: {
    outCircleDepth: number
  }): WelcomeProfile[] => []

  return {
    updateFromNewTransactions,
    generateWelcomeProfiles,
  }
}

const maybeWelcomeFromTx = ({
  mostRecentWelcomeTimestamp,
  maybeWelcomeTx,
  accountHasBeenWelcomed,
}: {
  mostRecentWelcomeTimestamp: Date | undefined
  maybeWelcomeTx: PossibleWelcomeTransaction
  accountHasBeenWelcomed: (accountId: AccountId) => boolean
}): WelcomeError | undefined | Welcome => {
  if (
    mostRecentWelcomeTimestamp !== undefined &&
    mostRecentWelcomeTimestamp > maybeWelcomeTx.timestamp
  ) {
    return new WelcomeError()
  }

  if (
    maybeWelcomeTx.recipientAccountId === undefined ||
    maybeWelcomeTx.senderAccountId === undefined
  ) {
    return
  }

  if (!(maybeWelcomeTx.type in welcomeTxTypes)) {
    return
  }

  if (accountHasBeenWelcomed(maybeWelcomeTx.recipientAccountId)) {
    return
  }

  return {
    welcomerAccountId: maybeWelcomeTx.senderAccountId,
    welcomeeAccountId: maybeWelcomeTx.recipientAccountId,
    welcomeTxId: maybeWelcomeTx.id,
    timestamp: maybeWelcomeTx.timestamp,
  }
}

const welcomeTxTypes: LedgerTransactionType[] = [
  LedgerTransactionType.OnchainIntraLedger,
  LedgerTransactionType.LnIntraLedger,
  LedgerTransactionType.IntraLedger,
]

export const ledgerTxToPossibleWelcomeTx = ({
  tx: { walletId, recipientWalletId, timestamp, id, type },
  accountIdForWalletId,
}: {
  tx: LedgerTransaction<WalletCurrency>
  accountIdForWalletId: (walletId: WalletId) => AccountId
}): PossibleWelcomeTransaction => {
  return {
    timestamp,
    recipientAccountId: recipientWalletId && accountIdForWalletId(recipientWalletId),
    senderAccountId: walletId && accountIdForWalletId(walletId),
    id,
    type,
  }
}
