import { RepositoryError } from "@domain/errors"
import { OnChainError, MakeTxFilter, MakeTxDecoder } from "@domain/bitcoin/onchain"
import { MakeWallets } from "@services/mongoose/wallets"
import { MakeLedger } from "@services/ledger"
import { MakeOnChainService } from "@services/lnd/onchain-service"
import {
  toLiabilitiesAccountId,
  LedgerError,
  ledgerToWalletTransactions,
} from "@domain/ledger"
import { LOOK_BACK } from "../utils"
import { ONCHAIN_MIN_CONFIRMATIONS } from "@config/app"
import { submittedToWalletTransactions } from "@domain/wallet/transaction-translation"

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

  const decoder = MakeTxDecoder(process.env.NETWORK as BtcNetwork)

  const onChain = MakeOnChainService(decoder)
  if (onChain instanceof OnChainError) return onChain
  const onChainTxs = await onChain.getIncomingTransactions(LOOK_BACK)
  if (onChainTxs instanceof OnChainError) return onChain

  const pendingTxs = filter.apply(onChainTxs)

  const pendingIncomingWalletTransactions = submittedToWalletTransactions(pendingTxs)

  const ledger = MakeLedger()
  const liabilitiesAccountId = toLiabilitiesAccountId(walletId)
  const ledgerTransactions = await ledger.liabilityTransactions(liabilitiesAccountId)
  if (ledgerTransactions instanceof LedgerError) return ledgerTransactions

  const confirmedWalletTransactions = ledgerToWalletTransactions(ledgerTransactions)

  return [...confirmedWalletTransactions, ...pendingIncomingWalletTransactions]
}

// read from ledger -> leger line
// translate to display tx
// add unconfirmed
