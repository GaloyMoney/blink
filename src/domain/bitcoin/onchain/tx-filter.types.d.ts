type TxFilterArgs = {
  confsLT?: number
  confsGTE?: number
  addresses?: OnChainAddress[]
}

type TxFilter = {
  apply(txsonChainTransactions: OnChainTransaction[]): OnChainTransaction[]
}
