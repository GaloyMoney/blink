import { GT } from "@graphql/index"
import IError from "../abstract/error"

const AuthCodeRequestPayload = new GT.Object({
  name: "AuthCodeRequestPayload",
  fields: () => ({
    errors: {
      type: GT.NonNullList(IError),
    },
    success: { type: GT.Boolean },
  }),
})

export default AuthCodeRequestPayload
