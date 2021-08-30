type LockServiceError = import("./errors").LockServiceError

interface ILockService {
  lockWalletAccess<Res>(
    args: { walletId: WalletId; logger: Logger },
    f: () => Promise<Res>,
  ): Promise<Res | LockServiceError>
}
