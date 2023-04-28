import { GT } from "@graphql/index"

import AuthTokenPayload from "@graphql/types/payload/auth-token"
import { Auth } from "@app"
import { mapAndParseErrorForGqlResponse } from "@graphql/error-map"

const UserLoginDeviceInput = GT.Input({
  name: "UserLoginDeviceInput",
  fields: () => ({
    jwt: {
      type: GT.String,
    },
  }),
})

const UserLoginDeviceMutation = GT.Field<{
  input: {
    jwt: string | InputValidationError
  }
}>({
  extensions: {
    complexity: 120,
  },
  type: GT.NonNull(AuthTokenPayload),
  args: {
    input: { type: GT.NonNull(UserLoginDeviceInput) },
  },
  resolve: async (_, args, { ip }) => {
    const { jwt } = args.input

    if (jwt instanceof Error) {
      return { errors: [{ message: jwt.message }] }
    }

    if (ip === undefined) {
      return { errors: [{ message: "ip is undefined" }] }
    }

    const authToken = await Auth.loginWithDevice({
      jwt,
      ip,
    })

    if (authToken instanceof Error) {
      return { errors: [mapAndParseErrorForGqlResponse(authToken)] }
    }

    return { errors: [], authToken }
  },
})

export default UserLoginDeviceMutation
