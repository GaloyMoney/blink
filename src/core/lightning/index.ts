import assert from "assert"
import {
  cancelHodlInvoice,
  GetInvoiceResult,
  getPayment,
  payViaPaymentDetails,
  payViaRoutes,
} from "lightning"
import { toSats } from "@domain/primitives/btc"
import lnService from "ln-service"

import { TIMEOUT_PAYMENT } from "@services/lnd/auth"
import { MakeLndService } from "@services/lnd"
import { MakeInvoicesRepo } from "@services/mongoose/invoices"
import { invoiceExpirationForCurrency } from "@domain/invoice-expiration"
import {
  getActiveLnd,
  getInvoiceAttempt,
  getLndFromPubkey,
  isMyNode,
  validate,
} from "@services/lnd/utils"
import { ledger } from "@services/mongodb"
import { redis } from "@services/redis"
import { InvoiceUser, User } from "@services/mongoose/schema"

import {
  DbError,
  InsufficientBalanceError,
  LightningPaymentError,
  LndOfflineError,
  NewAccountWithdrawalError,
  NotFoundError,
  RouteFindingError,
  SelfPaymentError,
  TransactionRestrictedError,
} from "../error"
import { lockExtendOrThrow, redlock } from "../lock"
import { transactionNotification } from "../notifications/payment"
import { UserWallet } from "../user-wallet"
import { addContact, isInvoiceAlreadyPaidError, timeout } from "../utils"

export type ITxType =
  | "invoice"
  | "payment"
  | "onchain_receipt"
  | "onchain_payment"
  | "on_us"
export type payInvoiceResult = "success" | "failed" | "pending" | "already_paid"

export const LightningMixin = (superclass) =>
  class extends superclass {
    readonly config: UserWalletConfig
    readonly invoices: IInvoices

    constructor(...args) {
      super(...args)
      this.config = args[0].config
      this.invoices = MakeInvoicesRepo()
    }

    async updatePending(lock) {
      await Promise.all([
        this.updatePendingInvoices(lock),
        this.updatePendingPayments(lock),
        super.updatePending(lock),
      ])
    }

    async addInvoice({
      value,
      memo = "",
      selfGenerated = true,
    }: IAddInvoiceRequest): Promise<string> {
      if (!!value && value < 0) {
        throw new Error("value can't be negative")
      }

      let lnd: AuthenticatedLnd, pubkey: string

      try {
        ;({ lnd, pubkey } = getActiveLnd())
      } catch (err) {
        throw new LndOfflineError("no active lnd to create an invoice")
      }

      const lndService = MakeLndService(lnd)
      const registerResult = await lndService.registerInvoice({
        description: memo,
        satoshis: toSats(value),
        expiresAt: invoiceExpirationForCurrency("BTC", new Date()),
      })

      if (registerResult instanceof Error) {
        throw registerResult
      }
      const { invoice } = registerResult

      const walletInvoice = {
        paymentHash: invoice.paymentHash,
        walletId: this.user.id,
        selfGenerated,
        pubkey: pubkey,
        paid: false,
      } as WalletInvoice

      const persistResult = await this.invoices.persist(walletInvoice)
      if (persistResult instanceof Error) {
        throw persistResult
      }
      this.logger.info(
        {
          pubkey,
          result: persistResult,
          value,
          memo,
          selfGenerated,
          id: walletInvoice.paymentHash,
          user: this.user,
        },
        "a new invoice has been added",
      )

      return invoice.paymentRequest
    }

    async getLightningFee(params: IFeeRequest): Promise<number> {
      // TODO:
      // we should also log the fact we have started the query
      // if (await redis.get(JSON.stringify(params))) {
      //   return
      // }
      //
      // OR: add a lock

      // TODO: do a balance check, so that we don't probe needlessly if the user doesn't have the
      // probably make sense to used a cached balance here.

      const {
        mtokens,
        max_fee,
        destination,
        id,
        routeHint,
        cltv_delta,
        features,
        payment,
      } = await validate({ params, logger: this.logger })

      const lightningLogger = this.logger.child({
        topic: "fee_estimation",
        protocol: "lightning",
        params,
        decoded: {
          mtokens,
          max_fee,
          destination,
          id,
          routeHint,
          cltv_delta,
          features,
          payment,
        },
      })

      // safety check
      // this should not happen as this check is done within RN

      // TODO: mobile side should also haev a list of array instead of a single node
      if (isMyNode({ pubkey: destination })) {
        lightningLogger.warn("probe for self")
        return 0
      }

      const { lnd, pubkey } = getActiveLnd()

      const key = JSON.stringify({ id, mtokens })

      const cacheProbe = await redis.get(key)
      if (cacheProbe) {
        lightningLogger.info("route result in cache")
        return JSON.parse(cacheProbe).fee
      }

      let route

      try {
        ;({ route } = await lnService.probeForRoute({
          lnd,
          destination,
          mtokens,
          routes: routeHint,
          cltv_delta,
          features,
          max_fee,
          payment,
          total_mtokens: payment ? mtokens : undefined,
        }))
      } catch (err) {
        throw new RouteFindingError(undefined, {
          logger: lightningLogger,
          probingSuccess: false,
          success: false,
        })
      }

      if (!route) {
        // TODO: check if the error is irrecoverable or not.
        throw new RouteFindingError(undefined, {
          logger: lightningLogger,
          probingSuccess: false,
          success: false,
        })
      }

      const value = JSON.stringify({ ...route, pubkey })
      await redis.set(key, value, "EX", 60 * 5) // expires after 5 minutes

      lightningLogger.info(
        { redis: { key, value }, probingSuccess: true, success: true },
        "successfully found a route",
      )
      return route.fee
    }

    async pay(params: IPaymentRequest): Promise<payInvoiceResult | Error> {
      let lightningLogger = this.logger.child({
        topic: "payment",
        protocol: "lightning",
        transactionType: "payment",
      })

      const {
        tokens,
        mtokens,
        username: input_username,
        destination,
        isPushPayment,
        id,
        routeHint,
        memoInvoice,
        payment,
        cltv_delta,
        features,
        max_fee,
      } = await validate({ params, logger: lightningLogger })
      const { memo: memoPayer } = params

      // not including message because it contains the preimage and we don't want to log this
      lightningLogger = lightningLogger.child({
        decoded: {
          tokens,
          destination,
          isPushPayment,
          id,
          routeHint,
          memoInvoice,
          memoPayer,
          payment,
          cltv_delta,
          features,
        },
        params,
      })

      let fee
      let route
      let paymentPromise
      let feeKnownInAdvance

      return await redlock(
        { path: this.user._id, logger: lightningLogger },
        async (lock) => {
          const balance = await this.getBalances(lock)

          // On us transaction
          if (isMyNode({ pubkey: destination }) || isPushPayment) {
            const lightningLoggerOnUs = lightningLogger.child({ onUs: true, fee: 0 })

            if (await this.user.limitHit({ on_us: true, amount: tokens })) {
              const error = `Cannot transfer more than ${this.config.limits.onUsLimit} sats in 24 hours`
              throw new TransactionRestrictedError(error, { logger: lightningLoggerOnUs })
            }

            let payeeUser, pubkey

            if (isPushPayment) {
              // pay through username
              payeeUser = await User.getUserByUsername(input_username)
            } else {
              // standard path, user scan a lightning invoice of our own wallet from another user

              const payeeInvoice = await InvoiceUser.findOne({ _id: id })
              if (!payeeInvoice) {
                const error = `User tried to pay invoice from ${this.config.name}, but it does not exist`
                throw new LightningPaymentError(error, {
                  logger: lightningLoggerOnUs,
                  success: false,
                })
              }

              if (payeeInvoice.paid) {
                const error = `Invoice is already paid`
                throw new LightningPaymentError(error, {
                  logger: lightningLoggerOnUs,
                  success: false,
                })
              }

              ;({ pubkey } = payeeInvoice)
              payeeUser = await User.findOne({ _id: payeeInvoice.uid })
            }

            if (!payeeUser) {
              const error = `this user doesn't exist`
              throw new NotFoundError(error, { logger: lightningLoggerOnUs })
            }

            if (String(payeeUser._id) === String(this.user._id)) {
              throw new SelfPaymentError(undefined, { logger: lightningLoggerOnUs })
            }

            const sats = tokens
            const metadata = {
              hash: id,
              pubkey,
              type: "on_us",
              pending: false,
              ...UserWallet.getCurrencyEquivalent({ sats, fee: 0 }),
            }

            // TODO: manage when paid fully in USD directly from USD balance to avoid conversion issue
            if (balance.total_in_BTC < sats) {
              throw new InsufficientBalanceError(undefined, {
                logger: lightningLoggerOnUs,
              })
            }

            await lockExtendOrThrow({ lock, logger: lightningLoggerOnUs }, async () => {
              const tx = await ledger.addOnUsPayment({
                description: memoInvoice,
                sats,
                metadata,
                payerUser: this.user,
                payeeUser,
                memoPayer,
                shareMemoWithPayee: isPushPayment,
                lastPrice: UserWallet.lastPrice,
              })
              return tx
            })

            transactionNotification({
              amount: sats,
              user: payeeUser,
              hash: id,
              logger: this.logger,
              type: "paid-invoice",
            })

            if (!isPushPayment) {
              // trying to delete the invoice first from lnd
              // if we failed to do it, the invoice would still be present in InvoiceUser
              // in case the invoice were to be paid another time independantly (unlikely outcome)
              try {
                const { lnd } = getLndFromPubkey({ pubkey })

                await cancelHodlInvoice({ lnd, id })
                this.logger.info({ id, user: this.user }, "canceling invoice on lnd")

                const resultUpdate = await InvoiceUser.updateOne(
                  { _id: id },
                  { paid: true },
                )
                this.logger.info(
                  { id, user: this.user, resultUpdate },
                  "invoice has been updated from InvoiceUser following on_us transaction",
                )
              } catch (err) {
                this.logger.error({ id, user: this.user, err }, "issue deleting invoice")
              }
            }

            // adding contact for the payer
            if (payeeUser.username) {
              await addContact({ uid: this.user._id, username: payeeUser.username })
            }

            // adding contact for the payee
            if (this.user.username) {
              await addContact({ uid: payeeUser._id, username: this.user.username })
            }

            lightningLoggerOnUs.info(
              {
                isPushPayment,
                success: true,
                isReward: params.isReward ?? false,
                ...metadata,
              },
              "lightning payment success",
            )

            return "success"
          }

          // "normal" transaction: paying another lightning node
          if (!this.user.oldEnoughForWithdrawal) {
            const error = `New accounts have to wait ${this.config.limits.oldEnoughForWithdrawalHours}h before withdrawing`
            throw new NewAccountWithdrawalError(error, { logger: lightningLogger })
          }

          if (await this.user.limitHit({ on_us: false, amount: tokens })) {
            const error = `Cannot transfer more than ${this.config.limits.withdrawalLimit} sats in 24 hours`
            throw new TransactionRestrictedError(error, { logger: lightningLogger })
          }

          // TODO: fine tune those values:
          // const probe_timeout_ms
          // const path_timeout_ms

          // TODO: push payment for other node as well
          lightningLogger = lightningLogger.child({ onUs: false, max_fee })

          const key = JSON.stringify({ id, mtokens })
          route = JSON.parse((await redis.get(key)) as string)
          this.logger.info({ route }, "route from redis")

          let pubkey: string, lnd: AuthenticatedLnd

          // TODO: check if route is not an array and we shouldn't use .length instead
          if (route) {
            lightningLogger = lightningLogger.child({ routing: "payViaRoutes", route })
            fee = route.safe_fee
            feeKnownInAdvance = true
            pubkey = route.pubkey

            try {
              ;({ lnd } = getLndFromPubkey({ pubkey }))
            } catch (err) {
              // lnd may have gone offline since the probe has been done.
              // deleting entry so that subsequent payment attempt could succeed
              await redis.del(key)
              throw err
            }
          } else {
            lightningLogger = lightningLogger.child({ routing: "payViaPaymentDetails" })
            fee = max_fee
            feeKnownInAdvance = false
            ;({ pubkey, lnd } = getActiveLnd())
          }

          // we are confident enough that there is a possible payment route. let's move forward
          // TODO quote for fees, and also USD for USD users

          let entry

          {
            const sats = tokens + fee

            const metadata = {
              hash: id,
              type: "payment",
              pending: true,
              pubkey,
              feeKnownInAdvance,
              ...UserWallet.getCurrencyEquivalent({ sats, fee }),
            }

            lightningLogger = lightningLogger.child({ route, balance, ...metadata })

            // TODO usd management for balance

            if (balance.total_in_BTC < sats) {
              throw new InsufficientBalanceError(undefined, { logger: lightningLogger })
            }

            entry = await lockExtendOrThrow(
              { lock, logger: lightningLogger },
              async () => {
                // reduce balance from customer first
                const tx = await ledger.addLndPayment({
                  description: memoInvoice,
                  payerUser: this.user,
                  sats,
                  metadata,
                  lastPrice: UserWallet.lastPrice,
                })
                return tx
              },
            )

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
                  mtokens,
                  payment,
                  routes: routeHint,
                })
              }

              await Promise.race([paymentPromise, timeout(TIMEOUT_PAYMENT, "Timeout")])
              // FIXME
              // return this.payDetail({
              //     pubkey: details.destination,
              //     hash: details.id,
              //     amount: details.tokens,
              //     routes: details.routes
              // })
            } catch (err) {
              if (err.message === "Timeout") {
                lightningLogger.warn({ ...metadata, pending: true }, "timeout payment")

                return "pending"
                // pending in-flight payment are being handled either by a cron job
                // or payment update when the user query his balance
              }

              try {
                // FIXME: this query may not make sense
                // where multiple payment have the same hash
                // ie: when a payment is being retried

                await ledger.settleLndPayment(id)

                await ledger.voidTransactions(entry.journal._id, err[1])

                lightningLogger.warn(
                  { success: false, err, ...metadata, entry },
                  `payment error`,
                )
              } catch (err_fatal) {
                const error = `ERROR CANCELING PAYMENT ENTRY`
                throw new DbError(error, { logger: lightningLogger, level: "fatal" })
              }

              if (isInvoiceAlreadyPaidError(err)) {
                lightningLogger.warn(
                  { ...metadata, pending: false },
                  "invoice already paid",
                )
                return "already_paid"
              }

              throw new LightningPaymentError("Error paying invoice", {
                logger: lightningLogger,
                err,
                success: false,
              })
            }

            // success
            await ledger.settleLndPayment(id)
            const paymentResult = await paymentPromise

            if (!feeKnownInAdvance) {
              await this.recordFeeDifference({
                paymentResult,
                max_fee,
                id,
                related_journal: entry.journal._id,
              })
            }

            lightningLogger.info(
              { success: true, paymentResult, ...metadata },
              `payment success`,
            )
          }

          return "success"
        },
      )
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

      this.logger.info(
        { paymentResult, feeDifference, max_fee, actualFee: paymentResult.safe_fee, id },
        "logging a fee difference",
      )

      const { usd } = UserWallet.getCurrencyEquivalent({ sats: feeDifference })
      const metadata = {
        currency: "BTC",
        hash: id,
        related_journal,
        type: "fee_reimbursement",
        usd,
        pending: false,
      }

      // todo: add a reference to the journal entry of the main tx

      await ledger.addLndReceipt({
        description: "fee reimbursement",
        payeeUser: this.user,
        metadata,
        sats: feeDifference,
        lastPrice: UserWallet.lastPrice,
      })
    }

    // TODO manage the error case properly. right now there is a mix of string being return
    // or error being thrown. Not sure how this is handled by GraphQL

    async updatePendingPayments(lock) {
      const query = {
        type: "payment",
        pending: true,
      }
      const count = await ledger.getAccountTransactionsCount(this.user.accountPath, query)

      if (count === 0) {
        return
      }

      const lightningLogger = this.logger.child({
        topic: "payment",
        protocol: "lightning",
        transactionType: "payment",
        onUs: false,
      })

      // we only lock the account if there is some pending payment transaction, which would typically be unlikely
      // we're doing the the Transaction.find after the lock to make sure there is no race condition
      // note: there might be another design that doesn't requiere a lock at the uid level but only at the hash level,
      // but will need to dig more into the cursor aspect of mongodb to see if there is a concurrency-safe way to do it.
      await redlock({ path: this.user._id, logger: lightningLogger, lock }, async () => {
        const { results: payments } = await ledger.getAccountTransactions(
          this.user.accountPath,
          query,
        )

        for (const payment of payments) {
          const paymentLogger = lightningLogger.child({ payment })

          let lnd
          try {
            ;({ lnd } = getLndFromPubkey({ pubkey: payment.pubkey }))
          } catch (err) {
            lightningLogger.warn(
              { payment },
              "node is offline. skipping payment verification for now",
            )
            continue
          }

          let result
          try {
            result = await getPayment({ lnd, id: payment.hash })
          } catch (err) {
            const error = "issue fetching payment"
            paymentLogger.error({ lnd, err }, error)
            continue
          }

          if (result.is_confirmed || result.is_failed) {
            const settled = await ledger.settleLndPayment(payment.hash)

            if (!settled) {
              // this could happen if dealer and user try to update transaction at the same time
              // they are not mutually protected from the lock
              paymentLogger.error({ settled }, "we didn't have any transaction to update")
              continue
            }

            paymentLogger.info({ settled }, "pending update status")
          }

          if (result.is_confirmed) {
            paymentLogger.info(
              { success: true, id: payment.hash, payment },
              "payment has been confirmed",
            )

            if (!payment.feeKnownInAdvance) {
              await this.recordFeeDifference({
                paymentResult: result.payment,
                max_fee: payment.fee,
                id: payment.hash,
                related_journal: payment._journal,
              })
            }
          }

          if (result.is_failed) {
            try {
              await ledger.voidTransactions(payment._journal, "Payment canceled")
              paymentLogger.info({ success: false, result }, "payment has been canceled")
            } catch (err) {
              const error = `error voiding payment entry`
              paymentLogger.fatal(
                {
                  success: false,
                  result,
                },
                error,
              )
            }
          }
        }
      })
    }

    // return whether the invoice has been paid of not
    async updatePendingInvoice({
      hash,
      lock,
      pubkeyCached,
    }: {
      hash: string
      lock
      pubkeyCached?: string
    }): Promise<boolean> {
      let pubkey: string | undefined

      // if a pubkey has been provided, it means the invoice has not been set as paid in mongodb
      // so not need for a round back trip to mongodb
      if (!pubkeyCached) {
        let paid: boolean
        const invoiceUser = await InvoiceUser.findOne({ _id: hash })

        if (!invoiceUser) {
          this.logger.info({ hash }, "invoiceUser doesn't exist")
          return false
        }

        ;({ paid, pubkey } = invoiceUser)

        if (paid) {
          return true
        }
      }

      pubkey = (pubkey ?? pubkeyCached) as string

      let lnd: AuthenticatedLnd
      try {
        ;({ lnd } = getLndFromPubkey({ pubkey }))
      } catch (err) {
        // TODO: send a status to the user showing the infrastructure is not fully operational
        this.logger.warn({ pubkey, hash }, "node is offline. can't verify invoice status")
        return false
      }

      const invoice = await getInvoiceAttempt({ lnd, id: hash })

      if (!invoice) {
        try {
          await InvoiceUser.deleteOne({ _id: hash, uid: this.user._id })
        } catch (err) {
          this.logger.error({ invoice }, "impossible to delete InvoiceUser entry")
        }

        return false
      }

      // TODO: we should not log/keep secret in the logs
      this.logger.debug({ invoice, user: this.user }, "got invoice status")

      if (invoice.is_confirmed) {
        return await redlock({ path: hash, logger: this.logger, lock }, async () => {
          const lightningLogger = this.logger.child({
            hash,
            user: this.user._id,
            topic: "payment",
            protocol: "lightning",
            transactionType: "receipt",
            onUs: false,
          })

          let invoiceUser

          try {
            invoiceUser = await InvoiceUser.findOne({
              _id: hash,
              uid: this.user._id,
            })
          } catch (err) {
            throw new DbError(`issue getting invoiceUser`, {
              logger: this.logger,
              level: "error",
              err,
              invoice,
            })
          }

          if (!invoiceUser) {
            lightningLogger.error("invoiceUser not found")
            return false
          }

          if (invoiceUser.paid) {
            lightningLogger.info("invoice has already been processed")
            return true
          }

          try {
            // TODO: use a transaction here
            // const session = await InvoiceUser.startSession()
            // session.withTransaction(

            // OR: use a an unique index account / hash / voided
            // may still not avoid issue from discrenpency between hash and the books

            const resultUpdate = await InvoiceUser.updateOne(
              { _id: hash, uid: this.user._id },
              { paid: true },
            )
            this.logger.info(
              { hash, user: this.user, resultUpdate },
              "invoice has been updated from InvoiceUser following on_us transaction",
            )
          } catch (err) {
            throw new DbError(`issue updating invoiceUser`, {
              logger: this.logger,
              level: "error",
              err,
              invoice,
            })
          }

          const sats = (invoice as GetInvoiceResult).received

          const metadata = {
            hash,
            type: "invoice",
            pending: false,
            ...UserWallet.getCurrencyEquivalent({ sats, fee: 0 }),
          }

          try {
            await ledger.addLndReceipt({
              description: (invoice as GetInvoiceResult).description,
              payeeUser: this.user,
              metadata,
              sats,
              lastPrice: UserWallet.lastPrice,
            })
          } catch (err) {
            const error = `addTransactionLndReceipt failed following updating InvoiceUser to paid = true. potential inconsistency`
            throw new DbError(error, {
              logger: this.logger,
              level: "fatal",
              err,
              invoice,
            })
          }

          this.logger.info({ metadata, success: true }, "long standing payment succeeded")

          return true
        })
      } else {
        this.logger.debug({ invoice }, "invoice has not been paid")
        return false
      }
    }

    async updatePendingInvoices(lock) {
      // TODO
      // const currency = "BTC"

      const invoices = await InvoiceUser.find({ uid: this.user._id, paid: false })

      for (const { _id: hash, pubkey: pubkeyCached } of invoices) {
        await this.updatePendingInvoice({ hash, lock, pubkeyCached })
      }
    }
  }
