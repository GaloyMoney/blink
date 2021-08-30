type LockServiceError = import("./errors").LockServiceError

interface ILockService {
  lockWalletId<Res>(
    args: { walletId: WalletId; logger: Logger },
    f: () => Promise<Res>,
  ): Promise<Res | LockServiceError>
}
