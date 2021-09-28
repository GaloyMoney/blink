type LockServiceError = import("./errors").LockServiceError

type RedLock = import("redlock").Lock

declare const distributedLockSymbol: unique symbol
type DistributedLock = RedLock & { [distributedLockSymbol]: never }

interface ILockService {
  lockWalletId<Res>(
    args: { walletId: WalletId; logger: Logger; lock?: DistributedLock },
    f: (lock?: DistributedLock) => Promise<Res>,
  ): Promise<Res | LockServiceError>
  lockPaymentHash<Res>(
    args: { paymentHash: PaymentHash; logger: Logger; lock?: DistributedLock },
    f: (lock?: DistributedLock) => Promise<Res>,
  ): Promise<Res | LockServiceError>
  extendLock<Res>(
    args: { logger: Logger; lock?: DistributedLock },
    f: (lock?: DistributedLock) => Promise<Res>,
  ): Promise<Res | LockServiceError>
}
