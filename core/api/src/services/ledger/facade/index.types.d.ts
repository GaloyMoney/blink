type TxnGroup = keyof typeof import("./volume").TxnGroups
type TxnTypes = (typeof import("./volume").TxnGroups)[TxnGroup]

type VolumeAmountForAccountSinceFn = (args: {
  accountWalletDescriptors: AccountWalletDescriptors
  period: Days
}) => Promise<TxBaseVolumeAmount<WalletCurrency>[] | ApplicationError>

type InitialStaticAccountIds = {
  bankOwnerAccountId: LedgerAccountId | Error
  dealerBtcAccountId: LedgerAccountId | Error
  dealerUsdAccountId: LedgerAccountId | Error
  funderAccountId: LedgerAccountId | Error
}

type VolumeCalculator<S extends WalletCurrency> = {
  in: () => PaymentAmount<S>
  out: () => PaymentAmount<S>
  netIn: () => PaymentAmount<S>
  netOut: () => PaymentAmount<S>
  absolute: () => PaymentAmount<S>
}
