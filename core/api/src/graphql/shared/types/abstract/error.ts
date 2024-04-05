import { GT } from "@/graphql/index"

const IError = GT.Interface({
  name: "Error",
  fields: () => ({
    message: {
      type: GT.NonNull(GT.String),
    },
    path: {
      type: GT.List(GT.String),
    },
    code: {
      type: GT.String,
    },
  }),
})

export default IError
