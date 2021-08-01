import { GT } from "../index"

import Date from "../types/scalars/date"

const MutationType = new GT.Object({
  name: "Mutation",
  fields: () => ({
    currentTime: {
      type: Date,
      resolve: () => {
        return new Date().toISOString()
      },
    },
  }),
})

export default MutationType
