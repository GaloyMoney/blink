import assert from "assert"

import { createChainAddress, sendToChainAddress } from "lightning"

import { bitcoindDefaultClient, BitcoindWalletClient } from "@services/bitcoind"
import { getActiveOnchainLnd, lndsBalances } from "@services/lnd/utils"
import { ledger } from "@services/mongodb"

import { BTC_NETWORK, ONCHAIN_SCAN_DEPTH_OUTGOING } from "@config/app"
import { btc2sat, sat2btc, toSats } from "@domain/bitcoin"
import { RebalanceChecker } from "@domain/cold-storage"
import { OnChainService } from "@services/lnd/onchain-service"
import { TxDecoder } from "@domain/bitcoin/onchain"

import { UserWallet } from "./user-wallet"

// TODO no longer used in tests, removing the creation of the default wallet didn't break anything
const staticClient = ""

export class SpecterWallet {
  bitcoindClient // TODO rename?
  readonly logger: Logger
  readonly config: SpecterWalletConfig

  constructor({ logger, config }: SpecterWalletConstructorArgs) {
    this.logger = logger.child({ topic: "bitcoind" })
    this.config = config

    assert(this.config.onchainWallet !== "")
  }

  async listWallets() {
    return bitcoindDefaultClient.listWallets()
  }

  async createWallet() {
    return bitcoindDefaultClient.createWallet({ wallet_name: "specter/coldstorage" })
  }

  async setBitcoindClient(): Promise<string> {
    const wallets = await this.listWallets()

    const pattern = this.config.onchainWallet
    const specterWallets = wallets.filter((item) => item.includes(pattern))

    // there should be only one specter wallet
    // TODO/FIXME this is a weak security assumption
    // someone getting access to specter could create another
    // hotkey-based specter wallet to bypass this check

    if (specterWallets.length === 0) {
      this.logger.info("specter wallet has not been instantiated")

      // currently use for testing purpose. need to refactor
      return staticClient
    }

    if (specterWallets.length > 1) {
      throw Error("currently one wallet can be selected for cold storage rebalancing")
    }

    this.logger.info({ wallet: specterWallets[0] }, "setting BitcoindClient")

    this.bitcoindClient = new BitcoindWalletClient({ walletName: specterWallets[0] })

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

  async getAddressInfo({ address }) {
    return this.bitcoindClient.getAddressInfo({ address })
  }

  async getBitcoindBalance(): Promise<number> {
    if (!this.bitcoindClient) {
      const wallet = await this.setBitcoindClient()
      if (wallet === staticClient) {
        return 0
      }
    }

    return btc2sat(await this.bitcoindClient.getBalance())
  }

  async tentativelyRebalance(): Promise<void> {
    this.logger.info("entering tentatively rebalance")

    if (!this.bitcoindClient) {
      const wallet = await this.setBitcoindClient()
      if (wallet === staticClient) {
        return
      }
    }

    const { offChain, onChain, total } = await lndsBalances()
    const logger = this.logger.child({ offChain, onChain, total })

    const withdrawFromHotWalletAmount = RebalanceChecker(
      this.config,
    ).getWithdrawFromHotWalletAmount({
      onChainHotWalletBalance: toSats(onChain),
      offChainHotWalletBalance: toSats(offChain),
    })

    if (withdrawFromHotWalletAmount > 0) {
      logger.info(`attempting to rebalance ${withdrawFromHotWalletAmount} satoshis`)
      await this.toColdStorage({ sats: withdrawFromHotWalletAmount })
    }
  }

  async toColdStorage({ sats }) {
    if (!this.bitcoindClient) {
      const wallet = await this.setBitcoindClient()
      if (wallet === staticClient) {
        this.logger.warn("no wallet has been setup")
        return
      }
    }

    const { lnd } = getActiveOnchainLnd()

    const address = await this.getColdStorageAddress()

    let id

    try {
      ;({ id } = await sendToChainAddress({
        address,
        lnd,
        tokens: sats,
        target_confirmations: 1000,
      }))
    } catch (err) {
      this.logger.fatal({ err }, "could not send to deposit. accounting to be reverted")
    }

    const memo = `deposit of ${sats} sats to the cold storage wallet`

    const getOnChainFee = async (txHash: OnChainTxHash): Promise<Satoshis> => {
      const onChainService = OnChainService(TxDecoder(BTC_NETWORK))
      if (onChainService instanceof Error) return toSats(0)

      const onChainTxFee = await onChainService.lookupOnChainFee({
        txHash,
        scanDepth: ONCHAIN_SCAN_DEPTH_OUTGOING,
      })
      if (onChainTxFee instanceof Error) return toSats(0)

      return onChainTxFee
    }

    const fee = await getOnChainFee(id)

    const metadata = {
      hash: id,
      ...UserWallet.getCurrencyEquivalent({ sats, fee }),
    }

    await ledger.addColdStoragePayment({
      description: memo,
      amount: sats,
      fee,
      metadata,
    })

    this.logger.info(
      { ...metadata, sats, memo, address, fee },
      "deposit rebalancing successful",
    )
  }

  async toLndWallet({ sats }) {
    if (!this.bitcoindClient) {
      const wallet = await this.setBitcoindClient()
      if (wallet === staticClient) {
        return
      }
    }

    const { lnd } = getActiveOnchainLnd()

    // TODO: move to an event based as the transaction
    // would get done in specter

    // TODO: initiate transaction from here when this ticket is done
    // https://github.com/cryptoadvance/specter-desktop/issues/895

    // ...this.getCurrencyEquivalent({sats, fee: 0}),
    let subLogger = this.logger.child({ sats })

    const memo = `withdrawal of ${sats} sats from specter wallet to lnd`

    // TODO: unlike other address, this one will not be attached to a user account
    // check if it's possible to add a label to this address in lnd.
    const { address } = await createChainAddress({
      lnd,
      format: "p2wpkh",
    })

    let txid

    subLogger = subLogger.child({ memo, address })

    try {
      // TODO: won't work automatically with a cold storage wallet
      // make a PSBT instead accesible for further signing.
      // TODO: figure out a way to export the PSBT when there is a pending tx
      txid = await this.bitcoindClient.sendToAddress({ address, amount: sat2btc(sats) })
    } catch (err) {
      const error = "this.bitcoindClient.sendToAddress() error"
      subLogger.error({ txid }, error)
      throw new Error(err)
    }

    const tx = await this.bitcoindClient.getTransaction({
      txid,
      include_watchonly: true,
    })
    const fee = btc2sat(-tx.fee) /* fee is negative */

    await ledger.addHotWalletPayment({
      description: memo,
      amount: sats,
      fee,
      hash: txid,
    })

    subLogger.info({ txid, tx }, `rebalancing withdrawal was succesful`)
  }
}
