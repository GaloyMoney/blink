import { toSats } from "@domain/bitcoin"
import { CouldNotFindPendingIncomingOnChainUTXOError } from "@domain/errors"

import { PendingIncomingUTXO } from "./schema"
import { fromObjectId, parseRepositoryError, toObjectId } from "./utils"

export const PendingIncomingUTXORepository = (): IPendingIncomingUTXORepository => {
  const listByAddresses = async (
    addresses: OnChainAddress[],
  ): Promise<PendingIncomingOnChainTransaction[] | RepositoryError> => {
    try {
      const result: PendingIncomingUTXORecord[] = await PendingIncomingUTXO.find({
        address: { $in: addresses },
      })
      if (!result || result.length === 0) {
        return new CouldNotFindPendingIncomingOnChainUTXOError()
      }
      return result.map(resultToPendingIncomingOnChainTransaction)
    } catch (err) {
      return parseRepositoryError(err)
    }
  }

  const persistNew = async ({
    address,
    amount,
    txHash,
    vout,
  }: PersistNewPendingIncomingOnChainTransactionArgs): Promise<
    PendingIncomingOnChainTransaction | RepositoryError
  > => {
    try {
      const pendingUtxo = new PendingIncomingUTXO({ address, amount, txHash, vout })
      await pendingUtxo.save()
      return resultToPendingIncomingOnChainTransaction(pendingUtxo)
    } catch (err) {
      return parseRepositoryError(err)
    }
  }

  const remove = async ({
    id,
  }: PendingIncomingOnChainTransaction): Promise<true | RepositoryError> => {
    try {
      const result = await PendingIncomingUTXO.deleteOne({ _id: toObjectId(id) })
      if (result.deletedCount === 0) {
        return new CouldNotFindPendingIncomingOnChainUTXOError(id)
      }
      return true
    } catch (err) {
      return parseRepositoryError(err)
    }
  }

  return { listByAddresses, persistNew, remove }
}

const resultToPendingIncomingOnChainTransaction = (
  result: PendingIncomingUTXORecord,
): PendingIncomingOnChainTransaction => ({
  id: fromObjectId<PendingIncomingOnChainTransactionId>(result._id),
  address: result.address as OnChainAddress,
  amount: toSats(result.amount),
  txHash: result.txHash as OnChainTxHash,
  vout: result.vout,
  createdAt: new Date(result.createdAt),
})
