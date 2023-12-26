import RealtimePrice from "../object/realtime-price"

import IError from "@/graphql/shared/types/abstract/error"
import { GT } from "@/graphql/index"

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
