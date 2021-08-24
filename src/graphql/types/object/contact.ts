import { GT } from "@graphql/index"

import FullName from "../scalar/full-name"

const Contact = new GT.Object({
  name: "Contact",
  fields: () => ({
    id: { type: GT.NonNullID },
    name: { type: FullName },
    transactionsCount: {
      type: GT.NonNull(GT.Int),
    },
  }),
})

export default Contact
