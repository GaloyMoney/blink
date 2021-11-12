import { CasbinService } from "@services/casbin"
import {
  Role,
  Permission,
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
      role: Role.Owner,
    })
    expect(result).toBeTruthy()

    result = await casbinService.addPermissionToRole({
      role: Role.Owner,
      scope: scopeFromAccountId(accountid),
      resourceId: resourceIdFromWalletId(walletId),
      permission: Permission.Read,
    })
    expect(result).toBeTruthy()

    const allowed = await casbinService.checkPermission({
      userId,
      resourceId: resourceIdFromWalletId(walletId),
      permission: Permission.Read,
    })
    expect(allowed).toBeTruthy()
  })
})
