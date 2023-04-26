import { GT } from "@graphql/index"

import { Auth } from "@app"
import { mapAndParseErrorForGqlResponse } from "@graphql/error-map"
import { BTC_NETWORK } from "@config"
import SuccessPayload from "@graphql/types/payload/success-payload"

const UserDeviceAccountCreateMutation = GT.Field({
  extensions: {
    complexity: 120,
  },
  type: GT.NonNull(SuccessPayload),
  resolve: async (_, args, { ip, sub }) => {
    if (ip === undefined) {
      return { errors: [{ message: "ip is undefined" }] }
    }

    // TODO: remove once ready for production
    if (BTC_NETWORK === "mainnet") {
      return { errors: [{ message: "currently not available on mainnet" }] }
    }

    const success = await Auth.createDeviceAccount({
      ip,
      sub,
    })

    if (success instanceof Error) {
      return { errors: [mapAndParseErrorForGqlResponse(success)], success: false }
    }

    return { errors: [], success }
  },
})

export default UserDeviceAccountCreateMutation
