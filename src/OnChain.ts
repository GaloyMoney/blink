const lnService = require('ln-service');
import { assert } from "console";
import { intersection, last } from "lodash";
import moment from "moment";
import { customerPath, lightningAccountingPath } from "./ledger";
import { disposer } from "./lock";
import { MainBook, Transaction, User } from "./mongodb";
import { Price } from "./priceImpl";
import { ILightningTransaction, IOnChainPayment, ISuccess } from "./types";
import { amountOnVout, bitcoindClient, btc2sat, getAuth, getCurrencyEquivalent, LoggedError, satsToUsdCached } from "./utils";

const util = require('util')

const using = require('bluebird').using

// TODO: look if tokens/amount has an effect on the fees
// we don't want to go back and forth between RN and the backend if amount changes
// but fees are the same
const someAmount = 50000

export const OnChainMixin = (superclass) => class extends superclass {
  lnd = lnService.authenticatedLndGrpc(getAuth()).lnd

  constructor(...args) {
    super(...args)
  }

  async updatePending(): Promise<void | Error> {
    await this.updateOnchainReceipt()
    await super.updatePending()
  }

  async PayeeUser(address: string) { return User.findOne({ onchain_addresses: { $in: address } }) }

  async getOnchainFee({address}: {address: string}): Promise<number | Error> {
    const payeeUser = await this.PayeeUser(address)

    let fee

    if (payeeUser) {
      fee = 0
    } else {
      const sendTo = [{ address, tokens: someAmount }];
      ({ fee } = await lnService.getChainFeeEstimate({ lnd: this.lnd, send_to: sendTo }))
    }

    return fee
  }

  // amount in sats
  async onChainPay({ address, amount, memo }: IOnChainPayment): Promise<ISuccess | Error> {
    let onchainLogger = this.logger.child({ topic: "payment", protocol: "onchain", transactionType: "payment", address, amount, memo })

    const balance = await this.getBalance()
    
    onchainLogger = onchainLogger.child({ balance })

    // quit early if balance is not enough
    if (balance < amount) {
      const error = `balance is too low`
      onchainLogger.warn({ success: false, error }, error)
      throw new LoggedError(error)
    }

    const payeeUser = await this.PayeeUser(address)

    if (payeeUser) {
      const onchainLoggerOnUs = onchainLogger.child({onUs: true})

      // FIXME: Using == here because === returns false even for same uids
      if (payeeUser._id == this.uid) {
        const error = 'User tried to pay himself'
        this.logger.warn({ payeeUser, error, success: false }, error)
        throw new LoggedError(error)
      }

      const sats = amount

      const addedMetadata = await getCurrencyEquivalent({ sats, fee: 0 })
      const metadata = { currency: this.currency, type: "onchain_on_us", pending: false, ...addedMetadata}

      return await using(disposer(this.uid), async (lock) => {

        await MainBook.entry()
          .debit(customerPath(payeeUser._id), sats, metadata)
          .credit(this.accountPath, sats, {...metadata, memo})
          .commit()
        
        onchainLoggerOnUs.info({ success: true, ...metadata }, "onchain payment succeed")

        return true
      })
    }

    onchainLogger = onchainLogger.child({onUs: false})

    const { chain_balance: onChainBalance } = await lnService.getChainBalance({ lnd: this.lnd })

    let estimatedFee, id

    const sendTo = [{ address, tokens: amount }]

    try {
      ({ fee: estimatedFee } = await lnService.getChainFeeEstimate({ lnd: this.lnd, send_to: sendTo }))
    } catch (err) {
      const error = `Unable to estimate fee for on-chain transaction`
      onchainLogger.error({ err, sendTo, success: false }, error)
      throw new LoggedError(error)
    }

    // case where there is not enough money available within lnd on-chain wallet
    if (onChainBalance < amount + estimatedFee) {
      const error = `insufficient onchain balance on the lnd node. rebalancing is needed`
      onchainLogger.fatal({onChainBalance, amount, estimatedFee, sendTo, success: false }, error)
      throw new LoggedError(error)
    }

    return await using(disposer(this.uid), async (lock) => {
      
      // case where the user doesn't have enough money
      if (balance < amount + estimatedFee) {
        const error = `balance is too low. have: ${balance} sats, need ${amount + estimatedFee}`
        onchainLogger.warn({balance, amount, estimatedFee, sendTo, success: false }, error)
        throw new LoggedError(error)
      }

      try {
        ({ id } = await lnService.sendToChainAddress({ address, lnd: this.lnd, tokens: amount }))
      } catch (err) {
        onchainLogger.error({ err, address, tokens: amount, success: false }, "Impossible to sendToChainAddress")
        return false
      }

      const outgoingOnchainTxns = await this.getOnChainTransactions({ lnd: this.lnd, incoming: false })

      const [{ fee }] = outgoingOnchainTxns.filter(tx => tx.id === id)

      {
        const sats = amount + fee
        
        const addedMetadata = await getCurrencyEquivalent({ sats, fee })
        const metadata = { currency: this.currency, hash: id, type: "onchain_payment", pending: true, ...addedMetadata }

        // TODO/FIXME refactor. add the transaction first and set the fees in a second tx.
        await MainBook.entry(memo)
          .debit(lightningAccountingPath, sats, metadata)
          .credit(this.accountPath, sats, metadata)
          .commit()

        onchainLogger.info({success: true , ...metadata}, 'successfull onchain payment')
      }

      return true

    })

  }

  async getLastOnChainAddress(): Promise<String | Error | undefined> {
    let user = await User.findOne({ _id: this.uid })

    if (!user) { // this should not happen. is test that relevant?
      const error = "no user is associated with this address"
      this.logger.error({user}, error)
      throw new LoggedError(`no user with this uid`)
    }

    if (user.onchain_addresses.length === 0) {
      // TODO create one address when a user is created instead?
      // FIXME this shold not be done in a query but only in a mutation?
      await this.getOnChainAddress()
      user = await User.findOne({ _id: this.uid })
    }

    return last(user.onchain_addresses)
  }

  async getOnChainAddress(): Promise<String | Error> {
    // another option to investigate is to have a master key / client
    // (maybe this could be saved in JWT)
    // and a way for them to derive new key
    // 
    // this would avoid a communication to the server 
    // every time you want to show a QR code.

    let address

    try {
      const format = 'p2wpkh';
      const response = await lnService.createChainAddress({
        lnd: this.lnd,
        format,
      })
      address = response.address
    } catch (err) {
      const error = `error getting on chain address`
      this.logger.error({err}, error)
      throw new LoggedError(error)
    }

    try {
      const user = await User.findOne({ _id: this.uid })
      if (!user) { // this should not happen. is test that relevant?
        const error = "no user is associated with this address"
        this.logger.error({user}, error)
        throw new LoggedError(error)
      }

      user.onchain_addresses.push(address)
      await user.save()

    } catch (err) {
      const error = `error storing new onchain address to db`
      this.logger.error({err}, error)
      throw new LoggedError(error)
    }

    return address
  }

  async getOnChainTransactions({ lnd, incoming }: { lnd: any, incoming: boolean }) {
    try {
      const onchainTransactions = await lnService.getChainTransactions({ lnd })
      return onchainTransactions.transactions.filter(tx => incoming === !tx.is_outgoing)
    } catch (err) {
      const error = `issue fetching transaction`
      this.logger.error({err, incoming}, error)
      throw new LoggedError(error)
    }
  }

  async getIncomingOnchainPayments({confirmed}: {confirmed: boolean}) {

    const lnd_incoming_txs = await this.getOnChainTransactions({ lnd: this.lnd, incoming: true })
    
    //        { block_id: '0000000000000b1fa86d936adb8dea741a9ecd5f6a58fc075a1894795007bdbc',
    //          confirmation_count: 712,
    //          confirmation_height: 1744148,
    //          created_at: '2020-05-14T01:47:22.000Z',
    //          fee: undefined,
    //          id: '5e3d3f679bbe703131b028056e37aee35a193f28c38d337a4aeb6600e5767feb',
    //          is_confirmed: true,
    //          is_outgoing: false,
    //          output_addresses: [Array],
    //          tokens: 10775,
    //          transaction: '020000000001.....' } ] }

    const lnd_incoming_filtered = lnd_incoming_txs.filter(tx => tx.is_confirmed === confirmed)

    const { onchain_addresses } = await User.findOne({ _id: this.uid }, { onchain_addresses: 1 })

    const user_matched_txs = lnd_incoming_filtered.filter(tx => intersection(tx.output_addresses, onchain_addresses).length > 0)

    return user_matched_txs
  }

  async getTransactions(): Promise<Array<ILightningTransaction>> {
    const confirmed = await super.getTransactions()

    //  ({
    //   created_at: moment(item.timestamp).unix(),
    //   amount: item.debit - item.credit,
    //   sat: item.sat,
    //   usd: item.usd,
    //   description: item.memoPayer || item.memo || item.type, // TODO remove `|| item.type` once users have upgraded
    //   type: item.type,
    //   hash: item.hash,
    //   fee: item.fee,
    //   feeUsd: item.feeUsd,
    //   // destination: TODO
    //   pending: item.pending,
    //   id: item._id,
    //   currency: item.currency
    //  })


    // TODO: only get onchain transaction as of the last 14 days to make the query faster, for now.
    // (transactions are ejected from mempool after 14 days by default)

    // TODO: should have outgoing unconfirmed transaction as well.
    // they are in medici, but not necessarily confirmed
    const unconfirmed = await this.getIncomingOnchainPayments({confirmed: false})

    
    // {
    //   block_id: undefined,
    //   confirmation_count: undefined,
    //   confirmation_height: undefined,
    //   created_at: '2020-10-06T17:18:26.000Z',
    //   description: undefined,
    //   fee: undefined,
    //   id: '709dcc443014d14bf906b551d60cdb814d6f98f1caa3d40dcc49688175b2146a',
    //   is_confirmed: false,
    //   is_outgoing: false,
    //   output_addresses: [Array],
    //   tokens: 100000000,
    //   transaction: '020000000001019b5e33c844cc72b093683cec8f743f1ddbcf075077e5851cc8a598a844e684850100000000feffffff022054380c0100000016001499294eb1f4936f15472a891ba400dc09bfd0aa7b00e1f505000000001600146107c29ed16bf7712347ddb731af713e68f1a50702473044022016c03d070341b8954fe8f956ed1273bb3852d3b4ba0d798e090bb5fddde9321a022028dad050cac2e06fb20fad5b5bb6f1d2786306d90a1d8d82bf91e03a85e46fa70121024e3c0b200723dda6862327135ab70941a94d4f353c51f83921fcf4b5935eb80495000000'
    // }


    // TODO: refactor Price
    const price = await new Price({logger: this.logger}).lastPrice()

    return [
      ...unconfirmed.map(({ tokens, id, created_at }) => ({
        id, 
        amount: tokens,
        pending: true,
        created_at: moment(created_at).unix(),
        sat: tokens,
        usd: satsToUsdCached(tokens, price),
        description: "pending",
        type: "onchain_receipt",
        hash: id,
        currency: "BTC",
        fee: 0,
        feeUsd: 0,
      })),
      ...confirmed
    ]
  }

  async updateOnchainReceipt() {
    const user_matched_txs = await this.getIncomingOnchainPayments({confirmed: true})

    const type = "onchain_receipt"

    return await using(disposer(this.uid), async (lock) => {

      // FIXME O(n) ^ 2. bad.
      for (const matched_tx of user_matched_txs) {

        // has the transaction has not been added yet to the user account?
        const mongotx = await Transaction.findOne({ account_path: this.accountPathMedici, type, hash: matched_tx.id })

        // this.logger.debug({ matched_tx, mongotx }, "updateOnchainReceipt with user %o", this.uid)

        if (!mongotx) {

          const {vout} = await bitcoindClient.decodeRawTransaction(matched_tx.transaction)

          //   vout: [
          //   {
          //     value: 1,
          //     n: 0,
          //     scriptPubKey: {
          //       asm: '0 13584315784642a24d62c7dd1073f24c60604a10',
          //       hex: '001413584315784642a24d62c7dd1073f24c60604a10',
          //       reqSigs: 1,
          //       type: 'witness_v0_keyhash',
          //       addresses: [ 'bcrt1qzdvyx9tcgep2yntzclw3quljf3sxqjsszrwx2x' ]
          //     }
          //   },
          //   {
          //     value: 46.9999108,
          //     n: 1,
          //     scriptPubKey: {
          //       asm: '0 44c6e3f09c2462f9825e441a69d3f2c2325f3ab8',
          //       hex: '001444c6e3f09c2462f9825e441a69d3f2c2325f3ab8',
          //       reqSigs: 1,
          //       type: 'witness_v0_keyhash',
          //       addresses: [ 'bcrt1qgnrw8uyuy330nqj7gsdxn5ljcge97w4cu4c7m0' ]
          //     }
          //   }
          // ]

          // TODO: dedupe from getIncomingOnchainPayments
          const { onchain_addresses } = await User.findOne({ _id: this.uid }, { onchain_addresses: 1 })

          // we have to look at the precise vout because lnd sums up the value at the transaction level, not at the vout level.
          // ie: if an attacker send 10 to user A at Galoy, and 10 to user B at galoy in a sinle transaction,
          // both would be credited 20, unless we do the below filtering.
          const value = amountOnVout({vout, onchain_addresses})

          const sats = btc2sat(value)
          assert(matched_tx.tokens >= sats)

          const addedMetadata = await getCurrencyEquivalent({ sats })
          const metadata = { currency: this.currency, type, hash: matched_tx.id, pending: false, ...addedMetadata }

          await MainBook.entry()
            .debit(this.accountPath, sats, metadata)
            .credit(lightningAccountingPath, sats, metadata)
            .commit()

          const onchainLogger = this.logger.child({ topic: "payment", protocol: "onchain", transactionType: "receipt", onUs: false })
          onchainLogger.info({ success: true, ...metadata })
        }

      }

    })
  }

};
