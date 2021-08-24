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
