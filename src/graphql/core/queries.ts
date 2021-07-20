import { GT } from "../index"

import Date from "../types/scalars/date"

const QueryType = new GT.Object({
  name: "Query",
  fields: () => ({
    currentTime: {
      type: Date,
      resolve: () => {
        return new Date().toISOString()
      },
    },
  }),
})

export default QueryType
