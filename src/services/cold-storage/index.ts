import {
  authenticatedBitcoind,
  Bitcoind,
  getAddressInfo,
  getBalance as getBalanceRpc,
  getNewAddress,
  getTransaction,
  listWallets as listWalletsRpc,
  walletCreateFundedPsbt,
} from "bitcoin-cli-ts"

import { BitcoinNetwork, getBitcoinCoreRPCConfig, getColdStorageConfig } from "@config"

import {
  InsufficientBalanceForRebalanceError,
  InvalidCurrentColdStorageWalletServiceError,
  InvalidOrNonWalletTransactionError,
  UnknownColdStorageServiceError,
} from "@domain/cold-storage/errors"
import { btc2sat, sat2btc } from "@domain/bitcoin"
import { checkedToOnChainAddress } from "@domain/bitcoin/onchain"

import { wrapAsyncFunctionsToRunInSpan } from "@services/tracing"

const { onChainWallet, walletPattern } = getColdStorageConfig()

export const ColdStorageService = async (): Promise<
  IColdStorageService | ColdStorageServiceError
> => {
  const bitcoindCurrentWallet = await getBitcoindCurrentWalletClient()
  if (bitcoindCurrentWallet instanceof Error) return bitcoindCurrentWallet

  const listWallets = async (): Promise<string[] | ColdStorageServiceError> => {
    try {
      const bitcoind = getBitcoindClient()
      if (bitcoind instanceof Error) return bitcoind

      const wallets: string[] = await listWalletsRpc({ bitcoind })
      return wallets.filter((item: string) => item.includes(walletPattern))
    } catch (err) {
      return new UnknownColdStorageServiceError(err)
    }
  }

  const getBalances = async (): Promise<
    ColdStorageBalance[] | ColdStorageServiceError
  > => {
    try {
      const coldStorageWallets = await listWallets()
      if (coldStorageWallets instanceof Error) return coldStorageWallets

      const balances: ColdStorageBalance[] = []
      for await (const walletName of coldStorageWallets) {
        const bitcoind = getBitcoindClient(walletName)
        if (bitcoind instanceof Error) return bitcoind

        const amount = btc2sat(await getBalanceRpc({ bitcoind }))
        balances.push({ walletName, amount })
      }

      return balances
    } catch (err) {
      return new UnknownColdStorageServiceError(err)
    }
  }

  const getBalance = async (
    walletName: string,
  ): Promise<ColdStorageBalance | ColdStorageServiceError> => {
    try {
      const bitcoind = getBitcoindClient(walletName)
      if (bitcoind instanceof Error) return bitcoind

      const amount = btc2sat(await getBalanceRpc({ bitcoind }))
      return { walletName, amount }
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
      const bitcoind = getBitcoindClient(walletName)
      if (bitcoind instanceof Error) return bitcoind

      const output0: { [onchainaddress: OnChainAddress]: number } = {}
      output0[onChainAddress] = sat2btc(amount)

      const fundedPsbt = await walletCreateFundedPsbt({
        bitcoind,
        inputs: [],
        outputs: [output0],
        options: { conf_target: targetConfirmations },
      })

      return {
        transaction: fundedPsbt.psbt,
        fee: btc2sat(fundedPsbt.fee),
      }
    } catch (err) {
      if (err instanceof Error && err.message.includes("Insufficient funds")) {
        return new InsufficientBalanceForRebalanceError(err.message)
      }
      return new UnknownColdStorageServiceError(err)
    }
  }

  const createOnChainAddress = async (): Promise<
    OnChainAddress | ColdStorageServiceError
  > => {
    try {
      return checkedToOnChainAddress({
        network: BitcoinNetwork(),
        value: await getNewAddress({
          bitcoind: bitcoindCurrentWallet,
        }),
      })
    } catch (err) {
      return new UnknownColdStorageServiceError(err)
    }
  }

  const isDerivedAddress = async (
    address: OnChainAddress,
  ): Promise<boolean | ColdStorageServiceError> => {
    try {
      const { ismine: isMine } = await getAddressInfo({
        bitcoind: bitcoindCurrentWallet,
        address,
      })
      return !!isMine
    } catch (err) {
      return new UnknownColdStorageServiceError(err)
    }
  }

  const isWithdrawalTransaction = async (
    txHash: OnChainTxHash,
  ): Promise<boolean | ColdStorageServiceError> => {
    try {
      const { amount } = await getTransaction({
        bitcoind: bitcoindCurrentWallet,
        txid: txHash,
      })
      return Number(amount || 0) < 0
    } catch (err) {
      if (err instanceof Error && err.message === "Invalid or non-wallet transaction id")
        return new InvalidOrNonWalletTransactionError(err.message)
      return new UnknownColdStorageServiceError(err)
    }
  }

  const lookupTransactionFee = async (
    txHash: OnChainTxHash,
  ): Promise<Satoshis | ColdStorageServiceError> => {
    try {
      const { fee } = await getTransaction({
        bitcoind: bitcoindCurrentWallet,
        txid: txHash,
      })
      return btc2sat(Math.abs(fee || 0))
    } catch (err) {
      return new UnknownColdStorageServiceError(err)
    }
  }

  return wrapAsyncFunctionsToRunInSpan({
    namespace: "services.coldstorage",
    fns: {
      listWallets,
      getBalances,
      getBalance,
      createPsbt,
      createOnChainAddress,
      isDerivedAddress,
      isWithdrawalTransaction,
      lookupTransactionFee,
    },
  })
}

const getBitcoindClient = (wallet?: string): Bitcoind | ColdStorageServiceError => {
  try {
    const { host, username, password, port, timeout } = getBitcoinCoreRPCConfig()
    return authenticatedBitcoind({
      protocol: "http",
      host: host || "",
      username,
      password,
      timeout,
      port,
      walletName: wallet,
    })
  } catch (err) {
    return new UnknownColdStorageServiceError(err)
  }
}

const getBitcoindCurrentWalletClient = async (): Promise<
  Bitcoind | ColdStorageServiceError
> => {
  try {
    const bitcoind = getBitcoindClient()
    if (bitcoind instanceof Error) return bitcoind

    const wallets: string[] = await listWalletsRpc({ bitcoind })
    const wallet = wallets
      .filter((item: string) => item.includes(walletPattern))
      .find((item: string) => item.includes(onChainWallet))
    if (wallet) return getBitcoindClient(wallet)

    return new InvalidCurrentColdStorageWalletServiceError()
  } catch (err) {
    return new UnknownColdStorageServiceError(err)
  }
}
