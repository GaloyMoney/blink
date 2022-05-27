import { CasbinService } from "@services/casbin"
import {
  Role,
  WalletPermission,
  scopeFromAccountId,
  resourceIdFromWalletId,
} from "@domain/authorization"

describe("CasbinService", () => {
  it("Should enforce wallet access", async () => {
    const casbinService = await CasbinService()
    const userId = "some-user" as UserId
    const accountid = "some-account" as AccountId
    const walletId = "some-wallet" as WalletId

    let result = await casbinService.addRoleToUser({
      userId,
      scope: scopeFromAccountId(accountid),
      role: Role.AccountOwner,
    })
    expect(result).toBeTruthy()

    result = await casbinService.addPermissionsToRole({
      role: Role.AccountOwner,
      scope: scopeFromAccountId(accountid),
      resourceId: resourceIdFromWalletId(walletId),
      permissions: [WalletPermission.BalanceRead],
    })
    expect(result).toBeTruthy()

    const allowed = await casbinService.checkPermission({
      userId,
      resourceId: resourceIdFromWalletId(walletId),
      permission: WalletPermission.BalanceRead,
    })
    expect(allowed).toBe(true)

    const notAllowed = await casbinService.checkPermission({
      userId,
      resourceId: resourceIdFromWalletId(walletId),
      permission: WalletPermission.OnChainSend,
    })
    expect(notAllowed).toBe(false)
  })
})
