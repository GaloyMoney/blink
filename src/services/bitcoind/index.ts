import Client from "bitcoin-core"

import { UnknownRepositoryError } from "@domain/errors"
import { WalletAlreadyExistError } from "@domain/bitcoin/onchain"
import { SATS_PER_BTC, toSats } from "@domain/bitcoin"

export const btc2sat = (btc: number) => {
  return Math.round(btc * SATS_PER_BTC) as Satoshis
}

export const sat2btc = (sat: number) => {
  return (sat / SATS_PER_BTC) as WholeBitcoin
}

const connection_obj = {
  network: process.env.NETWORK,
  username: "rpcuser",
  password: process.env.BITCOINDRPCPASS,
  host: process.env.BITCOINDADDR,
  port: process.env.BITCOINDPORT,
  version: "0.22.0",
}

export const BitcoindService = (): IBitcoindService => {
  const client = new Client({ ...connection_obj })

  const getBlockCount = async (): Promise<number> => {
    return client.getBlockCount()
  }

  const getBlockchainInfo = async (): Promise<{ chain: BtcNetwork }> => {
    return client.getBlockchainInfo()
  }

  const createWallet = async (
    walletName: BitcoindWalletName,
  ): Promise<
    | { name: BitcoindWalletName; warning: string }
    | UnknownRepositoryError
    | WalletAlreadyExistError
  > => {
    try {
      const result = await client.createWallet({ wallet_name: walletName })
      return result
    } catch (err) {
      if (err?.message.includes("Database already exists")) {
        return new WalletAlreadyExistError(err)
      }
      return new UnknownRepositoryError(err)
    }
  }

  const listWallets = async (): Promise<BitcoindWalletName[]> => {
    return client.listWallets()
  }

  // load/unload only used in tests, for now

  const loadWallet = async (
    walletName: BitcoindWalletName,
  ): Promise<{ name: string; warning: string }> => {
    return client.loadWallet({ filename: walletName })
  }

  const unloadWallet = async (
    walletName: BitcoindWalletName,
  ): Promise<{ warning: string }> => {
    return client.unloadWallet({ wallet_name: walletName })
  }

  return {
    getBlockCount,
    getBlockchainInfo,
    createWallet,
    listWallets,
    loadWallet,
    unloadWallet,
  }
}

export const BitcoindWalletClient = (
  walletName: BitcoindWalletName,
): IBitcoindWalletService => {
  const client = new Client({ ...connection_obj, wallet: walletName })

  const getNewAddress = async (): Promise<OnChainAddress> => {
    return client.getNewAddress()
  }

  const getAddressInfo = async (
    address: OnChainAddress,
  ): Promise<GetAddressInfoResult> => {
    return client.getAddressInfo({ address })
  }

  const sendToAddress = async ({
    address,
    amount,
  }: {
    address: OnChainAddress
    amount: Satoshis
  }): Promise<string> => {
    return client.sendToAddress({ address, amount: sat2btc(amount) })
  }

  const getTransaction = async ({
    txid,
    include_watchonly,
  }: {
    txid: OnChainTxHash
    include_watchonly?: boolean
  }): Promise<InWalletTransaction> => {
    return client.getTransaction({ txid, include_watchonly })
  }

  const generateToAddress = async ({
    nblocks,
    address,
  }: {
    nblocks: number
    address: OnChainAddress
  }): Promise<[string]> => {
    return client.generateToAddress({ nblocks, address })
  }

  const getBalance = async (): Promise<Satoshis> => {
    const balance = await client.getBalance()
    return btc2sat(balance)
  }

  const walletCreateFundedPsbt = async ({
    inputs,
    outputs,
  }: {
    inputs: unknown[]
    outputs: Record<string, number>[]
  }): Promise<{ psbt: string }> => {
    return client.walletCreateFundedPsbt({ inputs, outputs })
  }

  const walletProcessPsbt = async ({
    psbt,
  }: {
    psbt: string
  }): Promise<{ psbt: string }> => {
    return client.walletProcessPsbt({ psbt })
  }

  const finalizePsbt = async ({
    psbt,
  }: {
    psbt: string
  }): Promise<{ psbt: string; hex: string; complete: boolean }> => {
    return client.finalizePsbt({ psbt })
  }

  const sendRawTransaction = async ({
    hexstring,
  }: {
    hexstring: string
  }): Promise<string> => {
    return client.sendRawTransaction({ hexstring })
  }

  return {
    getNewAddress,
    getAddressInfo,
    sendToAddress,
    getTransaction,
    generateToAddress,
    getBalance,
    walletCreateFundedPsbt,
    walletProcessPsbt,
    finalizePsbt,
    sendRawTransaction,
  }
}

export const bitcoindDefaultClient = BitcoindService()

export const getBalancesDetail = async (): Promise<
  { wallet: BitcoindWalletName; balance: Satoshis }[]
> => {
  const wallets = await bitcoindDefaultClient.listWallets()

  const balances: { wallet: BitcoindWalletName; balance: Satoshis }[] = []

  for await (const wallet of wallets) {
    // do not consider the "outside" wallet in tests
    const emptyWallet = "" as BitcoindWalletName
    const outsideWAllet = "outside" as BitcoindWalletName

    if (wallet === emptyWallet || wallet === outsideWAllet) {
      continue
    }

    const client = BitcoindWalletClient(wallet)
    const balance = btc2sat(await client.getBalance())
    balances.push({ wallet, balance })
  }

  return balances
}

export const getBalance = async (): Promise<Satoshis> => {
  const balanceObj = await getBalancesDetail()
  const balances = balanceObj.map((wallet) => wallet.balance)
  return balances.reduce((a, b) => toSats(a + b), toSats(0))
}
