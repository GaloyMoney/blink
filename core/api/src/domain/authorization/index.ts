import { AccountStatus } from "../accounts/primitives"

export const ScopesOauth2 = {
  Read: "read",
  Write: "write",
  Receive: "receive",
} as const

export const resolveScopes = ({
  account,
  scopes,
}: {
  account: Account
  scopes?: ScopesOauth2[]
}): ScopesOauth2[] => {
  const isActive = account.status === AccountStatus.Active
  if (!isActive) {
    return [ScopesOauth2.Read]
  }

  if (scopes && scopes.length > 0) return scopes

  return [ScopesOauth2.Read, ScopesOauth2.Write, ScopesOauth2.Receive]
}
