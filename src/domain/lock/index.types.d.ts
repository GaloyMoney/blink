type LockServiceError = import("./errors").LockServiceError

type RedLock = import("redlock").Lock

declare const paymentHashLockSymbol: unique symbol
type PaymentHashLock = RedLock & { [paymentHashLockSymbol]: never }

interface ILockService {
  lockWalletId<Res>(
    args: { walletId: WalletId; logger: Logger },
    f: () => Promise<Res>,
  ): Promise<Res | LockServiceError>
  lockPaymentHash<Res>(
    args: { paymentHash: PaymentHash; logger: Logger; lock?: PaymentHashLock },
    f: (lock?: PaymentHashLock) => Promise<Res>,
  ): Promise<Res | LockServiceError>
}
