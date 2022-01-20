import BitcoindClient from "bitcoin-core"
import { btc2sat } from "@domain/bitcoin"
import { BTC_NETWORK, getBitcoinCoreRPCConfig, getColdStorageConfig } from "@config/app"
import {
  InvalidCurrentColdStorageWalletServiceError,
  UnknownColdStorageServiceError,
} from "@domain/cold-storage/errors"
import { checkedToOnChainAddress } from "@domain/bitcoin/onchain"

const { onchainWallet, walletPattern } = getColdStorageConfig()

export const ColdStorageService = async (): Promise<
  IColdStorageService | ColdStorageServiceError
> => {
  const bitcoindCurrentWalletClient = await getBitcoindCurrentWalletClient()
  if (bitcoindCurrentWalletClient instanceof Error) return bitcoindCurrentWalletClient

  const getBalances = async (): Promise<
    ColdStorageBalance[] | ColdStorageServiceError
  > => {
    try {
      const client = await getBitcoindClient()
      if (client instanceof Error) return client

      const wallets = await client.listWallets()
      const coldStorageWallets = wallets.filter((item: string) =>
        item.includes(walletPattern),
      )

      const balances: ColdStorageBalance[] = []
      for await (const walletName of coldStorageWallets) {
        const client = await getBitcoindClient(walletName)
        if (client instanceof Error) continue
        const amount = btc2sat(await client.getBalance())
        balances.push({ walletName, amount })
      }

      return balances
    } catch (err) {
      return new UnknownColdStorageServiceError(err)
    }
  }

  const createOnChainAddress = async (): Promise<
    OnChainAddress | ColdStorageServiceError
  > => {
    try {
      return checkedToOnChainAddress({
        network: BTC_NETWORK,
        value: await bitcoindCurrentWalletClient.getNewAddress(),
      })
    } catch (err) {
      return new UnknownColdStorageServiceError(err)
    }
  }

  return {
    getBalances,
    createOnChainAddress,
  }
}

const getBitcoindClient = (wallet?: string) => {
  try {
    const bitcoinCoreRPCConfig = getBitcoinCoreRPCConfig()
    return new BitcoindClient({ ...bitcoinCoreRPCConfig, wallet })
  } catch (err) {
    return new UnknownColdStorageServiceError(err)
  }
}

const getBitcoindCurrentWalletClient = async () => {
  try {
    const client = getBitcoindClient()
    if (client instanceof Error) return client

    const wallets = await client.listWallets()
    const wallet = wallets
      .filter((item: string) => item.includes(walletPattern))
      .find((item: string) => item.includes(onchainWallet))
    if (wallet) return getBitcoindClient(wallet)

    return new InvalidCurrentColdStorageWalletServiceError()
  } catch (err) {
    return new UnknownColdStorageServiceError(err)
  }
}
