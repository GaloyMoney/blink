import Client from "bitcoin-core"
import _ from "lodash"

import { btc2sat } from "@core/utils"

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
  desc?: string
  isscript: boolean
  ischange: boolean
  iswitness: boolean
  witness_version?: number
  witness_program?: string
  script?: string
  hex?: string
  pubkeys?: [string]
  sigsrequired?: number
  pubkey?: string
  embedded?: Record<string, unknown>
  iscompressed?: boolean
  timestamp?: number
  hdkeypath?: string
  hdseedid?: string
  hdmasterfingerprint?: string
  labels: [string]
}

type ScriptSig = {
  asm: string
  hex: string
}

type ScriptPubKey = {
  asm: string
  hex: string
  reqSigs: number
  type: string
  addresses: [string]
}

export type VIn = {
  txid: string
  vout: number
  scriptSig: ScriptSig
  txinwitness: [string]
  sequence: number
}

export type VOut = {
  value: number
  n: number
  scriptPubKey: ScriptPubKey
}

type DecodeRawTransactionResult = {
  txid: string
  hash: string
  size: number
  vsize: number
  weight: number
  version: number
  locktime: number
  vin: [VIn]
  vout: [VOut]
}

export enum TransactionCategory {
  SEND = "send",
  RECEIVE = "receive",
  GENERATE = "generate",
  IMMATURE = "immature",
  ORPHAN = "orphan",
}

type ListTransactionsResult = {
  "involvesWatchonly": boolean
  "address": string
  "category": TransactionCategory
  "amount": number
  "label": string
  "vout": number
  "fee": number
  "confirmations": number
  "generated": boolean
  "trusted": boolean
  "blockhash": string
  "blockheight": number
  "blockindex": number
  "blocktime": number
  "txid": string
  "walletconflicts": [string]
  "time": number
  "timereceived": number
  "comment": string
  "bip125-replaceable": string
  "abandoned": boolean
}

type InWalletTransactionDetails = {
  involvesWatchonly: boolean
  address: string
  category: TransactionCategory
  amount: number
  label: string
  vout: number
  fee: number
  abandoned: boolean
}

export type InWalletTransaction = {
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
  "walletconflicts": [string]
  "time": number
  "timereceived": number
  "comment": string
  "bip125-replaceable": string
  "details": [InWalletTransactionDetails]
  "hex": string
  "decoded": DecodeRawTransactionResult
}

type EstimateSmartFeeResult = {
  feerate: number // made required because error is now thrown, not returned
  errors?: [string]
  blocks: number
}

export class BitcoindClient {
  readonly client

  constructor() {
    this.client = new Client({ ...connection_obj })
  }

  async getBlockCount(): Promise<number> {
    return await this.client.getBlockCount()
  }

  async getBlockchainInfo(): Promise<{ chain: string }> {
    return await this.client.getBlockchainInfo()
  }

  async createWallet({
    wallet_name,
  }: {
    wallet_name: string
  }): Promise<{ name: string; warning: string }> {
    return await this.client.createWallet({ wallet_name })
  }

  async listWallets(): Promise<[string]> {
    return await this.client.listWallets()
  }

  async decodeRawTransaction({
    hexstring,
  }: {
    hexstring: string
  }): Promise<DecodeRawTransactionResult> {
    return await this.client.decodeRawTransaction({ hexstring })
  }

  // load/unload only used in tests, for now

  async loadWallet({
    filename,
  }: {
    filename: string
  }): Promise<{ name: string; warning: string }> {
    return await this.client.loadWallet({ filename })
  }

  async unloadWallet({
    wallet_name,
  }: {
    wallet_name: string
  }): Promise<{ warning: string }> {
    return await this.client.unloadWallet({ wallet_name })
  }

  // for tests
  async getZmqNotifications(): Promise<[Record<string, unknown>]> {
    return await this.client.getZmqNotifications()
  }

  // utils

  async estimateSmartFee({
    conf_target,
    estimate_mode = "CONSERVATIVE",
  }: {
    conf_target: number
    estimate_mode?: string
  }): Promise<EstimateSmartFeeResult> {
    const result: EstimateSmartFeeResult = await this.client.estimateSmartFee({
      conf_target,
      estimate_mode,
    })
    if (result.errors && result.errors.length) {
      throw Error(JSON.stringify(result.errors))
    }
    return result
  }
}

export class BitcoindWalletClient {
  readonly client

  constructor({ walletName }: { walletName: string }) {
    this.client = new Client({ ...connection_obj, wallet: walletName })
  }

  async getNewAddress({ address_type }: { address_type?: string }): Promise<string> {
    if (typeof address_type !== "undefined") {
      return await this.client.getNewAddress({ address_type })
    }
    return await this.client.getNewAddress()
  }

  async getAddressInfo({ address }: { address: string }): Promise<GetAddressInfoResult> {
    return await this.client.getAddressInfo({ address })
  }

  async sendToAddress({
    address,
    amount,
    fee_rate,
  }: {
    address: string
    amount: number
    fee_rate?: number // sat/vB
  }): Promise<string> {
    if (typeof fee_rate !== "undefined") {
      return await this.client.sendToAddress({ address, amount, fee_rate })
    }
    return await this.client.sendToAddress({ address, amount })
  }

  async generateToAddress({
    nblocks,
    address,
  }: {
    nblocks: number
    address: string
  }): Promise<[string]> {
    return await this.client.generateToAddress({ nblocks, address })
  }

  async getTransaction({
    txid,
    include_watchonly = true,
    verbose = false,
  }: {
    txid: string
    include_watchonly?: boolean
    verbose?: boolean
  }): Promise<InWalletTransaction> {
    return await this.client.getTransaction({ txid, include_watchonly, verbose })
  }

  async listTransactions({
    count,
  }: {
    count: number
  }): Promise<[ListTransactionsResult]> {
    return await this.client.listTransactions({ count })
  }

  async getBalance(): Promise<number> {
    return await this.client.getBalance()
  }

  async walletCreateFundedPsbt({
    inputs,
    outputs,
  }: {
    inputs: []
    outputs: Record<string, number>[]
  }): Promise<{ psbt: string }> {
    return await this.client.walletCreateFundedPsbt({ inputs, outputs })
  }

  async walletProcessPsbt({ psbt }: { psbt: string }): Promise<{ psbt: string }> {
    return await this.client.walletProcessPsbt({ psbt })
  }

  async finalizePsbt({
    psbt,
  }: {
    psbt: string
  }): Promise<{ psbt: string; hex: string; complete: boolean }> {
    return await this.client.finalizePsbt({ psbt })
  }

  async sendRawTransaction({ hexstring }: { hexstring: string }): Promise<string> {
    return await this.client.sendRawTransaction({ hexstring })
  }
}

export const getBalancesDetail = async ({
  bitcoindClient,
}: {
  bitcoindClient: BitcoindClient
}): Promise<{ wallet: string; balance: number }[]> => {
  const wallets = await bitcoindClient.listWallets()

  const balances: { wallet: string; balance: number }[] = []

  for await (const wallet of wallets) {
    // do not consider the "outside" wallet in tests
    if (wallet === "" || wallet === "outside") {
      continue
    }

    const bitcoindWalletClient = new BitcoindWalletClient({ walletName: wallet })
    const balance = btc2sat(await bitcoindWalletClient.getBalance())
    balances.push({ wallet, balance })
  }

  return balances
}

export const getBalance = async ({
  bitcoindClient,
}: {
  bitcoindClient: BitcoindClient
}): Promise<number> => {
  const balanceObj = await getBalancesDetail({ bitcoindClient })
  return _.sumBy(balanceObj, "balance")
}
