import { PendingOnChainTransactionsRepository } from "@services/mongoose/pending-onchain-transactions"

export const addPendingTransaction = async ({
  rawUserId,
  txHash,
  vout,
  amount,
}: {
  rawUserId: UserId | undefined
  txHash: OnChainTxHash
  vout: number
  amount: BtcPaymentAmount
}) => {
  // SECTION: Do checks
  let userId: UserId | undefined = undefined
  if (rawUserId === undefined) {
    // const userId = Wallets.lookupUserIdForAddress(addressInfo.address)
    userId = "result" as UserId
    // BriaService.updateAddressMetadata({address, userId})
    // BriaService.getNewAddress({address, userId})
  } else {
    userId = rawUserId
  }
  if (!userId) {
    return
  }

  // SECTION: Repo add transaction
  const pendingTxn = PendingOnChainTransactionsRepository().persistNew({
    userId,
    txHash,
    vout,
    amount,
  })
  if (pendingTxn instanceof Error) {
    return pendingTxn
  }
}
