import { RepositoryError } from "@domain/errors"
import { OnChainError, MakeTxFilter } from "@domain/bitcoin/onchain"
import { MakeWallets } from "@services/mongoose/wallets"
import { MakeLedger } from "@services/ledger"
import { MakeOnChainService } from "@services/lnd/onchain-service"
import { toLiabilitiesAccountId, LedgerError } from "@domain/ledger"
import { LOOK_BACK } from "../utils"
import { ONCHAIN_MIN_CONFIRMATIONS } from "@config/app"
// import { WalletFactory } from "@core/wallet-factory"
// import { User } from "@services/mongoose/schema"

export const GetTransactionsForWallet = async ({
  walletId,
}: // logger,
{
  walletId: WalletId
  // logger: Logger
}): Promise<WalletTransaction[] | CoreError> => {
  const wallets = MakeWallets()
  const wallet = await wallets.findById(walletId)
  if (wallet instanceof RepositoryError) return wallet

  const filter = MakeTxFilter({
    confsLT: ONCHAIN_MIN_CONFIRMATIONS,
    addresses: wallet.onChainAddresses,
  })

  const onChain = MakeOnChainService()
  if (onChain instanceof OnChainError) return onChain
  const onChainTxs = await onChain.getIncomingTransactions(LOOK_BACK)
  if (onChainTxs instanceof OnChainError) return onChain

  const pendingTxs = filter.apply(onChainTxs)

  const ledger = MakeLedger()
  const liabilitiesAccountId = toLiabilitiesAccountId(walletId)
  const ledgerTransactions = await ledger.liabilityTransactions(liabilitiesAccountId)
  if (ledgerTransactions instanceof LedgerError) return ledgerTransactions

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

  return new LedgerError("")
}

// read from ledger -> leger line
// translate to display tx
// add unconfirmed
