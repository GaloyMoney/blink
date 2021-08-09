import { UnknownLedgerError, LedgerError, RepositoryError } from "@domain/errors"
import { MakeWallets } from "@services/mongoose/wallets"
import { MakeLedger } from "@services/ledger"
import { toLiabilitiesAccountId } from "@domain/ledger"
// import { WalletFactory } from "@core/wallet-factory"
// import { User } from "@services/mongoose/schema"

export const GetTransactionsForWallet = async ({
  walletId,
}: // logger,
{
  walletId: WalletId
  // logger: Logger
}): Promise<WalletTransaction[] | LedgerError | RepositoryError> => {
  const ledger = MakeLedger()

  const liabilitiesAccountId = toLiabilitiesAccountId(walletId)
  const ledgerTransactions = await ledger.liabilityTransactions(liabilitiesAccountId)
  if (ledgerTransactions instanceof LedgerError) return ledgerTransactions

  const wallets = MakeWallets()

  const onchainAddresses = await wallets.getOnchainAddressesFor(walletId)
  if (onchainAddresses instanceof RepositoryError) return onchainAddresses

  // ledgerToWalletTransactions(ledgerTransactions)
  // bitcoinDService.getUnconfirmedTxs(walletId)

  /// result = LedgerService.getTransactionForWallet(walletId)
  //
  // result.map((ledgerTx) => displayTx)
  //
  // BitcoinService.getUnconfirmedTxs(walletId)
  // append(ledgeTxs, bitcoinUnconfirmedTxs)
  // return
  // const user = await User.findOne({ _id: walletId })
  // const wallet = await WalletFactory({ user, logger })
  // wallet.getTransactions()

  return new UnknownLedgerError("")
}

// read from ledger -> leger line
// translate to display tx
// add unconfirmed
