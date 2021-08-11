import _ from "lodash"

import { LOOK_BACK } from "@core/utils"
import {
  UnknownRepositoryError,
  CouldNotFindError,
  RepositoryError,
  OnChainServiceError,
} from "@domain/errors"
import { MakeOnchainService } from "@services/lnd/onchain-service"
import { getLndFromPubkey } from "@services/lnd/utils"
import { baseLogger } from "@services/logger"
import { User } from "@services/mongoose/schema"

export const MakeWallets = (): IWallets => {
  let lnd: AuthenticatedLnd

  const getOnchainAddressesFor = async (
    walletId: WalletId,
  ): Promise<AddressIdentifier[] | RepositoryError> => {
    try {
      const result = await User.findOne({ _id: walletId })
      if (!result) {
        return new CouldNotFindError()
      }
      return result.onchain.map(({ pubkey, address }) => {
        return { pubkey: pubkey as Pubkey, address: address as OnchainAddress }
      })
    } catch (err) {
      return new UnknownRepositoryError(err)
    }
  }

  const getOnchainTransactionsFor = async (
    walletId: WalletId,
  ): Promise<OnChainTransaction[] | OnChainServiceError> => {
    let user_matched_txs: OnChainTransaction[] = []

    let userAddresses = await getOnchainAddressesFor(walletId)
    if (userAddresses instanceof RepositoryError) {
      userAddresses = []
    }

    const pubkeys: string[] = [...new Set(userAddresses.map((item) => item.pubkey))]
    for (const pubkey of pubkeys) {
      // TODO: optimize the data structure
      // const addresses = this.user.onchain
      //   .filter((item) => (item.pubkey = pubkey))
      //   .map((item) => item.address)

      const addresses = userAddresses
        .filter((item) => item.pubkey == pubkey)
        .map((item) => item.address)

      try {
        ;({ lnd } = getLndFromPubkey({ pubkey }))
      } catch (err) {
        // FIXME pass logger
        baseLogger.warn({ pubkey }, "node is offline")
        continue
      }

      const onChainService = MakeOnchainService(lnd)
      const lnd_incoming_txs = await onChainService.getIncomingTransactions({
        scanDepth: LOOK_BACK,
      })
      if (lnd_incoming_txs instanceof OnChainServiceError) {
        // FIXME: return OnChainServiceError
        return []
      }

      // for unconfirmed tx:
      // { block_id: undefined,
      //   confirmation_count: undefined,
      //   confirmation_height: undefined,
      //   created_at: '2021-03-09T12:55:09.000Z',
      //   description: undefined,
      //   fee: undefined,
      //   id: '60dfde7a0c5209c1a8438a5c47bb5e56249eae6d0894d140996ec0dcbbbb5f83',
      //   is_confirmed: false,
      //   is_outgoing: false,
      //   output_addresses: [Array],
      //   tokens: 100000000,
      //   transaction: '02000000000...' }

      // for confirmed tx
      // { block_id: '0000000000000b1fa86d936adb8dea741a9ecd5f6a58fc075a1894795007bdbc',
      //   confirmation_count: 712,
      //   confirmation_height: 1744148,
      //   created_at: '2020-05-14T01:47:22.000Z',
      //   fee: undefined,
      //   id: '5e3d3f679bbe703131b028056e37aee35a193f28c38d337a4aeb6600e5767feb',
      //   is_confirmed: true,
      //   is_outgoing: false,
      //   output_addresses: [Array],
      //   tokens: 10775,
      //   transaction: '020000000001.....' }

      user_matched_txs = [
        ...user_matched_txs,
        ...lnd_incoming_txs.filter(
          // only return transactions for addresses that belond to the user
          (tx) => _.intersection(tx.outputAddresses, addresses).length > 0,
        ),
      ]
    }

    return user_matched_txs
  }

  const getConfirmedTransactionsFor = async (
    walletId: WalletId,
  ): Promise<OnChainTransaction[] | OnChainServiceError> => {
    const walletOnchainTransactions = await getOnchainTransactionsFor(walletId)
    if (walletOnchainTransactions instanceof OnChainServiceError) {
      // FIXME: return new OnChainServiceError
      return []
    }

    const onChainService = MakeOnchainService(lnd)
    return onChainService.filterConfirmedTransactions(walletOnchainTransactions)
  }

  const getUnconfirmedTransactionsFor = async (
    walletId: WalletId,
  ): Promise<OnChainTransaction[] | OnChainServiceError> => {
    const walletOnchainTransactions = await getOnchainTransactionsFor(walletId)
    if (walletOnchainTransactions instanceof OnChainServiceError) {
      // FIXME: return new OnChainServiceError
      return []
    }

    const onChainService = MakeOnchainService(lnd)
    return onChainService.filterUnconfirmedTransactions(walletOnchainTransactions)
  }

  return {
    getOnchainAddressesFor,
    getConfirmedTransactionsFor,
    getUnconfirmedTransactionsFor,
  }
}
