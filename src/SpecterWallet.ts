import { filter } from "lodash";
import { bitcoindAccountingPath, lightningAccountingPath, lndFee } from "./ledger";
import { lnd } from "./lndConfig";
import { MainBook } from "./mongodb";
import { getOnChainTransactions } from "./OnChain";
import { BitcoindClient, bitcoindDefaultClient, btc2sat, sat2btc } from "./utils";

const lnService = require('ln-service');


// TODO: we should not rely on OnChainMixin/UserWallet for this "wallet"

export class SpecterWallet {
  bitcoindClient 
  logger

  constructor({ logger }) {
    this.logger = logger.child({ topic: "bitcoind" })
  }

  // static method are wallet agnostics

  static async listWallets() {
    return bitcoindDefaultClient.listWallets()
  }

  static async createWallet() {
    return bitcoindDefaultClient.createWallet({wallet_name: "specter/coldstorage"})
  }

  async setBitcoindClient(): Promise<string> {
    const wallets = await SpecterWallet.listWallets()

    const pattern = "specter"
    const specterWallets = filter(wallets, item => item.startsWith(pattern))

    // there should be only one specter wallet
    // TODO/FIXME this is a weak security assumption
    // someone getting access to specter could create another 
    // hotkey-based specter wallet to bypass this check

    if (specterWallets.length !== 1) {
      throw Error("only one specter wallet in bitcoind is currently supported")
    }

    this.bitcoindClient = BitcoindClient({wallet: specterWallets[0]})

    return specterWallets[0]
  }

  async getColdStorageAddress() {
    return this.bitcoindClient.getNewAddress()
  }

  // for debugging
  // to create the wallet from bitcoin-cli:
  // bitcoin-cli --named createwallet wallet_name="coldstorage" disable_private_keys="true"
  // 
  // more info on: 
  // https://github.com/BlockchainCommons/Learning-Bitcoin-from-the-Command-Line/blob/master/07_3_Integrating_with_Hardware_Wallets.md

  // to import a descriptor:
  // https://github.com/BlockchainCommons/Learning-Bitcoin-from-the-Command-Line/blob/master/03_5_Understanding_the_Descriptor.md
  // bitcoin-cli importmulti `${descriptor}`


  async getAddressInfo({address}) {
    return this.bitcoindClient.getAddressInfo({address})
  }

  async getBitcoindBalance() {
    return btc2sat(await this.bitcoindClient.getBalance())
  }

  static isRebalanceNeeded({ }) {
    // TODO
  }

  async toColdStorage({ sats }) {
    const address = await this.getColdStorageAddress()
    
    let id

    try {
      ({ id } = await lnService.sendToChainAddress({ address, lnd, tokens: sats }))
    } catch (err) {
      this.logger.fatal({err}, "could not send to deposit. accounting to be reverted")
    }
    
    const memo = `deposit of ${sats} sats to the cold storage wallet`

    const outgoingOnchainTxns = await getOnChainTransactions({ lnd, incoming: false })
    const [{ fee }] = outgoingOnchainTxns.filter(tx => tx.id === id)

    // add ...UserWallet.getCurrencyEquivalent({sats, fee}), 
    const metadata = { 
      type: "to_cold_storage", 
      currency: "BTC", 
      pending: false,
      hash: id,
      fee
    }

    await MainBook.entry(memo)
      .debit(lightningAccountingPath, sats + fee, {...metadata })
      .credit(lndFee, fee, {...metadata })
      .credit(bitcoindAccountingPath, sats, {...metadata })
      .commit()

    this.logger.info({...metadata, sats, memo, address, fee}, "deposit rebalancing successful")
  }

  async toLndWallet ({ sats }) {
    // ...this.getCurrencyEquivalent({sats, fee: 0}),
    const metadata = { type: "to_hot_wallet", currency: "BTC", pending: false }
    let subLogger = this.logger.child({...metadata, sats })

    const memo = `withdrawal of ${sats} sats from specter wallet to lnd`

    // TODO: unlike other address, this one will not be attached to an account
    // check if it's possible to add a label to this address in lnd.
    const { address } = await lnService.createChainAddress({
      lnd,
      format: 'p2wpkh',
    })

    let withdrawalResult

    subLogger = subLogger.child({memo, address})

    try {
      // TODO: won't work automatically with a cold storage wallet
      // make a PSBT instead accesible for further signing.
      // TODO: figure out a way to export the PSBT when there is a pending tx
      withdrawalResult = await this.bitcoindClient.sendToAddress(address, sat2btc(sats))
    } catch(err) {
      const error = "this.bitcoindClient.sendToAddress() error"
      subLogger.error({withdrawalResult}, error)
      throw new Error(err)
    }

    // TODO
    const success = true

    if (success) {

      await MainBook.entry()
      .debit(lightningAccountingPath, sats, {...metadata, memo })
      .credit(bitcoindAccountingPath, sats, {...metadata, memo })
      .commit()

      subLogger.info({withdrawalResult}, `rebalancing withdrawal was succesful`)

    } else {
      subLogger.error({withdrawalResult}, `rebalancing withdrawal was not succesful`)
    }

  } 
}