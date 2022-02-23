import Redlock from "redlock"

import { ResourceAttemptsLockServiceError, UnknownLockServiceError } from "@domain/lock"
import { lockExtendOrThrow, redlock } from "@core/lock"
import { wrapAsyncFunctionsToRunInSpan } from "@services/tracing"

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
      return await redlock({ path: walletId, logger, lock }, f)
    } catch (err) {
      if (err instanceof Redlock.LockError && err.attempts > 0) {
        return new ResourceAttemptsLockServiceError(err.message)
      }
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
      return await redlock({ path: paymentHash, logger, lock }, f)
    } catch (err) {
      if (err instanceof Redlock.LockError && err.attempts > 0) {
        return new ResourceAttemptsLockServiceError(err.message)
      }
      return new UnknownLockServiceError(err)
    }
  }

  const lockOnChainTxHash = async <Res>(
    {
      txHash,
      logger,
      lock,
    }: { txHash: OnChainTxHash; logger: Logger; lock?: DistributedLock },
    f: (lock?: DistributedLock) => Promise<Res>,
  ): Promise<Res | LockServiceError> => {
    try {
      return await redlock({ path: txHash, logger, lock }, f)
    } catch (err) {
      if (err instanceof Redlock.LockError && err.attempts > 0) {
        return new ResourceAttemptsLockServiceError(err.message)
      }
      return new UnknownLockServiceError(err)
    }
  }

  const extendLock = async <Res>(
    { lock, logger }: { lock: DistributedLock; logger: Logger },
    f: () => Promise<Res>,
  ): Promise<Res | LockServiceError> => {
    try {
      return (await lockExtendOrThrow({ lock, logger }, f)) as Promise<Res>
    } catch (err) {
      if (err instanceof Redlock.LockError && err.attempts > 0) {
        return new ResourceAttemptsLockServiceError(err.message)
      }
      return new UnknownLockServiceError(err)
    }
  }

  return wrapAsyncFunctionsToRunInSpan({
    namespace: "services.lock",
    fns: {
      lockWalletId,
      lockPaymentHash,
      lockOnChainTxHash,
      extendLock,
    },
  })
}
