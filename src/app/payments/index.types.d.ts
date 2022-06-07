type RecipientDetails =
  | {
      id: WalletId
      currency: WalletCurrency
      username: Username
    }
  | undefined
