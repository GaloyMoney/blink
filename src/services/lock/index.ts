import { UnknownLockServiceError } from "@domain/lock"
import { redlock } from "@core/lock"

export const LockService = (): ILockService => {
  const lockWalletId = async <Res>(
    {
      walletId,
      logger,
      lock,
    }: { walletId: WalletId; logger: Logger; lock?: DistributedLock },
    f: () => Promise<Res>,
  ) => {
    try {
      return redlock({ path: walletId, logger, lock }, f)
    } catch (err) {
      return new UnknownLockServiceError(err)
    }
  }

  const lockPaymentHash = async <Res>(
    {
      paymentHash,
      logger,
      lock,
    }: { paymentHash: PaymentHash; logger: Logger; lock?: DistributedLock },
    f: () => Promise<Res>,
  ) => {
    try {
      return redlock({ path: paymentHash, logger, lock }, f)
    } catch (err) {
      return new UnknownLockServiceError(err)
    }
  }

  return {
    lockWalletId,
    lockPaymentHash,
  }
}
