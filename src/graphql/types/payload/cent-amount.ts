import { GT } from "@graphql/index"

import IError from "@graphql/types/abstract/error"
import CentAmount from "@graphql/types/scalar/cent-amount"
import ExchangeCurrencyUnit from "@graphql/types/scalar/exchange-currency-unit"

const CentAmountPayload = GT.Object({
  name: "CentAmountPayload",
  fields: () => ({
    errors: {
      type: GT.NonNullList(IError),
    },
    amount: {
      type: CentAmount,
    },
    currencyUnit: {
      type: ExchangeCurrencyUnit,
    },
  }),
})

export default CentAmountPayload
