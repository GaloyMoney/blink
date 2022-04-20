import { getDisplayCurrency, getDealerConfig, ConfigError } from "@config"
import { WalletCurrency } from "@domain/shared"

import * as HedgingDealer from "./hedging-dealer"
import * as NonHedgingDealer from "./non-hedging-dealer"

let DealerPriceService: () => IDealerPriceService,
  NewDealerPriceService: () => INewDealerPriceService

const usdHedgeEnabled = getDealerConfig().usd.hedgingEnabled
const displayCurrency = getDisplayCurrency().code

if (usdHedgeEnabled) {
  ;({ DealerPriceService, NewDealerPriceService } = HedgingDealer)
} else if (displayCurrency === WalletCurrency.Usd) {
  ;({ DealerPriceService, NewDealerPriceService } = NonHedgingDealer)
} else {
  throw new ConfigError("No valid service available to use for Dealer service")
}

export { DealerPriceService, NewDealerPriceService }
