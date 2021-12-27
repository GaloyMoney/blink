type LockServiceError = import("./errors").LockServiceError

type RedLock = import("redlock").Lock

type DistributedLock = RedLock & { readonly brand: unique symbol }
interface ILockService {
  lockWalletId<Res>(
    args: { walletId: WalletId; logger: Logger; lock?: DistributedLock },
    f: (lock?: DistributedLock) => Promise<Res>,
  ): Promise<Res | LockServiceError>
  lockPaymentHash<Res>(
    args: { paymentHash: PaymentHash; logger: Logger; lock?: DistributedLock },
    f: (lock?: DistributedLock) => Promise<Res>,
  ): Promise<Res | LockServiceError>
  lockOnChainTxHash<Res>(
    args: { txHash: OnChainTxHash; logger: Logger; lock?: DistributedLock },
    f: (lock?: DistributedLock) => Promise<Res>,
  ): Promise<Res | LockServiceError>
  extendLock<Res>(
    args: { logger: Logger; lock?: DistributedLock },
    f: (lock?: DistributedLock) => Promise<Res>,
  ): Promise<Res | LockServiceError>
}
