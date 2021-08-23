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
  recipient: Walletname
  amount: number
  memo?: string
}

type AddInvoiceNoAmountForRecipientArgs = {
  recipient: Walletname
  memo?: string
}
