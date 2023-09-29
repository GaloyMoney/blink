type TxnGroup = keyof typeof import("./volume").TxnGroups
type TxnTypes = (typeof import("./volume").TxnGroups)[TxnGroup]

type InitialStaticAccountIds = {
  bankOwnerAccountId: LedgerAccountId | Error
  dealerBtcAccountId: LedgerAccountId | Error
  dealerUsdAccountId: LedgerAccountId | Error
  funderAccountId: LedgerAccountId | Error
}
