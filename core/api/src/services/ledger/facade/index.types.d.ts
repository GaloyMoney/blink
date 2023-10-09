type TxnGroup = keyof typeof import("./volume").TxnGroups
type TxnTypes = (typeof import("./volume").TxnGroups)[TxnGroup]

type VolumeAmountForAccountSinceFn = (args: {
  accountWalletDescriptors: AccountWalletDescriptors
  period: Days
}) => Promise<TxBaseVolumeAmount<WalletCurrency>[] | ApplicationError>

type InitialStaticAccountUuids = {
  bankOwnerAccountUuid: LedgerAccountId | Error
  dealerBtcAccountUuid: LedgerAccountId | Error
  dealerUsdAccountUuid: LedgerAccountId | Error
  funderAccountUuid: LedgerAccountId | Error
}
