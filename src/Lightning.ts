import assert from 'assert';
import crypto, { createHash, randomBytes } from "crypto";
import { AuthenticatedLnd, cancelHodlInvoice, createInvoice, decodePaymentRequest, getInvoice, getPayment, payViaPaymentDetails, payViaRoutes } from "lightning";
import lnService from 'ln-service';
import moment from "moment";
import util from 'util';
import { yamlConfig } from "./config";
import { InsufficientBalanceError, NewAccountWithdrawalError, NotFoundError, SelfPaymentError, TransactionRestrictedError, ValidationError } from './error';
import { addTransactionLndPayment, addTransactionLndReceipt, addTransactionOnUsPayment } from "./ledger/transaction";
import { FEECAP, FEEMIN, TIMEOUT_PAYMENT } from "./lndAuth";
import { getActiveLnd, getLndFromPubkey, isMyNode } from "./lndUtils";
import { lockExtendOrThrow, redlock } from "./lock";
import { MainBook } from "./mongodb";
import { transactionNotification } from "./notifications/payment";
import { getAsyncRedisClient } from "./redis";
import { InvoiceUser, Transaction, User } from "./schema";
import { IAddInvoiceRequest, IFeeRequest, IPaymentRequest } from "./types";
import { UserWallet } from "./userWallet";
import { addContact, isInvoiceAlreadyPaidError, LoggedError, timeout } from "./utils";




export type ITxType = "invoice" | "payment" | "onchain_receipt" | "onchain_payment" | "on_us"
export type payInvoiceResult = "success" | "failed" | "pending" | "already_paid"


// this value is here so that it can get mocked.
// there could probably be a better design
// but mocking on mixin is tricky
export const delay = (currency) => {
  return {
    "BTC": { value: 1, unit: 'days', "additional_delay_value": 1 },
    "USD": { value: 2, unit: 'mins', "additional_delay_value": 1 },
  }[currency]
}

export const LightningMixin = (superclass) => class extends superclass {
  constructor(...args) {
    super(...args)
  }

  async updatePending(lock) {
    await Promise.all([
      this.updatePendingInvoices(lock),
      this.updatePendingPayments(lock),
      super.updatePending(lock),
    ])
  }

  getExpiration = (input) => {    
    // TODO: manage USD shorter time
    const currency = "BTC"

    return input.add(delay(currency).value, delay(currency).unit)
  }

  async addInvoice({ value, memo, selfGenerated = true }: IAddInvoiceRequest): Promise<string> {
    if (!!value && value < 0) {
      throw new Error("value can't be negative")
    }
    
    let request, id, input

    const expires_at = this.getExpiration(moment()).toDate()
    
    const { lnd, pubkey } = getActiveLnd()

    if (!lnd) {
      throw new Error("no active lnd")
    }

    try {
      input = {
        lnd,
        tokens: value,
        expires_at,
      }
      
      if (selfGenerated) {
      // generated through the mobile app
        input["description"] = memo
      } else {
      // lnpay // static invoice
        const description_string = `pay ${this.user.username}`
        const sha256 = crypto.createHash("sha256");
        const description_hash = sha256.update(description_string).digest("hex");
        input["description_hash"] = description_hash
      }

      const result = await createInvoice(input)
      request = result.request
      id = result.id
    } catch (err) {
      const error = "impossible to create the invoice"
      throw new LoggedError(error)
    }

    try {
      const result = await new InvoiceUser({
        _id: id,
        uid: this.user.id,
        selfGenerated,
        pubkey,
      }).save()

      this.logger.info({ pubkey, result, value, memo, selfGenerated, id, user: this.user }, "a new invoice has been added")
    } catch (err) {
      // FIXME if the mongodb connection has not been instantiated
      // this fails silently
      const error = `error storing invoice to db`
      throw new LoggedError(error)
    }

    return request
  }

  async getLightningFee(params: IFeeRequest): Promise<Number> {

    // TODO:
    // we should also log the fact we have started the query
    // if (await getAsyncRedisClient().get(JSON.stringify(params))) {
    //   return
    // }
    //
    // OR: add a lock

    // TODO: do a balance check, so that we don't probe needlessly if the user doesn't have the 
    // probably make sense to used a cached balance here. 

    // TODO: if this is a node we are connected with, we may not even need a probe/round trip to redis
    // we could handle this from the front end directly.



    const { mtokens, max_fee, destination, id, routeHint, messages, cltv_delta, features, payment } = 
      await this.validate({params, logger: this.logger})

    const lightningLogger = this.logger.child({ 
      topic: "fee_estimation",
      protocol: "lightning",
      params, 
      decoded: { mtokens, max_fee, destination, id, routeHint, messages, cltv_delta, features, payment }
    })

    // safety check
    // this should not happen as this check is done within RN

    // TODO: mobile side should also haev a list of array instead of a single node
    if (isMyNode({pubkey: destination})) {
      lightningLogger.warn("probe for self")
      return 0
    }

    const { lnd, pubkey } = getActiveLnd() 

    if (!lnd) {
      throw new Error("no active lnd")
    }

    const key = JSON.stringify({ id, mtokens })

    const cacheProbe = await getAsyncRedisClient().get(key)
    if (cacheProbe) {
      lightningLogger.info("route result in cache")
      return JSON.parse(cacheProbe).fee
    }

    let route

    try {
      ({ route } = await lnService.probeForRoute({
        lnd, 
        destination, 
        mtokens, 
        routes: routeHint,
        cltv_delta,
        features,
        max_fee,
        messages,
        payment,
        total_mtokens: payment ? mtokens : undefined,
      }));
    } catch (err) {
      const error = "error getting route / probing for route"
      lightningLogger.error({ pubkey, err, max_fee, probingSuccess: false, success: false }, error)
      throw new LoggedError(error)
    }

    if (!route) {
      // TODO: check if the error is irrecovable or not.

      const error = "there is no potential route for payment"
      lightningLogger.warn({ pubkey, probingSuccess: false, success: false }, error)
      throw new LoggedError(error)
    }

    const value = JSON.stringify({...route, pubkey})
    await getAsyncRedisClient().set(key, value, 'EX', 60 * 5); // expires after 5 minutes

    lightningLogger.info({ redis: { key, value }, probingSuccess: true, success: true }, "succesfully found a route")
    return route.fee
  }

  // FIXME this should be static
  async validate({params, logger}: {params: IFeeRequest, logger: any}) {
  
    const keySendPreimageType = '5482373484';
    const preimageByteLength = 32;

    let pushPayment = false
    let tokens
    let expires_at
    let features
    let cltv_delta
    let payment
    let destination, id, description
    let routeHint 
    let messages
    let username

    if (params.invoice) {
      // TODO: replace this with invoices/bolt11/parsePaymentRequest function?
      // TODO: use msat instead of sats for the db?

      const { lnd } = getActiveLnd() 

      try {
        // it doesn't matter which node we fetch the decodePaymentRequest, this operation is stateless and every node should return the same value
        ({ id, safe_tokens: tokens, destination, description, routes: routeHint, payment, cltv_delta, expires_at, features } = await decodePaymentRequest({ lnd, request: params.invoice }))
      } catch (err) {
        const error = `Error decoding the invoice`
        logger.error({ params, success: false, error }, error)
        throw new LoggedError(error)
      }

      // TODO: if expired_at expired, thrown an error

      if (!!params.amount && tokens !== 0) {
        const error = `Invoice contains non-zero amount, but amount was also passed separately`
        throw new ValidationError(error, {forwardToClient: true, logger: logger, level: 'error'})
      }

    } else {
      if (!params.username) {
        const error = `a username is required for push payment to the ${ yamlConfig.name }`
        throw new ValidationError(error, {forwardToClient: true, logger: logger, level: 'warn'})
      }

      pushPayment = true
      destination = params.destination
      username = params.username

      const preimage = randomBytes(preimageByteLength);
      id = createHash('sha256').update(preimage).digest().toString('hex');
      const secret = preimage.toString('hex');
      messages = [{ type: keySendPreimageType, value: secret }]

      // TODO: should it be id or secret?
      // check from keysend invoices generated by lnd
      // payment = payment ?? secret

    }

    if (!params.amount && tokens === 0) {
      const error = 'Invoice is a zero-amount invoice, or pushPayment is being used, but no amount was passed separately'
      throw new ValidationError(error, {forwardToClient: true, logger: logger, level: 'error'})
    }

    tokens = !!tokens ? tokens : params.amount
  
    if (tokens <= 0) {
      logger.error('A negative amount was passed')
      throw Error("amount can't be negative")
    }

    const max_fee = Math.floor(Math.max(FEECAP * tokens, FEEMIN))

    return {
      // FIXME String: https://github.com/alexbosworth/lightning/issues/24
      tokens, mtokens: String(tokens * 1000), destination, pushPayment, id, routeHint, messages, max_fee,
      memoInvoice: description, payment, cltv_delta, expires_at, features, username
    }
  }

  async pay(params: IPaymentRequest): Promise<payInvoiceResult | Error> {
    let lightningLogger = this.logger.child({ topic: "payment", protocol: "lightning", transactionType: "payment" })

    const { tokens, mtokens, username: input_username, destination, pushPayment, id, routeHint, messages, memoInvoice, payment, cltv_delta, features, max_fee } = await this.validate({params, logger: lightningLogger})
    const { memo: memoPayer } = params

    // not including message because it contains the preimage and we don't want to log this
    lightningLogger = lightningLogger.child({ decoded: { tokens, destination, pushPayment, id, routeHint, memoInvoice, memoPayer, payment, cltv_delta, features }, params })

    let fee
    let route
    let paymentPromise
    let feeKnownInAdvance

    return await redlock({ path: this.user._id, logger: lightningLogger }, async (lock) => {
      const balance = await this.getBalances(lock)

      // On us transaction
      // if destination is empty, we consider this is also an on-us transaction
      if (isMyNode({pubkey: destination}) || destination === "") {
        const lightningLoggerOnUs = lightningLogger.child({ onUs: true, fee: 0 })

        if(await this.user.limitHit({on_us: true, amount: tokens})) {
          const error = `Cannot transfer more than ${yamlConfig.limits.onUs.level[this.user.level]} sats in 24 hours`
          throw new TransactionRestrictedError(error, {forwardToClient: true, logger: lightningLoggerOnUs, level: 'error'})
        }

        let payeeUser, pubkey

        if (pushPayment) {
          // pay through username
          payeeUser = await User.findByUsername({ username: input_username })

        } else {
          // standard path, user scan a lightning invoice of our own wallet from another user

          const payeeInvoice = await InvoiceUser.findOne({ _id: id })
          if (!payeeInvoice) {
            const error = `User tried to pay invoice from ${ yamlConfig.name }, but it was already paid or does not exist`
            lightningLoggerOnUs.error({ success: false, error })
            throw new LoggedError(error)
          }

          ({ pubkey } = payeeInvoice)
          payeeUser = await User.findOne({ _id: payeeInvoice.uid })
        }

        if (!payeeUser) {
          const error = `this user doesn't exist`
          throw new NotFoundError(error, {forwardToClient: true, logger: lightningLoggerOnUs, level: 'warn'})
        }

        if (String(payeeUser._id) === String(this.user._id)) {
          const error = 'User tried to pay himself'
          throw new SelfPaymentError(error, {forwardToClient: true, logger: lightningLoggerOnUs, level: 'warn'})
        }

        const sats = tokens
        const metadata = { hash: id, pubkey, type: "on_us", pending: false, ...UserWallet.getCurrencyEquivalent({ sats, fee: 0 }) }

        // TODO: manage when paid fully in USD directly from USD balance to avoid conversion issue
        if (balance.total_in_BTC < sats) {
          const error = `balance is too low`
          throw new InsufficientBalanceError(error, {forwardToClient: true, logger: lightningLoggerOnUs, level: 'warn'})
        }

        await lockExtendOrThrow({lock, logger: lightningLoggerOnUs}, async () => {
          addTransactionOnUsPayment({
            description: memoInvoice,
            sats,
            metadata,
            payerUser: this.user,
            payeeUser,
            memoPayer
          })
        })
        
        transactionNotification({ amount: sats, user: payeeUser, hash: id, logger: this.logger, type: "paid-invoice" })

        if (!pushPayment) {
          const {lnd} = getLndFromPubkey({ pubkey })
          // TODO: manage case node if offline

          try {
            // trying to delete the invoice first from lnd
            // if we failed to do it, the invoice would still be present in InvoiceUser
            // in case the invoice were to be paid another time independantly (unlikely outcome)
            await cancelHodlInvoice({ lnd, id })
            this.logger.info({ id, user: this.user }, "canceling invoice on lnd")

            const resultUpdate = await InvoiceUser.updateOne({ _id: id }, {paid: true})
            this.logger.info({ id, user: this.user, resultUpdate }, "invoice has been updated from InvoiceUser following on_us transaction")
          } catch(err) {
            this.logger.error({ id, user: this.user, err}, "issue deleting invoice")
          }
        }

        // adding contact for the payer
        if (!!payeeUser.username) {
          await addContact({uid: this.user._id, username: payeeUser.username})
        }

        // adding contact for the payee
        if (!!this.user.username) {
          await addContact({uid: payeeUser._id, username: this.user.username})
        }

        lightningLoggerOnUs.info({ pushPayment, success: true, isReward: params.isReward ?? false, ...metadata }, "lightning payment success")

        return "success"
      }

      // "normal" transaction: paying another lightning node
      if (!this.user.oldEnoughForWithdrawal) {
        const error = `New accounts have to wait ${yamlConfig.limits.oldEnoughForWithdrawal / (60 * 60 * 1000)}h before withdrawing`
        throw new NewAccountWithdrawalError(error, {forwardToClient: true, logger: lightningLogger, level: 'error'})
      }

      if (await this.user.limitHit({on_us: false, amount:tokens})) {
        const error = `Cannot transfer more than ${yamlConfig.limits.withdrawal.level[this.user.level]} sats in 24 hours`
        throw new TransactionRestrictedError(error,{forwardToClient: true, logger: lightningLogger, level: 'error'})
      }

      // TODO: manage push payment for other node as well
      if (pushPayment) {
        const error = "no push payment to other wallet (yet)"
        lightningLogger.error({ success: false }, error)
        throw new LoggedError(error)
      }

      // TODO: fine tune those values:
      // const probe_timeout_ms
      // const path_timeout_ms

      // TODO: push payment for other node as well
      lightningLogger = lightningLogger.child({ onUs: false, max_fee })

      const key = JSON.stringify({ id, mtokens })
      route = JSON.parse(await getAsyncRedisClient().get(key))
      this.logger.info({ route }, "route from redis")

      let pubkey: string, lnd: AuthenticatedLnd

      if (!!route) {
        lightningLogger = lightningLogger.child({ routing: "payViaRoutes", route })
        fee = route.safe_fee
        feeKnownInAdvance = true;
        pubkey = route.pubkey;
        ({ lnd } = getLndFromPubkey({pubkey}));
      } else {
        lightningLogger = lightningLogger.child({ routing: "payViaPaymentDetails" })
        fee = max_fee
        feeKnownInAdvance = false;

        // @ts-ignore pubkey is defined for offchain // FIXME type for pubkey
        ({ pubkey, lnd } = getActiveLnd());
      }

      // we are confident enough that there is a possible payment route. let's move forward
      // TODO quote for fees, and also USD for USD users

      let entry

      {        
        const sats = tokens + fee

        const metadata = {
          hash: id, type: "payment", pending: true, pubkey,
          feeKnownInAdvance, ...UserWallet.getCurrencyEquivalent({ sats, fee })
        }

        lightningLogger = lightningLogger.child({ route, balance, ...metadata })

        // TODO usd management for balance

        if (balance.total_in_BTC < sats) {
          const error = `balance is too low`
          throw new InsufficientBalanceError(error,{forwardToClient: true, logger: lightningLogger, level: 'error'})
        }

        entry = await lockExtendOrThrow({lock, logger: lightningLogger}, async () => {
          // reduce balance from customer first
          return addTransactionLndPayment({
            description: memoInvoice,
            payerUser: this.user,
            sats,
            metadata,
          })
        })
        
        if (pushPayment) {
          route.messages = messages
        }

        // there is 3 scenarios for a payment.
        // 1/ payment succeed (function return before TIMEOUT_PAYMENT) and:
        // 1A/ fees are known in advance
        // 1B/ fees are not kwown in advance --> need to refund for the difference in fees?
        //   for now we keep the change

        // 2/ the payment fails. we are reverting it. this including voiding prior transaction
        // 3/ payment is still pending after TIMEOUT_PAYMENT.
        // we are timing out the request for UX purpose, so that the client can show the payment is pending
        // even if the payment is still ongoing from lnd.
        // to clean pending payments, another cron-job loop will run in the background.

        try {

          // Fixme: seems to be leaking if it timeout.
          if (route) {

            paymentPromise = payViaRoutes({ lnd, routes: [route], id })

          } else {

            // incoming_peer?
            // max_paths for MPP
            // max_timeout_height ??
            paymentPromise = payViaPaymentDetails({
              lnd,
              id,
              cltv_delta,
              destination,
              features,
              max_fee,
              messages,
              mtokens,
              payment,
              routes: routeHint,
            })
          }

          await Promise.race([paymentPromise, timeout(TIMEOUT_PAYMENT, 'Timeout')])
          // FIXME
          // return this.payDetail({
          //     pubkey: details.destination,
          //     hash: details.id,
          //     amount: details.tokens,
          //     routes: details.routes
          // })

        } catch (err) {

          if (err.message === "Timeout") {
            lightningLogger.warn({ ...metadata, pending: true }, 'timeout payment')

            return "pending"
            // pending in-flight payment are being handled either by a cron job 
            // or payment update when the user query his balance
          }

          try {
            // FIXME: this query may not make sense 
            // where multiple payment have the same hash
            // ie: when a payment is being retried

            await Transaction.updateMany({ hash: id }, { pending: false, error: err[1] })
            await MainBook.void(entry.journal._id, err[1])
            lightningLogger.warn({ success: false, err, ...metadata, entry }, `payment error`)

          } catch (err_fatal) {
            const error = `ERROR CANCELING PAYMENT ENTRY`
            lightningLogger.fatal({ err, err_fatal, entry }, error)
            throw new LoggedError(error)
          }

          if (isInvoiceAlreadyPaidError(err)) {
            lightningLogger.warn({ ...metadata, pending: false }, 'invoice already paid')
            return "already_paid"
          }

          throw new LoggedError(`Error paying invoice: ${util.inspect({ err }, false, Infinity)}`)
        }

        // success
        await Transaction.updateMany({ hash: id }, { pending: false })
        const paymentResult = await paymentPromise

        if (!feeKnownInAdvance) {
          await this.recordFeeDifference({ paymentResult, max_fee, id, related_journal: entry.journal._id })
        }

        lightningLogger.info({ success: true, paymentResult, ...metadata }, `payment success`)
      }

      return "success"

    })
  }

  // this method is used when the probing failed
  //
  // there are times when it's not possible to know in advance the fees
  // this could be because the receiving doesn't respond to the fake payment hash
  // or because there is no liquidity for a one-sum payment, but there could 
  // be liquidity if the payment was using MPP
  //
  // in this scenario, we have withdrawal a percent of fee (`max_fee`)
  // and once we know precisely how much the payment was we reimburse the difference
  async recordFeeDifference({ paymentResult, max_fee, id, related_journal }) {
    const feeDifference = max_fee - paymentResult.safe_fee

    assert(feeDifference >= 0)
    assert(feeDifference <= max_fee)

    this.logger.info({ paymentResult, feeDifference, max_fee, actualFee: paymentResult.safe_fee, id }, "logging a fee difference")

    const {usd} = UserWallet.getCurrencyEquivalent({sats: feeDifference})
    const metadata = { currency: "BTC", hash: id, related_journal, type: "fee_reimbursement", usd, pending: false }

    // todo: add a reference to the journal entry of the main tx

    await addTransactionLndReceipt({
     description: "fee reimbursement",
     payeeUser: this.user,
     metadata,
     sats: feeDifference
    })
  }

  // TODO manage the error case properly. right now there is a mix of string being return
  // or error being thrown. Not sure how this is handled by GraphQL

  async updatePendingPayments(lock) {

    const query = { accounts: this.user.accountPath, type: "payment", pending: true }
    const count = await Transaction.countDocuments(query)

    if (count === 0) {
      return
    }

    const lightningLogger = this.logger.child({ topic: "payment", protocol: "lightning", transactionType: "payment", onUs: false })

    // we only lock the account if there is some pending payment transaction, which would typically be unlikely
    // we're doing the the Transaction.find after the lock to make sure there is no race condition
    // note: there might be another design that doesn't requiere a lock at the uid level but only at the hash level,
    // but will need to dig more into the cursor aspect of mongodb to see if there is a concurrency-safe way to do it.
    await redlock({ path: this.user._id, logger: lightningLogger, lock }, async (lock) => {

      const payments = await Transaction.find(query)

      for (const payment of payments) {
        const {lnd} = getLndFromPubkey({ pubkey: payment.pubkey })

        if (!lnd) {
          lightningLogger.warn("node is offline. not verifying payment for now")
          return
        }

        let result
        try {
          result = await getPayment({ lnd, id: payment.hash })
        } catch (err) {
          const error = 'issue fetching payment'
          this.logger.error({ lnd, err, payment }, error)
          throw new LoggedError(error)
        }

        if (result.is_confirmed || result.is_failed) {
          payment.pending = false
          await payment.save()
        }

        if (result.is_confirmed) {
          lightningLogger.info({ success: true, id: payment.hash, payment }, 'payment has been confirmed')

          if (!payment.feeKnownInAdvance) {
            await this.recordFeeDifference({ paymentResult: result.payment, max_fee: payment.fee, id: payment.hash, related_journal: payment._journal })
          }

        }

        if (result.is_failed) {
          try {
            await MainBook.void(payment._journal, "Payment canceled") // JSON.stringify(result.failed
            lightningLogger.info({ success: false, id: payment.hash, payment, result }, 'payment has been canceled')
          } catch (err) {
            const error = `error canceling payment entry`
            this.logger.fatal({ err, payment, result }, error)
            throw new LoggedError(error)
          }
        }
      }

    })
  }

  // return whether the invoice has been paid of not
  async updatePendingInvoice({ hash, lock, pubkey }: {hash: string, lock: any, pubkey?: string}): Promise<boolean> {
    let invoice, pubkey_

    if (!pubkey) {
      let paid
      ({ pubkey: pubkey_, paid } = await InvoiceUser.findOne({ _id: hash }));

      if (paid) {
        return true
      }
    }

    const {lnd} = getLndFromPubkey({ pubkey: pubkey ?? pubkey_ })

    if (!lnd) {
      throw Error("node is offline")
    }

    try {
      // FIXME we should only be able to look at User invoice, 
      // but might not be a strong problem anyway
      // at least return same error if invoice not from user
      // or invoice doesn't exist. to preserve privacy and prevent DDOS attack.
      invoice = await getInvoice({ lnd, id: hash })

      // TODO: we should not log/keep secret in the logs
      this.logger.debug({ invoice, user: this.user }, "got invoice status")
    } catch (err) {
      const error = `issue fetching invoice`
      this.logger.warn({ err, invoice }, error)
      return false
    }

    // invoice that are on_us will be cancelled but not confirmed
    if (invoice.is_canceled) {
      this.logger.warn({ hash, user: this.user }, "cancelled invoice")
    } else if (invoice.is_confirmed) {

      try {

        const lightningLogger = this.logger.child({ hash, user: this.user._id, topic: "payment", protocol: "lightning", transactionType: "receipt", onUs: false })

        return await redlock({ path: hash, logger: lightningLogger, lock }, async () => {

          const invoiceUser = await InvoiceUser.findOne({ _id: hash, uid: this.user._id, paid: false })

          if (!invoiceUser) {
            lightningLogger.info("invoice has already been processed")
            return true
          }

          // TODO: use a transaction here
          // const session = await InvoiceUser.startSession()
          // session.withTransaction(

          // OR: use a an unique index account / hash / voided
          // may still not avoid issue from discrenpency between hash and the books

          const resultUpdate = await InvoiceUser.updateOne({ _id: hash, uid: this.user._id }, {paid: true})
          this.logger.info({ hash, user: this.user, resultUpdate }, "invoice has been updated from InvoiceUser following on_us transaction")


          const sats = invoice.received

          const metadata = { hash, type: "invoice", pending: false, ...UserWallet.getCurrencyEquivalent({ sats, fee: 0 }) }

          await addTransactionLndReceipt({
            description: invoice.description,
            payeeUser: this.user,
            metadata,
            sats
          })

          this.logger.info({ metadata, success: true }, "long standing payment succeeded")

          return true
        })

      } catch (err) {
        const error = `issue updating invoice`
        this.logger.error({ err, invoice }, error)
        throw new LoggedError(error)
      }
    }

    return false
  }

  // should be run regularly with a cronjob
  // TODO: move to an "admin/ops" wallet
  async updatePendingInvoices(lock) {

    // TODO
    const currency = "BTC"

    const invoices = await InvoiceUser.find({ uid: this.user._id, paid: false })

    for (const invoice of invoices) {
      const { _id, pubkey } = invoice
      await this.updatePendingInvoice({ hash: _id, lock, pubkey })
    }
  }

}
