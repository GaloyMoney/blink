import { GT } from "@/graphql/index"
import { mapError } from "@/graphql/error-map"
import IAccountLimit from "@/graphql/public/types/abstract/account-limit"
import CentAmount from "@/graphql/public/types/scalar/cent-amount"
import Seconds from "@/graphql/public/types/scalar/seconds"
import { normalizePaymentAmount } from "@/graphql/shared/root/mutation"

import { Accounts } from "@/app"
import { AccountLimitsRange, AccountLimitsType } from "@/domain/accounts"
import { SECS_PER_DAY, getDealerConfig } from "@/config"
import { InvalidAccountLimitTypeError } from "@/domain/errors"
import { getMidPriceRatio } from "@/app/prices"

const OneDayAccountLimit = GT.Object<{
  account: Account
  limitType: AccountLimitsType
  range: AccountLimitsRange
}>({
  name: "OneDayAccountLimit",
  interfaces: () => [IAccountLimit],
  isTypeOf: ({ range }) => range === AccountLimitsRange.ONE_DAY,

  fields: () => ({
    totalLimit: {
      type: GT.NonNull(CentAmount),
      description: `The current maximum limit for a given 24 hour period.`,
      resolve: async (source) => {
        const { account, limitType } = source
        const limit = await Accounts.totalLimit({
          level: account.level,
          limitType,
        })
        if (limit instanceof Error) throw mapError(limit)

        return limit
      },
    },
    remainingLimit: {
      type: CentAmount,
      description: `The amount of cents remaining below the limit for the current 24 hour period.`,
      resolve: async (source) => {
        const { account, limitType } = source

        const usdHedgeEnabled = getDealerConfig().usd.hedgingEnabled
        const priceRatio = await getMidPriceRatio(usdHedgeEnabled)
        if (priceRatio instanceof Error) throw mapError(priceRatio)

        let volumeRemaining: UsdPaymentAmount | ApplicationError
        switch (limitType) {
          case AccountLimitsType.IntraLedger:
            volumeRemaining = await Accounts.remainingIntraLedgerLimit({
              accountId: account.id,
              priceRatio,
            })
            if (volumeRemaining instanceof Error) throw mapError(volumeRemaining)

            return normalizePaymentAmount(volumeRemaining).amount

          case AccountLimitsType.Withdrawal:
            volumeRemaining = await Accounts.remainingWithdrawalLimit({
              accountId: account.id,
              priceRatio,
            })
            if (volumeRemaining instanceof Error) throw mapError(volumeRemaining)

            return normalizePaymentAmount(volumeRemaining).amount

          case AccountLimitsType.SelfTrade:
            volumeRemaining = await Accounts.remainingTradeIntraAccountLimit({
              accountId: account.id,
              priceRatio,
            })
            if (volumeRemaining instanceof Error) throw mapError(volumeRemaining)

            return normalizePaymentAmount(volumeRemaining).amount

          default:
            throw new InvalidAccountLimitTypeError(limitType)
        }
      },
    },
    interval: {
      type: Seconds,
      description: `The rolling time interval value in seconds for the current 24 hour period.`,
      resolve: () => SECS_PER_DAY,
    },
  }),
})

export default OneDayAccountLimit
