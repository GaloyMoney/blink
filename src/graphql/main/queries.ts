import User from "@graphql/types/object/user"
import { GT } from "../index"

const QueryType = new GT.Object({
  name: "Query",
  fields: () => ({
    me: {
      type: User,
      resolve: (_, __, { user }) => {
        if (!user) {
          throw new Error("Invalid user request")
        }
        return user
      },
    },
  }),
})

export default QueryType
