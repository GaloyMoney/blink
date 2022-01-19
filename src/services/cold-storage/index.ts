import BitcoindClient from "bitcoin-core"
import { btc2sat } from "@domain/bitcoin"
import { getBitcoinCoreRPCConfig, getColdStorageConfig } from "@config/app"
import { UnknownColdStorageServiceError } from "@domain/cold-storage/errors"

export const ColdStorageService = async (): Promise<
  IColdStorageService | ColdStorageServiceError
> => {
  const bitcoindClient = await getBitcoindClient()
  if (bitcoindClient instanceof Error) return bitcoindClient

  const getBalance = async (): Promise<Satoshis | ColdStorageServiceError> => {
    try {
      return btc2sat(await bitcoindClient.getBalance())
    } catch (err) {
      return new UnknownColdStorageServiceError(err)
    }
  }

  const createOnChainAddress = async (): Promise<
    OnChainAddress | ColdStorageServiceError
  > => {
    try {
      return bitcoindClient.getNewAddress() as OnChainAddress
    } catch (err) {
      return new UnknownColdStorageServiceError(err)
    }
  }

  return {
    getBalance,
    createOnChainAddress,
  }
}

const getBitcoindClient = async () => {
  try {
    const bitcoinCoreRPCConfig = getBitcoinCoreRPCConfig()
    const { onchainWallet } = getColdStorageConfig()
    const client = new BitcoindClient({ ...bitcoinCoreRPCConfig })

    const wallets = await client.listWallets()
    const wallet = wallets.find((item: string) => item.includes(onchainWallet))

    return new BitcoindClient({ ...bitcoinCoreRPCConfig, wallet })
  } catch (err) {
    return new UnknownColdStorageServiceError(err)
  }
}
