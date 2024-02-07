import {
  authenticatedBitcoind,
  createWallet,
  generateToAddress,
  getAddressInfo,
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

export const getBitcoinCoreRPCConfig = () => ({
  network: process.env.NETWORK,
  username: process.env.BITCOINDRPCUSER || "rpcuser",
  password: process.env.BITCOINDRPCPASS || "rpcpassword",
  timeout: parseInt(process.env.BITCOINDTIMEOUT || "20000", 10),
  version: "24.0.0",
  host: process.env.BITCOINDADDR,
  port: parseInt(process.env.BITCOINDPORT || "8332", 10),
})

export const getBitcoinCoreSignerRPCConfig = () => {
  return {
    ...getBitcoinCoreRPCConfig(),
    host: process.env.BITCOIND_SIGNER_ADDR,
    port: parseInt(process.env.BITCOIND_SIGNER_PORT || "8332", 10),
  }
}

export class BitcoindClient {
  readonly bitcoind

  /* eslint @typescript-eslint/ban-ts-comment: "off" */
  // @ts-ignore-next-line no-implicit-any error
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
