import { GT } from "@graphql/index"

import IError from "../../../shared/types/abstract/error"
import RealtimePrice from "../object/realtime-price"

const RealtimePricePayload = GT.Object({
  name: "RealtimePricePayload",
  fields: () => ({
    errors: {
      type: GT.NonNullList(IError),
    },
    realtimePrice: {
      type: RealtimePrice,
    },
  }),
})

export default RealtimePricePayload
