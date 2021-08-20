type AddInvoiceArgs = {
  walletId: WalletId
  amount: Satoshis
  memo?: string
}

type AddInvoiceNoAmountArgs = {
  walletId: WalletId
  memo?: string
}

type AddInvoiceByUsernameArgs = {
  recipient: Username
  amount: Satoshis
  memo?: string
}

type AddInvoiceNoAmountByUsernameArgs = {
  recipient: Username
  memo?: string
}
