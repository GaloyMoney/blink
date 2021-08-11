import { ONCHAIN_MIN_CONFIRMATIONS } from "@config/app"
import { toSats } from "@domain/bitcoin"
import { getHeight, getChainTransactions } from "lightning"

export const MakeOnchainService = (lndAuth: AuthenticatedLnd): IOnChainService => {
  const getIncomingTransactions = async ({
    scanDepth,
  }: {
    scanDepth: number
  }): Promise<OnChainTransaction[] | OnChainServiceError> => {
    const { current_block_height } = await getHeight({ lnd: lndAuth })
    const after = Math.max(0, current_block_height - scanDepth) // this is necessary for tests, otherwise after may be negative
    const { transactions } = await getChainTransactions({ lnd: lndAuth, after })
    return transactions
      .filter((tx) => !tx.is_outgoing)
      .map(
        (tx) =>
          ({
            blockId: tx.block_id as BlockId,
            confirmationCount: tx.confirmation_count,
            fee: toSats(tx.fee as number),
            id: tx.id as TxId,
            isOutgoing: tx.is_outgoing as boolean,
            outputAddresses: tx.output_addresses as OnchainAddress[],
            tokens: toSats(tx.tokens),
            transactionHex: tx.transaction,
          } as OnChainTransaction),
      )
  }

  const filterConfirmedTransactions = (
    transactions: OnChainTransaction[],
  ): OnChainTransaction[] =>
    transactions.filter(
      (tx) => !!tx.confirmationCount && tx.confirmationCount >= ONCHAIN_MIN_CONFIRMATIONS,
    )

  const filterUnconfirmedTransactions = (
    transactions: OnChainTransaction[],
  ): OnChainTransaction[] =>
    transactions.filter(
      (tx) =>
        (!!tx.confirmationCount && tx.confirmationCount < ONCHAIN_MIN_CONFIRMATIONS) ||
        !tx.confirmationCount,
    )

  return {
    getIncomingTransactions,
    filterConfirmedTransactions,
    filterUnconfirmedTransactions,
  }
}
