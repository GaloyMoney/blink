import getUuidByString from "uuid-by-string"

import { WalletOnChainPendingReceive } from "./schema"

import { parseRepositoryError } from "./utils"

import { toSats } from "@/domain/bitcoin"
import { toCents } from "@/domain/fiat"
import { TxStatus } from "@/domain/wallets"
import { WalletCurrency } from "@/domain/shared"
import { CouldNotFindWalletOnChainPendingReceiveError } from "@/domain/errors"

export const WalletOnChainPendingReceiveRepository =
  (): IWalletOnChainPendingReceiveRepository => {
    const listByWalletIds = async ({
      walletIds,
      paginationArgs,
    }: ListWalletOnChainPendingReceiveArgs): Promise<
      WalletOnChainSettledTransaction[] | RepositoryError
    > => {
      // TODO: implement pagination
      !!paginationArgs

      try {
        const result: WalletOnChainPendingReceiveRecord[] =
          await WalletOnChainPendingReceive.find({
            walletId: { $in: walletIds },
          })
        if (!result || result.length === 0) {
          return new CouldNotFindWalletOnChainPendingReceiveError()
        }
        return result.map(translateToWalletOnChainTransaction)
      } catch (err) {
        return parseRepositoryError(err)
      }
    }

    const listByWalletIdsAndAddresses = async ({
      walletIds,
      addresses,
      paginationArgs,
    }: ListWalletOnChainPendingReceiveByAddressesArgs): Promise<
      WalletOnChainSettledTransaction[] | RepositoryError
    > => {
      // TODO: implement pagination
      !!paginationArgs

      try {
        const result: WalletOnChainPendingReceiveRecord[] =
          await WalletOnChainPendingReceive.find({
            walletId: { $in: walletIds },
            address: { $in: addresses },
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
      transactionHash,
      vout,
    }: RemoveWalletOnChainPendingReceiveArgs): Promise<true | RepositoryError> => {
      try {
        const result = await WalletOnChainPendingReceive.deleteOne({
          walletId,
          transactionHash,
          vout,
        })
        if (result.deletedCount === 0) {
          return new CouldNotFindWalletOnChainPendingReceiveError()
        }
        return true
      } catch (err) {
        return parseRepositoryError(err)
      }
    }

    return { listByWalletIds, listByWalletIdsAndAddresses, persistNew, remove }
  }

const translateToWalletOnChainTransaction = (
  result: WalletOnChainPendingReceiveRecord,
): WalletOnChainSettledTransaction => {
  const walletCurrency = result.walletCurrency as WalletCurrency
  const toCurrency = walletCurrency === WalletCurrency.Btc ? toSats : toCents
  return {
    id: getUuidByString(
      `${result.transactionHash}:${result.vout}`,
    ) as LedgerTransactionId,
    walletId: result.walletId as WalletId,
    externalId: undefined,
    settlementAmount: toCurrency(result.walletAmount),
    settlementFee: toCurrency(result.walletFee),
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
      vout: result.vout as OnChainTxVout,
    },
    createdAt: new Date(result.createdAt),
  }
}

const translateToDbRecord = (
  tx: WalletOnChainPendingTransaction,
): WalletOnChainPendingReceiveRecord => ({
  walletId: tx.walletId || "",
  address: tx.initiationVia.address,
  transactionHash: tx.settlementVia.transactionHash,
  vout: tx.settlementVia.vout || 0,
  walletAmount: Number(tx.settlementAmount.amount),
  walletFee: Number(tx.settlementFee.amount),
  walletCurrency: tx.settlementCurrency,
  displayAmount: tx.settlementDisplayAmount.displayInMajor,
  displayFee: tx.settlementDisplayFee.displayInMajor,
  displayPriceBase: tx.settlementDisplayPrice.base.toString(),
  displayPriceOffset: tx.settlementDisplayPrice.offset.toString(),
  displayPriceCurrency: tx.settlementDisplayPrice.displayCurrency,
  createdAt: tx.createdAt,
})
