type AuthenticatedLnd = import("lightning").AuthenticatedLnd

interface IAddInvoiceRequest {
  value: number
  memo: string | undefined
  selfGenerated?: boolean
}

interface IFeeRequest {
  amount?: number
  invoice?: string
  username?: string
}

interface IPaymentRequest {
  username?: string
  amount?: number
  invoice?: string
  memo?: string
  isReward?: boolean
}

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
