import { btc2sat } from "@domain/bitcoin"

import Client from "bitcoin-core-ts"
import sumBy from "lodash.sumby"

const connection_obj = {
  network: process.env.NETWORK,
  username: "rpcuser",
  password: process.env.BITCOINDRPCPASS,
  host: process.env.BITCOINDADDR,
  port: process.env.BITCOINDPORT,
  version: "0.21.0",
}

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

export class BitcoindClient {
  readonly client

  constructor() {
    this.client = new Client({ ...connection_obj })
  }

  async getBlockCount(): Promise<number> {
    return this.client.getBlockCount()
  }

  async getBlockchainInfo(): Promise<{ chain: string }> {
    return this.client.getBlockchainInfo()
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
    return this.client.createWallet({
      wallet_name: walletName,
      disable_private_keys: disablePrivateKeys,
      descriptors,
    })
  }

  async listWallets(): Promise<[string]> {
    return this.client.listWallets()
  }

  async listWalletDir(): Promise<[{ name: string }]> {
    return (await this.client.listWalletDir()).wallets
  }

  // load/unload only used in tests, for now

  async loadWallet({
    filename,
  }: {
    filename: string
  }): Promise<{ name: string; warning: string }> {
    return this.client.loadWallet({ filename })
  }

  async unloadWallet({
    walletName,
  }: {
    walletName: string
  }): Promise<{ warning: string }> {
    return this.client.unloadWallet({ wallet_name: walletName })
  }
}

export class BitcoindWalletClient {
  readonly client

  constructor(walletName: string) {
    this.client = new Client({ ...connection_obj, wallet: walletName })
  }

  async getNewAddress(): Promise<string> {
    return this.client.getNewAddress()
  }

  async getAddressInfo({ address }: { address: string }): Promise<GetAddressInfoResult> {
    return this.client.getAddressInfo({ address })
  }

  async sendToAddress({
    address,
    amount,
  }: {
    address: string
    amount: number
  }): Promise<string> {
    return this.client.sendToAddress({ address, amount })
  }

  async getTransaction({
    txid,
    include_watchonly,
  }: {
    txid: string
    include_watchonly?: boolean
  }): Promise<InWalletTransaction> {
    return this.client.getTransaction({ txid, include_watchonly })
  }

  async generateToAddress({
    nblocks,
    address,
  }: {
    nblocks: number
    address: string
  }): Promise<[string]> {
    return this.client.generateToAddress({ nblocks, address })
  }

  async getBalance(): Promise<number> {
    return this.client.getBalance()
  }

  async walletCreateFundedPsbt({
    inputs,
    outputs,
  }: {
    inputs: []
    outputs: Record<string, number>[]
  }): Promise<{ psbt: string }> {
    return this.client.walletCreateFundedPsbt({ inputs, outputs })
  }

  async walletProcessPsbt({ psbt }: { psbt: string }): Promise<{ psbt: string }> {
    return this.client.walletProcessPsbt({ psbt })
  }

  async finalizePsbt({
    psbt,
  }: {
    psbt: string
  }): Promise<{ psbt: string; hex: string; complete: boolean }> {
    return this.client.finalizePsbt({ psbt })
  }

  async sendRawTransaction({ hexstring }: { hexstring: string }): Promise<string> {
    return this.client.sendRawTransaction({ hexstring })
  }
}

// The default client should remain without a wallet (not generate or receive bitcoin)
export const bitcoindDefaultClient = new BitcoindClient()

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
