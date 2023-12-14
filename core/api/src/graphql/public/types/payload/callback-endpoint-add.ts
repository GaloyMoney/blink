import IError from "../../../shared/types/abstract/error"
import EndpointId from "../scalar/endpoint-id"

import { GT } from "@/graphql/index"

const CallbackEndpointAddPayload = GT.Object({
  name: "CallbackEndpointAddPayload",
  fields: () => ({
    errors: {
      type: GT.NonNullList(IError),
    },
    id: {
      type: EndpointId,
    },
  }),
})

export default CallbackEndpointAddPayload
