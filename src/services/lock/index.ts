import { UnknownLockServiceError } from "@domain/lock"
import { redlock } from "@core/lock"

export const LockService = (): ILockService => {
  const lockWalletId = async <Res>(
    { walletId, logger }: { walletId: WalletId; logger: Logger },
    f: () => Promise<Res>,
  ) => {
    try {
      return redlock({ path: walletId, logger }, f)
    } catch (err) {
      return new UnknownLockServiceError(err)
    }
  }

  return {
    lockWalletId,
  }
}
