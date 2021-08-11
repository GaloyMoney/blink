// type OnChainTransaction = {
//   blockId: BlockId
//   confirmations: number
//   fee: Satoshis
//   id: TxId
//   isOutgoing: boolean
//   outputAddresses: OnChainAddress[]
//   // satsToAddress(recipient: OnChainAddress): Satoshis
//   tokens: Satoshis
//   transactionHex: string
//   createdAt: Date
// }

interface IOnChainService {
  getIncomingTransactions({
    scanDepth: number,
  }): Promise<SubmittedTransaction[] | OnChainServiceError>
}
