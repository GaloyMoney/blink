import { AuthWildCard, AuthResourceType } from "./primitives"

const resourceUri = ({ type, id }: { type: AuthResourceType; id: string }): string =>
  type == AuthResourceType.Any && id == AuthWildCard
    ? `/resource/${type}`
    : `/resource/${type}/${id}`

export const resourceFromWalletId = (walletId: WalletId): AuthResource => {
  const type = AuthResourceType.Wallet
  const id = walletId
  return {
    type,
    id,
    uri: resourceUri({ type, id }),
  }
}

export const resourceFromAccountId = (accountId: AccountId): AuthResource => {
  const type = AuthResourceType.Account
  const id = accountId
  return {
    type,
    id,
    uri: resourceUri({ type, id }),
  }
}

export const resourceFromUserId = (userId: UserId): AuthResource => {
  const type = AuthResourceType.User
  const id = userId
  return {
    type,
    id,
    uri: resourceUri({ type, id }),
  }
}

export const AnyAccountResource = {
  type: AuthResourceType.Account,
  id: AuthWildCard,
  uri: resourceUri({ type: AuthResourceType.Account, id: AuthWildCard }),
} as const

export const AnyWalletResource = {
  type: AuthResourceType.Account,
  id: AuthWildCard,
  uri: resourceUri({ type: AuthResourceType.Wallet, id: AuthWildCard }),
} as const

export const AnyResource = {
  type: AuthResourceType.Any,
  id: AuthWildCard,
  uri: resourceUri({ type: AuthResourceType.Any, id: AuthWildCard }),
} as const
