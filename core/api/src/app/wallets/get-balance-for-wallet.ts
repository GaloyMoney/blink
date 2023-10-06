import { LedgerService } from "@/services/ledger"

export const getBalanceForWallet = async ({
  walletId,
}: {
  walletId: WalletId
}): Promise<CurrencyBaseAmount | ApplicationError> => {
  return LedgerService().getWalletBalance(walletId)
}
