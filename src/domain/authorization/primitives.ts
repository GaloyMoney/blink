export const AuthWildCard = "*"

export const AuthResourceType = {
  User: "user",
  Wallet: "wallet",
  Account: "account",
  Any: AuthWildCard,
} as const

export const AuthAction = {
  Read: "read",
  Update: "update",
  Delete: "delete",
  List: "list",
  Add: "add",
} as const

export const AccountAttribute = {
  Status: "status",
  Level: "level",
} as const

export const UserAttribute = {
  SupportRole: "supportRole",
} as const

export const Role = {
  SupportLevel1: "/role/support/level1",
  SupportLevel2: "/role/support/level2",

  AccountReader: "/role/account/reader",

  WalletReader: "wallet.reader",
} as const

export const subjectIdFromUserId = (userId: UserId) => `/user/${userId}` as SubjectId

export const subjectIdFromRole = (role: Role) => `/role/${role}` as SubjectId

export const GlobalAuthorizationScope = "/scope/*" as AuthorizationScope
export const scopeFromAccountId = (accountId: AccountId) =>
  `/scope/account/${accountId}` as AuthorizationScope
