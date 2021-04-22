import _ from "lodash";
import { bitcoindAccountingPath, lndAccountingPath, lndFeePath } from "./ledger/ledger";
import { lnd } from "./lndConfig";
import { MainBook } from "./mongodb";
import { getOnChainTransactions } from "./OnChain";
import { BitcoindClient, bitcoindDefaultClient, btc2sat, sat2btc } from "./utils";
import { UserWallet } from "./userWallet";
import { lndBalances } from "./lndUtils"
import { yamlConfig } from "./config"

import lnService from 'ln-service'


// TODO: we should not rely on OnChainMixin/UserWallet for this "wallet"

export class SpecterWallet {
  bitcoindClient 
  logger

  constructor({ logger }) {
    this.logger = logger.child({ topic: "bitcoind" })
  }

  // below static method are {wallet} agnostics from bitcoin-core api perspective

  static async listWallets() {
    return bitcoindDefaultClient.listWallets()
  }

  static async createWallet() {
    return bitcoindDefaultClient.createWallet({wallet_name: "specter/coldstorage"})
  }

  async setBitcoindClient(): Promise<string> {
    const wallets = await SpecterWallet.listWallets()

    const pattern = "specter"
    const specterWallets = _.filter(wallets, item => item.startsWith(pattern))

    // there should be only one specter wallet
    // TODO/FIXME this is a weak security assumption
    // someone getting access to specter could create another 
    // hotkey-based specter wallet to bypass this check

    if (specterWallets.length === 0) {
      this.logger.info("specter wallet has not been instantiated")
      
      // currently use for testing purpose. need to refactor
      return ""
    }

    if (specterWallets.length > 1) {
      throw Error("only one specter wallet in bitcoind is currently supported")
    }

    this.logger.info({wallet: specterWallets[0]}, "setting BitcoindClient")

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

  async getBitcoindBalance(): Promise<number> {
    if (!this.bitcoindClient) {
      const wallet = await this.setBitcoindClient()
      if (wallet === "") {
        return 0
      }
    }

    return btc2sat(await this.bitcoindClient.getBalance())
  }

  async tentativelyRebalance(): Promise<void> {
    if (!this.bitcoindClient) {
      const wallet = await this.setBitcoindClient()
      if (wallet === "") {
        return 
      }
    }

    const { total, onChain } = await lndBalances()
    const { action, sats } = SpecterWallet.isRebalanceNeeded({ lndBalance: total })

    const logger = this.logger.child({sats, action, total, onChain})

    if (action === undefined) {
      logger.info("no rebalancing needed")
      return
    }

    if (!sats) {
      logger.info("sats is null")
      return
    }

    const minOnchainRatio = yamlConfig.rebalancing.minOnchainRatio
    if (onChain * minOnchainRatio < sats) {
      logger.warn({onChain, sats, minOnchainRatio}, "rebalancing is needed, but not enough money is onchain. loop might be needed")
      return
    }

    if (action === "deposit") {
      await this.toColdStorage({ sats })
      logger.info("rebalancing succesfull")
    } else if (action === "withdraw") {
      logger.error("rebalancing is needed, but need manual intervention")
      // this.toLndWallet({ sats })
    } 
  }

  static isRebalanceNeeded({ lndBalance }) {
    // base number to calculate the different thresholds below
    const lndHoldingBase = yamlConfig.rebalancing.lndHoldingBase

    const ratioTargetDeposit = yamlConfig.rebalancing.ratioTargetDeposit
    const ratioTargetWithdraw = yamlConfig.rebalancing.ratioTargetWithdraw

    // threshold for when we need to move money from cold storage to the lnd wallet
    const thresholdLowBound = lndHoldingBase * 70 / 100

    // threshold for when we need to move money out of lnd to multisig storage
    const thresholdHighBound = lndHoldingBase * 130 / 100

    // what is the target amount to be in lnd wallet holding
    // when there is too much money in lnd and we need to deposit in cold storage 
    const targetDeposit = lndHoldingBase * ratioTargetDeposit
    
    // what is the target amount to be in lnd wallet holding 
    //when there is a not enough money in lnd and we need to withdraw from cold storage
    const targetWithdraw = lndHoldingBase * ratioTargetWithdraw

    if (lndBalance > thresholdHighBound) {
      return { action: "deposit", sats: lndBalance - targetDeposit }
    }

    if (lndBalance < thresholdLowBound) {
      return { action: "withdraw", sats: targetWithdraw - lndBalance}
    }

    return { action: undefined }
  }

  async toColdStorage({ sats }) {
    if (!this.bitcoindClient) {
      const wallet = await this.setBitcoindClient()
      if (wallet === "") {
        this.logger.warn("no wallet has been setup")
        return 
      }
    }

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

    const metadata = { 
      type: "to_cold_storage", 
      currency: "BTC", 
      pending: false,
      hash: id,
      fee,
      ...UserWallet.getCurrencyEquivalent({sats, fee})
    }

    await MainBook.entry(memo)
      .credit(lndAccountingPath, sats + fee, {...metadata })
      .debit(lndFeePath, fee, {...metadata })
      .debit(bitcoindAccountingPath, sats, {...metadata })
      .commit()

    this.logger.info({...metadata, sats, memo, address, fee}, "deposit rebalancing successful")
  }

  async toLndWallet ({ sats }) {
    if (!this.bitcoindClient) {
      const wallet = await this.setBitcoindClient()
      if (wallet === "") {
        return 
      }
    }

    // TODO: move to an event based as the transaction
    // would get done in specter

    // TODO: initiate transaction from here when this ticket is done
    // https://github.com/cryptoadvance/specter-desktop/issues/895

    // ...this.getCurrencyEquivalent({sats, fee: 0}),
    const metadata = { type: "to_hot_wallet", currency: "BTC", pending: false }
    let subLogger = this.logger.child({...metadata, sats })

    const memo = `withdrawal of ${sats} sats from specter wallet to lnd`

    // TODO: unlike other address, this one will not be attached to a user account
    // check if it's possible to add a label to this address in lnd.
    const { address } = await lnService.createChainAddress({
      lnd,
      format: 'p2wpkh',
    })

    let txid

    subLogger = subLogger.child({memo, address})

    try {
      // TODO: won't work automatically with a cold storage wallet
      // make a PSBT instead accesible for further signing.
      // TODO: figure out a way to export the PSBT when there is a pending tx
      txid = await this.bitcoindClient.sendToAddress(address, sat2btc(sats))
    } catch(err) {
      const error = "this.bitcoindClient.sendToAddress() error"
      subLogger.error({txid}, error)
      throw new Error(err)
    }

    const tx = await this.bitcoindClient.getTransaction(txid, true /* include_watchonly */ )
    const fee = btc2sat(- tx.fee) /* fee is negative */

    await MainBook.entry(memo)
      .debit(lndAccountingPath, sats, {...metadata })
      .debit(lndFeePath, fee, {...metadata })
      .credit(bitcoindAccountingPath, sats + fee, {...metadata })
      .commit()

    subLogger.info({txid, tx}, `rebalancing withdrawal was succesful`)

  }
}
