export const Role = {
  AccountOwner: "account.owner",
} as const

export const Permission = {
  WalletView: "wallet:view",
  WalletOnChainAddressCreate: "wallet:onChainAddressCreate",
  WalletOnChainPaymentSend: "wallet:sendOnChainPayment",
} as const

export const scopeFromAccountId = (accountId: AccountId) =>
  `account/${accountId}` as AuthorizationScope

export const resourceIdFromWalletPublicId = (walletId: WalletPublicId): ResourceId =>
  `wallet/${walletId}` as ResourceId
