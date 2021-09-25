import assert from "assert"
import { payViaPaymentDetails, payViaRoutes } from "lightning"
import lnService from "ln-service"

import * as Wallets from "@app/wallets"
import { TIMEOUT_PAYMENT } from "@services/lnd/auth"
import {
  UsersRepository,
  WalletInvoicesRepository,
  WalletsRepository,
} from "@services/mongoose"
import { getActiveLnd, getLndFromPubkey, validate } from "@services/lnd/utils"
import { ledger } from "@services/mongodb"
import { User } from "@services/mongoose/schema"

import {
  DbError,
  InsufficientBalanceError,
  LightningPaymentError,
  NewAccountWithdrawalError,
  NotFoundError,
  RouteFindingError,
  SelfPaymentError,
  TransactionRestrictedError,
  TwoFAError,
} from "../error"
import { redlock } from "../lock"
import { transactionNotification } from "@services/notifications/payment"
import { UserWallet } from "../user-wallet"
import { addContact, isInvoiceAlreadyPaidError, timeout } from "../utils"
import { lnPaymentStatusEvent } from "@config/app"
import pubsub from "@services/pubsub"
import { LndService } from "@services/lnd"
import { PriceService } from "@services/price"
import { LedgerService } from "@services/ledger"
import { toMilliSats, toSats } from "@domain/bitcoin"
import { toLiabilitiesAccountId } from "@domain/ledger"
import { RoutesRepository } from "@services/redis/routes"
import { CouldNotFindError } from "@domain/errors"
import { LockService } from "@services/lock"
import { checkAndVerifyTwoFA, getLimitsChecker } from "@core/accounts/helpers"
import { TwoFANewCodeNeededError } from "@domain/twoFA"
import { CachedRouteKeyGenerator } from "@domain/routes/key-generator"

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
    readonly invoices: IWalletInvoicesRepository

    constructor(args: UserWalletConstructorArgs) {
      super(args)
      this.config = args.config
      this.invoices = WalletInvoicesRepository()
    }

    async updatePending(lock) {
      const [, updatePaymentsResult] = await Promise.all([
        Wallets.updatePendingInvoices({
          walletId: this.user.id as WalletId,
          lock,
          logger: this.logger,
        }),
        Wallets.updatePendingPayments({
          walletId: this.user.id as WalletId,
          lock,
          logger: this.logger,
        }),
      ])
      if (updatePaymentsResult instanceof Error) throw updatePaymentsResult
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
      const lndService = LndService()
      if (lndService instanceof Error) throw lndService
      if (lndService.isLocal(destination)) {
        lightningLogger.warn("probe for self")
        return 0
      }

      const { lnd, pubkey } = getActiveLnd()

      const millisats = toMilliSats(parseFloat(mtokens))
      const key = CachedRouteKeyGenerator(id).generate(millisats)
      const cachedRoute = await RoutesRepository().findByKey(key)
      if (cachedRoute instanceof Error && !(cachedRoute instanceof CouldNotFindError))
        throw cachedRoute
      if (!(cachedRoute instanceof CouldNotFindError)) {
        lightningLogger.info("route result in cache")
        return cachedRoute.route.fee
      }

      let rawRoute

      try {
        ;({ route: rawRoute } = await lnService.probeForRoute({
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

      if (!rawRoute) {
        // TODO: check if the error is irrecoverable or not.
        throw new RouteFindingError(undefined, {
          logger: lightningLogger,
          probingSuccess: false,
          success: false,
        })
      }

      const routeToCache = {
        pubkey: pubkey as Pubkey,
        route: rawRoute,
      }
      const persistedRoute = await RoutesRepository().persist({ key, routeToCache })
      if (persistedRoute instanceof Error) throw persistedRoute

      lightningLogger.info(
        {
          redis: { key, value: JSON.stringify(routeToCache) },
          probingSuccess: true,
          success: true,
        },
        "successfully found a route",
      )
      return rawRoute.fee
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
      const { memo: memoPayer, twoFAToken } = params

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

      const twoFALimitsChecker = await getLimitsChecker(this.user.id)
      if (twoFALimitsChecker instanceof Error) throw twoFALimitsChecker

      const user = await UsersRepository().findById(this.user.id)
      if (user instanceof Error) throw user
      const { twoFA } = user

      const twoFACheck = twoFA?.secret
        ? await checkAndVerifyTwoFA({
            amount: toSats(tokens),
            twoFAToken: twoFAToken ? (twoFAToken as TwoFAToken) : null,
            twoFASecret: twoFA.secret,
            limitsChecker: twoFALimitsChecker,
          })
        : true
      if (twoFACheck instanceof TwoFANewCodeNeededError)
        throw new TwoFAError("Need a 2FA code to proceed with the payment", {
          logger: lightningLogger,
        })
      if (twoFACheck instanceof Error)
        throw new TwoFAError(undefined, { logger: lightningLogger })

      let fee
      let route
      let paymentPromise
      let feeKnownInAdvance

      return redlock({ path: this.user._id, logger: lightningLogger }, async (lock) => {
        const balanceSats = await Wallets.getBalanceForWallet({
          walletId: this.user.id,
          logger: lightningLogger,
        })
        if (balanceSats instanceof Error) throw balanceSats

        const limitsChecker = await getLimitsChecker(this.user.id)
        if (limitsChecker instanceof Error) throw limitsChecker

        // On us transaction
        const lndService = LndService()
        if (lndService instanceof Error) throw lndService
        if (lndService.isLocal(destination) || isPushPayment) {
          const lightningLoggerOnUs = lightningLogger.child({ onUs: true, fee: 0 })

          const intraledgerLimitCheck = limitsChecker.checkIntraledger({
            amount: tokens,
          })
          if (intraledgerLimitCheck instanceof Error)
            throw new TransactionRestrictedError(intraledgerLimitCheck.message, {
              logger: lightningLoggerOnUs,
            })

          let payeeUser, pubkey, payeeInvoice

          if (isPushPayment) {
            // pay through username
            payeeUser = await User.getUserByUsername(input_username)
          } else {
            // standard path, user scan a lightning invoice of our own wallet from another user
            payeeInvoice = await this.invoices.findByPaymentHash(id)
            if (payeeInvoice instanceof Error) {
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
            payeeUser = await User.findOne({ _id: payeeInvoice.walletId })
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
          if (balanceSats < sats) {
            throw new InsufficientBalanceError(undefined, {
              logger: lightningLoggerOnUs,
            })
          }

          const price = await PriceService().getCurrentPrice()
          if (price instanceof Error) throw price
          const lnFee = toSats(0)
          const usd = sats * price
          const usdFee = lnFee * price

          const payerWallet = await WalletsRepository().findById(this.user.id)
          if (payerWallet instanceof CouldNotFindError) throw payerWallet
          if (payerWallet instanceof Error) throw payerWallet
          const recipientWallet = await WalletsRepository().findById(payeeUser.id)
          if (recipientWallet instanceof CouldNotFindError) throw recipientWallet
          if (recipientWallet instanceof Error) throw recipientWallet

          const journal = await LockService().extendLock(
            { logger: lightningLoggerOnUs, lock },
            async () =>
              LedgerService().addLnIntraledgerTxSend({
                liabilitiesAccountId: toLiabilitiesAccountId(this.user.id),
                paymentHash: id,
                description: memoInvoice,
                sats,
                fee: lnFee,
                usd,
                usdFee,
                pubkey,
                recipientLiabilitiesAccountId: toLiabilitiesAccountId(payeeUser.id),
                payerWalletName: payerWallet.walletName,
                recipientWalletName: recipientWallet.walletName,
                memoPayer: memoPayer || null,
                shareMemoWithPayee: isPushPayment,
              }),
          )
          if (journal instanceof Error) throw journal

          transactionNotification({
            amount: sats,
            user: payeeUser,
            hash: id,
            logger: this.logger,
            type: "paid-invoice",
          })

          const eventName = lnPaymentStatusEvent(id)
          pubsub.publish(eventName, { status: "PAID" })

          if (!isPushPayment) {
            // trying to delete the invoice first from lnd
            // if we failed to do it, the invoice would still be present in InvoiceUser
            // in case the invoice were to be paid another time independantly (unlikely outcome)
            try {
              const lndService = LndService()
              if (lndService instanceof Error) return lndService
              const deleteResult = lndService.cancelInvoice({
                pubkey,
                paymentHash: id,
              })
              if (deleteResult instanceof Error) throw deleteResult
              this.logger.info({ id, user: this.user }, "canceling invoice on lnd")

              payeeInvoice.paid = true
              payeeInvoice = await this.invoices.update(payeeInvoice)
              if (payeeInvoice instanceof Error) {
                this.logger.error(
                  { id, user: this.user, err: payeeInvoice },
                  "issue updating invoice",
                )
              }

              if (payeeInvoice.paid) {
                this.logger.info(
                  { id, user: this.user },
                  "invoice has been updated from InvoiceUser following on_us transaction",
                )
              }
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
          const withdrawalLimitCheck = limitsChecker.checkWithdrawal({
            amount: tokens,
          })
          if (withdrawalLimitCheck instanceof Error)
            throw new TransactionRestrictedError(withdrawalLimitCheck.message, {
              logger: lightningLogger,
            })

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

        const withdrawalLimitCheck = limitsChecker.checkWithdrawal({
          amount: tokens,
        })
        if (withdrawalLimitCheck instanceof Error)
          throw new TransactionRestrictedError(withdrawalLimitCheck.message, {
            logger: lightningLogger,
          })

        // TODO: fine tune those values:
        // const probe_timeout_ms
        // const path_timeout_ms

        // TODO: push payment for other node as well
        lightningLogger = lightningLogger.child({ onUs: false, max_fee })

        const millisats = toMilliSats(parseFloat(mtokens))
        const key = CachedRouteKeyGenerator(id).generate(millisats)
        const routesRepo = RoutesRepository()
        const cachedRoute = await routesRepo.findByKey(key)
        if (cachedRoute instanceof Error && !(cachedRoute instanceof CouldNotFindError))
          throw cachedRoute
        if (!(cachedRoute instanceof CouldNotFindError)) {
          route = { ...cachedRoute.route, pubkey: cachedRoute.pubkey }
        }
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
            const millisats = toMilliSats(parseFloat(mtokens))
            const key = CachedRouteKeyGenerator(id).generate(millisats)
            const deleted = await routesRepo.deleteByKey(key)
            if (deleted instanceof Error) throw deleted
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

          lightningLogger = lightningLogger.child({ route, balanceSats, ...metadata })

          // TODO usd management for balance

          if (balanceSats < sats) {
            throw new InsufficientBalanceError(undefined, { logger: lightningLogger })
          }

          const price = await PriceService().getCurrentPrice()
          if (price instanceof Error) throw price
          const lnFee = toSats(fee)
          const usd = sats * price
          const usdFee = lnFee * price

          const lockArgs = { logger: lightningLogger, lock }
          entry = await LockService().extendLock(lockArgs, async () =>
            // reduce balance from customer first
            LedgerService().addLnTxSend({
              liabilitiesAccountId: toLiabilitiesAccountId(this.user.id),
              paymentHash: id,
              description: memoInvoice,
              sats,
              fee,
              usd,
              usdFee,
              pubkey: pubkey as Pubkey,
              feeKnownInAdvance,
            }),
          )
          if (entry instanceof Error) throw entry

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
              // or payment update when the user query his balanceSats
            }

            try {
              // FIXME: this query may not make sense
              // where multiple payment have the same hash
              // ie: when a payment is being retried

              await ledger.settleLndPayment(id)

              await ledger.voidTransactions(entry.journalId, err[1])

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
              related_journal: entry.journalId,
            })
          }

          lightningLogger.info(
            { success: true, paymentResult, ...metadata },
            `payment success`,
          )
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
  }
