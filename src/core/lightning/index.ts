import lnService from "ln-service"

import { WalletInvoicesRepository } from "@services/mongoose"
import { getActiveLnd, validate } from "@services/lnd/utils"

import { RouteFindingError } from "../error"
import { LndService } from "@services/lnd"
import { toMilliSatsFromString } from "@domain/bitcoin"
import { RoutesCache } from "@services/redis"
import { CouldNotFindError } from "@domain/errors"
import { CachedRouteLookupKeyFactory } from "@domain/routes/key-factory"

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

      const milliSats = toMilliSatsFromString(mtokens)
      const key = CachedRouteLookupKeyFactory().create({ paymentHash: id, milliSats })
      const routeFromCache = await RoutesCache().findByKey(key)
      if (
        routeFromCache instanceof Error &&
        !(routeFromCache instanceof CouldNotFindError)
      )
        throw routeFromCache
      if (!(routeFromCache instanceof CouldNotFindError)) {
        lightningLogger.info("route result in cache")
        return routeFromCache.route.fee
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
      const cachedRoute = await RoutesCache().store({ key, routeToCache })
      if (cachedRoute instanceof Error) throw cachedRoute

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
  }
