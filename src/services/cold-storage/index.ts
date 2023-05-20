import { RPCClient } from "rpc-bitcoin"

import { BTC_NETWORK, getBitcoinCoreRPCConfig, getColdStorageConfig } from "@config"

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
  const bitcoindCurrentWalletClient = await getBitcoindCurrentWalletClient()
  if (bitcoindCurrentWalletClient instanceof Error) return bitcoindCurrentWalletClient

  const listWallets = async (): Promise<string[] | ColdStorageServiceError> => {
    try {
      const client = getBitcoindClient()
      if (client instanceof Error) return client

      const wallets: string[] = await client.listwallets()
      return wallets.filter((item: string) => item.includes(walletPattern))
    } catch (err) {
      return new UnknownColdStorageServiceError(err.message || err)
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
        const client = getBitcoindClient(walletName)
        if (client instanceof Error) continue
        const amount = btc2sat(await client.getbalance({}))
        balances.push({ walletName, amount })
      }

      return balances
    } catch (err) {
      return new UnknownColdStorageServiceError(err.message || err)
    }
  }

  const getBalance = async (
    walletName: string,
  ): Promise<ColdStorageBalance | ColdStorageServiceError> => {
    try {
      const client = getBitcoindClient(walletName)
      if (client instanceof Error) return client

      const amount = btc2sat(await client.getbalance({}))
      return { walletName, amount }
    } catch (err) {
      return new UnknownColdStorageServiceError(err.message || err)
    }
  }

  const createPsbt = async ({
    walletName,
    onChainAddress,
    amount,
    targetConfirmations,
  }: GetColdStoragePsbtArgs): Promise<ColdStoragePsbt | ColdStorageServiceError> => {
    try {
      const client = getBitcoindClient(walletName)
      if (client instanceof Error) return client

      const output0: { [onchainaddress: OnChainAddress]: number } = {}
      output0[onChainAddress] = sat2btc(amount)

      const fundedPsbt = await client.walletcreatefundedpsbt({
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
      return new UnknownColdStorageServiceError(err.message || err)
    }
  }

  const createOnChainAddress = async (): Promise<
    OnChainAddress | ColdStorageServiceError
  > => {
    try {
      return checkedToOnChainAddress({
        network: BTC_NETWORK,
        value: await bitcoindCurrentWalletClient.getnewaddress({}),
      })
    } catch (err) {
      return new UnknownColdStorageServiceError(err.message || err)
    }
  }

  const isDerivedAddress = async (
    address: OnChainAddress,
  ): Promise<boolean | ColdStorageServiceError> => {
    try {
      const { ismine: isMine } = await bitcoindCurrentWalletClient.getaddressinfo({
        address,
      })
      return !!isMine
    } catch (err) {
      return new UnknownColdStorageServiceError(err.message || err)
    }
  }

  const isWithdrawalTransaction = async (
    txHash: OnChainTxHash,
  ): Promise<boolean | ColdStorageServiceError> => {
    try {
      const { amount } = await bitcoindCurrentWalletClient.gettransaction({
        txid: txHash,
      })
      return Number(amount || 0) < 0
    } catch (err) {
      if (err?.message === "Invalid or non-wallet transaction id")
        return new InvalidOrNonWalletTransactionError(err)
      return new UnknownColdStorageServiceError(err.message || err)
    }
  }

  const lookupTransactionFee = async (
    txHash: OnChainTxHash,
  ): Promise<Satoshis | ColdStorageServiceError> => {
    try {
      const { fee } = await bitcoindCurrentWalletClient.gettransaction({ txid: txHash })
      return btc2sat(Math.abs(fee || 0))
    } catch (err) {
      return new UnknownColdStorageServiceError(err.message || err)
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

const getBitcoindClient = (wallet?: string): RPCClient | ColdStorageServiceError => {
  try {
    const config = getBitcoinCoreRPCConfig()
    return new RPCClient({
      url: `http://${config.host}`,
      user: config.username,
      pass: config.password,
      port: parseInt(config.port, 10),
      wallet,
    })
  } catch (err) {
    return new UnknownColdStorageServiceError(err.message || err)
  }
}

const getBitcoindCurrentWalletClient = async (): Promise<
  RPCClient | ColdStorageServiceError
> => {
  try {
    const client = getBitcoindClient()
    if (client instanceof Error) return client

    const wallets: string[] = await client.listwallets()
    const wallet = wallets
      .filter((item: string) => item.includes(walletPattern))
      .find((item: string) => item.includes(onChainWallet))
    if (wallet) return getBitcoindClient(wallet)

    return new InvalidCurrentColdStorageWalletServiceError()
  } catch (err) {
    return new UnknownColdStorageServiceError(err.message || err)
  }
}
