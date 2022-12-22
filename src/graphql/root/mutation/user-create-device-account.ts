import { GT } from "@graphql/index"

import AuthTokenPayload from "@graphql/types/payload/auth-token"
import { Auth } from "@app"
import { mapAndParseErrorForGqlResponse } from "@graphql/error-map"
import { BTC_NETWORK } from "@config"
import { addAttributesToCurrentSpan } from "@services/tracing"

const UserDeviceAccountCreateInput = GT.Input({
  name: "UserDeviceAccountCreateInput",
  fields: () => ({
    deviceId: {
      type: GT.NonNull(GT.String), // TODO: DeviceId
    },
  }),
})

const UserDeviceAccountCreateMutation = GT.Field<{
  input: {
    deviceId: string | InputValidationError
  }
}>({
  extensions: {
    complexity: 120,
  },
  type: GT.NonNull(AuthTokenPayload),
  args: {
    input: { type: GT.NonNull(UserDeviceAccountCreateInput) },
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

    addAttributesToCurrentSpan({ deviceId })

    const authToken = await Auth.createDeviceAccount(ip)

    if (authToken instanceof Error) {
      return { errors: [mapAndParseErrorForGqlResponse(authToken)] }
    }

    return { errors: [], authToken }
  },
})

export default UserDeviceAccountCreateMutation
