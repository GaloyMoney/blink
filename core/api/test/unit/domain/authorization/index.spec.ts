import { AccountLevel, AccountStatus } from "@/domain/accounts"
import { ScopesOauth2, resolveScopes } from "@/domain/authorization"
import { UsdDisplayCurrency } from "@/domain/fiat"

describe("resolveScopes", () => {
  const defaultAccount: Account = {
    id: crypto.randomUUID() as AccountId,
    createdAt: new Date(),
    username: "username" as Username,
    defaultWalletId: "defaultWalletId" as WalletId,
    withdrawFee: 0 as Satoshis,
    level: AccountLevel.One,
    status: AccountStatus.Active,
    statusHistory: [{ status: AccountStatus.Active }],
    contactEnabled: true,
    contacts: [],
    kratosUserId: "kratosUserId" as UserId,
    displayCurrency: UsdDisplayCurrency,
    threadId: "threadId" as ThreadId,
  }

  it("returns read scope when account is not active", () => {
    const account = { ...defaultAccount, status: AccountStatus.Locked }
    let result = resolveScopes({ account })
    expect(result).toEqual([ScopesOauth2.Read])

    const scopes = [ScopesOauth2.Read, ScopesOauth2.Write]
    result = resolveScopes({ account, scopes })
    expect(result).toEqual([ScopesOauth2.Read])
  })

  it("returns specified scopes when provided", () => {
    const account = { ...defaultAccount, status: AccountStatus.Active }
    const scopes = [ScopesOauth2.Read, ScopesOauth2.Receive]
    const result = resolveScopes({ account, scopes })
    expect(result).toEqual(scopes)
  })

  it("returns default scopes when no scope provided", () => {
    const account = { ...defaultAccount, status: AccountStatus.Active }
    let result = resolveScopes({ account })
    expect(result).toEqual([ScopesOauth2.Read, ScopesOauth2.Write, ScopesOauth2.Receive])

    result = resolveScopes({ account, scopes: [] })
    expect(result).toEqual([ScopesOauth2.Read, ScopesOauth2.Write, ScopesOauth2.Receive])
  })
})
