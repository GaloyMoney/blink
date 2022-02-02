import BitcoindClient from "bitcoin-core"
import { btc2sat, sat2btc } from "@domain/bitcoin"
import { BTC_NETWORK, getBitcoinCoreRPCConfig, getColdStorageConfig } from "@config"
import {
  InsufficientBalanceForRebalanceError,
  InvalidCurrentColdStorageWalletServiceError,
  UnknownColdStorageServiceError,
} from "@domain/cold-storage/errors"
import { checkedToOnChainAddress } from "@domain/bitcoin/onchain"

const { onChainWallet, walletPattern } = getColdStorageConfig()

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

  const createPsbt = async ({
    walletName,
    onChainAddress,
    amount,
    targetConfirmations,
  }: GetColdStoragePsbtArgs): Promise<ColdStoragePsbt | ColdStorageServiceError> => {
    try {
      const client = await getBitcoindClient(walletName)
      if (client instanceof Error) return client

      const output0 = {}
      output0[onChainAddress] = sat2btc(amount)

      const fundedPsbt = await client.walletCreateFundedPsbt({
        inputs: [],
        outputs: [output0],
        options: { conf_target: targetConfirmations },
      })

      return {
        transaction: fundedPsbt.psbt,
        fee: btc2sat(fundedPsbt.fee),
      }
    } catch (err) {
      if (err && err.message && err.message.includes("Insufficient funds")) {
        return new InsufficientBalanceForRebalanceError(err)
      }
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

  const isDerivedAddress = async (
    address: OnChainAddress,
  ): Promise<boolean | ColdStorageServiceError> => {
    try {
      const { ismine: isMine } = await bitcoindCurrentWalletClient.getAddressInfo(address)
      return !!isMine
    } catch (err) {
      return new UnknownColdStorageServiceError(err)
    }
  }

  const isWithdrawalTransaction = async (
    txHash: OnChainTxHash,
  ): Promise<boolean | ColdStorageServiceError> => {
    try {
      const { amount } = await bitcoindCurrentWalletClient.getTransaction(txHash)
      return amount < 0
    } catch (err) {
      return new UnknownColdStorageServiceError(err)
    }
  }

  const lookupTransactionFee = async (
    txHash: OnChainTxHash,
  ): Promise<Satoshis | ColdStorageServiceError> => {
    try {
      const { fee } = await bitcoindCurrentWalletClient.getTransaction(txHash)
      return btc2sat(Math.abs(fee))
    } catch (err) {
      return new UnknownColdStorageServiceError(err)
    }
  }

  return {
    getBalances,
    createPsbt,
    createOnChainAddress,
    isDerivedAddress,
    isWithdrawalTransaction,
    lookupTransactionFee,
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
      .find((item: string) => item.includes(onChainWallet))
    if (wallet) return getBitcoindClient(wallet)

    return new InvalidCurrentColdStorageWalletServiceError()
  } catch (err) {
    return new UnknownColdStorageServiceError(err)
  }
}
