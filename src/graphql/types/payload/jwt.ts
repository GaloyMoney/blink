import { GT } from "@graphql/index"

import IError from "../abstract/error"

const JwtPayload = GT.Object({
  name: "JwtPayload",
  fields: () => ({
    errors: {
      type: GT.NonNullList(IError),
    },
    authToken: {
      type: GT.String,
    },
  }),
})

export default JwtPayload
