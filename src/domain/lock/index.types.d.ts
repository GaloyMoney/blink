type RedlockAbortSignal = import("redlock").RedlockAbortSignal

type LockServiceError = import("./errors").LockServiceError

type WalletIdAbortSignal = RedlockAbortSignal & { readonly brand: unique symbol }
type PaymentHashAbortSignal = RedlockAbortSignal & { readonly brand: unique symbol }
type OnChainTxAbortSignal = RedlockAbortSignal & { readonly brand: unique symbol }

interface ILockService {
  lockWalletId<Res>(
    args: { walletId: WalletId },
    f: (signal: WalletIdAbortSignal) => Promise<Res>,
  ): Promise<Res | LockServiceError>
  lockPaymentHash<Res>(
    args: { paymentHash: PaymentHash },
    f: (signal: PaymentHashAbortSignal) => Promise<Res>,
  ): Promise<Res | LockServiceError>
  lockOnChainTxHash<Res>(
    args: { txHash: OnChainTxHash },
    f: (signal: OnChainTxAbortSignal) => Promise<Res>,
  ): Promise<Res | LockServiceError>
}
