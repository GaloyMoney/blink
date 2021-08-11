type OnChainTransaction = {
  blockId: BlockId
  confirmationCount: number
  fee: Satoshis
  id: TxId
  isOutgoing: boolean
  outputAddresses: OnchainAddress[]
  tokens: Satoshis
  transactionHex: string
  createdAt: string
}

interface IOnChainService {
  getIncomingTransactions({
    scanDepth: number,
  }): Promise<OnChainTransaction[] | OnChainServiceError>
  filterUnconfirmedTransactions(transactions: OnChainTransaction[]): OnChainTransaction[]
  filterConfirmedTransactions(transactions: OnChainTransaction[]): OnChainTransaction[]
}
