const lnService = require('ln-service');
import { intersection, last } from "lodash";
import { disposer } from "./lock";
import { MainBook, Transaction, User } from "./mongodb";
import { IOnChainPayment, ISuccess } from "./types";
import { addCurrentValueToMetadata, getAuth, logger, sendToAdmin } from "./utils";
import { customerPath } from "./wallet";
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

  async updatePending() {
    await this.updateOnchainPayment()
    return super.updatePending()
  }

  async PayeeUser(address: string) { return User.findOne({ onchain_addresses: { $in: address } }) }

  async getOnchainFee({address}): Promise<number | Error> {
    const payeeUser = await this.PayeeUser(address)

    console.log({payeeUser})

    let fee

    if (payeeUser) {
      fee = 0
    } else {
      const sendTo = [{ address, tokens: someAmount }];
      ({ fee } = await lnService.getChainFeeEstimate({ lnd: this.lnd, send_to: sendTo }))
    }

    return fee
  }

  async onChainPay({ address, amount, memo }: IOnChainPayment): Promise<ISuccess | Error> {
    const balance = await this.getBalance()
    
    // quit early if balance is not enough
    if (balance < amount) {
      throw Error(`cancelled: balance is too low. have: ${balance} sats, need ${amount}`)
    }

    const payeeUser = await this.PayeeUser(address)

    if (payeeUser) {
      // FIXME: Using == here because === returns false even for same uids
      if (payeeUser._id == this.uid) {
        throw Error('User tried to pay themselves')
      }

      const sats = amount
      const metadata = { currency: this.currency, type: "onchain_on_us", pending: false }
      await addCurrentValueToMetadata(metadata, { sats, fee: 0 })

      return await using(disposer(this.uid), async (lock) => {

        await MainBook.entry()
          .credit(this.accountPath, sats, {...metadata, memo})
          .debit(customerPath(payeeUser._id), sats, metadata)
          .commit()
        return true
      })
    }

    const { chain_balance: onChainBalance } = await lnService.getChainBalance({ lnd: this.lnd })

    let estimatedFee, id

    const sendTo = [{ address, tokens: amount }]

    try {
      ({ fee: estimatedFee } = await lnService.getChainFeeEstimate({ lnd: this.lnd, send_to: sendTo }))
    } catch (err) {
      logger.error({ err }, `Unable to estimate fee for on-chain transaction`)
      throw new Error(`Unable to estimate fee for on-chain transaction: ${err}`)
    }

    // case where there is not enough money available within lnd on-chain wallet
    if (onChainBalance < amount + estimatedFee) {
      const body = `insufficient onchain balance. have ${onChainBalance}, need ${amount + estimatedFee}`

      //FIXME: use pagerduty instead of text
      await sendToAdmin(body)
      throw Error(body)
    }

    return await using(disposer(this.uid), async (lock) => {
      
      // case where the user doesn't have enough money
      if (balance < amount + estimatedFee) {
        throw Error(`cancelled: balance is too low. have: ${balance} sats, need ${amount + estimatedFee}`)
        // TODO: report error in a way this can be handled propertly in React Native
      }

      try {
        ({ id } = await lnService.sendToChainAddress({ address, lnd: this.lnd, tokens: amount }))
      } catch (err) {
        logger.error({ err }, "Impossible to sendToChainAddress")
        return false
      }

      const outgoingOnchainTxns = await this.getOnChainTransactions({ lnd: this.lnd, incoming: false })

      const [{ fee }] = outgoingOnchainTxns.filter(tx => tx.id === id)

      {
        const sats = amount + fee
        const metadata = { currency: this.currency, hash: id, type: "onchain_payment", pending: true }
        await addCurrentValueToMetadata(metadata, { sats, fee })

        // TODO/FIXME refactor. add the transaction first and set the fees in a second tx.
        await MainBook.entry(memo)
          .debit('Assets:Reserve:Lightning', sats, metadata)
          .credit(this.accountPath, sats, metadata)
          .commit()
      }
      return true

    })

  }

  async getLastOnChainAddress(): Promise<String | Error | undefined> {
    let user = await User.findOne({ _id: this.uid })
    if (!user) { // this should not happen. is test that relevant?
      console.error("no user is associated with this address")
      throw new Error(`no user with this uid`)
    }

    if (user.onchain_addresses?.length === 0) {
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
      throw new Error(`internal error getting address ${util.inspect({ err })}`)
    }

    try {
      const user = await User.findOne({ _id: this.uid })
      if (!user) { // this should not happen. is test that relevant?
        console.error("no user is associated with this address")
        throw new Error(`no user with this uid`)
      }

      user.onchain_addresses.push(address)
      await user.save()

    } catch (err) {
      throw new Error(`internal error storing new onchain address to db ${util.inspect({ err })}`)
    }

    return address
  }

  async getOnChainTransactions({ lnd, incoming }: { lnd: any, incoming: boolean }) {
    try {
      const onchainTransactions = await lnService.getChainTransactions({ lnd })
      return onchainTransactions.transactions.filter(tx => incoming === !tx.is_outgoing)
    } catch (err) {
      const err_string = `${util.inspect({ err }, { showHidden: false, depth: null })}`
      throw new Error(`issue fetching transaction: ${err_string})`)
    }
  }

  async getIncomingOnchainPayments(confirmed: boolean) {

    const incoming_txs = (await this.getOnChainTransactions({ lnd: this.lnd, incoming: true }))
      .filter(tx => tx.is_confirmed === confirmed)

    const { onchain_addresses } = await User.findOne({ _id: this.uid }, { onchain_addresses: 1 })
    const matched_txs = incoming_txs
      .filter(tx => intersection(tx.output_addresses, onchain_addresses).length > 0)

    return matched_txs
  }

  async getPendingIncomingOnchainPayments() {
    return (await this.getIncomingOnchainPayments(false)).map(({ tokens, id }) => ({ amount: tokens, txId: id }))
  }

  async updateOnchainPayment() {

    const matched_txs = await this.getIncomingOnchainPayments(true)

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

    // TODO FIXME XXX: this could lead to an issue for many output transaction.
    // ie: if an attacker send 10 to user A at Galoy, and 10 to user B at galoy
    // in a sinle transaction, both would be credited 20.

    // FIXME O(n) ^ 2. bad.

    const type = "onchain_receipt"

    return await using(disposer(this.uid), async (lock) => {

      for (const matched_tx of matched_txs) {

        // has the transaction has not been added yet to the user account?
        const mongotx = await Transaction.findOne({ account_path: this.accountPathMedici, type, hash: matched_tx.id })

        // logger.debug({ matched_tx, mongotx }, "updateOnchainPayment with user %o", this.uid)

        if (!mongotx) {

          const sats = matched_tx.tokens
          const metadata = { currency: this.currency, type, hash: matched_tx.id }
          await addCurrentValueToMetadata(metadata, { sats })

          await MainBook.entry()
            .credit('Assets:Reserve:Lightning', sats, metadata)
            .debit(this.accountPath, sats, metadata)
            .commit()
        }
      }

    })
  }

};
