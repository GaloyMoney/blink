import { GT } from "@graphql/index"

import IError from "../../../shared/types/abstract/error"
import EndpointId from "../scalar/endpoint-id"

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
