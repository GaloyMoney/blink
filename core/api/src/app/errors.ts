import * as SharedErrors from "@/domain/shared/errors"
import * as DomainErrors from "@/domain/errors"
import * as PaymentErrors from "@/domain/payments/errors"
import * as LedgerErrors from "@/domain/ledger/errors"
import * as CallbackErrors from "@/domain/callback/errors"
import * as CommErrors from "@/domain/comm/errors"
import * as OnChainErrors from "@/domain/bitcoin/onchain/errors"
import * as LightningErrors from "@/domain/bitcoin/lightning/errors"
import * as PriceServiceErrors from "@/domain/price/errors"
import * as LockServiceErrors from "@/domain/lock/errors"
import * as RateLimitServiceErrors from "@/domain/rate-limit/errors"
import * as IpFetcherErrors from "@/domain/ipfetcher/errors"
import * as AccountErrors from "@/domain/accounts/errors"
import * as NotificationsErrors from "@/domain/notifications/errors"
import * as CacheErrors from "@/domain/cache/errors"
import * as PhoneProviderServiceErrors from "@/domain/phone-provider/errors"
import * as DealerPriceErrors from "@/domain/dealer-price/errors"
import * as PubSubErrors from "@/domain/pubsub/errors"
import * as CaptchaErrors from "@/domain/captcha/errors"
import * as AuthenticationErrors from "@/domain/authentication/errors"
import * as UserErrors from "@/domain/users/errors"
import * as WalletInvoiceErrors from "@/domain/wallet-invoices/errors"

import * as LedgerFacadeErrors from "@/services/ledger/domain/errors"
import * as KratosErrors from "@/services/kratos/errors"
import * as BriaEventErrors from "@/services/bria/errors"
import * as SvixErrors from "@/services/svix/errors"

export const ApplicationErrors = {
  ...SharedErrors,
  ...DomainErrors,
  ...PaymentErrors,
  ...LedgerErrors,
  ...CallbackErrors,
  ...CommErrors,
  ...OnChainErrors,
  ...LightningErrors,
  ...PriceServiceErrors,
  ...LockServiceErrors,
  ...RateLimitServiceErrors,
  ...IpFetcherErrors,
  ...AccountErrors,
  ...NotificationsErrors,
  ...CacheErrors,
  ...PhoneProviderServiceErrors,
  ...DealerPriceErrors,
  ...PubSubErrors,
  ...CaptchaErrors,
  ...AuthenticationErrors,
  ...UserErrors,
  ...WalletInvoiceErrors,

  ...KratosErrors,
  ...LedgerFacadeErrors,
  ...BriaEventErrors,
  ...SvixErrors,
} as const
