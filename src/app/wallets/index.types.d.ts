type AddInvoiceSelfArgs = {
  walletId: WalletId
  amount: Satoshis
  memo?: string
}

type AddInvoiceNoAmountSelfArgs = {
  walletId: WalletId
  memo?: string
}

type AddInvoiceRecipientArgs = {
  recipient: Username
  amount: Satoshis
  memo?: string
}

type AddInvoiceNoAmountRecipientArgs = {
  recipient: Username
  memo?: string
}
