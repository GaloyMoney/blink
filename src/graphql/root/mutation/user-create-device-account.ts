import { GT } from "@graphql/index"

import AuthTokenPayload from "@graphql/types/payload/auth-token"
import { Auth } from "@app"
import { mapAndParseErrorForGqlResponse } from "@graphql/error-map"
import { BTC_NETWORK } from "@config"

const UserDeviceAccountCreateMutation = GT.Field({
  extensions: {
    complexity: 120,
  },
  type: GT.NonNull(AuthTokenPayload),
  resolve: async (_, args, { ip, sub, iss }) => {
    if (ip === undefined) {
      return { errors: [{ message: "ip is undefined" }] }
    }

    // TODO: remove once ready for production
    if (BTC_NETWORK === "mainnet") {
      return { errors: [{ message: "currently not available on mainnet" }] }
    }

    if (iss === undefined) {
      return { errors: [{ message: "iss is undefined" }] }
    }

    if (iss === "galoy") {
      return { errors: [{ message: "wrong issuer" }] }
    }

    const userId = sub
    if (userId === undefined) {
      return { errors: [{ message: "user is undefined" }] }
    }

    const authToken = await Auth.createDeviceAccount({ ip, userId })

    if (authToken instanceof Error) {
      return { errors: [mapAndParseErrorForGqlResponse(authToken)] }
    }

    return { errors: [], authToken }
  },
})

export default UserDeviceAccountCreateMutation
