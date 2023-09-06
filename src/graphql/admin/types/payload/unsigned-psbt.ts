import { GT } from "@graphql/index"
import IError from "@graphql/shared/types/abstract/error"

const UnsignedPsbtPayload = GT.Object({
  name: "UnsignedPsbtPayload",
  fields: () => ({
    errors: {
      type: GT.NonNullList(IError),
    },
    unsignedPsbt: {
      type: GT.String,
    },
  }),
})

export default UnsignedPsbtPayload
