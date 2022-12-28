import { GT } from "@graphql/index"

import AuthTokenPayload from "@graphql/types/payload/auth-token"
import { Auth } from "@app"
import { mapAndParseErrorForGqlResponse } from "@graphql/error-map"
import { BTC_NETWORK } from "@config"

const UserCreateBearerInput = GT.Input({
  name: "UserCreateBearerInput",
  fields: () => ({
    deviceId: {
      type: GT.NonNull(GT.String), // TODO: DeviceId
    },
  }),
})

const UserCreateBearerMutation = GT.Field<{
  input: {
    deviceId: string | InputValidationError
  }
}>({
  extensions: {
    complexity: 120,
  },
  type: GT.NonNull(AuthTokenPayload),
  args: {
    input: { type: GT.NonNull(UserCreateBearerInput) },
  },
  resolve: async (_, args, { ip }) => {
    const { deviceId } = args.input

    if (deviceId instanceof Error) {
      return { errors: [{ message: deviceId.message }] }
    }

    if (ip === undefined) {
      return { errors: [{ message: "ip is undefined" }] }
    }

    if (BTC_NETWORK === "mainnet") {
      return { errors: [{ message: "currently not available on mainnet" }] }
    }

    // TODO: log deviceId
    const authToken = await Auth.createBearer(ip)

    if (authToken instanceof Error) {
      return { errors: [mapAndParseErrorForGqlResponse(authToken)] }
    }

    return { errors: [], authToken }
  },
})

export default UserCreateBearerMutation
