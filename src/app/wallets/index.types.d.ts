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
  recipient: Username
  amount: number
  memo?: string
}

type AddInvoiceNoAmountForRecipientArgs = {
  recipient: Username
  memo?: string
}
