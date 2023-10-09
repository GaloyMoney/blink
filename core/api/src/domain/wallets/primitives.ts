// in the future, we may have:
// - saving account (not redeemable instantly)
// - borrowing account based on collateral
export const WalletType = {
  Checking: "checking",
} as const

export const toWalletDescriptor = <S extends WalletCurrency>(
  wallet: Wallet,
): WalletDescriptor<S> => ({
  id: wallet.id,
  currency: wallet.currency as S,
  accountId: wallet.accountId,
})
