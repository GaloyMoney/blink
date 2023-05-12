import { toSats } from "@domain/bitcoin"
import { toCents } from "@domain/fiat"
import { TxStatus } from "@domain/wallets"
import { WalletCurrency } from "@domain/shared"
import { CouldNotFindWalletOnChainPendingReceiveError } from "@domain/errors"

import { parseRepositoryError } from "./utils"
import { WalletOnChainPendingReceive } from "./schema"

export const WalletOnChainPendingReceiveRepository =
  (): IWalletOnChainPendingReceiveRepository => {
    const listByWalletId = async ({
      walletId,
    }: ListWalletOnChainPendingReceiveArgs): Promise<
      WalletOnChainSettledTransaction[] | RepositoryError
    > => {
      try {
        const result: WalletOnChainPendingReceiveRecord[] =
          await WalletOnChainPendingReceive.find({
            walletId,
          })
        if (!result || result.length === 0) {
          return new CouldNotFindWalletOnChainPendingReceiveError()
        }
        return result.map(translateToWalletOnChainTransaction)
      } catch (err) {
        return parseRepositoryError(err)
      }
    }

    const persistNew = async (
      transaction: PersistWalletOnChainPendingReceiveArgs,
    ): Promise<WalletOnChainSettledTransaction | RepositoryError> => {
      try {
        const pendingUtxo = new WalletOnChainPendingReceive(
          translateToDbRecord(transaction),
        )
        await pendingUtxo.save()
        return translateToWalletOnChainTransaction(pendingUtxo)
      } catch (err) {
        return parseRepositoryError(err)
      }
    }

    const remove = async ({
      walletId,
      txHash,
    }: RemoveWalletOnChainPendingReceiveArgs): Promise<true | RepositoryError> => {
      try {
        const result = await WalletOnChainPendingReceive.deleteOne({ walletId, txHash })
        if (result.deletedCount === 0) {
          return new CouldNotFindWalletOnChainPendingReceiveError()
        }
        return true
      } catch (err) {
        return parseRepositoryError(err)
      }
    }

    return { listByWalletId, persistNew, remove }
  }

const translateToWalletOnChainTransaction = (
  result: WalletOnChainPendingReceiveRecord,
): WalletOnChainSettledTransaction => {
  const walletCurrency = result.currency as WalletCurrency
  const toCurrency = walletCurrency === WalletCurrency.Btc ? toSats : toCents
  return {
    id: result.transactionHash as OnChainTxHash,
    walletId: result.walletId as WalletId,
    settlementAmount: toCurrency(result.amount),
    settlementFee: toCurrency(result.fee),
    settlementCurrency: walletCurrency,
    settlementDisplayAmount: result.displayAmount as DisplayCurrencyMajorAmount,
    settlementDisplayFee: result.displayFee as DisplayCurrencyMajorAmount,
    settlementDisplayPrice: {
      base: BigInt(result.displayPriceBase),
      offset: BigInt(result.displayPriceOffset),
      displayCurrency: result.displayPriceCurrency as DisplayCurrency,
      walletCurrency: walletCurrency,
    },
    status: TxStatus.Pending,
    memo: null,
    initiationVia: {
      type: "onchain",
      address: result.address as OnChainAddress,
    },
    settlementVia: {
      type: "onchain",
      transactionHash: result.transactionHash as OnChainTxHash,
    },
    createdAt: new Date(result.createdAt),
  }
}

const translateToDbRecord = (
  tx: PersistWalletOnChainPendingReceiveArgs,
): WalletOnChainPendingReceiveRecord => ({
  walletId: tx.walletId || "",
  address: tx.initiationVia.address,
  transactionHash: tx.settlementVia.transactionHash,
  amount: tx.settlementAmount,
  fee: tx.settlementFee,
  currency: tx.settlementCurrency,
  displayAmount: tx.settlementDisplayAmount,
  displayFee: tx.settlementDisplayFee,
  displayPriceBase: tx.settlementDisplayPrice.base.toString(),
  displayPriceOffset: tx.settlementDisplayPrice.offset.toString(),
  displayPriceCurrency: tx.settlementDisplayPrice.displayCurrency,
  createdAt: tx.createdAt,
})
