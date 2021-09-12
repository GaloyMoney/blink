import { UnknownLockServiceError } from "@domain/lock"
import { lockExtendOrThrow, redlock } from "@core/lock"

export const LockService = (): ILockService => {
  const lockWalletId = async <Res>(
    {
      walletId,
      logger,
      lock,
    }: { walletId: WalletId; logger: Logger; lock?: DistributedLock },
    f: () => Promise<Res>,
  ): Promise<Res | LockServiceError> => {
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
  ): Promise<Res | LockServiceError> => {
    try {
      return redlock({ path: paymentHash, logger, lock }, f)
    } catch (err) {
      return new UnknownLockServiceError(err)
    }
  }

  const extendLock = async <Res>(
    { lock, logger }: { lock: DistributedLock; logger: Logger },
    f: () => Promise<Res>,
  ): Promise<Res | LockServiceError> => {
    try {
      return lockExtendOrThrow({ lock, logger }, f) as Promise<Res>
    } catch (err) {
      return new UnknownLockServiceError(err)
    }
  }

  return {
    lockWalletId,
    lockPaymentHash,
    extendLock,
  }
}
