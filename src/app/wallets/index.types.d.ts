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
  username: Username
  amount: Satoshis
  memo?: string
}

type AddInvoiceNoAmountRecipientArgs = {
  username: Username
  memo?: string
}

type BaseAddInvoiceArgs = {
  amount: Satoshis
  memo: string
  walletInvoiceCreateFn: WalletInvoiceFactoryCreateMethod
}
