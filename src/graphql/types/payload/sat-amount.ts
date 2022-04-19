import { GT } from "@graphql/index"

import IError from "@graphql/types/abstract/error"
import SatAmount from "@graphql/types/scalar/sat-amount"
import ExchangeCurrencyUnit from "@graphql/types/scalar/exchange-currency-unit"

const SatAmountPayload = GT.Object({
  name: "SatAmountPayload",
  fields: () => ({
    errors: {
      type: GT.NonNullList(IError),
    },
    amount: {
      type: SatAmount,
    },
    currencyUnit: {
      type: ExchangeCurrencyUnit,
    },
  }),
})

export default SatAmountPayload
