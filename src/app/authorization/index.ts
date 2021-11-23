import { CasbinService } from "@services/casbin"
import {
  resourceIdFromWalletPublicId,
  scopeFromAccountId,
  Role,
  Permission,
  AuthorizationServiceError,
} from "@domain/authorization"

export const initAccountPermissions = async ({
  userId,
  accountId,
  walletPublicId,
}: {
  userId: UserId
  accountId: AccountId
  walletPublicId: WalletPublicId
}): Promise<true | AuthorizationServiceError> => {
  const authService = await CasbinService()
  const scope = scopeFromAccountId(accountId)
  let ret = await authService.addRoleToUser({
    userId,
    role: Role.AccountOwner,
    scope,
  })
  if (ret instanceof Error) return ret
  ret = await authService.addPermissionsToRole({
    role: Role.AccountOwner,
    scope,
    resourceId: resourceIdFromWalletPublicId(walletPublicId),
    permissions: [
      Permission.WalletView,
      Permission.WalletOnChainAddressCreate,
      Permission.WalletOnChainPaymentSend,
    ],
  })
  if (ret instanceof Error) return ret
  return true
}
