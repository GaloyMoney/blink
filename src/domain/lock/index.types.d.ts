type RedlockAbortSignal = import("redlock").RedlockAbortSignal

type LockServiceError = import("./errors").LockServiceError

type WalletIdAbortSignal = RedlockAbortSignal & { readonly brand: unique symbol }
type PaymentHashAbortSignal = RedlockAbortSignal & { readonly brand: unique symbol }
type OnChainTxAbortSignal = RedlockAbortSignal & { readonly brand: unique symbol }

interface ILockService {
  lockWalletId<Res>(
    walletId: WalletId,
    f: (signal: WalletIdAbortSignal) => Promise<Res>,
  ): Promise<Res | LockServiceError>
  lockPaymentHash<Res>(
    paymentHash: PaymentHash,
    f: (signal: PaymentHashAbortSignal) => Promise<Res>,
  ): Promise<Res | LockServiceError>
  lockOnChainTxHash<Res>(
    txHash: OnChainTxHash,
    f: (signal: OnChainTxAbortSignal) => Promise<Res>,
  ): Promise<Res | LockServiceError>
}

type RedlockArgs<Signal, Ret> = {
  path: string
  signal?: Signal
  asyncFn: (signal: Signal) => Promise<Ret>
}
