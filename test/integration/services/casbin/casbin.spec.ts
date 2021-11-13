import { CasbinService } from "@services/casbin"
import {
  Role,
  Permission,
  scopeFromAccountId,
  resourceIdFromWalletPublicId,
} from "@domain/authorization"

describe("CasbinService", () => {
  it("Should enforce wallet access", async () => {
    const casbinService = await CasbinService()
    const userId = "some-user" as UserId
    const accountid = "some-account" as AccountId
    const walletId = "some-wallet" as WalletPublicId

    let result = await casbinService.addRoleToUser({
      userId,
      scope: scopeFromAccountId(accountid),
      role: Role.AccountOwner,
    })
    expect(result).toBeTruthy()

    result = await casbinService.addPermissionsToRole({
      role: Role.AccountOwner,
      scope: scopeFromAccountId(accountid),
      resourceId: resourceIdFromWalletPublicId(walletId),
      permissions: [Permission.WalletView],
    })
    expect(result).toBeTruthy()

    const allowed = await casbinService.checkPermission({
      userId,
      resourceId: resourceIdFromWalletPublicId(walletId),
      permission: Permission.WalletView,
    })
    expect(allowed).toBeTruthy()
  })
})
