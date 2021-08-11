import { toSats } from "@domain/bitcoin"

export const submittedToWalletTransactions = (
  submittedTransactions: SubmittedTransaction[],
): WalletTransaction[] => {
  const walletTransactions: WalletTransaction[] = []
  submittedTransactions.forEach(({ id, rawTx, createdAt }) => {
    rawTx.outs.forEach(({ sats, address }) => {
      walletTransactions.push({
        id,
        settlementVia: "onchain",
        description: "pending",
        settlementFee: toSats(0),
        pendingConfirmation: true,
        createdAt: createdAt,
        settlementAmount: sats,
        addresses: [address],
      })
    })
  })
  return walletTransactions
}
