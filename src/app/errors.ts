import * as SharedErrors from "@domain/shared/errors"
import * as DomainErrors from "@domain/errors"
import * as AuthorizationErrors from "@domain/authorization/errors"
import * as PaymentErrors from "@domain/payments/errors"
import * as LedgerErrors from "@domain/ledger/errors"
import * as OnChainErrors from "@domain/bitcoin/onchain/errors"
import * as LightningErrors from "@domain/bitcoin/lightning/errors"
import * as PriceServiceErrors from "@domain/price/errors"
import * as TwoFAErrors from "@domain/twoFA/errors"
import * as LockServiceErrors from "@domain/lock/errors"
import * as RateLimitServiceErrors from "@domain/rate-limit/errors"
import * as IpFetcherErrors from "@domain/ipfetcher/errors"
import * as AccountErrors from "@domain/accounts/errors"
import * as NotificationsErrors from "@domain/notifications/errors"
import * as CacheErrors from "@domain/cache/errors"
import * as PhoneProviderServiceErrors from "@domain/phone-provider/errors"
import * as ColdStorageServiceErrors from "@domain/cold-storage/errors"
import * as DealerPriceErrors from "@domain/dealer-price/errors"
import * as PubSubErrors from "@domain/pubsub/errors"

export const ApplicationErrors = {
  ...SharedErrors,
  ...DomainErrors,
  ...AuthorizationErrors,
  ...PaymentErrors,
  ...LedgerErrors,
  ...OnChainErrors,
  ...LightningErrors,
  ...PriceServiceErrors,
  ...TwoFAErrors,
  ...LockServiceErrors,
  ...RateLimitServiceErrors,
  ...IpFetcherErrors,
  ...AccountErrors,
  ...NotificationsErrors,
  ...CacheErrors,
  ...PhoneProviderServiceErrors,
  ...ColdStorageServiceErrors,
  ...DealerPriceErrors,
  ...PubSubErrors,
} as const
