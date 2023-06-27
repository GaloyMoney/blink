import sumBy from "lodash.sumby"
import {
  authenticatedBitcoind,
  createWallet,
  generateToAddress,
  getAddressInfo,
  getBlockchainInfo,
  getBlockCount,
  getNewAddress,
  getTransaction,
  listWalletDir,
  listWallets,
  loadWallet,
  sendToAddress,
  unloadWallet,
  getBalance as getWalletBalance,
  walletCreateFundedPsbt,
  walletProcessPsbt,
  finalizePsbt,
  sendRawTransaction,
} from "bitcoin-cli-ts"

import { btc2sat } from "@domain/bitcoin"
import { getBitcoinCoreRPCConfig } from "@config"

type GetAddressInfoResult = {
  address: string
  scriptPubKey: string
  ismine: boolean
  iswatchonly: boolean
  solvable: boolean
  isscript: boolean
  ischange: boolean
  iswitness: boolean
  // TODO? all available: https://developer.bitcoin.org/reference/rpc/getaddressinfo.html#result
}

type InWalletTransaction = {
  "amount": number
  "fee": number
  "confirmations": number
  "generated": boolean
  "trusted": boolean
  "blockhash": string
  "blockheight": number
  "blockindex": number
  "blocktime": number
  "txid": string
  "time": number
  "timereceived": number
  "comment": string
  "bip125-replaceable": string
  "hex": string
  // TODO? all available: https://developer.bitcoin.org/reference/rpc/gettransaction.html#result
}

export const getBitcoinCoreSignerRPCConfig = () => {
  return {
    ...getBitcoinCoreRPCConfig(),
    host: process.env.BITCOIND_SIGNER_ADDR,
    port: parseInt(process.env.BITCOIND_SIGNER_PORT || "8332", 10),
  }
}

export class BitcoindClient {
  readonly bitcoind

  constructor(connection_obj) {
    const { host, username, password, port, timeout } = connection_obj
    this.bitcoind = authenticatedBitcoind({
      protocol: "http",
      host: host || "",
      username,
      password,
      timeout,
      port,
    })
  }

  async getBlockCount(): Promise<number> {
    return getBlockCount({ bitcoind: this.bitcoind })
  }

  async getBlockchainInfo(): Promise<{ chain: string }> {
    return getBlockchainInfo({ bitcoind: this.bitcoind })
  }

  async createWallet({
    walletName,
    disablePrivateKeys,
    descriptors,
  }: {
    walletName: string
    disablePrivateKeys?: boolean
    descriptors?: boolean
  }): Promise<{ name: string; warning: string }> {
    return createWallet({
      bitcoind: this.bitcoind,
      wallet_name: walletName,
      disable_private_keys: disablePrivateKeys,
      descriptors,
    })
  }

  async listWallets(): Promise<[string]> {
    return listWallets({ bitcoind: this.bitcoind })
  }

  async listWalletDir(): Promise<[{ name: string }]> {
    return (await listWalletDir({ bitcoind: this.bitcoind })).wallets
  }

  // load/unload only used in tests, for now

  async loadWallet({
    filename,
  }: {
    filename: string
  }): Promise<{ name: string; warning: string }> {
    return loadWallet({ bitcoind: this.bitcoind, filename })
  }

  async unloadWallet({
    walletName,
  }: {
    walletName: string
  }): Promise<{ warning: string }> {
    return unloadWallet({ bitcoind: this.bitcoind, wallet_name: walletName })
  }
}

class BaseBitcoindWalletClient {
  readonly bitcoind

  constructor({
    walletName,
    config,
  }: {
    walletName: string
    config: {
      network: string | undefined
      username: string
      password: string
      timeout: number
      version: string
      host: string | undefined
      port: number
    }
  }) {
    const { host, username, password, port, timeout } = config
    this.bitcoind = authenticatedBitcoind({
      protocol: "http",
      host: host || "",
      username,
      password,
      timeout,
      port,
      walletName,
    })
  }

  async getNewAddress(): Promise<string> {
    return getNewAddress({ bitcoind: this.bitcoind })
  }

  async getAddressInfo({ address }: { address: string }): Promise<GetAddressInfoResult> {
    return getAddressInfo({ bitcoind: this.bitcoind, address })
  }

  async sendToAddress({
    address,
    amount,
    subtractfeefromamount,
  }: {
    address: string
    amount: number
    subtractfeefromamount?: boolean
  }): Promise<string> {
    return sendToAddress({
      bitcoind: this.bitcoind,
      address,
      amount,
      subtractfeefromamount,
    })
  }

  async getTransaction({
    txid,
    include_watchonly,
  }: {
    txid: string
    include_watchonly?: boolean
  }): Promise<InWalletTransaction> {
    return getTransaction({ bitcoind: this.bitcoind, txid, include_watchonly })
  }

  async generateToAddress({
    nblocks,
    address,
  }: {
    nblocks: number
    address: string
  }): Promise<[string]> {
    return generateToAddress({ bitcoind: this.bitcoind, nblocks, address })
  }

  async getBalance(): Promise<number> {
    return getWalletBalance({ bitcoind: this.bitcoind })
  }

  async walletCreateFundedPsbt({
    inputs,
    outputs,
  }: {
    inputs: []
    outputs: Record<string, number>[]
  }): Promise<{ psbt: string }> {
    return walletCreateFundedPsbt({ bitcoind: this.bitcoind, inputs, outputs })
  }

  async walletProcessPsbt({ psbt }: { psbt: string }): Promise<{ psbt: string }> {
    return walletProcessPsbt({ bitcoind: this.bitcoind, psbt })
  }

  async finalizePsbt({
    psbt,
  }: {
    psbt: string
  }): Promise<{ psbt: string; hex: string; complete: boolean }> {
    return finalizePsbt({ bitcoind: this.bitcoind, psbt })
  }

  async sendRawTransaction({ hexstring }: { hexstring: string }): Promise<string> {
    return sendRawTransaction({ bitcoind: this.bitcoind, hexstring })
  }
}

export class BitcoindWalletClient extends BaseBitcoindWalletClient {
  constructor(walletName: string) {
    super({ walletName, config: getBitcoinCoreRPCConfig() })
  }
}

export class BitcoindSignerWalletClient extends BaseBitcoindWalletClient {
  constructor(walletName: string) {
    super({ walletName, config: getBitcoinCoreSignerRPCConfig() })
  }
}

// The default client should remain without a wallet (not generate or receive bitcoin)
export const bitcoindDefaultClient = new BitcoindClient(getBitcoinCoreRPCConfig())

export const getBalancesDetail = async (): Promise<
  { wallet: string; balance: number }[]
> => {
  const wallets = await bitcoindDefaultClient.listWallets()

  const balances: { wallet: string; balance: number }[] = []

  for await (const wallet of wallets) {
    // do not consider the "outside" wallet in tests
    if (wallet === "" || wallet === "outside") {
      continue
    }

    const client = new BitcoindWalletClient(wallet)
    const balance = btc2sat(await client.getBalance())
    balances.push({ wallet, balance })
  }

  return balances
}

export const getBalance = async (): Promise<number> => {
  const balanceObj = await getBalancesDetail()
  return sumBy(balanceObj, "balance")
}
