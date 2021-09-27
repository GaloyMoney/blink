type AddInvoiceArgs = {
  walletId: WalletId
  amount: number
  memo?: string
}

type AddInvoiceNoAmountArgs = {
  walletId: WalletId
  memo?: string
}

type AddInvoiceForRecipientArgs = {
  recipient: WalletName
  amount: number
  memo?: string
}

type AddInvoiceNoAmountForRecipientArgs = {
  recipient: WalletName
  memo?: string
}

type GetOnChainFeeArgs = {
  wallet: Wallet
  amount: Satoshis
  address: OnChainAddress
  targetConfirmations: TargetConfirmations
}

type GetOnChainFeeByWalletIdArgs = {
  walletId: WalletId
  amount: number
  address: OnChainAddress
  targetConfirmations: number
}

type GetOnChainFeeByWalletNameArgs = {
  walletName: WalletName
  amount: number
  address: OnChainAddress
  targetConfirmations: number
}
