const lnService = require('ln-service');
import { intersection, last } from "lodash";
import { createHash, randomBytes } from "crypto";
import { book } from "medici";
import moment from "moment";
import { disposer } from "./lock";
import { IAddInvoiceRequest, ILightningTransaction, IPaymentRequest, TransactionType } from "./types";
import { getAuth, logger, timeout, measureTime } from "./utils";
import { InvoiceUser, Transaction, User } from "./mongodb";
const mongoose = require("mongoose");
const util = require('util')

const using = require('bluebird').using


const FEECAP = 0.02 // %
const FEEMIN = 10 // sats

export type ITxType = "invoice" | "payment" | "earn" | "onchain_receipt" | "on_us"
export type payInvoiceResult = "success" | "failed" | "pending"
type IMemo = string | undefined

const formatInvoice = (type: ITxType, memo: IMemo, pending: boolean, credit?: boolean): String => {
  if (pending) {
    return `Waiting for payment confirmation`
  } else {
    if (memo) {
      return memo
    }
    // else if (invoice.htlcs[0].customRecords) {
    // FIXME above syntax from lnd, not lnService script "overlay"
    // TODO for lnd keysend 
    // } 

    // FIXME: this could be done in the frontend?
    switch (type) {
      case "on_us": return (credit ? 'Payment sent' : 'Payment received')
      case "payment": return `Payment sent`
      case "invoice": return `Payment received`
      case "onchain_receipt": return `Onchain payment received`
      case "earn": return `Earn`
    }
  }
}

const formatType = (type: ITxType, pending: Boolean | undefined): TransactionType | Error => {
  if (type === "invoice") {
    return pending ? "unconfirmed-invoice" : "paid-invoice"
  }

  if (type === "payment") {
    return pending ? "inflight-payment" : "payment"
  }

  if (type === "earn") {
    return "earn"
  }

  if (type === "onchain_receipt") {
    return "onchain_receipt"
  }

  if (type === "on_us") {
    return "on_us"
  }

  throw Error("incorrect type for formatType")
}

export const LightningMixin = (superclass) => class extends superclass {
  protected _currency = "BTC"
  lnd: any
  nodePubKey: string | null = null

  constructor(...args) {
    super(...args)
    this.lnd = lnService.authenticatedLndGrpc(getAuth()).lnd
  }

  async getNodePubkey() {
    this.nodePubKey = this.nodePubKey ?? (await lnService.getWalletInfo({ lnd: this.lnd })).public_key
    return this.nodePubKey
  }

  async updatePending() {
    await this.updatePendingInvoices()
    await this.updatePendingPayment()
    await this.updateOnchainPayment()
  }

  async getBalance() {
    await this.updatePending()
    return super.getBalance()
  }

  async getTransactions(): Promise<Array<ILightningTransaction>> {
    await this.updatePending()

    const MainBook = new book("MainBook")

    const { results } = await MainBook.ledger({
      account: this.accountPath,
      currency: this.currency,
      // start_date: startDate,
      // end_date: endDate
    })
    // TODO we could duplicated pending/type to transaction,
    // this would avoid to fetch the data from hash collection and speed up query

    const results_processed = results.map((item) => ({
      created_at: moment(item.timestamp).unix(),
      amount: item.debit - item.credit,
      description: formatInvoice(item.type, item.memo, item.pending, item.credit > 0 ? true: false),
      hash: item.hash,
      fee: item.fee,
      // destination: TODO
      type: formatType(item.type, item.pending),
      id: item._id,
    }))

    return results_processed
  }

  async addInvoice({ value, memo }: IAddInvoiceRequest): Promise<String> {
    let request, id

    logger.error(request)

    try {
      const result = await lnService.createInvoice({
        lnd: this.lnd,
        tokens: value,
        description: memo,
      })
      request = result.request
      id = result.id
    } catch (err) {
      logger.error("impossible to create the invoice")
    }

    try {
      const result = await new InvoiceUser({
        _id: id,
        uid: this.uid,
        pending: true,
      }).save()
    } catch (err) {
      // FIXME if the mongodb connection has not been instanciated
      // this fails silently
      logger.error(err)
      throw Error(`internal: error storing invoice to db ${util.inspect({ err })}`)
    }

    return request
  }

  async pay(params: IPaymentRequest): Promise<payInvoiceResult | Error> {

    const keySendPreimageType: string = '5482373484';
    const preimageByteLength: number = 32;

    let pushPayment = false;
    //TODO: adding types here leads to errors further down below
    let tokens, fee = 0
    let destination, id, description, route, routes
    let payeeUid
    let messages: Object[] = []

    const MainBook = new book("MainBook")

    if (params.invoice) {
      // TODO replace this with bolt11 utils library
      ({ id, tokens, destination, description } = await lnService.decodePaymentRequest({ lnd: this.lnd, request: params.invoice }))

      if (!!params.amount && tokens !== 0) {
        throw Error('Invoice contains non-zero amount, but amount was also passed separately')
      }
      
      if(!params.amount && tokens === 0) {
        throw Error('Invoice is a zero-amount invoice, but no amount was passed separately')
      }
    } else {
      if (!params.amount || !params.destination) {
        throw Error('Pay requires either invoice or destination and amount to be specified')
      } else {
        pushPayment = true
        destination = params.destination

        const preimage = randomBytes(preimageByteLength);
        id = createHash('sha256').update(preimage).digest().toString('hex');
        const secret = preimage.toString('hex');
        messages = [{ type: keySendPreimageType, value: secret }]
      }
    }

    tokens = !!tokens ? tokens : params.amount

    const balance = await this.getBalance()

    return await using(disposer(this.uid), async (lock) => {

      if (destination === await this.getNodePubkey()) {
        if (pushPayment) {
          // TODO: if (dest == user) throw error
          //TODO: push payment on-us use case implementation
        } else {
          const existingInvoice = await InvoiceUser.findOne({ _id: id, pending: true })
          if (!existingInvoice) {
            throw Error('User tried to pay invoice destined to us, but it was already paid or does not exist')
            // FIXME: Using == here because === returns false even for same uids
          } else if (existingInvoice.uid == this.uid) {
            throw Error('User tried to pay their own invoice')
          }
          payeeUid = existingInvoice.uid
        }

        if (balance < tokens) {
          throw Error(`cancelled: balance is too low. have: ${balance} sats, need ${tokens}`)
        }
        const payeeAccountPath = await this.customerPath(payeeUid)
        const metadata = { currency: this.currency, hash: id, type: "on_us", pending: false }
        await MainBook.entry()
          .credit(this.accountPath, tokens, metadata)
          .debit(payeeAccountPath, tokens, metadata)
          .commit()

        await InvoiceUser.findOneAndUpdate({ _id: id }, { pending: false })
        await lnService.cancelHodlInvoice({ lnd: this.lnd, id })
        return "success"
      }

      // TODO add private route from invoice

      try {
        ({ routes } = await lnService.getRoutes({ destination, lnd: this.lnd, tokens }));

        if (routes.length === 0) {
          logger.warn("there is no potential route for payment to %o from user %o", destination, this.uid)
          throw Error(`there is no potential route for this payment`)
        }

        logger.info({ routes }, "successfully found routes for payment to %o from user %o", destination, this.uid)
      } catch (error) {
        logger.error(error, "error getting route")
        throw new Error(error)
      }

      for (const potentialRoute of routes) {
        const probePromise = lnService.probe({ lnd: this.lnd, routes: [potentialRoute] })
        const [probeResult, timeElapsedms] = await measureTime(probePromise)
        logger.info({ probeResult }, `probe took ${timeElapsedms} ms`)
        if (
          probeResult.generic_failures.length == 0 &&
          probeResult.stuck.length == 0 &&
          probeResult.temporary_failures.length == 0 &&
          probeResult.successes.length > 0
        ) {
          route = probeResult.route
          break
        }
      }

      if (!route) {
        logger.warn("there is no payable route for payment to %o from user %o", destination, this.uid)
        throw Error(`there is no payable route for this payment`)
      }

      logger.info({ route }, "successfully found payable route for payment to %o from user %o", destination, this.uid)

      // we are confident enough that there is a possible payment route. let's move forward

      fee = route.safe_fee

      if (fee > FEECAP * tokens && fee > FEEMIN) {
        throw Error(`cancelled: fee exceeds ${FEECAP * 100} percent of token amount`)
      }

      if (balance < tokens + fee) {
        throw Error(`cancelled: balance is too low. have: ${balance} sats, need ${tokens + fee}`)
      }

      if (pushPayment) {
        route.messages = messages
      }

      // reduce balance from customer first

      const metadata = { currency: this.currency, hash: id, type: "payment", pending: true, fee }
      const entry = await MainBook.entry(description)
        .debit('Assets:Reserve:Lightning', tokens + fee, metadata)
        .credit(this.accountPath, tokens + fee, metadata)
        .commit()

        // there is 3 scenarios for a payment.
        // 1/ payment succeed is less than TIMEOUT_PAYMENT
        // 2/ the payment fails. we are reverting it. this including voiding prior transaction
        // 3/ payment is still pending after TIMEOUT_PAYMENT.
        // we are timing out the request for UX purpose, so that the client can show the payment is pending
        // even if the payment is still ongoing from lnd.
        // to clean pending payments, another cron-job loop will run in the background.

      try {
        const TIMEOUT_PAYMENT = 45000

        // Fixme: seems to be leaking if it timeout.
        const promise = lnService.payViaRoutes({ lnd: this.lnd, routes: [route], id })

        await Promise.race([promise, timeout(TIMEOUT_PAYMENT, 'Timeout')])
        // FIXME
        // return this.payDetail({
        //     pubkey: details.destination,
        //     hash: details.id,
        //     amount: details.tokens,
        //     routes: details.routes
        // })

        // console.log({result})

      } catch (err) {

        logger.warn({ err, message: err.message, errorCode: err[1] },
          `payment "error" to %o from user %o`, destination, this.uid)

        if (err.message === "Timeout") {
          return "pending"
          // pending in-flight payment are being handled in a cron-like job
        }

        try {
          await Transaction.updateMany({ hash: id }, { pending: false, error: err[1] })
          await MainBook.void(entry._id, err[1])
        } catch (err_db) {
          const err_message = `error canceling payment entry ${util.inspect({ err_db })}`
          console.error(err_message)
          throw Error(`internal ${err_message}`)
        }

        throw Error(`internal error paying invoice ${util.inspect({ err }, false, Infinity)}`)
      }

      // success
      await Transaction.updateMany({ hash: id }, { pending: false })
      return "success"

    })

  }

  // TODO manage the error case properly. right now there is a mix of string being return
  // or error being thrown. Not sure how this is handled by GraphQL

  async updatePendingPayment() {

    const MainBook = new book("MainBook")
    const payments = await Transaction.find({ account_path: this.accountPathMedici, type: "payment", pending: true })

    if (payments === []) {
      return
    }

    return await using(disposer(this.uid), async (lock) => {

      for (const payment of payments) {

        let result
        try {
          result = await lnService.getPayment({ lnd: this.lnd, id: payment.hash })
        } catch (err) {
          throw Error('issue fetching payment: ' + err.toString())
        }

        if (result.is_confirmed) {
          // success
          payment.pending = false
          payment.save()
        }

        if (result.is_failed) {
          try {
            payment.pending = false
            await payment.save()
            await MainBook.void(payment._journal, "Payment canceled") // JSON.stringify(result.failed
          } catch (err) {
            throw Error(`internal: error canceling payment entry ${util.inspect({ err })}`)
          }
        }
      }

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
      throw new Error(`internal error storing invoice to db ${util.inspect({ err })}`)
    }

    return address
  }

  async updatePendingInvoice({ hash }) {
    // TODO we should have "streaming" / use Notifications for android/iOs to have
    // a push system and not a pull system

    let result

    try {
      // FIXME we should only be able to look at User invoice, 
      // but might not be a strong problem anyway
      // at least return same error if invoice not from user
      // or invoice doesn't exist. to preserve privacy reason and DDOS attack.
      result = await lnService.getInvoice({ lnd: this.lnd, id: hash })
    } catch (err) {
      throw new Error(`issue fetching invoice: ${util.inspect({ err }, { showHidden: false, depth: null })
        })`)
    }

    if (result.is_confirmed) {

      const MainBook = new book("MainBook")

      try {

        return await using(disposer(this.uid), async (lock) => {

          const invoice = await InvoiceUser.findOne({ _id: hash, pending: true, uid: this.uid })

          if (!invoice) {
            throw Error(`no mongodb entry is associated with this invoice ${result}`)
          }

          // TODO: use a transaction here
          // const session = await InvoiceUser.startSession()
          // session.withTransaction(

          // OR: use a an unique index account / hash / voided
          // may still not avoid issue from discrenpency between hash and the books

          invoice.pending = false
          invoice.save()

          await MainBook.entry()
            .credit('Assets:Reserve:Lightning', result.tokens, { currency: "BTC", hash, type: "invoice" })
            .debit(this.accountPath, result.tokens, { currency: "BTC", hash, type: "invoice" })
            .commit()

          // session.commitTransaction()
          // session.endSession()

          return true

        })

      } catch (err) {
        console.error(err)
        throw new Error(`issue updating invoice: ${err}`)
      }
    }

    return false
  }

  // should be run regularly with a cronjob
  // TODO: move to an "admin/ops" wallet
  async updatePendingInvoices() {
    
    const invoices = await InvoiceUser.find({ uid: this.uid, pending: true })

    for (const invoice of invoices) {
      await this.updatePendingInvoice({ hash: invoice._id })
    }
  }

  async getIncomingOnchainPayments(confirmed: boolean) {
    let onchainTransactions
    try {
      onchainTransactions = await lnService.getChainTransactions({ lnd: this.lnd })
    } catch (err) {
      const err_string = `${util.inspect({ err }, { showHidden: false, depth: null })}`
      throw new Error(`issue fetching transaction: ${err_string})`)
    }

    let incoming_txs = onchainTransactions.transactions.filter(tx => !tx.is_outgoing)
    if (confirmed) {
      incoming_txs = incoming_txs.filter(tx => tx.is_confirmed)
    } else {
      incoming_txs = incoming_txs.filter(tx => !tx.is_confirmed)
    }

    const { onchain_addresses } = await User.findOne({ _id: this.uid })
    const matched_txs = incoming_txs
      .filter(tx => intersection(tx.output_addresses, onchain_addresses).length > 0)

    return matched_txs
  }

  async getPendingIncomingOnchainPayments() {
    return (await this.getIncomingOnchainPayments(false)).map(({ tokens, id }) => ({ txId: id, amount: tokens }))
  }

  async updateOnchainPayment() {
    const MainBook = new book("MainBook")
    const Transaction = await mongoose.model("Medici_Transaction")

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
        logger.info({ matched_tx, mongotx }, "updateOnchainPayment with user %o", this.uid)

        if (!mongotx) {
          await MainBook.entry()
            .credit('Assets:Reserve:Lightning', matched_tx.tokens, { currency: "BTC", type, hash: matched_tx.id })
            .debit(this.accountPath, matched_tx.tokens, { currency: "BTC", type, hash: matched_tx.id, })
            .commit()
        }
      }

    })
  }
};
